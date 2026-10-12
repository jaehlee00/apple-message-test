# Microsoft revenue chart in Apple Messages

Version 0.4.0 — October 12, 2026. Two separate native iMessage packaging paths and a shared Twilio Functions integration.

The native implementation uses Apple's Messages framework and Swift Charts. The existing Financial Charts web export is preserved as the fallback. This package is source code, not an installed iOS app or an activated Twilio channel.

Two independent projects are included: **A: StandaloneMessages**, a Messages-only product, and **B: AppWithMessages**, a regular iOS app with an embedded Messages extension. Both reuse bar/line/pie charts, data and review actions. App Clip source is optional and excluded from both delivered projects.

## Start here

- **Visual setup guide for beginners:** open `setup-guide.html` in a browser.
- **Integration TODOs:** read `docs/integration-todo.md` for agent-led installation and return to inline components.
- **Compare the two packaging paths:** read `docs/packaging-paths.md`.
- **Component catalog and mock API:** read `docs/native-components.md`.
- **Public Twilio API findings:** read `docs/twilio-public-evidence.md`.
- **Continue in local Codex when ready:** read `LOCAL-CODEX-HANDOFF.md` or run `bash start-local-codex.sh`.
- **Build either native product:** follow the explicitly separated paths in `ios/README.md`.
- **Deploy the Twilio side:** follow `docs/twilio-handoff.md`.
- **Understand the researched pattern:** read `docs/integration-pattern.md`.
- **What was actually tested:** read `docs/validation.md`.

## What is implemented

| Component | Implementation | Current verification |
| --- | --- | --- |
| Native chart | Shared SwiftUI/Swift Charts view, bar, line and pie, quarter selection, exact values and source metadata | Source written; requires Xcode build and device review |
| Messages extension | Live message layout, expanded chart/source view, template fallback, user-initiated message insertion | Source written; requires device testing |
| Data display | Reusable exact records with dates, provider, units, nulls and provenance | Source written; same preserved data |
| Confirmation | Confirm calls local/HTTP mock, Cancel makes no call, pending/error/result states | HTTP mock and validation tested; native UI uncompiled |
| Optional App Clip experiment | Retained source; excluded from both delivered projects | See `docs/app-clip-path.md` only if revisiting this option |
| Snapshot service | Twilio Function returns the exact versioned JSON bundled in the app | Local function tests pass |
| AMB event handler | Protected Twilio Function, explicit beta-contract mapping, one test-recipient allowlist | Local tests pass using a clearly synthetic contract |
| Duplicate prevention | Atomic Twilio Sync Map item creation and retained uncertain-send state | Adapter tests pass; real Sync remains untested |
| Delivery | Fixed chart revision; native descriptor mapped through the account's documented API | Blocked: complete CIM field mapping, account enablement and credentials unverified |
| Web chart | Original interactive Financial Charts export | Preserved unchanged |

The native client loads the packaged verified snapshot when opened without a selected message. For a received message it validates the configured origin, chart ID and revision, loads the server manifest, and compares its canonical JSON content with the packaged snapshot. A network or integrity failure is visible; it does not silently replace the data.

## Local checks

```sh
npm test
cd twilio
npm ci --ignore-scripts
npm test
npm run preflight
```

Preflight deliberately fails until real channel configuration and a reviewed beta API contract are supplied. It does not send a message. The test contract is synthetic and must never be used as Twilio documentation.

The original browser mockup remains available: run `npm start` at the project root, or open `preview.html`. That mockup demonstrates the web fallback, not the native extension.

## Data provenance

Same four reviewed observations as the original revenue chart, not a new financial retrieval:

| Fiscal quarter | End date | Revenue, base USD | Fiscal restated | Fiscal calculated |
| --- | --- | ---: | --- | --- |
| FY2025 Q1 | 2024-09-30 | 65,585,000,000 | true | false |
| FY2025 Q2 | 2024-12-31 | 69,632,000,000 | true | false |
| FY2025 Q3 | 2025-03-31 | 70,066,000,000 | true | false |
| FY2025 Q4 | 2025-06-30 | 76,441,000,000 | true | true |

Provider: Fiscal through Financial Data, retrieved October 12, 2026. These current-provider historical observations cite later filings. Q4's supplied classification is `derived_lineitem`; no missing formula has been inferred. Original nulls remain in the full chart JSON. Source links are retained in `finance/dist/client/data/chart.json` and displayed at `/sources`.

The financial payload excludes stock-price observations, Jordan's holdings, synthetic attribution, meeting notes, transcripts and action registers. No portfolio records were changed.

## Rebuild generated assets

```sh
node scripts/build-native-data.mjs
python3 scripts/build-xcode-project.py
python3 scripts/verify-native-packaging.py
```

The first command copies the existing chart evidence to the native and Twilio bundles; it performs no retrieval. The second regenerates both Xcode projects and resets its default bundle identifiers/signing settings, so avoid it after configuring signing unless you intend to reapply those changes.
