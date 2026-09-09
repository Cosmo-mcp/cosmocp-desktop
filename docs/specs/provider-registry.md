# Provider registry v1 specification

Status: Proposed baseline for COS-DEV-006  
Contract version: `1.0.0`  
Decision owner: Gaurav Saini  
Last reviewed: 2026-09-09

## Purpose and scope

Cosmo's provider registry is the product source of truth for provider metadata,
configuration fields, discovery, lifecycle, compatibility, and support. It is
separate from AI SDK's `createProviderRegistry`, which remains the backend-only
runtime resolver for configured model instances.

Version 1 covers language-model providers and reserves extension points for
other model families. It defines contracts and policy only. Implementing the
registry, generating forms, changing persistence, upgrading packages, and
adding providers belong to later work items.

## Product decisions

These decisions resolve the open questions in COS-CHAT-001:

1. A provider is "supported" only with a visible support level and route:
   `direct`, `compatible`, `local`, or `gateway`. A catalog listing alone is not
   a support claim.
2. Executable definitions ship with the application. Cosmo may remotely refresh
   signed data-only metadata, but a remote document cannot introduce adapters,
   fields, scripts, URLs used for requests, or validation behavior.
3. The first generated forms cover connection configuration. Runtime/model
   options are represented by a distinct schema now and may be surfaced later.
4. Arbitrary custom headers are not accepted. Only reviewed, named header
   fields in an app-bundled definition may be configured.
5. Hidden, deprecated, renamed, unknown, and removed providers retain persisted
   configurations. Cosmo never silently rewrites or deletes them.
