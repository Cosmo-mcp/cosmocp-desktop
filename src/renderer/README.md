# Renderer (Next.js)

This folder contains the **renderer/UI** for the Cosmo Studio Electron app.

## Important constraints

- `next.config.ts` uses `output: "export"` so production builds are static and written to `src/renderer/out/`.
- In development, Electron loads the Next dev server at `http://localhost:3000`.

## Local development

Prefer running from the repo root:

```bash
cd ../..
npm run dev
```

If you want to run the renderer alone:

```bash
npm run dev
```

## Scripts

```bash
npm run dev     # Next dev (Turbopack)
npm run build   # Static export build to out/
npm run lint    # Next lint
```

## Process boundary

The renderer must talk to the main process via `window.api` (exposed by preload). Do not import Node/Electron APIs directly.
