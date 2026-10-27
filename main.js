/**
 * ==============================================================================
 * PORTAFOLIO BORIS SEPÚLVEDA · LÓGICA E INTERACTIVIDAD (ES6+)
 * Funcionalidades:
 * - Gestor de tema Claro/Oscuro con persistencia en localStorage y detección de SO
 * - Barra de progreso de lectura en scroll superior
 * - Efecto de foco lumínico (Spotlight cursor) en tarjetas
 * - Filtro dinámico de proyectos destacados
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

    /**
     * Aplica el tema seleccionado al DOM y lo persiste
     * @param {'dark' | 'light'} theme
     */
    function applyTheme(theme) {
        rootHtml.setAttribute('data-theme', theme);
        localStorage.setItem(STORAGE_KEY, theme);
        if (themeToggleBtn) {
            themeToggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
        }
    }

    // Inicializar tema: preferencia guardada > preferencia del sistema > 'dark'
    const savedTheme = localStorage.getItem(STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') {
        applyTheme(savedTheme);
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDark ? 'dark' : 'light');
    }

    // Escuchar cambios en la preferencia del sistema operativo si no hay elección manual previa
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem(STORAGE_KEY)) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });

    // Evento de click para alternar tema
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = rootHtml.getAttribute('data-theme') || 'dark';
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
            showToast(`Tema cambiado a ${newTheme === 'dark' ? 'oscuro' : 'claro'}`);
        });
    }


    /* --- 2. BARRA DE PROGRESO DE LECTURA --- */
    const progressBar = document.getElementById('scroll-progress');
    let ticking = false;

    function updateScrollProgress() {
        if (!progressBar) return;
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progressBar.style.width = `${Math.min(100, Math.max(0, scrollPercent))}%`;
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateScrollProgress);
            ticking = true;
        }
    }, { passive: true });


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


    /* --- 4. EFECTO SPOTLIGHT DINÁMICO EN TARJETAS --- */
    const spotlightCards = document.querySelectorAll('.spotlight-card');

    spotlightCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });


    /* --- 5. FILTRADO INTERACTIVO DE PROYECTOS --- */
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');

    if (filterButtons.length > 0 && projectCards.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Actualizar estado activo en botones
                filterButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-selected', 'false');
                });
                button.classList.add('active');
                button.setAttribute('aria-selected', 'true');

                const filterValue = button.getAttribute('data-filter');

                // Filtrar tarjetas
                projectCards.forEach(card => {
                    const category = card.getAttribute('data-category');
                    if (filterValue === 'all' || category === filterValue) {
                        card.classList.remove('is-hidden');
                    } else {
                        card.classList.add('is-hidden');
                    }
                });
            });
        });
    }


    /* --- 6. COPIAR CORREO AL PORTAPAPELES & NOTIFICACIÓN TOAST --- */
    const toastElement = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');
    let toastTimeout = null;

    /**
     * Muestra una notificación emergente visual accesible
     * @param {string} message
     */
    function showToast(message) {
        if (!toastElement || !toastMessage) return;

        toastMessage.textContent = message;
        toastElement.classList.add('is-visible');

        if (toastTimeout) {
            clearTimeout(toastTimeout);
        }

        toastTimeout = setTimeout(() => {
            toastElement.classList.remove('is-visible');
        }, 3200);
    }

    /**
     * Copia texto al portapapeles de manera segura
     * @param {string} text
     * @param {string} successFeedback
     */
    async function copyToClipboard(text, successFeedback = '¡Copiado al portapapeles!') {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                // Fallback para entornos donde no está disponible el API moderna
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-9999px';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            showToast(successFeedback);
        } catch (err) {
            console.error('Error al intentar copiar:', err);
            showToast(`Correo: ${text}`);
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


    /* --- 7. RESALTADO AUTOMÁTICO DE SECCIÓN ACTIVA EN NAVBAR (SPY) --- */
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
                        } else {
                            link.classList.remove('active');
                        }
                    });
                }
            });
        }, observerOptions);

        sections.forEach(section => sectionObserver.observe(section));
    }


    /* --- 8. ACTUALIZACIÓN AUTOMÁTICA DEL AÑO DE COPYRIGHT --- */
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = String(new Date().getFullYear());
    }

});
