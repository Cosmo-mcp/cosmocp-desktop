# Decision record: provider registry source, support, and lifecycle

Status: Proposed  
Date: 2026-09-09  
Decision owner: Gaurav Saini  
Related work: COS-DEV-006, COS-CHAT-001

## Context

Cosmo currently combines a static display catalog, a database type enum,
renderer form branches, discovery branches, and a backend provider factory map.
Adding or retiring a provider therefore requires coordinated changes and can
produce inconsistent validation across renderer, IPC/HTTP, persistence, and
runtime construction. AI SDK's runtime registry does not solve product metadata,
configuration, migration, support, or trust concerns.

## Decision

Adopt the versioned, serializable product contract in
[Provider registry v1 specification](provider-registry.md) with these boundaries:

- App-bundled definitions are authoritative for behavior. Signed remote refresh
  is optional and limited to non-executable metadata for bundled identities.
- Backend-only adapter maps own executable construction, validation,
  normalization, discovery, connection tests, and migrations.
- Support is expressed as an independent route and level. AI Gateway is an
  optional gateway route, not a default or compatibility fallback.
- Versioned copy-and-validate migrations preserve unknown, deprecated, hidden,
  removed, newer, and failed configurations without silent data loss.
- V1 UI generation uses connection fields. Model/chat runtime options stay in a
  separate namespace even before the UI exposes them.
- Only named, bundled header fields are allowed. Endpoint access is governed by
  a central deny-by-default network policy.

## Alternatives considered

### Keep app-bundled definitions only forever

This is simplest and safest, but forces an application release for harmless
description or lifecycle-advisory changes. The selected approach preserves the
same executable trust boundary while allowing a narrowly scoped future refresh.

### Permit fully remote provider definitions

Rejected. Remote fields, adapter locations, validation expressions, headers, or
request templates would create a code/configuration supply-chain channel and
could exfiltrate secrets or enable SSRF.

### Treat AI Gateway as the universal provider path

Rejected. It changes billing, credentials, data path, privacy, availability,
and provider-specific feature access. Gateway remains useful as an explicit
route alongside direct, compatible, and local routes.

### Store all settings in one untyped JSON object

Rejected. It conflates secrets, connection identity, and runtime behavior;
weakens renderer redaction; and makes safe migrations and generated forms
ambiguous.

## Consequences

- Later implementation needs strict Zod schemas, new persistence fields or
  tables, adapter manifests, and migration machinery.
- Existing enum values become legacy inputs; canonical string IDs must not
  require a database enum migration.
- Provider additions remain reviewed changes even when they reuse the
  compatible adapter.
- Remote metadata can reduce support visibility but cannot enable executable
  behavior or broaden permissions.
- Unknown configurations remain recoverable, which adds UI and persistence
  complexity but prevents silent loss.

## Approval

The representative test matrix and all product decisions are owned by Gaurav
Saini. Change `Status` to `Accepted` after review; record incompatible changes
in a superseding decision record rather than silently editing this decision.
