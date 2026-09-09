# Decision record: one local provider registry

Status: Proposed

Date: 2026-09-09

Decision owner: Gaurav Saini

Related work: COS-DEV-006, COS-CHAT-001

## Problem

Provider information is spread across the catalog, database types, UI forms,
model discovery code, and backend factory code. Adding or removing a provider
means changing many files. Those files can easily disagree.

AI SDK's registry does not solve this problem. It only finds running models. It
does not define setup forms, saved settings, support levels, or migrations.

## Decision

Cosmo will use one local JSON registry as the provider source of truth. Its
layout takes the [ACP registry](https://cdn.agentclientprotocol.com/registry/v1/latest/registry.json)
as a reference: a versioned document with a list of entries.

The source files will live in the product repository:

```text
packages/core/provider-registry/registry.json
packages/core/provider-registry/registry.schema.json
```

A build script will check the registry and create:

- the full backend registry; and
- a safe public registry for the frontend setup forms.

The app will not download provider definitions at build time or runtime. The ACP
URL is a reference, not a build input. Provider icons will also be local.

Other decisions:

- Reviewed backend adapters contain all executable code.
- Every provider shows both a route and a support level.
- AI Gateway is optional, not the default.
- Connection fields and runtime options stay separate.
- Only named headers in the local definition are allowed.
- Provider changes and migrations never silently delete saved settings.

The full rules are in the
[provider registry specification](provider-registry.md).

## Options we did not choose

### Download the registry from a server

Rejected. It would make builds or the app depend on a network service and would
add a supply-chain risk. Provider changes should go through normal code review
and ship with the app.

### Use AI Gateway for every provider

Rejected. A gateway changes billing, credentials, privacy, and where requests
go. Users must be able to choose direct, compatible, local, or gateway routes.

### Save every setting in one untyped object

Rejected. That makes it hard to hide secrets, create forms, check input, and
move old data safely.

## Result

Adding a provider becomes one reviewed registry entry, a local icon, tests, and
an adapter only when needed. Backend and frontend code come from the same file,
so they cannot keep separate provider lists.

The build becomes stricter: it fails when the registry is invalid or references
a missing adapter or icon. Saved configurations need clear versions and safe
migrations.

## Approval

Gaurav Saini owns this decision and the test matrix. Change `Status` to
`Accepted` after review. Record any future incompatible choice in a new decision
record.
