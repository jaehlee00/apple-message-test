# Path A — Standalone Messages app

Use this path when the product should live only inside Messages. No regular Home Screen app is required. Xcode still packages an app wrapper plus the executable Messages extension. Apple describes this model in [App Store Connect](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-imessage-app-information).

## What belongs here

- `ChartMessagesStandalone.xcodeproj`: independent project.
- `ChartMessagesStandalone`: product type `com.apple.product-type.application.messages`; no Swift app entry point, scene or application source code. Xcode supplies the Messages wrapper support.
- `StandaloneChartMessages`: product type `com.apple.product-type.app-extension.messages`; contains all native UI.
- `App/Info.plist`: wrapper metadata, with launch prohibited outside Messages.
- `MessagesExtension/Info.plist`: this path's extension metadata.
- Shared component/controller sources stay one directory up.

## Build and open in Messages

1. Open this `.xcodeproj` on a Mac with Xcode and an iOS 17+ simulator runtime.
2. Select the **ChartMessagesStandalone** scheme and an iPhone simulator; choose Product > Build. This supplied scheme builds/archives the wrapper and extension. It intentionally does not launch a regular app.
3. Create an extension Run scheme using Product > Scheme > New Scheme and choose **StandaloneChartMessages** as its target. Run that scheme and select **Messages** when Xcode requests a host. If necessary, edit the scheme's Run executable/host to Messages. Exact labels depend on Xcode; do not select the wrapper as a normal executable.
4. Open a test conversation in Messages and select the extension in its app menu. In an empty composer, it can show the packaged snapshot without a server. This is the first place to test the five components and local mock.
5. For a physical device/distribution, set your Apple team on **both** targets and register your own wrapper and extension identifiers. Replace `com.example.ChartConciergeMessages` and `com.example.ChartConciergeMessages.Messages`. Keep the extension identifier prefixed by the wrapper's identifier.
6. Add the required Messages/app icons, privacy metadata, provisioning and App Store record. App Store submission is not completed by this source package. Confirm supported TestFlight/App Store testing with the AMB team.
7. Configure the real HTTPS origin as described in `../README.md`, rebuild, and test manual message insertion on consenting devices.

Optional command-line build, from the package root:

```sh
xcodebuild -project ios/StandaloneMessages/ChartMessagesStandalone.xcodeproj \
  -scheme ChartMessagesStandalone -sdk iphonesimulator \
  -configuration Debug CODE_SIGNING_ALLOWED=NO build
```

## Twilio identity — A only

Start from `twilio/config/standalone.env.example`. Its extension example is **com.example.ChartConciergeMessages.Messages**. Supply the actual App Store ID of this standalone product and the actual Apple Team ID. Neither is a bundle ID. Do not copy path B's App Store ID into this configuration.

The extension uses the same `/chart`, `/chart-manifest` and `/mock-confirm` contract as path B. The Twilio-specific native-message envelope remains unverified and live delivery remains disabled. See `docs/twilio-handoff.md` from the package root.
