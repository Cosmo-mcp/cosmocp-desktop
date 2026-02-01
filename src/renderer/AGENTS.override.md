# `src/renderer` (Next.js renderer/UI) — AGENTS override

This file applies to changes under `src/renderer/`.

## Runtime constraints (important)

- The renderer is a Next.js App Router project under `src/renderer/src/`.
- `src/renderer/next.config.ts` uses `output: "export"`:
  - Production builds are **static** and written to `src/renderer/out/`.
  - Do not rely on server-only features (API routes, server actions, runtime secrets).
- In Electron dev, the UI is served by `next dev` on `http://localhost:3000` and loaded by `src/main/index.ts`.

## Process boundary rules

- Renderer must not import Node/Electron APIs.
- All privileged operations go through `window.api` (preload).
- Prefer `import type` when consuming `core/dto` types to avoid bundling heavy runtime code:
  - Example: `import type {Chat} from "core/dto";`

## UI stack (what to use)

- Styling: Tailwind CSS v4 + CSS variables in `src/renderer/src/app/globals.css`.
- Component primitives: shadcn/ui + Radix (`src/renderer/src/components/ui/*`).
- Icons: `lucide-react`.
- Themes: `next-themes` (`ThemeProvider` in `src/renderer/src/app/layout.tsx`).
- Notifications: `sonner`.

## Design guidelines (match current product)

The current UI establishes:
- Left app sidebar (logo + primary nav + Settings).
- A top header with utility actions (GitHub CTA, theme toggle).
- Neutral palette, soft borders, rounded corners, card layouts.

When adding UI:
- Default to semantic tokens (`bg-background`, `text-foreground`, `border-border`) instead of hardcoded colors.
- Keep spacing consistent (use existing patterns like `p-4`, `gap-2/4/6`, `rounded-lg`).
- Prefer composition over custom one-off styling; reuse `src/renderer/src/components/ui/*`.
- Mobile-first:
  - Ensure no overflow; use `min-h-0` and `overflow-hidden` patterns used in `src/renderer/src/app/(main)/layout.tsx`.
  - Validate sidebar behavior at small sizes.

## Accessibility (required)

- Ensure every interactive element is keyboard reachable.
- Provide labels for icon-only buttons (`aria-label` or `sr-only` text).
- Preserve visible focus states (don’t remove outlines).
- Don’t rely on color alone for state.
- Be careful with Markdown rendering; never allow unsafe HTML injection.

## Performance rules (follow Vercel best practices)

This repo includes the Vercel React/Next best-practices skill in `.codex/skills/vercel-react-best-practices/`.
Apply the highest-impact rules first:

- Avoid waterfalls: start async work early; `Promise.all()` independent work.
- Bundle size: avoid barrel imports; dynamically import heavy components where appropriate.
- Re-render control: memoize expensive components; keep effect deps narrow; avoid derived state pitfalls.
- Client fetching: use `swr` for dedup/caching when data is fetch-like and can be cached.

## Data flow conventions

- Prefer a single “source of truth” for cached UI state.
- Keep renderer logic focused on presentation + orchestration:
  - DB queries, encryption, provider registries belong in `packages/core` and/or main controllers.
- For streaming chat:
  - Renderer uses `@ai-sdk/react` + `IpcChatTransport` (`src/renderer/src/chat-transport.ts`).
  - Ensure stream channels are stable (`chat-stream-${chatId}`) and all listeners are cleaned up.

## Testing expectations (renderer)

Add tests for any new UI behavior:
- Unit/component tests for components (React Testing Library + a JS test runner).
- Interaction tests for critical flows (chat send/stream, provider management, settings navigation).
- E2E automation: Playwright Electron mode should cover “happy path” and at least one failure path.

If a test harness is missing, add it as part of the change rather than skipping tests.

