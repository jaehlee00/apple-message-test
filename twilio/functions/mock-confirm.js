'use strict';
// Public because a native client cannot hold a Twilio Auth Token. This endpoint
// is ONLY a non-mutating mock. Do not attach real business operations here.
exports.handler = (context, event, callback) => {
  const { confirmReview } = require(Runtime.getAssets()['/mock-review.js'].path);
  const { request, ...input } = event;
  const result = confirmReview(input);
  const response = new Twilio.Response();
  response.setStatusCode(result.statusCode);
  response.appendHeader('Content-Type', 'application/json; charset=utf-8');
  response.appendHeader('Cache-Control', 'no-store');
  response.appendHeader('X-Content-Type-Options', 'nosniff');
  response.setBody(result.body);
  return callback(null, response);
};
