'use strict';
exports.handler = (context,event,callback) => {
  // Public-company fallback only. No client holdings or price records included.
  let html = Runtime.getAssets()['/chart-runtime.html'].open();
  // Optional App Clip discovery metadata. The saved Financial Charts export
  // and its data remain unchanged. Only real configured identities are used.
  if (/^[1-9]\d*$/.test(context.APPLE_APP_STORE_ID || '') &&
      /^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(context.APPLE_APP_CLIP_BUNDLE_ID || '')) {
    const { origin } = require(Runtime.getAssets()['/core.js'].path);
    const base = origin(context.PUBLIC_BASE_URL);
    const meta = `<meta name="apple-itunes-app" content="app-id=${context.APPLE_APP_STORE_ID}, app-clip-bundle-id=${context.APPLE_APP_CLIP_BUNDLE_ID}">` +
      `<meta property="og:image" content="${base}/revenue-preview.png">`;
    html = html.replace(/<head>/i, '<head>' + meta);
  }
  const r = new Twilio.Response();
  r.appendHeader('Content-Type','text/html; charset=utf-8');
  r.appendHeader('Cache-Control','no-store');
  r.appendHeader('Referrer-Policy','no-referrer');
  r.appendHeader('X-Content-Type-Options','nosniff');
  r.setBody(html); return callback(null,r);
};
