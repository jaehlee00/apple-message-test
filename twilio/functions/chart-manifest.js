'use strict';
exports.handler = (context,event,callback) => {
  const data = Runtime.getAssets()['/chart-manifest.json'].open();
  const r = new Twilio.Response();
  r.appendHeader('Content-Type','application/json; charset=utf-8');
  r.appendHeader('Cache-Control','no-store');
  r.appendHeader('X-Content-Type-Options','nosniff');
  // Return an object: the hosted runtime serializes JSON responses. Passing an
  // already serialized string can produce a JSON string instead of an object.
  r.setBody(JSON.parse(data)); return callback(null,r);
};
