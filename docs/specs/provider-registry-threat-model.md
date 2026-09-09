# Provider registry threat model

Status: Proposed

Owner: Gaurav Saini

Reviewed: 2026-09-09

## What we protect

Cosmo must protect:

- API keys and other secrets;
- account, organization, endpoint, and header settings;
- prompts and model responses;
- services on the user's computer and private network;
- saved provider settings; and
- the adapter that Cosmo chooses for a provider.

The renderer, IPC and HTTP input, provider responses, model lists, local
services, and old saved records are untrusted. The local registry is trusted
only after the build checks it and the normal code review and release process
approves it.

## Main risks and controls

| Risk                                          | What could happen                                                | What Cosmo must do                                                                                                                      |
| --------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Secret reaches the renderer                   | An API key appears in a list or edit response                    | Return only whether a secret is set. Never return its value. Test both Electron and HTTP responses.                                     |
| Secret appears in a log or error              | An SDK error includes a key, header, prompt, or response         | Log only approved fields. Clean errors before logging or returning them. Test with a unique fake secret.                                |
| Secret is stored as plain text                | A database or backup exposes keys                                | Save secrets through `SecretStore`. Keep only secret references in provider records and migrations.                                     |
| Editing removes a secret by mistake           | An empty input silently overwrites a saved key                   | Use clear actions: keep, replace, or remove. Ask before removing a saved secret.                                                        |
| Unsafe endpoint causes SSRF                   | A provider URL reaches cloud metadata or a private admin service | Check the URL before connecting, after DNS lookup, and after every redirect. Block unsafe addresses and ports.                          |
| A custom header leaks data                    | A user sets `Host`, `Authorization`, or a proxy header           | Allow only named header fields from the local registry. Block line breaks and unsafe header names. Bind secrets to one approved origin. |
| Registry change selects unsafe code           | A JSON entry points to a package or script                       | Allow only keys from reviewed backend adapter maps. Never load code, scripts, or import paths from JSON.                                |
| Registry and generated code disagree          | The UI shows fields the backend does not check                   | Generate both backend and frontend registries from the same local file. Fail the build if generation is stale or invalid.               |
| Bad provider response uses too many resources | A model list is huge or malformed                                | Set time, size, item, and nesting limits. Check response shapes before using them.                                                      |
| Migration loses settings                      | A rename or upgrade drops fields or secrets                      | Move a copy, check it, save it in one transaction, and keep the original on failure. Never delete filled fields without permission.     |
| IPC or HTTP bypasses the form                 | A caller sends fields the UI did not show                        | Use strict Zod schemas on both boundaries. Repeat all checks in the backend.                                                            |
| A local route is treated as safe by name      | A fake local URL points somewhere else                           | Check the resolved address. Allow loopback by default and ask before using an approved private address.                                 |
| Capability data is wrong                      | The UI enables a feature the model cannot use                    | Treat capabilities as helpful labels, not permissions. Check support again when the model runs.                                         |

## Endpoint rules

Hosted and gateway providers must use HTTPS. An OpenAI-compatible provider can
use HTTP only on the same computer. Local providers use loopback by default.
Using a private-network address needs clear user approval for that address.

Block URLs with usernames or passwords, non-HTTP protocols, unusual encoded IP
forms, cloud metadata addresses, link-local addresses, wildcard addresses, and
redirects to a less trusted place. Apply the same checks when a proxy is used.
Every request needs connection and read timeouts plus a response-size limit.

## Secret and logging rules

The frontend only knows that a secret exists. The backend loads its value as
late as possible and holds it only while needed.

Logs may include the saved provider ID, provider type, adapter key, action,
duration, and a safe result code. Logs must not include keys, header values,
complete URLs with query strings, prompts, responses, or saved configuration
objects.

Tests use a unique fake key and prove that it never appears in logs, errors, API
responses, generated frontend data, caches, or snapshots.

## Local registry safety

The provider registry and JSON Schema live in the repository. Builds do not
download registry files. Normal code review protects changes to both files.

The build must reject unknown fields, duplicate IDs, missing adapters, missing
local icons, invalid versions, secret defaults, and backend-only data in the
frontend output. Generated files include the source hash so CI can detect stale
output. A registry entry cannot run a script or choose an import path.

## Remaining risks

Provider SDKs and services may handle data outside Cosmo's control. The UI must
tell users which route their request takes. A compromised operating system can
bypass app-level secret protection. DNS and proxy behavior differs by platform,
so endpoint tests must run on supported platforms.

Gaurav Saini owns any exception to these rules and accepts the remaining risks.
