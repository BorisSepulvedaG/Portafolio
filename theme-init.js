/**
 * Aplica el tema antes de pintar la página para evitar el parpadeo
 * (FOUC) en tema claro. Se carga de forma síncrona en <head> y como
 * archivo externo (no inline) para no exigir 'unsafe-inline' en la CSP.
 */
(function () {
    var theme = null;
    try {
        theme = localStorage.getItem('bruwuleeh_theme');
    } catch (e) {
        /* Almacenamiento bloqueado: se usa la preferencia del sistema */
    }
    if (theme !== 'light' && theme !== 'dark') {
        theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', theme);
})();
