# Validation record

Updated October 12, 2026. No public deployment, provider send or Apple device run occurred.

## Verified locally

- **34 Twilio project tests passed** on Node 24.19.0. Coverage includes configuration gates, account/channel/sender checks, test-recipient allowlist, event filtering, fixed native message identity/revision, concurrent duplicates, uncertain outcomes, failed state persistence, endpoint restrictions, template types, explicit nested serialization, Sync adapter behavior and exact source-row/null preservation.
- The installed **Twilio development runtime** served manifest JSON, interactive fallback and PNG over local HTTP. Direct access to the private contract asset returned 403. The unconfigured webhook returned 503.
- New backend checks cover component routing, native-review command isolation, deterministic mock receipts, invalid requests, association JSON, optional App Clip discovery metadata and operation-vs-message acceptance identifiers.
- The actual Twilio local HTTP runtime accepted the JSON POST to `/mock-confirm`, returned a correlated `mode: mock` result, returned the identical result on replay and rejected a cancel action with HTTP 422.
- **14 existing web prototype tests passed**, preserving the original revenue data, provenance, source table and fail-closed legacy adapter.
- Dependency installation succeeded and is locked. Runtime-handler 2.1.2 was unavailable, so deployment targets Node 22 with installable runtime-handler 2.1.0. Local tests ran under Node 24; hosted Node 22 verification remains necessary.
- Current native packaging checks parse all five Info.plists and both entitlement files, resolve project object/file references, verify product types, source membership, scheme references and per-path identity templates. Both delivered projects contain two targets.
- Native/server manifest files are byte-identical and retain every original source row and null. Over HTTP, the native client compares canonical JSON so harmless serialization changes do not invalidate the snapshot.
- The earlier 1200×630 preview PNG remains available; it was visually inspected in the earlier build.

Inspection of the actual Twilio runtime caught a serialization issue: returning an already serialized JSON string can cause a second serialization. The manifest now returns an object, and the native client checks canonical content. Local runtime HTTP checks confirm the object response.

## Not verified

- Swift compilation, native layout/accessibility, installation, live bubble or expanded-view behavior: this environment has no Xcode, Swift compiler, simulator or iPhone.
- Hosted Twilio deployment/Node 22 execution: no credentials or connected account were available.
- AMB native-extension contract: public Comms send endpoints, authentication, operation responses and event schemas were found. The exact native-extension field mapping and account-specific webhook compatibility remain unverified. See `twilio-public-evidence.md`. The private contract remains null/unverified and delivery disabled.
- Hosted gateway signatures: the local development runtime does not enforce the protected-Function gateway check. Local tests do not establish hosted authentication.
- Real Sync concurrency/failure behavior: the storage adapter was tested with controlled responses; no Sync service was created.
- Native Confirm/Cancel tap behavior, App Clip discovery and full-app replacement: source reviewed but not executed on Apple hardware. App Clip association must also be mapped to `/.well-known/apple-app-site-association` at deployment.
- Provider acceptance, delivery receipt, rendered message and extension reply: none was observed.
- Browser/device interaction: earlier Chromium installation failed. HTML was served and checked, but browser interaction remains unverified.

Synthetic test fixtures establish application behavior, not an undocumented Twilio API. Preflight cannot certify channel compatibility.

Version 0.3 preflight: native default selector and preserved snapshot checks pass; live delivery switch, verified CIM mapping and real HTTPS/identity configuration remain blocked as designed. Initial test commands were invoked from the workspace parent and failed to locate package.json; rerunning from each project directory produced the passing results above.

Version 0.3.1: verified both generator modes structurally (two default targets; three only with `--include-app-clip`), all project object references resolve, and schemes parse. That earlier version contained only ChartConcierge and ChartMessages, with no App Clip dependency or associated-domain entitlement. Backend/native component logic is unchanged from the 48 passing tests recorded above; no Apple compilation was possible.


## Version 0.4.0 — two paths and visual guide

- Reran the existing suites: **14 web + 34 Twilio tests pass** on Node 24.19.0. The native UI still requires Xcode compilation and device checks.
- `python3 scripts/verify-native-packaging.py` passes for both delivered projects. StandaloneMessages uses the Messages application product type, has zero Swift app sources and no regular app launch action. AppWithMessages uses the regular application product type and includes the SwiftUI app entry point. Both use the Messages extension product type.
- Verified both generator modes: default is two targets per project; optional App Clip mode adds a third target only to AppWithMessages. Restored the default projects for delivery. No App Clip entitlement/dependency is included in either default build.
- `setup-guide.html` was opened in headless Chromium at 1440 × 1040 and 390 × 844. Both path filters, the 17-item session checklist and troubleshooting disclosures worked; internal anchors resolve, element IDs are unique, neither viewport has page-wide horizontal overflow, no page script error occurred, and the guide made no external HTTP requests.
- Visually inspected desktop/mobile guide screenshots and the API sequence diagram. Diagrams are conceptual; they do not represent an observed Apple or Twilio session. The earlier browser limitation applied to the old preview, not this guide verification.
- Native/server snapshot files remain byte-identical. All original `finance/` files match the preceding package's SHA-256 checksums. Guide and integration examples remain separate from the financial evidence.
- Xcode, signing, app icons/distribution validation, real-device interaction and the exact account-specific Twilio CIM mapping remain outstanding. No deployment or outbound message occurred.