6. `stable` requires the minimum automated test bar in
   [Provider registry test matrix](../TESTING_STRATEGY.md#provider-registry-test-matrix).
7. AI Gateway is an optional `gateway` provider. It is neither the default nor
   a substitute for direct, compatible, or local support.

Any change to these decisions requires a replacement decision record approved
by the decision owner.

## Terms and support policy

Support has two independent dimensions: route and level.

### Routes

| Route        | Product meaning                                                                                                                                     | Credential, billing, and data path                                                                   |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `direct`     | Cosmo uses a reviewed native provider adapter and the provider's supported API. Provider-specific features may be exposed when tested.              | User credentials; provider billing; requests go directly to that provider.                           |
| `compatible` | Cosmo uses the reviewed OpenAI-compatible adapter against an explicitly configured service. Only the documented compatibility subset is promised.   | User credentials; service billing; requests go to the configured endpoint.                           |
| `local`      | Cosmo connects to software on a loopback or explicitly approved private endpoint. Offline operation is possible but not guaranteed by the registry. | Usually no credential; no Cosmo-routed billing; requests stay at the approved endpoint.              |
| `gateway`    | Cosmo connects through a reviewed routing provider such as AI Gateway. Downstream availability and capabilities depend on the gateway.              | Gateway credentials and billing; requests pass through the gateway and selected downstream provider. |

### Levels and lifecycle

| Level          | Meaning                                                                                                                                                             | User-visible behavior                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `stable`       | Meets the stable test bar, has an owned adapter, documented limitations, and is eligible for normal support.                                                        | Listed normally and enabled for new configurations.                                                    |
| `experimental` | Works for bounded scenarios but has incomplete coverage, capability parity, or operational confidence.                                                              | Listed with an Experimental label and explicit limitations; opt-in configuration is allowed.           |
| `compatible`   | Community/vendor service expected to work through the compatibility subset, without provider-specific guarantees. This level is valid only with route `compatible`. | Listed with a Compatible label; generic troubleshooting only.                                          |
| `deprecated`   | Existing configurations remain usable during a published migration window, but new configurations should not be created.                                            | Visible for existing users, labelled Deprecated, absent from the default add-provider list.            |
| `hidden`       | Not offered for new configurations. Used for emergency disablement, removal completion, or definitions not intended for direct selection.                           | Existing configurations remain inspectable/exportable; runtime use follows the lifecycle policy below. |

`gateway` and `local` are routes, not quality levels. A gateway or local
provider must still declare `stable` or `experimental`. A provider cannot claim
both `compatible` level and a non-`compatible` route.

## Contract boundaries

```text
trusted bundled definition (serializable)
  |-- public projection --> renderer-generated form and support labels
  |-- full schema -------> boundary validation and normalization
  |-- adapterKey --------> backend adapter map (executable, bundled)
  `-- discovery ---------> backend discovery adapter --> normalized models

persisted configuration --> secrets resolved in backend --> AI SDK provider
                                                   `-----> createProviderRegistry
```

Definitions contain data only: JSON-compatible primitives, arrays, and objects.
They must never contain functions, regular-expression source, template code,
import paths, executable expressions, or arbitrary request headers. Executable
adapter, discovery, migration, and connection-test implementations are selected
from reviewed backend maps by stable keys.

The renderer receives only the public projection. It never receives field
values marked `secret`, adapter maps, stored secret values, endpoint-policy
internals, or backend-only migration details.

## TypeScript contract

The normative contract is the following discriminated, serializable shape.
Later implementation may use Zod to validate it, but must preserve these names
and semantics for contract version 1.

```ts
type RegistrySchemaVersion = '1.0.0';
type ProviderId = string; // lowercase ASCII: ^[a-z0-9]+(?:[.-][a-z0-9]+)*$
type AdapterKey = string; // key into an app-bundled backend adapter map

type ProviderRoute = 'direct' | 'compatible' | 'local' | 'gateway';
type ProviderSupportLevel = 'stable' | 'experimental' | 'compatible' | 'deprecated' | 'hidden';
type PresentationGroup = 'simple' | 'advanced';
type ConfigurationScope = 'connection' | 'model' | 'chat';

type FieldValue = string | number | boolean | string[];

interface ProviderFieldDefinition {
    key: string; // stable within provider; never repurposed
    scope: ConfigurationScope;
    type: 'string' | 'secret' | 'url' | 'number' | 'boolean' | 'select' | 'string-list';
    label: string;
    helpText?: string;
    placeholder?: string;
    group: PresentationGroup;
    required: boolean;
    defaultValue?: FieldValue; // forbidden for secret fields
    options?: Array<{ value: string; label: string }>; // select only
    constraints?: {
        minLength?: number;
        maxLength?: number;
        minimum?: number;
        maximum?: number;
        allowedSchemes?: Array<'https' | 'http'>;
    };
    mapsTo?: string; // adapter-owned setting name, never an object path
}

interface ProviderDefinitionV1 {
    registrySchemaVersion: RegistrySchemaVersion;
    id: ProviderId;
    aliases?: ProviderId[];
    revision: number; // monotonically increases for semantic definition changes
    display: {
        name: string;
        description: string;
        iconKey: string;
        documentationUrl: string;
        categories: Array<'hosted' | 'local' | 'router' | 'compatible' | 'enterprise'>;
    };
    support: {
        route: ProviderRoute;
        level: ProviderSupportLevel;
        limitations?: string[];
        deprecatedAt?: string; // ISO 8601 date
        replacementProviderId?: ProviderId;
        removalEligibleAfter?: string; // ISO 8601 date
    };
    adapter: {
        key: AdapterKey;
        apiVersion: 1;
        compatibilityRange: string; // app-bundled adapter semantic-version range
    };
    fields: ProviderFieldDefinition[];
    validation: {
        ruleSetKey: string; // reviewed backend rule-set map
        normalizationKey: string; // reviewed backend normalizer map
    };
    discovery: {
        strategy: 'models-dev' | 'provider-api' | 'openai-compatible' | 'local-api' | 'static' | 'manual';
        adapterKey?: string;
        sourceKey?: string;
        allowManualModels: boolean;
    };
    capabilities: {
        modelFamilies: Array<'language' | 'embedding' | 'image' | 'speech' | 'transcription' | 'rerank'>;
    };
    migrations: Array<{
        fromRevision: number;
        toRevision: number;
        migrationKey: string; // reviewed backend migration map
    }>;
}

interface ProviderRegistryDocumentV1 {
    registrySchemaVersion: RegistrySchemaVersion;
    registryRevision: number;
    generatedAt: string;
    definitions: ProviderDefinitionV1[];
}
```

Contract invariants:

- IDs, aliases, field keys, and adapter keys are unique in their respective
  scopes. A canonical ID is never reused for another provider.
- `revision` and `registryRevision` are positive integers and never decrease.
- Every adapter, validation, normalization, discovery, and migration key
  resolves in the installed app before a definition is activated.
- Connection fields precede model/chat fields in processing; simple/advanced
  changes presentation only and never changes persistence or validation.
- Secret fields cannot declare defaults, appear in renderer views, logs, errors,
  analytics, registry metadata, or model discovery records.
- `http` is allowed only for a `local` route or a compatible endpoint that
  resolves to canonical loopback, and only after endpoint policy validation.
  All other endpoints require `https`.
- Unknown properties are rejected at the definition and IPC/HTTP boundaries.

## Typed examples

### Direct hosted provider

```ts
const openai: ProviderDefinitionV1 = {
    registrySchemaVersion: '1.0.0',
    id: 'openai',
    revision: 1,
    display: {
        name: 'OpenAI',
        description: 'Direct access to OpenAI models.',
        iconKey: 'openai',
        documentationUrl: 'https://platform.openai.com/docs',
        categories: ['hosted'],
    },
    support: { route: 'direct', level: 'stable' },
    adapter: { key: 'openai-native', apiVersion: 1, compatibilityRange: '^1.0.0' },
    fields: [
        { key: 'apiKey', scope: 'connection', type: 'secret', label: 'API key', group: 'simple', required: true },
        {
            key: 'baseUrl',
            scope: 'connection',
            type: 'url',
            label: 'Base URL',
            group: 'advanced',
            required: false,
            constraints: { allowedSchemes: ['https'] },
        },
        {
            key: 'temperature',
            scope: 'model',
            type: 'number',
            label: 'Temperature',
            group: 'advanced',
            required: false,
            constraints: { minimum: 0, maximum: 2 },
        },
    ],
    validation: { ruleSetKey: 'openai-v1', normalizationKey: 'hosted-v1' },
    discovery: { strategy: 'models-dev', sourceKey: 'openai', allowManualModels: true },
    capabilities: { modelFamilies: ['language', 'embedding', 'image', 'speech', 'transcription'] },
    migrations: [],
};
```

### OpenAI-compatible provider

```ts
const compatible: ProviderDefinitionV1 = {
    registrySchemaVersion: '1.0.0',
    id: 'openai-compatible',
    revision: 1,
    display: {
        name: 'OpenAI-compatible',
        description: "Connect to an endpoint implementing Cosmo's tested compatibility subset.",
        iconKey: 'compatible',
        documentationUrl: 'https://docs.cosmo.example/providers/compatible',
        categories: ['compatible'],
    },
    support: { route: 'compatible', level: 'compatible', limitations: ['Language-model subset only'] },
    adapter: { key: 'openai-compatible', apiVersion: 1, compatibilityRange: '^1.0.0' },
    fields: [
        { key: 'apiKey', scope: 'connection', type: 'secret', label: 'API key', group: 'simple', required: false },
        {
            key: 'baseUrl',
            scope: 'connection',
            type: 'url',
            label: 'Base URL',
            group: 'simple',
            required: true,
            constraints: { allowedSchemes: ['https', 'http'] },
        },
    ],
    validation: { ruleSetKey: 'compatible-v1', normalizationKey: 'compatible-v1' },
    discovery: { strategy: 'openai-compatible', adapterKey: 'openai-model-list-v1', allowManualModels: true },
    capabilities: { modelFamilies: ['language'] },
    migrations: [],
};
```

The compatible example permits `http` in its raw field declaration so users
can enter a loopback URL; centralized endpoint policy must still reject clear
text non-loopback destinations. Field constraints never bypass network policy.

## Connection versus runtime options

Connection configuration constructs a provider and is stored per configured
provider instance: credentials, endpoint, organization, project, region,
account, and reviewed named headers. Runtime options affect generation and are
stored separately at `model` or `chat` scope. They never participate in provider
identity, credential testing, or discovery unless an adapter contract explicitly
defines a read-only dependency.

`simple` is the minimum successful configuration for the common path.
`advanced` is progressive disclosure for optional or specialist configuration.
Both groups receive identical backend validation. Required advanced fields are
allowed only when conditional rules make them irrelevant to the common path;
otherwise they belong in `simple`.

## Adapter contract

Adapters are backend-only reviewed code. Each adapter implements the following
behavior without exposing the resolved configuration to the renderer:

```ts
interface ProviderAdapterV1 {
    readonly key: AdapterKey;
    readonly apiVersion: 1;
    validateConnection(input: UnknownFieldMap, context: EndpointPolicyContext): ValidationResult;
    normalizeConnection(input: ValidFieldMap): NormalizedConnectionConfig;
    createProvider(input: ResolvedSecretConnectionConfig): ProviderV4;
    testConnection(input: ResolvedSecretConnectionConfig, signal: AbortSignal): Promise<ConnectionTestResult>;
}
```

- `validateConnection` rejects unknown fields and applies cross-field and
  endpoint policy before any network request.
- `normalizeConnection` is deterministic and idempotent. It trims safe strings,
  canonicalizes URLs, and never transforms secret values except to distinguish
  absent, unchanged, replace, and clear operations.
- `createProvider` may import an SDK only from the installed dependency graph.
- `testConnection` uses bounded timeouts/response sizes and returns stable,
  sanitized error codes plus user-safe guidance.
- Discovery is a separate interface so model refresh cannot accidentally create
  a runtime provider or broaden its network privileges.

The app maintains an explicit adapter compatibility manifest. A definition is
inactive when its adapter key is absent, its API version differs, or the
installed adapter version is outside `compatibilityRange`.

## Versioning and lifecycle

### Version axes

- `registrySchemaVersion` uses semantic versioning. Major changes are not read
  by older apps. Minor changes add backward-compatible optional semantics.
- `registryRevision` changes whenever the document content changes and protects
  against replay/downgrade.
- Provider `revision` changes whenever fields, validation, discovery, support,
  or adapter compatibility changes.
- Persisted instances store canonical provider ID, definition revision used at
  last validation, configuration schema version, non-secret configuration,
  opaque secret references, and last migration result.

### Rename, deprecation, hide, and removal

- Display-name changes need no migration. Canonical ID changes are prohibited;
  a historical ID may become an alias that resolves to the original canonical
  ID before validation.
- Deprecation requires a replacement or reason, notice in release notes, and a
  minimum two-feature-release migration window unless security requires an
  emergency disablement.
- Hidden providers cannot be newly configured. Existing instances remain
  visible in an inspect/export/delete recovery view.
- Removing a definition from the active catalog does not remove persisted rows
  or secrets. It becomes an unknown preserved configuration and cannot run until
  a compatible definition is restored or the user migrates it.
- Emergency runtime disablement is allowed only for a documented security
  reason. The configuration stays exportable and deletable, and the UI explains
  why execution is blocked.

### Migration algorithm

1. Load persisted bytes into a quarantined legacy shape; never mutate in place.
2. Resolve canonical ID through bundled aliases. If no definition exists,
   preserve the instance as `unknown` and stop.
3. Apply every contiguous, app-bundled migration from stored revision to target
   revision to a copy, with secrets represented only by opaque references.
4. Strictly validate and normalize the migrated copy.
5. In one database transaction, write the new copy and an audit record, then
   retain a rollback snapshot until the next successful app startup.
6. On any error, keep the original bytes and secret references, mark migration
   `failed`, disable runtime use, and show export/retry guidance.

Migrations cannot delete a non-empty field or secret reference without explicit
user confirmation. Unknown fields are preserved in a quarantined extension map
for export but are never passed to an adapter. Downgrades do not rewrite newer
data; older apps open unsupported revisions read-only.

## Registry distribution and trust

The authoritative executable registry ships with each signed Cosmo release.
Remote refresh is limited to presentation metadata and lifecycle advisories for
already bundled provider IDs and revisions.

A remote document must be canonical JSON signed with an offline-controlled
Cosmo registry key. The app pins the public key and verifies signature,
schema version, monotonically increasing revision, issued/expiry times, maximum
document size, and provider/field identity before caching it. It must fail
closed to the last valid document or bundled metadata.

Remote metadata cannot change adapter/discovery/migration keys, fields,
validation, endpoint rules, documentation hosts, icons containing active
content, defaults, capabilities used for authorization, or support from a more
restrictive state to a less restrictive state. Key rotation requires an app
release signed by the existing release trust chain. The registry is never a
plugin or code-loading channel.

## Compatibility and failure behavior

- Missing definitions/adapters, newer major schemas, failed migrations, and
  invalid signatures are explicit non-runnable states, not fallbacks.
- Capability metadata is descriptive. Runtime code must handle provider/model
  rejection and may not treat metadata as authorization.
- Model discovery records provenance, fetch time, provider revision, and source.
  Stale data is labelled and never silently promoted to current.
- The same strict schemas and normalization run for Electron IPC and HTTP RPC.
- All network activity is initiated in main/core runtime code, never renderer or
  remote metadata.

## Acceptance and change control

Gaurav Saini is the named decision owner for the v1 baseline and representative
matrix. Status remains Proposed until owner review. Approval is recorded by
changing this document's status to `Accepted` in the same change that marks the
decision record accepted. Later tasks may implement only the Proposed contract
without incompatible assumptions and must escalate deviations to the owner.
