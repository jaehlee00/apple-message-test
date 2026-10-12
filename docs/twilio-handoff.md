# Twilio live activation path

Prepared October 12, 2026. The runnable project is `twilio/`. This supersedes the earlier rich-link-only adapter as the intended integration path. No account or live service was connected in this session.

Both packaging paths invoke their installed **iMessage extension**. Select the matching identity from `twilio/config/standalone.env.example` or `twilio/config/app-with-messages.env.example`; see `packaging-paths.md`. One environment selects one product identity. App Clip setup, associated domains and AASA configuration are optional and are not prerequisites for this path.

## Establish the channel contract

The agent-led App Store installation and return-to-conversation flow is tracked in [Integration TODOs](integration-todo.md). The customer accepts installation; delivery of a link does not establish that the native extension is installed. The primary component experience must remain inline.

Obtain the documentation associated with your Twilio AMB beta account. Ask the AMB team to confirm **Custom Interactive Messages invoking a third-party iMessage extension, with live layout**. Rich links, Apple Pay or list pickers alone do not establish this capability.

| Topic | Required evidence |
| --- | --- |
| Capability | Custom extension invocation/live layout enabled for this account |
| Send API | Endpoint, method, API version/product, authentication, encoding and response schema |
| Native identity | Exact types/nesting for app ID/name, Team ID, extension bundle ID, session UUID, URL, live-layout flag and fallback |
| Inbound event | Account, channel, event discriminator/ID, business sender, opaque recipient/conversation ID and text |
| Protection | Compatibility with protected Twilio Functions and documented signature behavior |
| Acknowledgement | Expected HTTP status, MIME type and response body |
| App testing | Supported development/TestFlight/App Store setup and app-ID requirements |
| Eligibility | Customer-initiated conversation rules, opt-out/closed-conversation behavior and required checks |
| Delivery | Callback schema, accepted vs delivered/failed state, retry and timeout behavior |

Public Communications API documentation supplies real endpoints, auth, operation response and event-schema evidence; see `twilio-public-evidence.md`. The complete native-extension content mapping remains unverified. Do not populate it from another MSP's documentation.

## Deploy data and fallback first

Use the intended Twilio account/profile. With Node 22 and the Twilio CLI installed:

```sh
twilio login
twilio plugins:install @twilio-labs/plugin-serverless@4.0.0
cd twilio
npm ci --ignore-scripts
# Choose exactly one, matching your Xcode project:
cp config/standalone.env.example .env
# Or: cp config/app-with-messages.env.example .env
```

Keep `AMB_ENABLE_LIVE_DELIVERY=false`. Configure the account's Functions environment, choose the intended test service and deploy:

```sh
twilio serverless:deploy --runtime node22
```

This publishes the public-company chart endpoints below. No client holdings, synthetic attribution or price records are included. Review scope and provider-data distribution permissions before wider release.

| Path | Visibility | Purpose |
| --- | --- | --- |
| `/chart-manifest` | Public Function | Verified snapshot; native client checks canonical JSON against its bundle |
| `/chart` | Public Function | Original Financial Charts web fallback; optional App Clip discovery metadata |
| `/mock-confirm` | Public Function | Stateless mock review API; no real business action |
| `/apple-app-site-association` | Public Function | App/domain association JSON; map also to `/.well-known/apple-app-site-association` during App Clip deployment |
| `/revenue-preview.png` | Public asset | Alternative bubble image |
| `/amb-inbound` | **Protected Function** | Incoming AMB handler |
| `/amb-contract.json`, `/core.js`, `/sync-store.js`, `/chart-runtime.html`, `/chart-manifest.json`, `/mock-review.js` | Private assets | Runtime configuration/code/data |

Set `PUBLIC_BASE_URL` and native `ChartConfiguration.publicOrigin` to the actual origin returned by Twilio. Verify deployed route visibility. Never make the inbound Function public to work around authentication failure. The native client must not contain a Twilio Auth Token.

## Configure the app and one-conversation test

Complete `ios/README.md`: real registered bundle identifiers, signing team, public origin, build and installation. Configure `APPLE_*` values from your account. The App Store ID is different from a bundle ID and Team ID.

Create a Sync service and Map in Twilio Console. Set `SYNC_SERVICE_SID` and `SYNC_MAP_SID`. Leave map/item TTL disabled so an old event does not become sendable after its deduplication record expires. Records contain a hash, correlation UUID and provider acceptance ID, not message bodies or recipient identifiers.

Choose a consenting internal tester and a customer-initiated AMB conversation. Set `AMB_TEST_RECIPIENT` to its exact verified opaque identifier and `AMB_BUSINESS_SENDER` to the documented business address. No phone-number convention or `apple:`/`amb:` prefix is assumed.

