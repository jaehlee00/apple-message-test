# Path B — Regular iOS app with Messages extension

Use this path when the product needs a normal iPhone/iPad app as well as the same experience inside Messages. This project is independent of path A.

## What belongs here

- `ChartConcierge.xcodeproj`: independent project.
- `ChartConcierge`: regular `com.apple.product-type.application` target; uses `App/ChartConciergeApp.swift` and the shared `NativeExperienceView`.
- `ChartMessages`: `com.apple.product-type.app-extension.messages` target; native UI inside Messages.
- `App/Info.plist` and `MessagesExtension/Info.plist`: metadata owned by this path.
- `App/ChartConcierge.entitlements`: optional App Clip experiment only; not used by the default project.
- Shared component/controller sources stay one directory up.

## Build the app, then run its extension

1. Open this `.xcodeproj` on a Mac with Xcode and an iOS 17+ simulator runtime.
2. Select the **ChartConcierge** scheme and an iPhone simulator, then press Run. The regular app opens the shared native components and bundled snapshot. Try all five components and the local confirmation mock.
3. Create an extension Run scheme using Product > Scheme > New Scheme and choose **ChartMessages** as its target. Run it with **Messages** as host. If prompted, select Messages; if necessary, edit the Run executable/host. Exact controls vary by Xcode version.
4. In a test conversation, open the extension from the Messages app menu. The app and extension use shared source, but run as separate processes. This implementation does not synchronize their in-memory selections or confirmation state.
5. For a physical device/distribution, set the same intended Apple team on **both** targets. Replace `com.example.ChartConcierge` and `com.example.ChartConcierge.Messages` with registered identifiers. Keep the extension identifier prefixed by the app identifier.
6. Add required app/Messages icons, privacy metadata, provisioning and the regular app's App Store record with its iMessage metadata. Confirm the AMB-supported test distribution method.
7. Configure the real HTTPS origin as described in `../README.md`, rebuild, then test manual message insertion on consenting devices.

Optional command-line build, from the package root:

```sh
xcodebuild -project ios/AppWithMessages/ChartConcierge.xcodeproj \
  -scheme ChartConcierge -sdk iphonesimulator \
  -configuration Debug CODE_SIGNING_ALLOWED=NO build
```

## Twilio identity — B only

Start from `twilio/config/app-with-messages.env.example`. Its extension example is **com.example.ChartConcierge.Messages**. Supply this regular app's actual App Store ID and the actual Apple Team ID. Do not use the standalone product's identity.

The extension uses the same `/chart`, `/chart-manifest` and `/mock-confirm` contract as path A. Twilio custom-extension delivery still requires the verified envelope and account enablement in `docs/twilio-handoff.md`. App Clip setup is separate and optional; see `docs/app-clip-path.md`.
