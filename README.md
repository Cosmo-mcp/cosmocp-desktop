# Cosmo Studio

Cosmo Studio is a desktop AI chat application. It provides a beautiful and intuitive interface for interacting with various AI models, including those from OpenAI, Anthropic, Google, and Ollama.

## Project overview

- Electron main process: `src/main/`
- Preload (security boundary): `src/preload/`
- Renderer (Next.js UI): `src/renderer/`
- Shared core package (DB + domain + AI): `packages/core/`

If you’re an AI agent/LLM working in this repo, start with `AGENTS.md`.

## Features

*   **Multi-Provider Support:** Connect to and switch between different AI model providers.
*   **Chat Interface:** A clean and modern chat interface for interacting with AI models.
*   **Chat History:** Your conversations are saved locally, so you can easily pick up where you left off.
*   **Markdown Rendering:** Messages are rendered with Markdown support, including code blocks and other formatting.
*   **Multimodal Input:** (Future) Support for multimodal input, such as images.
*   **Provider Management:** Easily add, edit, and remove AI model providers.
*   **Cross-Platform:** Works on Windows, macOS, and Linux.

## Getting started (development)

From the repo root:

```bash
npm install
npm run dev
```

Notes:

- The UI runs on `http://localhost:3000` (Next dev server).
- Electron loads `http://localhost:3000/splash` in dev.
- The database directory in dev is `app.getPath('userData')/$DATABASE_NAME` (see `src/main/index.ts`).

## Useful scripts (root)

```bash
npm run dev             # Next dev + Electron
npm run generate-api    # Regenerate src/preload/api.ts from IPC controllers
npm run lint            # gts lint (main/preload/core/scripts)
npm run fix             # gts fix

npm run db:generate     # drizzle-kit generate (creates migrations/)
npm run db:migrate      # drizzle-kit migrate
npm run db:studio       # drizzle-kit studio

npm run make            # build renderer + electron-forge make
npm run package         # build renderer + electron-forge package
npm run publish         # build renderer + electron-forge publish (requires GITHUB_TOKEN)
```

Renderer scripts live under `src/renderer/package.json` (Next lint/build/dev).

## Docs

- `docs/ARCHITECTURE.md`
- `docs/IPC.md`
- `docs/DATABASE.md`
- `docs/RENDERER_DESIGN.md`
- `docs/TESTING_STRATEGY.md`
- `docs/DEPENDENCIES.md`

## License

This project is licensed under the [AGPL license](LICENSE).
