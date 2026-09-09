# Testing strategy

The quality bar is “no untested behavior”. New code should ship with unit + integration coverage, and critical flows should be protected by E2E automation.

## Coverage goals

- 100%+ coverage mindset for new/changed code (line + branch).
- Every error path should be asserted (including validation failures).

## Test runners

- Root tests run through `vitest.config.mts` and cover `packages/`, `scripts/`, `src/main/`, and `src/preload/`.
- Renderer tests run through `src/renderer/vitest.config.mts` with JSDOM and `src/renderer/src/test/setup.ts`.

## What to test

### Provider registry test matrix

The version 1 contract uses five providers to prove that the design is broad
enough. Gaurav Saini owns changes to this list and approval for stable support.

| Example           | Route and target level      | What it proves                                                                                 |
| ----------------- | --------------------------- | ---------------------------------------------------------------------------------------------- |
| OpenAI            | `direct` / `stable`         | Required API key, optional HTTPS URL, native adapter, models.dev discovery, and a model option |
| Azure OpenAI      | `direct` / `experimental`   | Enterprise endpoint, deployment, API version, named account fields, and rules between fields   |
| Ollama            | `local` / `stable`          | No required key, a local URL, private-address approval, and local model discovery              |
| OpenAI-compatible | `compatible` / `compatible` | Required URL, optional key, safe local HTTP, hosted HTTPS, shared adapter, and manual models   |
| AI Gateway        | `gateway` / `experimental`  | Gateway key, routing fields, gateway model list, and a clear gateway data path                 |

This list approves what the tests must cover. It does not promise that every
example already ships at that support level.

Each example must test:

- valid and invalid local registry entries, duplicate IDs, unknown fields, and
  simple versus advanced fields;
- the split between connection, model, and chat settings;
- a frontend output with no secrets and the same input checks in Electron and
  HTTP;
- keeping, replacing, and removing secrets;
- safe URLs and headers, clean error messages, and no secret values in logs;
- missing and wrong adapter versions;
- connection success, bad credentials, timeout, cancel, bad responses, and
  response-size limits;
- model discovery success, no models, old cache, bad data, manual models, and
  provider errors; and
- add, edit, restart, deprecate, hide, remove, export, delete, migration, and
  rollback flows.

Minimum test bar by support level:

| Level          | Tests required                                                                                                                                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`       | All shared tests; every adapter branch; Electron and HTTP flows; saved-data and migration tests; one real or recorded protocol test; packaged Electron and built HTTP smoke tests; no open high-risk security issue; owner approval |
| `experimental` | Shared schema, secret, and security tests; adapter unit tests; both transports; fake connection and discovery tests; written limits                                                                                                 |
| `compatible`   | Shared safety tests; the documented compatibility feature set against a reference server; both transports; safe endpoint tests; clear errors for unsupported features                                                               |
| `deprecated`   | Existing setup still loads or shows a clear blocked state; migration, export, and delete work; users cannot add a new setup                                                                                                         |
| `hidden`       | Missing from the add screen; existing setup remains visible; runtime behavior matches the stated reason                                                                                                                             |

Unit-test mocks alone are not enough for `stable`. Pull-request tests use a
recorded protocol or test server. Release checks can use protected credentials.

### `packages/core`

- Unit test repositories and services:
    - DB queries return correct shapes.
    - Edge cases (empty, missing id).
    - Error handling.
- Prefer isolated DB instances per test suite:
    - Use ephemeral directories and run migrations deterministically.
    - Add unit coverage for command parsing/template rendering.

### `src/main`

- Integration test IPC controllers:
    - Validation behavior at the boundary.
    - Calls into core services via DI.
- Streaming controllers emit `*-data`, `*-end`, `*-error` consistently.
    - Command controller validates input and delegates to core services.

### `src/preload`

- Test the exposed `window.api` surface:
    - Correct function names and grouping.
    - No forbidden modules exposed.
    - Generated output stays in sync with controllers.

### `src/renderer`

- Component tests for UI behavior:
    - Chat selection, message rendering, search highlighting, model/persona selection.
    - Command management screens and dropdown integration.
- Prefer wrapping components with `StoreProvider` and injecting a test `appDataSource` when testing feature hooks or backend-backed UI flows.
- Mock `window.api` only when verifying the Electron adapter path; most renderer tests should stay backend-agnostic through the shared app data source.

## Automation / E2E

Use Playwright in Electron mode to cover:

- App boots to splash → main UI.
- Create chat → send message → stream response → persisted history.
- Provider management (add/edit/delete provider).
- Settings navigation + theme toggle.

E2E tests should run in CI and be resilient:

- Avoid timing flakiness by waiting on visible UI states and deterministic test data.
- Prefer seeding DB or using a test-only DB directory per run.
