/**
 * Twilio AMB private-beta boundary, reviewed 2026-10-12.
 * No channel address prefix, endpoint, rich-link payload, or webhook shape is
 * guessed. Implement this interface only from the account's beta documentation.
 * See docs/twilio-handoff.md for the required contract and activation checks.
 */
export class AmbAdapterUnavailable extends Error {
  constructor() {
    super('Twilio AMB beta account and verified channel API contract are required.');
    this.code = 'AMB_ADAPTER_NOT_CONFIGURED';
  }
}

export const unavailableAdapter = Object.freeze({
  configured: false,
  async verifyAndParseInbound() { throw new AmbAdapterUnavailable(); },
  async replyWithRichLink() { throw new AmbAdapterUnavailable(); }
});

// Contract for a future account-specific adapter:
// configured: true only after the account/channel is verified.
// verifyAndParseInbound(request): validates the provider signature against the
// documented canonical URL and returns {eventId, conversationId, text}, or null
// for a verified non-message event. Rejects invalid signatures.
// replyWithRichLink({eventId, conversationId, message}): maps ONLY the above
// application content to the documented AMB API. Must durably deduplicate eventId,
// handle uncertain sends without blind retries, and honor conversation eligibility.
// It returns {status: 'sent' | 'duplicate'} after provider acceptance.

export function assertVerifiedEvent(event) {
  if (!event || !['eventId', 'conversationId', 'text'].every(k => typeof event[k] === 'string')) {
    throw new TypeError('Invalid normalized message event.');
  }
  if (!event.eventId || event.eventId.length > 256 || !event.conversationId || event.conversationId.length > 1024 || event.text.length > 4096) {
    throw new TypeError('Invalid normalized message event.');
  }
  return event;
}
