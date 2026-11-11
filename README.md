# CHKON — Portafolio de Jose Chacón

**[chkon.vercel.app](https://chkon.vercel.app)**

*Primero funciona. Luego se ve impecable.*

Portafolio de Jose Chacón: T.S.U. en Informática, AWS Certified Cloud Practitioner. Construye sistemas completos con agentes de IA, apps nativas y web.

La marca gira en torno al punto de venta: cada proyecto es un artículo con su SKU, el contacto es «pase por caja», y el símbolo es un código de barras Code 39 real que dice `CHKON` y se puede escanear. El porqué de cada decisión está en [IDENTIDAD.md](IDENTIDAD.md).

## Qué tiene

- **Proyectos destacados** con captura, métricas reales y enlace al código. Los demás repos públicos aparecen solos, ordenados por actividad.
- **Sincronizado con GitHub.** Lee los repos en vivo y, si GitHub limita las peticiones, usa una copia guardada en el build.
- **Bilingüe:** español e inglés.
- **Tipografía cinética.** Los titulares usan Anybody, una fuente variable en ancho, y se estiran con el cursor y con el scroll. El código de barras del pie también reacciona al puntero.
- **Contacto directo** por WhatsApp, correo, GitHub y LinkedIn.
- **Seguro por defecto.** CSP estricta (sin scripts de terceros), HSTS y Trusted Types.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS · Framer Motion · Vercel

## Desarrollo

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # sincroniza GitHub, revisa tipos y compila a dist/
npm run preview
```

`npm run sync` actualiza a mano la copia de los repos (`src/data/github-snapshot.json`). Con `GITHUB_TOKEN` definido usa la API autenticada.

## Editar el contenido

Todo el texto vive en [`src/site.ts`](src/site.ts), con una versión en español y otra en inglés: datos personales, enlaces, proyectos destacados, títulos, stack y textos de la interfaz.

- **Agregar un proyecto destacado:** súmalo a `featured`, con su imagen en `public/projects/` y la miniatura en `public/projects/thumb/`.
- **Ocultar un repo:** agrega su nombre a `hiddenRepos`.

## Estructura

```
src/
├── components/   # Top (hero), Projects, Sections (manifiesto, títulos, stack, contacto),
│                 # Barcode, Loader, iconos
├── lib/          # GitHub, i18n, código de barras, tipografía cinética
├── data/         # Copia de los repos públicos
└── site.ts       # Contenido en español e inglés
public/           # Fuentes, fotos, capturas de proyectos
scripts/          # sync-github.mjs
```

## Despliegue

Cada push a `main` se despliega solo en Vercel. Las cabeceras de seguridad están en [`vercel.json`](vercel.json).
