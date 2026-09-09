# Provider registry v1 specification

Status: Proposed

Contract version: `1.0.0`

Decision owner: Gaurav Saini

Last reviewed: 2026-09-09

## Why we need this

Cosmo needs one place to describe every AI provider. We call this the **product
registry**. It describes:

- what the provider is;
- how users set it up;
- how Cosmo checks its settings;
- how Cosmo finds its models;
- how well Cosmo supports it; and
- how Cosmo handles changes over time.

This is not the same as AI SDK's `createProviderRegistry`. The AI SDK registry
only finds a running model by name. Cosmo will keep using it for that job.

This document defines the contract and rules for version 1. It does not build
the registry or change the app. Those changes belong to later tasks.

The file layout follows the simple pattern used by the
[ACP registry](https://cdn.agentclientprotocol.com/registry/v1/latest/registry.json):
one versioned JSON document with a list of entries. The ACP file is a design
reference only. Cosmo never downloads it to build or run provider support.

## Decisions

These decisions answer the open questions in COS-CHAT-001:

1. Cosmo only calls a provider "supported" when it shows both its support route
   and support level. These terms are explained below.
2. The registry and its JSON Schema are local files in this repository. The
   build reads those files and creates the backend and frontend registry code.
   The app does not download provider definitions at build time or runtime.
3. The first generated setup forms will cover connection settings. Model and
   chat settings have a separate schema, but the first UI does not need to show
   them.
4. Users cannot add any HTTP header they want. A trusted provider definition
   must list each allowed header field by name.
5. Hiding, renaming, deprecating, or removing a provider never deletes a user's
   saved settings.
6. A provider can be called `stable` only after it passes the tests in the
   [provider registry test matrix](../TESTING_STRATEGY.md#provider-registry-test-matrix).
7. AI Gateway is an optional provider. It is not the default and does not
   replace direct, compatible, or local providers.

Changing these decisions requires a new decision record approved by the
decision owner.

## Support routes

A **route** tells users where their request goes and who handles credentials and
billing.

| Route        | What it means                                                                                                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `direct`     | Cosmo connects to the provider through its own supported API. The user has an account and key with that provider. The provider handles billing and receives the request directly. |
| `compatible` | Cosmo connects through the common OpenAI-compatible adapter. Cosmo only promises the small feature set listed in its compatibility guide.                                         |
| `local`      | Cosmo connects to software running on the user's computer or an approved private address. A local label does not make an address safe by itself.                                  |
| `gateway`    | Cosmo sends the request through a routing service such as AI Gateway. The gateway handles credentials, billing, and routing to another provider.                                  |

## Support levels

A **level** tells users how well Cosmo has tested and supports the route.

| Level          | What it means                                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stable`       | The provider passed the full stable test bar, has an owned adapter, and has documented limits. Users can expect normal support.                                                            |
| `experimental` | The provider works for listed cases, but some tests, features, or operating experience are still missing. The UI must show its limits.                                                     |
| `compatible`   | The service is expected to work through Cosmo's OpenAI-compatible feature set. Cosmo does not promise provider-specific features. This level can only be used with the `compatible` route. |
| `deprecated`   | Existing setups can keep working for a stated period, but users should not create new ones. The UI points users to a replacement or explains why there is none.                            |
| `hidden`       | Users cannot create a new setup. Existing setups stay visible so users can inspect, export, move, or delete them.                                                                          |

`local` and `gateway` are routes, not support levels. They must also use
`stable` or `experimental`.

## What runs where

```text
local registry.json (data only)
  |-- checked with local registry.schema.json
  |-- safe public data --> setup form in the renderer
  |-- field rules ------> backend checks and cleans user input
  |-- adapter key ------> reviewed backend adapter
  `-- discovery rule ---> reviewed model discovery adapter

saved settings --> backend loads secrets --> AI SDK provider
                                      `----> createProviderRegistry
```

A provider definition is data, not code. It can use JSON values such as text,
numbers, lists, and objects. It cannot contain functions, scripts, import paths,
regular-expression text, request templates, or free-form headers.

Code lives in reviewed adapter maps in the backend. The renderer only receives
safe public data. It never receives saved secrets, executable adapter details,
or private migration data.

## TypeScript contract

The names and meanings below are the version 1 contract. The implementation can
use Zod to check this data, but it must keep this public shape.

```ts
type RegistrySchemaVersion = '1.0.0';
type ProviderId = string; // lowercase: ^[a-z0-9]+(?:[.-][a-z0-9]+)*$
type AdapterKey = string; // key in a reviewed backend adapter map

type ProviderRoute = 'direct' | 'compatible' | 'local' | 'gateway';
type ProviderSupportLevel = 'stable' | 'experimental' | 'compatible' | 'deprecated' | 'hidden';
type PresentationGroup = 'simple' | 'advanced';
type ConfigurationScope = 'connection' | 'model' | 'chat';

type FieldValue = string | number | boolean | string[];

interface ProviderFieldDefinition {
    key: string; // stable within this provider; never reuse it for a new meaning
    scope: ConfigurationScope;
    type: 'string' | 'secret' | 'url' | 'number' | 'boolean' | 'select' | 'string-list';
    label: string;
    helpText?: string;
    placeholder?: string;
    group: PresentationGroup;
    required: boolean;
    defaultValue?: FieldValue; // secrets cannot have defaults
    options?: Array<{ value: string; label: string }>; // select fields only
    constraints?: {
        minLength?: number;
        maxLength?: number;
        minimum?: number;
        maximum?: number;
        allowedSchemes?: Array<'https' | 'http'>;
    };
    mapsTo?: string; // setting name owned by the adapter; not an object path
}

interface ProviderDefinitionV1 {
    id: ProviderId;
    version: string; // semantic version for this provider definition
    aliases?: ProviderId[];
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
        deprecatedAt?: string;
        replacementProviderId?: ProviderId;
        removalEligibleAfter?: string;
    };
    adapter: {
        key: AdapterKey;
        apiVersion: 1;
        compatibilityRange: string;
    };
    fields: ProviderFieldDefinition[];
    validation: {
        ruleSetKey: string;
        normalizationKey: string;
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
        fromVersion: string;
        toVersion: string;
        migrationKey: string;
    }>;
}

interface ProviderRegistryDocumentV1 {
    version: RegistrySchemaVersion;
    providers: ProviderDefinitionV1[];
    extensions: unknown[]; // reserved; must be empty in version 1
}
```

### Contract rules

- Provider IDs, aliases, field keys, and adapter keys must be unique in their
  own scope. Never reuse an old provider ID for a different provider.
- Registry and provider versions use semantic versioning and can only move
  forward.
- Every code key must exist in the installed app before Cosmo enables the
  definition.
- Cosmo checks connection fields before model and chat fields.
- `simple` and `advanced` only control how the form looks. They do not change
  how a field is saved or checked.
- Secret fields cannot have defaults. Secret values cannot appear in the
  renderer, logs, errors, analytics, registry data, or model data.
- Plain HTTP is only allowed for local routes or compatible services on the
  same computer. All other endpoints must use HTTPS.
- Cosmo rejects fields it does not know at the definition, IPC, and HTTP
  boundaries.

## Example: direct hosted provider

```ts
const openai: ProviderDefinitionV1 = {
    id: 'openai',
    version: '1.0.0',
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

## Example: OpenAI-compatible provider

```ts
const compatible: ProviderDefinitionV1 = {
    id: 'openai-compatible',
    version: '1.0.0',
    display: {
        name: 'OpenAI-compatible',
        description: "Connect to a service that supports Cosmo's tested OpenAI-compatible features.",
        iconKey: 'compatible',
        documentationUrl: 'https://docs.cosmo.example/providers/compatible',
        categories: ['compatible'],
    },
    support: { route: 'compatible', level: 'compatible', limitations: ['Language models only'] },
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

The field allows HTTP so a user can enter a service on the same computer. The
backend must still reject any unsafe non-HTTPS address.

## Connection settings and runtime options

**Connection settings** are needed to connect to a provider. Examples are API
keys, endpoints, organization IDs, projects, regions, accounts, and approved
headers. Cosmo saves them for one configured provider.

**Runtime options** change how a model answers. Examples are temperature and
token limits. Cosmo saves them for a model or chat. They do not identify a
provider and do not take part in login or model discovery.

**Simple fields** are the smallest set most users need. **Advanced fields** are
optional settings for special cases. Both groups get the same backend checks.
If every user must fill in a field, it belongs in the simple group unless it is
only required after another advanced choice.

## Adapter contract

An adapter is reviewed backend code. It turns checked settings into a working AI
SDK provider.

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

- `validateConnection` rejects unknown fields and unsafe combinations before
  making a network request.
- `normalizeConnection` trims safe text and puts URLs into one standard form.
  Running it twice must give the same result. It keeps secret actions clear:
  keep, replace, or remove.
- `createProvider` can only use packages that ship with the app.
- `testConnection` has time and response-size limits. It returns safe error
  codes and helpful messages without leaking secrets.
- Model discovery uses a separate adapter. Finding models cannot create a chat
  provider or gain wider network access.

Cosmo keeps a list of installed adapter versions. It disables a definition when
the adapter is missing or has the wrong version.

## Versions and saved data

Cosmo tracks two kinds of version, like the ACP registry:

- The top-level `version` changes when the registry contract changes. An older
  app does not read a newer major version.
- A provider's `version` changes whenever its fields, checks, discovery,
  support, or adapter needs change.

A saved provider stores its provider ID, provider version, configuration schema
version, non-secret settings, secret references, and last migration result.

### Renaming, deprecating, hiding, and removing

- Changing the display name needs no migration.
- Do not change a provider's ID. An old ID may become an alias for the same
  provider.
- A deprecated provider needs a reason or replacement and release-note notice.
  Users get at least two feature releases to move unless there is an urgent
  security issue.
- A hidden provider disappears from the add screen. Existing users can still
  inspect, export, move, or delete their setup.
- Removing a definition never deletes saved settings or secrets. Cosmo keeps the
  setup as `unknown` and blocks it from running until support returns or the user
  moves it.
- Cosmo may stop a provider at once for a serious security problem. It must tell
  the user why and keep export and delete actions available.

### Moving saved data to a new revision

1. Read the old data without changing it.
2. Find the provider by its ID or an approved alias. If it is unknown, keep the
   data as-is and stop.
3. Run each migration from the saved version to the current version on a copy.
   Pass secret references, not secret
   values.
4. Check and clean the migrated copy with the new definition.
5. Save the new copy and an audit record in one database transaction. Keep a
   rollback copy until the next successful app start.
6. If anything fails, keep the old data, mark the migration as failed, stop the
   provider from running, and let the user export or retry.

A migration cannot remove a filled field or secret reference without asking the
user. Unknown fields stay in a separate export-only area and never reach an
adapter. An older app opens newer data as read-only instead of rewriting it.

## Local files and build output

Later implementation tasks must add these source files:

```text
packages/core/provider-registry/
  registry.json
  registry.schema.json
```

`registry.json` is the only provider list. Its top level follows the ACP pattern:

```json
{
    "version": "1.0.0",
    "providers": [],
    "extensions": []
}
```

`registry.schema.json` checks the document and all provider entries. Both files
ship in the repository. They are not hosted or loaded from a network address.
Provider icons used by the app are also local assets.

A build script reads `registry.json`, checks it against `registry.schema.json`,
and creates two outputs:

1. A backend registry with the full checked definitions and adapter keys.
2. A frontend registry with only public display data and form fields. It never
   contains saved secret values or backend code.

Both Electron and HTTP builds use the same backend output. The static Next.js
renderer uses the same frontend output. Developers do not maintain a second
provider list in TypeScript or in the UI.

The build fails on an invalid version, duplicate ID, bad field, missing adapter,
missing local icon, or unsafe public projection. Generated files are never
edited by hand. The build does not fetch the ACP registry or any other provider
definition file from the network.

## Safe failure rules

- A missing adapter, unsupported schema, or failed migration blocks the
  provider. Cosmo never guesses or silently falls back.
- Capability data is a description, not a permission. Runtime code still checks
  what the provider and model can do.
- Discovered models record where and when the data came from. The UI labels old
  data as stale.
- Electron IPC and HTTP RPC use the same strict checks.
- Only backend code can make provider and discovery network requests.

## Ownership and approval

Gaurav Saini owns this version 1 proposal and the test matrix. The status stays
`Proposed` until the owner reviews it. Approval changes this document and the
decision record to `Accepted`. Later work must ask the owner before making a
change that breaks this contract.
