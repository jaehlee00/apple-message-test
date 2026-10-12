'use strict';
const CHART_ID = 'b71d8906-be7f-499e-a448-044d4ec39825';
const REVISION_ID = 'f47530da-762a-44a1-9c52-ab142462bf6f';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Intentionally pure and stateless. This demonstrates an application API,
// not a Twilio API. Replays return the same result; nothing is persisted.
function confirmReview(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || input.schemaVersion !== 1 ||
      typeof input.requestID !== 'string' || !UUID.test(input.requestID) ||
      input.chartID !== CHART_ID || input.revisionID !== REVISION_ID ||
      input.action !== 'confirm_snapshot_review') {
    return { statusCode: 422, body: { mode: 'mock', error: 'INVALID_REVIEW_REQUEST' } };
  }
  const allowed = new Set(['schemaVersion','requestID','chartID','revisionID','action']);
  if (Object.keys(input).some(k => !allowed.has(k))) {
    return { statusCode: 422, body: { mode: 'mock', error: 'UNEXPECTED_FIELD' } };
  }
  return { statusCode: 200, body: {
    schemaVersion: 1, requestID: input.requestID, chartID: CHART_ID, revisionID: REVISION_ID,
    action: input.action, mode: 'mock', status: 'confirmed',
    receiptID: 'mock-' + input.requestID.toLowerCase(),
    message: 'Mock review confirmed. No business action was performed.'
  } };
}
module.exports = { confirmReview };
