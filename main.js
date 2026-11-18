/**
 * ==============================================================================
 * PORTAFOLIO BORIS SEPÚLVEDA · LÓGICA E INTERACTIVIDAD (ES6+)
 * Funcionalidades:
 * - Gestor de tema Claro/Oscuro con persistencia en localStorage y detección de SO
 * - Copia rápida de correo con feedback mediante notificaciones Toast accesibles
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


    /* --- 4. COPIAR CORREO AL PORTAPAPELES & NOTIFICACIÓN TOAST --- */
    const toastElement = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');
    let toastTimeout = null;

    /**
     * Muestra una notificación emergente visual accesible
     * @param {string} message
     * @param {'ok' | 'error'} type  El error usa otro ícono y dura más, para alcanzar a leer el correo
     */
    function showToast(message, type = 'ok') {
        if (!toastElement || !toastMessage) return;

        toastMessage.textContent = message;
        toastElement.classList.toggle('is-error', type === 'error');
        toastElement.classList.add('is-visible');

        if (toastTimeout) {
            clearTimeout(toastTimeout);
        }

        toastTimeout = setTimeout(() => {
            toastElement.classList.remove('is-visible');
        }, type === 'error' ? 8000 : 3200);
    }

    /**
     * Copia con el método antiguo (execCommand). Devuelve true solo si el navegador confirma la copia.
     * @param {string} text
     * @returns {boolean}
     */
    function legacyCopy(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        let copied = false;
        try {
            copied = document.execCommand('copy');
        } catch (e) {
            copied = false;
        }
        document.body.removeChild(textArea);
        return copied;
    }

    /**
     * Copia texto al portapapeles: API moderna primero, método antiguo si falla o el permiso se niega.
     * Si ninguno funciona, muestra el correo para que se pueda anotar.
     * @param {string} text
     * @param {string} successFeedback
     */
    async function copyToClipboard(text, successFeedback = '¡Copiado al portapapeles!') {
        let copied = false;

        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                copied = true;
            } catch (e) {
                copied = false; // p. ej. permiso negado: se intenta el método antiguo
            }
        }

        if (!copied) {
            copied = legacyCopy(text);
        }

        if (copied) {
            showToast(successFeedback);
        } else {
            showToast(`No pude copiar. Mi correo es ${text}`, 'error');
        }
    }

    // Botón de copiar correo en el Hero
    const heroCopyBtn = document.getElementById('btn-copy-email');
    if (heroCopyBtn) {
        heroCopyBtn.addEventListener('click', () => {
            const email = heroCopyBtn.getAttribute('data-email') || 'borissepg@gmail.com';
            copyToClipboard(email, '¡Correo copiado: borissepg@gmail.com!');
        });
    }

    // Botón de copiar correo en la sección de Contacto
    const inlineCopyBtn = document.getElementById('btn-copy-email-box');
    if (inlineCopyBtn) {
        inlineCopyBtn.addEventListener('click', () => {
            copyToClipboard('borissepg@gmail.com', '¡Correo copiado: borissepg@gmail.com!');
        });
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
