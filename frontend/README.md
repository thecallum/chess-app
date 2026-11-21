# Frontend

React + TypeScript, built with Vite and React Router in framework mode. There is no server-side rendering at runtime: the build produces static files.

## Rendering model

Configured in [react-router.config.ts](react-router.config.ts) with `ssr: false` and a `prerender` list.

- **Pre-rendered routes** (listed in `prerender`, currently `/`) are built to static HTML, then hydrated in the browser.
- **Client-only routes** (everything else) are rendered in the browser. The host serves `__spa-fallback.html` for these paths. The bundled [nginx.conf](nginx.conf) does this.

To pre-render another page, add its path to `prerender`.

## Commands

```bash
pnpm install
pnpm dev         # http://localhost:5173, /api proxied to the backend
pnpm build       # static output in build/client
pnpm typecheck
pnpm lint
pnpm format:check
```

Set `API_URL` to change the dev proxy target (default `http://localhost:5080`).
