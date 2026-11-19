/**
 * ==============================================================================
 * PORTAFOLIO BORIS SEPÚLVEDA · LÓGICA E INTERACTIVIDAD (ES6+)
 * Funcionalidades:
 * - Gestor de tema Claro/Oscuro con persistencia en localStorage y detección de SO
 * - Formulario de contacto validado en el navegador y enviado a /api/contacto
 * - Navegación móvil con soporte para teclado (Escape) y atributos ARIA
 * - Observador de intersección para enlaces activos de navegación
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

    /* --- 1. GESTIÓN DE TEMA CLARO / OSCURO --- */
    const themeToggleBtn = document.getElementById('theme-toggle');
    const rootHtml = document.documentElement;
    const STORAGE_KEY = 'bruwuleeh_theme';

    /** Lee la elección manual guardada; null si no hay o si el almacenamiento está bloqueado. */
    function getSavedTheme() {
        try {
            const value = localStorage.getItem(STORAGE_KEY);
            return value === 'light' || value === 'dark' ? value : null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Aplica el tema al DOM. Solo se guarda cuando la persona lo elige con el botón,
     * para que la preferencia del sistema siga mandando mientras no haya elección manual.
     * @param {'dark' | 'light'} theme
     * @param {boolean} persist
     */
    function applyTheme(theme, persist = false) {
        rootHtml.setAttribute('data-theme', theme);
        if (persist) {
            try {
                localStorage.setItem(STORAGE_KEY, theme);
            } catch (e) {
                /* Sin almacenamiento: el tema dura solo esta visita */
            }
        }
        if (themeToggleBtn) {
            themeToggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
        }
    }

    // theme-init.js ya fijó el tema antes de pintar; aquí solo se sincroniza la etiqueta del botón
    applyTheme(rootHtml.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

    // Seguir la preferencia del sistema mientras no haya elección manual
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!getSavedTheme()) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });

    // Evento de click para alternar tema
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = rootHtml.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme, true);
        });
    }


    /* --- 3. MENÚ DE NAVEGACIÓN MÓVIL (ACCESIBLE) --- */
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (navToggle && navMenu) {
        function toggleMenu(forceClose = false) {
            const isOpen = forceClose ? false : !navMenu.classList.contains('is-open');
            navMenu.classList.toggle('is-open', isOpen);
            navToggle.classList.toggle('is-open', isOpen);
            navToggle.setAttribute('aria-expanded', String(isOpen));
            navToggle.setAttribute('aria-label', isOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
        }

        navToggle.addEventListener('click', () => toggleMenu());

        // Cerrar menú al hacer clic en un enlace de navegación
        navMenu.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => toggleMenu(true));
        });

        // Cerrar menú al presionar la tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
                toggleMenu(true);
                navToggle.focus();
            }
        });
    }


    /* --- 4. FORMULARIO DE CONTACTO --- */
    // El servidor vuelve a validar todo: esto solo da avisos claros antes de enviar.
    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        const statusEl = document.getElementById('cf-estado');
        const submitBtn = document.getElementById('cf-enviar');
        const submitText = submitBtn ? submitBtn.querySelector('.cf-enviar-texto') : null;
        const startInput = document.getElementById('cf-inicio');
        const CORREO_RE = /^[^\s@<>()",;:]+@[^\s@<>()",;:]+\.[a-z]{2,}$/i;

        const MENSAJES = {
            ok: 'Mensaje enviado. Te respondo a tu correo lo antes posible.',
            datos: 'Revisa los campos marcados y vuelve a enviar.',
            limite: 'Llegaron varios mensajes seguidos desde tu conexión. Prueba de nuevo en unos minutos.',
            error: 'No se pudo enviar el mensaje. Prueba de nuevo o escríbeme por LinkedIn.'
        };

        const fields = {
            nombre: {
                input: document.getElementById('cf-nombre'),
                error: document.getElementById('cf-nombre-error'),
                check: (v) => (v.length === 0 ? 'Escribe tu nombre.' : '')
            },
            correo: {
                input: document.getElementById('cf-correo'),
                error: document.getElementById('cf-correo-error'),
                check: (v) => (v.length === 0
                    ? 'Escribe tu correo para poder responderte.'
                    : (CORREO_RE.test(v) ? '' : 'Revisa el correo: debería verse como nombre@dominio.cl.'))
            },
            mensaje: {
                input: document.getElementById('cf-mensaje'),
                error: document.getElementById('cf-mensaje-error'),
                check: (v) => (v.length < 10 ? 'Escribe un mensaje de al menos 10 caracteres.' : '')
            }
        };

        // Con JavaScript, los avisos son los nuestros (en español y junto al campo)
        contactForm.noValidate = true;
        if (startInput) startInput.value = String(Date.now());

        function setStatus(message, type) {
            if (!statusEl) return;
            statusEl.textContent = message;
            statusEl.classList.toggle('is-ok', type === 'ok');
            statusEl.classList.toggle('is-error', type === 'error');
        }

        function showFieldError(name, message) {
            const field = fields[name];
            if (!field || !field.input) return;
            field.error.textContent = message;
            if (message) {
                field.input.setAttribute('aria-invalid', 'true');
            } else {
                field.input.removeAttribute('aria-invalid');
            }
        }

        /** Valida todos los campos; devuelve el primero con error o null. */
        function validate() {
            let firstInvalid = null;
            Object.keys(fields).forEach((name) => {
                const field = fields[name];
                if (!field.input) return;
                const message = field.check(field.input.value.trim());
                showFieldError(name, message);
                if (message && !firstInvalid) firstInvalid = field.input;
            });
            return firstInvalid;
        }

        // Al corregir un campo marcado, el aviso se va en cuanto queda bien
        Object.keys(fields).forEach((name) => {
            const field = fields[name];
            if (!field.input) return;
            field.input.addEventListener('input', () => {
                if (field.input.getAttribute('aria-invalid') === 'true') {
                    showFieldError(name, field.check(field.input.value.trim()));
                }
            });
        });

        function setSending(sending) {
            if (!submitBtn) return;
            submitBtn.disabled = sending;
            submitBtn.setAttribute('aria-busy', String(sending));
            if (submitText) submitText.textContent = sending ? 'Enviando…' : 'Enviar mensaje';
        }

        contactForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            setStatus('', null);

            const firstInvalid = validate();
            if (firstInvalid) {
                setStatus(MENSAJES.datos, 'error');
                firstInvalid.focus();
                return;
            }

            setSending(true);
            let codigo = 'error';

            try {
                const response = await fetch(contactForm.action, {
                    method: 'POST',
                    headers: { Accept: 'application/json' },
                    body: new URLSearchParams(new FormData(contactForm))
                });
                const data = await response.json().catch(() => ({}));
                codigo = MENSAJES[data.codigo] ? data.codigo : (response.ok ? 'ok' : 'error');

                if (codigo === 'datos' && Array.isArray(data.campos)) {
                    validate();
                    data.campos.forEach((name) => {
                        const field = fields[name];
                        if (field && field.input && !field.error.textContent) {
                            showFieldError(name, 'Revisa este campo.');
                        }
                    });
                }
            } catch (e) {
                codigo = 'error'; // sin conexión o el servidor no respondió
            }

            setSending(false);

            if (codigo === 'ok') {
                contactForm.reset();
                if (startInput) startInput.value = String(Date.now());
                setStatus(MENSAJES.ok, 'ok');
            } else {
                setStatus(MENSAJES[codigo], 'error');
            }
        });

        // Vuelta desde el envío sin JavaScript: /?contacto=<código>#contacto
        const params = new URLSearchParams(window.location.search);
        const result = params.get('contacto');
        if (result && MENSAJES[result]) {
            setStatus(MENSAJES[result], result === 'ok' ? 'ok' : 'error');
            params.delete('contacto');
            const query = params.toString();
            history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : '') + window.location.hash);
        }
    }


    /* --- 5. RESALTADO AUTOMÁTICO DE SECCIÓN ACTIVA EN NAVBAR (SPY) --- */
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    if ('IntersectionObserver' in window && sections.length > 0) {
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -70% 0px',
            threshold: 0
        };

        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    navLinks.forEach(link => {
                        const href = link.getAttribute('href');
                        if (href === `#${id}`) {
                            link.classList.add('active');
                            link.setAttribute('aria-current', 'true');
                        } else {
                            link.classList.remove('active');
                            link.removeAttribute('aria-current');
                        }
                    });
                }
            });
        }, observerOptions);

        sections.forEach(section => sectionObserver.observe(section));
    }


    /* --- 6. ACTUALIZACIÓN AUTOMÁTICA DEL AÑO DE COPYRIGHT --- */
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = String(new Date().getFullYear());
    }

});
