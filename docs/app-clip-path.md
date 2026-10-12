# Optional App Clip experiment — not the selected path

The user selected the iMessage extension path. App Clip code is retained for reference but is excluded from both delivered Xcode projects. No App Clip or associated-domain setup is needed for the default build.

To explicitly regenerate the optional target, run `python3 scripts/build-xcode-project.py --include-app-clip`; run without that flag to restore both default two-target projects. This adds the Clip only to `ios/AppWithMessages/ChartConcierge.xcodeproj`; StandaloneMessages is unchanged. It regenerates both projects/signing settings.

Prepared October 12, 2026. Source code is included; compilation, Apple registration, discovery and Twilio delivery have not been performed.

| Host | Launch | UI location |
| --- | --- | --- |
| Messages extension | Custom interactive message identifies installed extension and carries `MSMessage.url` | Live bubble and expanded Messages presentation |
| App Clip | Registered invocation URL launches a lightweight part of the app | App Clip experience launched from its card/link |
| Full app | Installed app receives the corresponding invocation | Full app |

Apple supplies the Messages and App Clip mechanisms. Our SwiftUI code supplies the components. Twilio supplies a delivery channel. App Clips do not turn a web page into a live message bubble and are not an iMessage extension target.

## Included code

- `ios/AppClip/ChartClipApp.swift`: App Clip entry point.
- `ios/Shared/NativeExperienceView.swift`: shared App Clip/full-app host and `NSUserActivityTypeBrowsingWeb` invocation handler.
- `ios/Shared/*`: bar, line, pie, data, confirmation and result views; same verified data and mock API.
- Xcode `ChartClip` target/scheme, embedded in the containing app.
- App Clip Info.plist/entitlements and full-app associated-domains entitlements. Domain arrays are intentionally empty; no domain is invented.
- Twilio `apple-app-site-association` Function generates association JSON from real configured identity. Missing identity returns 503.
- `/chart` adds Smart App Banner and preview-image metadata only when valid App Store ID, App Clip bundle ID and HTTPS origin are configured. The saved original export remains unchanged.

## Activation sequence

1. Register the full app, Messages extension and App Clip identifiers under the intended Apple team. Replace the sample bundle IDs and the parent application identifier in `ChartClip.entitlements`; verify the actual App ID prefix used by your provisioning. Set the same signing team and correct profiles in Xcode.
2. Set `PUBLIC_BASE_URL`, `APPLE_TEAM_ID`, `APPLE_APP_BUNDLE_ID`, `APPLE_APP_CLIP_BUNDLE_ID` and `APPLE_APP_STORE_ID` in Twilio. Set `ChartConfiguration.publicOrigin` to the same HTTPS origin. The association generator assumes the App ID prefix matches the Team ID; adjust from actual provisioning if yours differs.
3. Publish the association Function at **`/.well-known/apple-app-site-association`**, with no redirect and JSON MIME type. The source's filename initially maps to `/apple-app-site-association`; change/add its Function path in your deployment/Console to the required `.well-known` path. Verify that URL directly and Apple's domain validation before relying on discovery. This alias is a deployment step, not claimed as already provisioned.
4. Add `appclips:YOUR_ACTUAL_HOST` to the associated domains for the Clip and full app. Add `applinks:YOUR_ACTUAL_HOST` to the full app. The full app must handle the same invocation because Apple uses it when installed; `NativeExperienceView` does this.
5. Build/install with Xcode. Configure an App Clip experience for your custom `/chart` URL in App Store Connect and supply Apple's required card metadata. Use a complete URL from `print-launch-url.cjs` for a component-specific invocation. Test with `_XCAppClipURL` in the `ChartClip` scheme or a configured local App Clip experience on a device.
6. Test direct link invocation, then a Messages-shared link, then the intended Twilio AMB conversation. Apple's general Messages-link documentation does not by itself verify how a specific AMB sender's preview behaves. Record actual results for installed/uninstalled full app and extension separately.

An App Clip test can proceed independently of the custom-extension Twilio payload: first validate the registered link on a device. Delivering that link through the enabled Twilio channel still requires the channel's verified send/addressing configuration. The checked-in AMB adapter currently selects native extension components; it does not automatically change to App Clip delivery or send a message.

## Primary sources

- [Configuring App Clip experiences](https://developer.apple.com/documentation/appclip/configuring-the-launch-experience-of-your-app-clip): invocation URL and experience registration; installed full app replaces the Clip.
- [Responding to invocations](https://developer.apple.com/documentation/appclip/responding-to-invocations): `NSUserActivity`, shared full-app handling and missing-URL cases.
- [Supporting website and Messages invocations](https://developer.apple.com/documentation/appclip/supporting-invocations-from-your-website-and-the-messages-app): banner and preview requirements; a website link may open a browser first.
- [Associating the Clip with a website](https://developer.apple.com/documentation/appclip/associating-your-app-clip-with-your-website): entitlements and `.well-known` association file.
- [Supporting associated domains](https://developer.apple.com/documentation/xcode/supporting-associated-domains): `appclips` and `applinks` JSON structure.

No claim is made that the current source has passed App Review, that the App Clip is published, or that Twilio has delivered or invoked it.
