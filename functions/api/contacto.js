/**
 * POST /api/contacto · Cloudflare Pages Function
 *
 * Recibe el formulario de contacto, lo valida y lo envía por correo con Resend.
 * La clave vive solo aquí (servidor): el navegador nunca la ve.
 *
 * Variables del proyecto en Cloudflare Pages (Settings → Variables and Secrets):
 *   RESEND_API_KEY  secreto · clave de Resend con permiso solo de envío
 *   CONTACT_TO      correo donde llegan los mensajes (fuera del repo para no exponerlo)
 *   CONTACT_FROM    remitente de un dominio verificado en Resend, p. ej. "Portafolio <contacto@bruwuleeh.com>"
 *
 * Responde JSON si el cliente lo pide (fetch desde main.js); si no, redirige a
 * /?contacto=<código>#contacto para que el formulario funcione también sin JavaScript.
 */

const MAX_CUERPO = 16 * 1024; // bytes: un mensaje real cabe de sobra
const LIMITES = { nombre: 100, correo: 254, mensaje: 4000 };
const MIN_MENSAJE = 10;
const MIN_MS_LLENADO = 3000; // un bot llena y envía al instante; una persona no
const CORREO_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[a-z]{2,}$/i;

// Freno por IP en memoria del isolate. No es un límite global (cada isolate tiene el suyo),
// por eso se complementa con una regla de rate limiting de Cloudflare sobre /api/contacto.
const VENTANA_MS = 10 * 60 * 1000;
const MAX_POR_VENTANA = 5;
const intentos = new Map();

export async function onRequest({ request, env }) {
    if (request.method !== 'POST') {
        return new Response('Método no permitido', {
            status: 405,
            headers: { Allow: 'POST', 'Cache-Control': 'no-store' },
        });
    }

    const quiereJson = (request.headers.get('Accept') || '').includes('application/json');
    const responder = (status, codigo, extra = {}) => {
        if (quiereJson) {
            return new Response(JSON.stringify({ ok: codigo === 'ok', codigo, ...extra }), {
                status,
                headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
            });
        }
        const destino = new URL(`/?contacto=${codigo}#contacto`, request.url);
        return Response.redirect(destino.toString(), 303);
    };

    // Solo desde este mismo sitio: otro dominio no puede usar el formulario como relé
    const origen = request.headers.get('Origin');
    if (origen && origen !== new URL(request.url).origin) {
        return responder(403, 'error');
    }

    const tipo = request.headers.get('Content-Type') || '';
    if (!tipo.startsWith('application/x-www-form-urlencoded')) {
        return responder(415, 'error');
    }

    const declarado = Number(request.headers.get('Content-Length') || 0);
    if (declarado > MAX_CUERPO) {
        return responder(413, 'datos');
    }

    let texto;
    try {
        texto = await request.text();
    } catch {
        return responder(400, 'error');
    }
    if (texto.length > MAX_CUERPO) {
        return responder(413, 'datos');
    }

    const datos = new URLSearchParams(texto);

    // Trampas anti-bot: se responde "ok" para no darle pistas, pero no se envía nada
    if ((datos.get('sitio_web') || '').trim() !== '') {
        return responder(200, 'ok');
    }
    const inicio = Number(datos.get('inicio'));
    if (Number.isFinite(inicio) && inicio > 0 && Date.now() - inicio < MIN_MS_LLENADO) {
        return responder(200, 'ok');
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'desconocida';
    if (superaLimite(ip)) {
        return responder(429, 'limite');
    }

    const nombre = limpiarLinea(datos.get('nombre'));
    const correo = limpiarLinea(datos.get('correo'));
    const mensaje = limpiarTexto(datos.get('mensaje'));

    const campos = [];
    if (!nombre || nombre.length > LIMITES.nombre) campos.push('nombre');
    if (!correo || correo.length > LIMITES.correo || !CORREO_RE.test(correo)) campos.push('correo');
    if (mensaje.length < MIN_MENSAJE || mensaje.length > LIMITES.mensaje) campos.push('mensaje');
    if (campos.length > 0) {
        return responder(422, 'datos', { campos });
    }

    if (!env.RESEND_API_KEY || !env.CONTACT_TO || !env.CONTACT_FROM) {
        console.error('contacto: faltan variables de entorno de correo');
        return responder(500, 'error');
    }

    // Solo texto plano: nada de lo que escriba el visitante se interpreta como HTML
    const cuerpo = [
        `Nombre: ${nombre}`,
        `Correo: ${correo}`,
        '',
        mensaje,
        '',
        '—',
        'Enviado desde el formulario de contacto del portafolio.',
    ].join('\n');

    try {
        const respuesta = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: env.CONTACT_FROM,
                to: [env.CONTACT_TO],
                reply_to: correo,
                subject: `Portafolio · mensaje de ${nombre}`,
                text: cuerpo,
            }),
            signal: AbortSignal.timeout(10000),
        });

        if (!respuesta.ok) {
            // Solo el estado: el cuerpo podría traer datos del mensaje
            console.error(`contacto: Resend respondió ${respuesta.status}`);
            return responder(502, 'error');
        }
    } catch (error) {
        console.error(`contacto: no se pudo llamar a Resend (${error && error.name})`);
        return responder(502, 'error');
    }

    return responder(200, 'ok');
}

/** Una línea: sin saltos ni caracteres de control (evita inyectar cabeceras en el asunto). */
function limpiarLinea(valor) {
    return String(valor || '').replace(/[\u0000-\u001f\u007f]+/g, ' ').trim();
}

/** Texto libre: conserva saltos de línea y tabulaciones, quita el resto de caracteres de control. */
function limpiarTexto(valor) {
    return String(valor || '')
        .replace(/\r\n?/g, '\n')
        .replace(/[\u0000-\u0008\u000b-\u001f\u007f]+/g, '')
        .trim();
}

function superaLimite(ip) {
    const ahora = Date.now();

    if (intentos.size > 1000) {
        for (const [clave, registro] of intentos) {
            if (ahora - registro.desde > VENTANA_MS) intentos.delete(clave);
        }
    }

    const registro = intentos.get(ip);
    if (!registro || ahora - registro.desde > VENTANA_MS) {
        intentos.set(ip, { desde: ahora, cuenta: 1 });
        return false;
    }

    registro.cuenta += 1;
    return registro.cuenta > MAX_POR_VENTANA;
}
