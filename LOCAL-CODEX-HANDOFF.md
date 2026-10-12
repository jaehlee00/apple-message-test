# Continue this implementation in local Codex

Prepared October 12, 2026. This transfers project context and files; it does not attach the existing ChatGPT Work thread to a CLI session.

## User goal

Build a real Twilio Apple Messages for Business path that invokes a native Messages app extension and shows the existing verified Microsoft FY2025 revenue chart inside the conversation. A browser mockup alone is insufficient. The user chose to continue in this Work session and hand off only when finished. This file is for that eventual handoff.

Decision recorded October 12: use **iMessage extensions**. The user requested both packaging paths with explicit separation: standalone Messages app and regular iOS app plus extension. A beginner HTML guide accompanies them. Keep App Clip work optional; do not require it for the selected flow.

## Start the CLI

Unzip this package, open Terminal in the `apple-chart-integration` directory and run:

```sh
codex "Read LOCAL-CODEX-HANDOFF.md and continue the native Apple Messages and Twilio integration."
```

If the CLI is not signed in, run `codex login` first and use the intended ChatGPT account/workspace. Keep credentials in local/Twilio credential stores, not in chat or source files. `bash start-local-codex.sh` is an equivalent convenience launcher.

## What exists

- `ios/StandaloneMessages/ChartMessagesStandalone.xcodeproj`: Messages-only wrapper plus native extension; no regular app entry point.
- `ios/AppWithMessages/ChartConcierge.xcodeproj`: regular SwiftUI app plus native extension.
- `setup-guide.html`: self-contained visual beginner guide with path-specific steps, glossary, configuration and delivery boundaries.
- `twilio/config`: separate example identities for the two products; one identity per deployed environment.
- Optional App Clip source is excluded from both delivered projects; no extra Swift packages.
- `ios/Shared`: bar/line/pie chart, exact data view, Confirm/Cancel/result components and local/HTTP mock client, data model, origin/revision validation, canonical JSON snapshot integrity check, verified data and fallback image.
- `ios/MessagesExtension`: live transcript layout, expanded view, alternate template and user-initiated message insertion.
- `twilio`: deployable Functions layout with protected AMB handler, public snapshot/fallback routes, private contract template and code, Twilio Sync duplicate handling, tests and dependency lockfile.
- `finance/dist`: original Financial Charts export preserved unchanged.
- `src`, `preview.html`: earlier local web fallback/mockup, retained for context; it is not the native app.
- `docs/integration-pattern.md`: researched mechanism, evidence and exact gaps.
- `docs/twilio-handoff.md`: activation sequence and contract checklist.
- `docs/integration-todo.md`: planned agent-led installation link, explicit readiness and return to the pending inline component. This onboarding flow is not implemented yet.
- `docs/native-components.md`: component routing and mock API contract.
- `docs/app-clip-path.md`: registered-link route, associated domains and App Clip setup.
- `docs/twilio-public-evidence.md`: public Comms endpoints/events found; exact remaining CIM gap.
- `docs/validation.md`: actual test results and remaining validation.

## Do next on the Mac

1. Read the source and validation record. Check `xcodebuild -version`, available SDKs and simulators. Run both unsigned simulator builds from the path-specific READMEs; fix any compiler errors and verify the app/extension UI. No Apple compiler was available in the cloud environment.
2. Run root `npm test`; then `cd twilio`, `npm ci --ignore-scripts`, `npm test`. Node 22 is the pinned Twilio runtime. The cloud machine ran Node 24 tests; verify Node 22 locally or in Twilio.
3. Inspect the user's authorized Twilio CLI/profile and existing service configuration without printing credentials. Confirm AMB private-beta enrollment and **custom iMessage app/CIM support**, not just rich links or list pickers.
4. Obtain and read Twilio's account-specific CIM documentation. Populate the private contract from that evidence, or implement its actual multi-step API if the generic mapping is insufficient. Never copy the synthetic tests' field names or `/TEST_ONLY` endpoint into deployment configuration.
5. Deploy the reviewed snapshot/fallback service to Twilio Functions, keep `AMB_ENABLE_LIVE_DELIVERY=false`, and verify equivalent JSON response content, protection and asset visibility on the live origin.
6. Test all five component selections, Cancel (zero calls), double-tap Confirm (one call), mock success/retry and response display. Configure the real Apple team/bundle identifiers and public origin. App Clip/AASA steps do not apply to the selected extension path. Build/install the app on a consenting internal test device; confirm the supported distribution/App Store ID setup with the AMB team.
7. Select one actual consenting test conversation, then configure the recipient allowlist and complete the activation sequence. Do not send an unrequested message to a contact. The current session authorized implementation, not a particular recipient or outbound message.
8. Exercise an actual customer-initiated request, native bubble, expanded sources, absent-extension fallback and provider callback. Persist evidence of acceptance separately from delivered/rendered status.

## Hard constraints retained from the user

- The agent triggers native components inside the message thread. An initial App Store visit to install the iMessage app is acceptable; App Clip/web launches are not the primary component flow. Do not infer installation success from sending or clicking the link.
- Reuse the existing verified Microsoft revenue chart and its four records. Keep dates, base USD, Fiscal provider, source links, restated flags and calculated-Q4 flag visible.
- Do not use or chart previously retrieved stock-price records; their metadata was incomplete. Do not calculate returns.
- Keep price returns separate from Jordan's synthetic contributions; leave fictional holdings unchanged.
- Ignore later meeting notes, transcript and action register. Guides, examples and skill source are not client evidence.
- Do not invent missing data, API fields, app identifiers, provider capabilities or test outcomes.

## Live gaps at handoff

No Twilio credentials/account connection, enabled AMB account, complete native CIM field mapping, deployment URL, Apple signing identity/App Store ID, Xcode/device run, or recipient authorization was available. Public Comms endpoints and events were found; do not repeat the earlier overbroad claim that no public API contract exists. No message or public deployment has occurred.

The Functions mapping is deliberately unverified and disabled; it is a completed generic adapter, not a claim that the Twilio-specific CIM request has been discovered. Native source has not been compiled. These gaps must remain visible until demonstrated.

## Session-connectivity finding

Official OpenAI documentation distinguishes Work and Codex history. Eligible new Work tasks can use a connected computer after local access is enabled; an existing cloud-only task does not automatically become a CLI session. `codex remote-control` manages a local app-server and is not documented as a way to import this Work thread. Use this file as explicit continuity context.

References reviewed October 12, 2026:
- https://learn.chatgpt.com/docs/enterprise/cloud-local-access
- https://learn.chatgpt.com/docs/cli/reference
- https://learn.chatgpt.com/docs/auth
