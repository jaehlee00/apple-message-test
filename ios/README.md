# Two native iMessage packaging paths

Both paths share the exact same native components and backend API. They are separate Xcode projects with separate example identities. iOS 17+ is required. No third-party Swift packages are required.

| | A — Standalone Messages app | B — iOS app with Messages extension |
| --- | --- | --- |
| Open | `StandaloneMessages/ChartMessagesStandalone.xcodeproj` | `AppWithMessages/ChartConcierge.xcodeproj` |
| Where the user opens it | Inside Messages | Home Screen app and inside Messages |
| App target | `ChartMessagesStandalone` — Messages packaging wrapper, no app screens | `ChartConcierge` — regular SwiftUI app |
| Extension target | `StandaloneChartMessages` | `ChartMessages` |
| Bundle ID examples | `com.example.ChartConciergeMessages` + `.Messages` | `com.example.ChartConcierge` + `.Messages` |
| Instructions | `StandaloneMessages/README.md` | `AppWithMessages/README.md` |
| Twilio config example | `../twilio/config/standalone.env.example` | `../twilio/config/app-with-messages.env.example` |

Start with **`../setup-guide.html`** for a visual, beginner-friendly walkthrough. Read `../docs/packaging-paths.md` for the identity and API boundaries. The standalone project has a real Messages application product type; it is not a regular app with an empty screen.

## Shared behavior

`Shared/RevenueChartView.swift`, `RevenueDataView.swift` and `ConfirmationView.swift` provide bar/line/pie, exact data and review/result components. `ChartScreen` selects the component and `ChartStore` supplies the verified snapshot. Both extension targets compile `MessagesExtension/MessagesViewController.swift` and the same shared sources. Only path B compiles the regular `App` entry point and `NativeExperienceView`. Optional App Clip code is excluded from both delivered projects.

With `ChartConfiguration.publicOrigin` empty in `Shared/ChartModel.swift`, an unselected-message composer uses the bundled snapshot and Confirm uses an explicitly labeled local mock. Message insertion is disabled until a real origin is configured. With a real origin, Confirm posts to `/mock-confirm`; Cancel makes no API call. Pending, success, error/retry and cancelled states are visible. Responses are in-memory mock results, not durable approvals.

A received message validates its exact origin, `/chart` path, chart/revision IDs, correlation UUID and allowlisted component before fetching `/chart-manifest`. It compares canonical JSON with the bundled snapshot. It displays network/integrity errors rather than silently substituting data. `Shared/chart-manifest.json` and `../twilio/assets/chart-manifest.private.json` remain byte-identical.

Native charts use Apple's Swift Charts. The original Financial Charts JavaScript export remains the web fallback. No stock-price records or portfolio changes are involved.

## Shared device checks

Try all five components, quarter/pie selection, source data, compact/expanded presentation, Cancel (zero API calls), double-tap Confirm, mock receipt, failure/retry, a new review and a new message. Insert a component into a consenting test conversation, then press Send yourself. Insertion only stages a message; it does not send it automatically.

## Verification boundary

These projects have been structurally inspected, but no Xcode compiler, simulator or iPhone is available in this environment. First build, signing, icons, App Store validation and device interaction remain required. Native P2P success does not establish Twilio AMB custom-extension delivery. Follow `../docs/twilio-handoff.md` separately.

Regenerate with `python3 scripts/build-xcode-project.py` from the package root. It rewrites both projects and resets example identities/signing settings. Preserve your configuration before rerunning. `--include-app-clip` adds the optional experiment to path B only.
