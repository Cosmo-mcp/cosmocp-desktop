# Provider registry threat model

Status: Proposed  
Owner: Gaurav Saini  
Reviewed: 2026-09-09

## Assets and trust boundaries

Protected assets are provider credentials, account/organization identifiers,
endpoint and header configuration, prompt/model traffic, local-network services,
model metadata, persisted configurations, logs, and the integrity of runtime
adapter selection.

Trust boundaries are renderer to preload, Electron IPC or HTTP RPC to main,
main/core to `SecretStore` and PGlite, main/core to provider endpoints, bundled
definition to executable adapter maps, and optional remote metadata to the local
registry cache. The renderer, IPC/HTTP input, provider responses, models.dev,
local services, stored legacy records, and all remote metadata are untrusted.

## Threats and required controls

| Threat                              | Example impact                                                          | Required controls                                                                                                                                                                                                             | Verification                                                |
| ----------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Secret disclosure to renderer       | Edit/list response contains an API key                                  | Public DTO omits secret values; return only `hasSecret`/field status; generated APIs use redacted DTOs                                                                                                                        | Contract snapshots and Electron/HTTP integration tests      |
| Secret leakage in logs/errors       | SDK exception includes authorization header or prompt                   | Structured allowlisted logging; stable sanitized error codes; recursive redaction at logger boundary; never log full request/response bodies                                                                                  | Sentinel-secret log tests and error-path tests              |
| Secret persistence exposure         | Plaintext credentials in PGlite, backup, or migration snapshot          | Store opaque `SecretStore` references; encrypt before DB write; migrations never materialize secrets in records                                                                                                               | Repository and migration inspection tests                   |
| Secret confusion on edit            | Empty renderer field erases or echoes an existing key                   | Explicit operations: `unchanged`, `replace`, `clear`; clearing requires confirmation; never use empty-string ambiguity                                                                                                        | Update contract branch tests                                |
| SSRF through endpoint               | User or metadata targets cloud metadata, LAN admin service, or redirect | Parse/canonicalize centrally; resolve DNS; deny link-local, multicast, unspecified, metadata, credentials-in-URL, and unsafe ports; revalidate every redirect; default HTTPS; explicit local-provider loopback/private policy | IPv4/IPv6, DNS rebinding, redirect, encoded-address tests   |
| Header injection/exfiltration       | Custom `Authorization`, `Host`, forwarding, or newline header           | No arbitrary headers; bundled named fields map to fixed header names; reject CR/LF and forbidden hop-by-hop/proxy headers; secrets scoped to exact approved origin                                                            | Schema, origin-scope, and request-capture tests             |
| Malicious remote registry           | Signed/unsigned metadata changes endpoint or adapter                    | Signature and pin verification; monotonic revision; expiry/size/schema limits; remote allowlist of display/advisory fields; no code, URLs used for requests, fields, defaults, or adapter keys                                | Tamper, replay, downgrade, expiry, and forbidden-diff tests |
| Compromised provider/model response | Oversized JSON, hostile model text, active icon content                 | Timeouts and byte/item/depth limits; strict schemas; treat descriptions as text; bundled passive icons only; no unsafe HTML                                                                                                   | Fuzz, size-limit, and rendering tests                       |
| Adapter substitution                | Definition selects unexpected package/factory                           | Closed bundled adapter map; API/version/range check; no dynamic import paths; release dependency review                                                                                                                       | Registry contract and packaging tests                       |
| Cross-provider credential reuse     | Compatible endpoint receives a key intended for another host            | Bind secret reference to provider instance, field key, and approved origin; require confirmation when origin changes; do not follow cross-origin redirects with credentials                                                   | Origin-change and redirect tests                            |
| Persisted-config data loss          | Rename/removal/migration drops fields or secrets                        | Copy-and-validate transaction; rollback snapshot; quarantine unknown fields; read-only handling for newer data; no destructive migration without consent                                                                      | Golden migration and interruption tests                     |
| Process-boundary bypass             | HTTP or IPC accepts fields UI never showed                              | Strict Zod schemas with unknown-key rejection at both transports; backend repeats all validation and authorization                                                                                                            | Parity and adversarial payload tests                        |
| Local-provider exposure             | `0.0.0.0` bind or remote HTTP endpoint is treated as safe local         | Route is a product label, not trust evidence; default loopback only; explicit user approval for private addresses; never classify hostname by string alone                                                                    | Endpoint-policy tests                                       |
| Metadata capability spoofing        | UI enables tools/attachments the runtime cannot safely use              | Capabilities are advisory; runtime validates model/provider behavior; preserve provenance and staleness                                                                                                                       | Capability mismatch and stale-cache tests                   |

## Endpoint policy baseline

Endpoint validation happens before DNS/network access and again after DNS
resolution and every redirect. Hosted and gateway routes require HTTPS. The
compatible route permits HTTP only for canonical loopback. Local routes default
to loopback; private-network access requires an explicit per-origin approval and
cannot be introduced by remote metadata.

Reject userinfo, fragments, non-HTTP protocols, ambiguous/encoded IP forms,
IPv4-mapped IPv6 bypasses, link-local and metadata destinations, wildcard or
unspecified addresses, and redirects to a less trusted origin. Pin the validated
origin for each request sequence and apply connect/read timeouts plus response
size limits. Proxy behavior must not bypass the same policy.

## Secret and redaction baseline

Renderer DTOs contain field definitions, non-secret values allowed by policy,
and `{configured: boolean}` for secret fields. Secret resolution occurs as late
as possible in the backend and values are held only for the operation. Logs use
an allowlist of stable identifiers such as provider instance ID, canonical
provider ID, adapter key, operation, duration, and sanitized result code.

Never log credentials, configured header values, complete endpoints containing
queries, prompts, provider response bodies, migrated configuration blobs, or
exceptions before sanitization. Tests use a sentinel credential and assert it
does not appear in logs, thrown messages, RPC responses, caches, or snapshots.

## Remote metadata response

On signature, schema, expiry, replay, or forbidden-diff failure, discard the
candidate, retain the last valid cache, and fall back to bundled metadata when
no valid cache exists. Record only revision, failure code, and timestamps. Do
not log the rejected document. Repeated failures never weaken verification.

## Residual risks and ownership

Provider SDKs and upstream services may mishandle data outside Cosmo's control;
support copy must describe the selected route and data path. OS compromise can
defeat application-level secret storage. DNS and proxy behavior varies across
platforms and requires platform integration tests. Gaurav Saini owns acceptance
of these residual risks and any exception to the endpoint or remote-metadata
baseline.
