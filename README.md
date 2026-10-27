# Portafolio Profesional · Boris Sepúlveda (BrUwUleeh)

Sitio web y portafolio personal de **Boris Sepúlveda**, Desarrollador de Software y fundador de **Vértice Software**. Diseñado bajo principios modernos de UI/UX, arquitectura limpia, accesibilidad web y optimizado para despliegue estático de alto rendimiento en **Cloudflare Pages**.

---

## 🚀 Tecnologías y Herramientas

- **HTML5 Semántico**: Estructura accesible, metadatos Open Graph, Twitter Cards y marcado schema.org para SEO.
- **CSS3 Vanilla**: Sistema de diseño con variables personalizadas, paleta monocromática con acento verde esmeralda (`#10b981`), modo oscuro/claro con detección de preferencias del sistema y microinteracciones fluidas.
- **JavaScript Moderno (ES6+)**: Efecto spotlight en tarjetas, barra de lectura interactiva, copia de contacto rápida con feedback visual (toasts) y navegación responsive sin dependencias externas.
- **Hosting & Despliegue**: Optimizado para **Cloudflare Pages** (tiempo de carga ultrarrápido y distribución global en el edge).

---

## 🌿 Filosofía de Diseño e Interfaz

Este portafolio implementa estándares de diseño refinados:
- **Acento Verde Profesional**: Uso calibrado de tonos esmeralda sobre fondo obsidiana oscuro, transmitiendo dinamismo tecnológico, solidez y elegancia sin saturar la vista.
- **Directrices de Interfaz (Web Interface Guidelines)**:
  - Navegación clara por teclado con anillos de foco (`:focus-visible`).
  - Respeto por preferencias del usuario (`prefers-reduced-motion` y `prefers-color-scheme`).
  - Jerarquía tipográfica con fuentes modernas (`Space Grotesk`, `Inter` y `JetBrains Mono`).
  - Estados interactivos (hover, active, disabled) en todos los elementos accionables.

---

## 🌳 Flujo de Trabajo en Git y Gestión de Ramas

El repositorio sigue un modelo de ramas ordenado y profesional:

```text
main (producción / conectado a Cloudflare Pages)
 └── develop (integración de características)
      ├── feature/configuracion-inicial
      ├── feature/estructura-html
      ├── feature/estilos-diseno
      ├── feature/interactividad-js
      └── feature/recursos-visuales
```

- **`main`**: Rama protegida y estable lista para producción.
- **`develop`**: Rama base para consolidar nuevas funciones antes de lanzar una versión.
- **`feature/*`**: Ramas específicas de trabajo para cada característica o mejora.
- **Commits**: Mensajes claros en español siguiendo el estándar de commits semánticos (`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `chore:`).

---

## 🛠️ Cómo Ejecutar Localmente

1. Clona el repositorio:
   ```bash
   git clone https://github.com/BorisSepulvedaG/portafolio.git
   cd portafolio
   ```

2. Abre `index.html` en tu navegador o ejecuta un servidor local:
   ```bash
   # Con Python 3
   python -m http.server 3000

   # O con extensiones como Live Server en VS Code
   ```

---

## 🌐 Despliegue en Cloudflare Pages

1. Conecta tu repositorio de GitHub a tu cuenta de **Cloudflare Pages**.
2. Parámetros de construcción:
   - **Framework preset**: `None` (sitio estático HTML/CSS/JS).
   - **Build command**: *(dejar vacío)*.
   - **Build output directory**: `/` (o directorio raíz).
3. Cada push a `main` generará un despliegue automático global.

---

## 📬 Contacto

- **Nombre**: Boris Sepúlveda
- **Empresa**: Vértice Software
- **Correo**: [borissepg@gmail.com](mailto:borissepg@gmail.com)
- **LinkedIn**: [boris-sepulveda](https://www.linkedin.com/in/boris-sepulveda-79253a2aa/)
- **GitHub**: [@BorisSepulvedaG](https://github.com/BorisSepulvedaG)
