# Explicitly separate native packaging paths

Prepared October 12, 2026. Start with `../setup-guide.html` for the visual beginner guide.

| Boundary | A — Standalone Messages app | B — Regular app + extension |
| --- | --- | --- |
| Project | `ios/StandaloneMessages/ChartMessagesStandalone.xcodeproj` | `ios/AppWithMessages/ChartConcierge.xcodeproj` |
| App product | Messages wrapper, no regular app UI | Regular SwiftUI application |
| Extension | `StandaloneChartMessages` | `ChartMessages` |
| Example app identifier | `com.example.ChartConciergeMessages` | `com.example.ChartConcierge` |
| Example extension identifier | `com.example.ChartConciergeMessages.Messages` | `com.example.ChartConcierge.Messages` |
| App Store record | Standalone product's own record | Regular app's record and iMessage metadata |
| Twilio environment example | `twilio/config/standalone.env.example` | `twilio/config/app-with-messages.env.example` |
| User entry | Messages app menu / supported interactive message | Home Screen app or Messages app menu / supported interactive message |
| Optional App Clip | Excluded; not part of this product | Excluded by default, explicit opt-in only |

Apple supports both models. A standalone app is only accessible inside iMessage; a containing iOS app adds functionality outside it. Switching a published product between these two models requires a **new App Store app record**, not just a version update. The standalone model still has both a packaging app target and an extension target. Sources: [App Store Connect](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-imessage-app-information), [TN2435](https://developer.apple.com/library/archive/technotes/tn2435/_index.html), [iMessage overview](https://developer.apple.com/imessage/). Retrieved October 12, 2026.

## Shared code is not shared identity

Both extensions compile the same `ios/Shared` components and `ios/MessagesExtension/MessagesViewController.swift`. Their builds contain their own resources and run independently. The normal app also compiles those view/model sources; this is code reuse, not moving a running screen from one process into another. No App Group or shared login/storage was implemented.

One Twilio environment in this project selects **one** extension identity. To test both concurrently, use separate Twilio service environments and their correctly matching configuration/origins. Do not mix App Store IDs, extension bundle IDs, or signing teams. No dynamic multi-product identity router is implemented.

Each environment can serve the same verified snapshot. Its configured public origin must match the origin compiled into its selected native build. The shared origin constant is a source default; if compiling both against different environments, set it for each build and record which build uses which origin.

## Three separate integration boundaries

1. **Native presentation:** Apple's Messages framework hosts the extension. SwiftUI and Swift Charts render bar/line/pie/data/review/result components. Native P2P insertion uses `MSMessage` and is staged for the user to send.
2. **Application API:** the native code validates the fixed chart/revision URL, reads `/chart-manifest`, and posts explicit Confirm actions to `/mock-confirm`. The server's mock result is shown in the native view. Cancel makes no request. These routes can be tested without AMB.
3. **Twilio AMB delivery:** the service receives an authenticated, eligible event, maps it to the correct product identity and component, and submits the provider's supported native-message envelope. The account capability and exact custom-extension envelope remain unverified. Public Comms APIs exist; their existence alone does not verify this final mapping.

The source does not claim that every AMB account can invoke either product. Supported distribution and identity requirements must be confirmed for the actual account. See `twilio-public-evidence.md` and `twilio-handoff.md`.

## Implementation record

The generated standalone app target uses `com.apple.product-type.application.messages` and has zero application Swift sources. Both extension targets use `com.apple.product-type.app-extension.messages`. These product-type identifiers are also documented in [Xcodeproj's product type definitions](https://github.com/CocoaPods/Xcodeproj/blob/master/lib/xcodeproj/constants.rb). The ordinary app target uses `com.apple.product-type.application`.

The standalone scheme is build/archive only; configure an extension Run scheme with Messages as its host on the Mac. This deliberately avoids claiming a host-launch configuration was tested without Xcode. Both projects still require compilation, signing, icons, App Store validation and real-device checks.
