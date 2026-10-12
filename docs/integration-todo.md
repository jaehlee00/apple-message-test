# Integration TODOs

Updated October 12, 2026. These are planned tasks, not implemented or verified capabilities.

## Agent-led iMessage app installation and return to inline UI

The agreed experience is an AI agent in the Apple Messages for Business conversation offering native charts, data displays and confirmation controls **inside the message thread**. An initial App Store installation visit is acceptable. App Clip or web launches are not the primary interaction flow.

- [ ] Publish the chosen native product and obtain its real App Store URL and numeric App Store ID. Keep standalone and full-app product identities separate.
- [ ] Let the agent offer the installation link in the active business conversation when the customer needs the native interface. Append `?app=messages` to an App Store URL with no query, or `&app=messages` when a query already exists. Use the published product's actual URL; no placeholder ID may be sent.
- [ ] Explain that the customer must tap the link and approve installation, then return to the conversation. The agent cannot silently install the app.
- [ ] Add an explicit readiness step: initially a customer “Ready” response; optionally an authenticated callback when the extension opens. A sent link, link click or user-reported readiness must not be treated as proof that the extension is installed and running. Keep those observations distinct.
- [ ] Retain the pending component, chart/revision and conversation/session correlation so the agent can resume the requested inline experience after onboarding. Do not put private conversation or account data in the App Store link.
- [ ] After readiness, deliver the custom interactive message using the verified Twilio CIM contract and the correct app identity. Confirm actual native rendering separately from provider acceptance. See `twilio-handoff.md` for the remaining account/payload requirements.
- [ ] Verify on supported devices: already installed, not installed, customer cancels installation, customer returns later, and extension opens successfully. Keep ordinary conversation available while installation is incomplete; do not silently substitute an external chart page for the requested inline experience.

Completion means a consenting customer can receive the real install link from the agent, install the app, return to the same business conversation and use the requested inline component. Neither an install-completion callback nor an automatic agent resume flow is implemented yet.

Reference: [Apple — Linking to Your Product Page](https://developer.apple.com/imessage/), reviewed October 12, 2026. Apple documents the `app=messages` parameter for the App Store for iMessage. Twilio's exact custom-extension delivery mapping remains a separate verification gate.
