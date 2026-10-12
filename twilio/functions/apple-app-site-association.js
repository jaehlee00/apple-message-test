'use strict';
// Apple's documented root AASA route. Real identifiers and associated-domain
// entitlements are required; an empty configuration publishes no association.
exports.handler = (context, event, callback) => {
  const { APPLE_TEAM_ID: team, APPLE_APP_BUNDLE_ID: app, APPLE_APP_CLIP_BUNDLE_ID: clip } = context;
  const bundle = /^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;
  const valid = /^[A-Z0-9]{10}$/.test(team || '') && bundle.test(app || '') &&
    bundle.test(clip || '') && clip.startsWith(app + '.');
  const response = new Twilio.Response();
  response.setStatusCode(valid ? 200 : 503);
  response.appendHeader('Content-Type', 'application/json');
  response.appendHeader('Cache-Control', 'no-store');
  response.setBody(valid ? {
    appclips: { apps: [team + '.' + clip] },
    applinks: { details: [{ appIDs: [team + '.' + app], components: [{ '/': '/chart' }] }] }
  } : { error: 'APPLE_ASSOCIATION_NOT_CONFIGURED' });
  return callback(null, response);
};
