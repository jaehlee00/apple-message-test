# Public Twilio evidence: corrected scope of the gap

Checked October 12, 2026. It would be incorrect to say that no integration contract exists publicly. We found public Communications API documentation beyond the AMB product announcement.

| Public source | Verified evidence | Remaining limitation |
| --- | --- | --- |
| [Communications API v1 Send Messages](https://docs.comms.twilio.com/comms-api-reference/messages/send) | `POST https://comms.twilio.com/v1/Messages`, JSON request, Basic account/token or API key/secret auth, HTTP 202 operation response | Retrieved page did not expose a complete Apple custom-extension content variant |
| [Preview Send Messages](https://docs.comms.twilio.com/comms-preview/comms-api-reference/messages/send-messages) | Separate `/preview/Messages` version | Do not mix versions or assume account access |
| [Preview List Messages](https://docs.comms.twilio.com/comms-preview/comms-api-reference/messages/list-messages) | Lists `APPLE` as a channel filter | A list filter is not an extension-send payload |
| [Rich Content guide](https://docs.comms.twilio.com/guides/messaging/advanced-concepts/rich-content) | Content IDs or inline modules; published RCS/SMS examples | No verified mapping of our extension identity, URL and live layout from retrieved content |
| [Events](https://docs.comms.twilio.com/comms-preview/guides/events) | Public message/operation events, including inbound schema | AMB-specific addressing and the exact webhook delivery/protection route still need verification |
| [API overview](https://docs.comms.twilio.com/guides/communications-api) | Communications API described as private beta | Documentation availability is not account enablement |
| [AMB announcement](https://www.twilio.com/en-us/changelog/amb-private-beta) | May 7, 2026 private-beta announcement | No account entitlement proof |
| [AMB article](https://www.twilio.com/en-us/blog/products/launches/the-power-of-the-grey-bubble--why-apple-messages-for-business-is) | Explicitly mentions app extensions | Capability description is not a full wire schema |

The v1 page's SDK example names `twilio-comms`; the accessible npm registry returned E404 for that package during this check. Its page-level Markdown could not be retrieved through the search tool; a direct request returned HTTP 403. The visible HTML left nested schema variants collapsed. These are evidence-access limits, not proof that those details do not exist.

The exact open question is the **Twilio-supported AMB custom iMessage-extension request**, its supported app-distribution setup, account enablement, and webhook mapping. Do not substitute a LivePerson or Webex payload. The generic adapter now allows the documented `comms.twilio.com` host and distinguishes an `operation` acceptance ID from a `message` ID. Neither is proof of delivery. Configuration remains unverified and disabled until the complete compatible mapping is confirmed.

The user identified iMessage apps and App Clips as relevant integration methods. Apple publicly documents both mechanisms. We verified Twilio's app-extension reference; we did not locate an explicit Twilio App Clip reference in the pages retrieved. See `app-clip-path.md` for the separately documented Apple route.