## Map the actual beta API

Edit private `assets/amb-contract.private.json` from evidence. Record `documentationRef` and `reviewedOn`. Set `verified` and `protectedFunctionsCompatible` only after verification. A switch alone cannot activate delivery.

Inbound paths use dot notation. Channel/kind values must match documented strings. All mappings are required and never default to SMS fields.

The generic adapter supports a single JSON or form POST with explicitly confirmed `account-basic` authentication to an allowlisted Twilio HTTPS API. The endpoint is static configuration, never inbound input.

| Template token | Application value |
| --- | --- |
| `{{recipient}}` | Verified incoming identifier, restricted to the one test recipient |
| `{{sender}}`, `{{accountSID}}` | Configured business/account |
| `{{extension.appId}}`, `{{extension.appName}}` | Configured app identity; descriptor appId is a string |
| `{{extension.bid}}` | `com.apple.messages.MSMessageExtensionBalloonPlugin:TEAM_ID:EXTENSION_BUNDLE_ID` |
| `{{extension.sessionIdentifier}}` | Correlation UUID |
| `{{extension.url}}` | Fixed chart/revision URL plus selected native component |
| `{{extension.useLiveLayout}}` | Boolean true |
| `{{extension.fallback.title}}`, `{{extension.fallback.subtitle}}`, `{{extension.fallback.imageURL}}` | Alternative bubble content |

A token occupies an entire value and preserves its type. `{ "$json": ... }` explicitly serializes a nested template if the provider expects JSON inside a form field. This is our template syntax, not Twilio's schema. Adapt app-ID numeric/string handling if required by the actual contract.

If Twilio requires pre-created Content resources, multiple API requests, another authentication method/host or additional eligibility checks, implement that documented adapter first. Do not force an incompatible API into this template. The test suite's synthetic fields and `/TEST_ONLY` endpoint are never deployment examples.

`outbound.acceptanceIDPath` names the returned identifier and `acceptanceIDType` is `message` or `operation`. The public Comms send response supplies an operation ID; never label it as a delivered message ID. The allowlist includes `comms.twilio.com`, but this does not enable or certify a CIM mapping.

`acknowledgement.body` is the expected response text. JSON acknowledgements are parsed before passing through Twilio's serializer.

Check configuration without sending:

```sh
node --env-file=.env scripts/preflight.cjs
npm test
```

Preflight initially reports `LIVE_DELIVERY_DISABLED`. It checks configuration completeness, not live access or compatibility.

## Run the live test

After the contract, identity and consenting test recipient are verified, set `AMB_ENABLE_LIVE_DELIVERY=true` in the test environment and redeploy. Have the tester request the chart. The protected gateway authenticates the event; code verifies account/channel/sender/recipient, atomically reserves the event, builds the descriptor and makes the configured request.

Record separately: provider acceptance ID, eventual delivered/failed callback, actual iPhone rendering, quarter interaction, expanded source details and absent-extension fallback. Also exercise duplicate webhook, invalid signature, wrong recipient/account/channel, closed conversation and timeout cases.

Native **Insert [component] into message** stages a message for the user to send; it does not prove Twilio can interpret an extension reply. Sending quarter-selection actions to an agent awaits the actual beta reply schema.

## Operational limits

- `accepted` means an allowed HTTP status and provider ID were observed; it does not mean delivered or rendered.
- `reserved` and `uncertain` suppress automatic retries. Reconcile with Twilio before deciding whether another event should send. Do not auto-delete deduplication records.
- The synchronous Function uses a 4.5-second outbound timeout. Validate beta latency against the Functions execution budget. Move sends to a durable worker if required, preserving the atomic claim.
- Real Sync behavior, hosted gateway validation, eligibility and callbacks remain untested here.
- The accessible npm registry supplied runtime-handler **2.1.0**, Twilio SDK **6.1.2** and serverless plugin **4.0.0**. Twilio's Node 24 guide names runtime-handler 2.1.2, which was unavailable from this registry. The project therefore pins supported **Node 22**, with the installable versions in its lockfile. Upgrade only after checking actual registry and account support.

## Component selection and App Clip route

`NATIVE_DEFAULT_COMPONENT=bar` sets the generic-chart default; explicit pie/line/data/review commands override it. All are application-side routing rules. A confirm command only opens review. The user must press the native Confirm button to call `/mock-confirm`. This mock flow can be tested independently of Twilio AMB delivery. See `native-components.md` for the API and `app-clip-path.md` for the separate registered-link route.
