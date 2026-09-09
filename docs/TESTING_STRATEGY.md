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

The v1 registry contract requires the following representative matrix. Gaurav
Saini is the decision owner for matrix changes and stable-support approval.

| Representative    | Route / target level                                      | Configuration exercised                                                                   | Discovery                             | Adapter expectations                                         |
| ----------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------ |
| OpenAI            | `direct` / `stable`                                       | Required secret; advanced HTTPS base URL; model-scoped option                             | models.dev plus manual fallback       | Native adapter and direct credential path                    |
| Azure OpenAI      | `direct` / `experimental` until enterprise auth is proven | Endpoint, deployment, API version, named credential/tenant fields; conditional validation | Provider API or static/manual         | Dedicated enterprise adapter; no generic-header escape hatch |
| Ollama            | `local` / `stable`                                        | Optional loopback URL; no required secret; explicit private-network approval branch       | Local API                             | Local adapter, bounded `/tags` and model-detail calls        |
| OpenAI-compatible | `compatible` / `compatible`                               | Required endpoint, optional secret, loopback HTTP versus hosted HTTPS                     | Compatible model-list API plus manual | Shared compatibility adapter and documented feature subset   |
| AI Gateway        | `gateway` / `experimental` until stable bar is met        | Gateway credential, optional routing/account fields                                       | Gateway catalog                       | Dedicated gateway adapter; gateway data path is visible      |

This matrix approves contract coverage, not the release support level of a
provider that the current application does not yet ship.

For every representative, tests must cover:

- Definition parsing, unknown-key rejection, uniqueness, cross-field rules,
  simple/advanced presentation, and connection/model/chat scope separation.
- Public projection redaction and identical Electron IPC/HTTP RPC validation.
- Normalization idempotence, secret `unchanged`/`replace`/`clear`, endpoint and
  header policy, sanitized errors, and sentinel-secret absence from logs.
- Adapter key/API/range resolution, provider construction, connection success,
  authentication failure, timeout, cancellation, malformed response, and
  response-size limits.
- Discovery success, empty catalog, stale cache, partial/malformed data,
  capability provenance, manual fallback, ordering, and provider failure.
- Add, edit, restart, runtime resolution, deprecate/hide/unknown behavior,
  export/delete recovery, and transactional migration failure/rollback.

Minimum test bar by support level:

| Level          | Required bar                                                                                                                                                                                                                                                                                                    |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stable`       | All shared contract suites; adapter unit tests with every branch; Electron and HTTP integration parity; persistence/migration golden tests; one real-provider or recorded protocol conformance run; packaged Electron and built HTTP smoke tests; no open critical/high security defects; named owner approval. |
| `experimental` | Shared schema/redaction/security suites; adapter unit tests; both transport validation paths; deterministic mocked discovery and connection tests; limitations documented.                                                                                                                                      |
| `compatible`   | Shared schema/redaction/security suites; compatibility-subset conformance against a reference server; both transport paths; endpoint/origin tests; unsupported features fail explicitly.                                                                                                                        |
| `deprecated`   | Existing-config load/runtime or explicit blocked-state test; migration/export/delete recovery; no new-config path.                                                                                                                                                                                              |
| `hidden`       | Absent from add flow; existing config preserved and inspectable; runtime behavior matches recorded reason.                                                                                                                                                                                                      |

A provider cannot be labelled stable from unit mocks alone. CI secrets are not a
prerequisite for pull requests: protocol recordings or an owned conformance
server cover deterministic CI, while credentialed smoke tests run in a protected
environment on release candidates.

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
