'use strict';
const { createHash, randomUUID } = require('node:crypto');
const CHART_ID = 'b71d8906-be7f-499e-a448-044d4ec39825';
const REVISION_ID = 'f47530da-762a-44a1-9c52-ab142462bf6f';
const COMPONENTS = ['bar','line','pie','data','confirmation'];
const forbidden = new Set(['__proto__', 'constructor', 'prototype']);
const isString = v => typeof v === 'string' && v.length > 0;
function fail(code) { const e = new Error(code); e.code = code; throw e; }
function getPath(object, path) {
  if (!isString(path)) fail('INVALID_FIELD_MAPPING');
  return path.split('.').reduce((value, key) => {
    if (forbidden.has(key)) fail('INVALID_FIELD_MAPPING');
    return value && Object.hasOwn(value, key) ? value[key] : undefined;
  }, object);
}
function origin(value) {
  let u; try { u = new URL(value); } catch { fail('PUBLIC_HTTPS_ORIGIN_REQUIRED'); }
  if (u.protocol !== 'https:' || u.username || u.password || u.search || u.hash || u.pathname !== '/' ||
      u.hostname === 'localhost' || u.hostname.endsWith('.localhost') || u.hostname === '127.0.0.1' || u.hostname === '[::1]') fail('PUBLIC_HTTPS_ORIGIN_REQUIRED');
  return u.origin;
}
function validateContract(c) {
  if (c?.verified !== true || c.protectedFunctionsCompatible !== true ||
      !isString(c.documentationRef) || !/^\d{4}-\d{2}-\d{2}$/.test(c.reviewedOn || '')) fail('TWILIO_CIM_CONTRACT_UNVERIFIED');
  for (const key of ['eventIDPath','accountIDPath','recipientPath','businessSenderPath','textPath','channelPath','channelValue','kindPath','kindValue']) {
    if (!isString(c.inbound?.[key])) fail('INBOUND_CONTRACT_INCOMPLETE');
  }
  const out = c.outbound;
  if (!out || !isString(out.endpoint) || !['json','form'].includes(out.encoding) || out.authentication !== 'account-basic' ||
      !out.bodyTemplate || typeof out.bodyTemplate !== 'object' || Array.isArray(out.bodyTemplate) ||
      !Array.isArray(out.acceptedStatusCodes) || !out.acceptedStatusCodes.length ||
      out.acceptedStatusCodes.some(v => !Number.isInteger(v) || v < 200 || v > 299) ||
      !isString(out.acceptanceIDPath) || !['message','operation'].includes(out.acceptanceIDType)) fail('OUTBOUND_CONTRACT_INCOMPLETE');
  const u = new URL(out.endpoint);
  if (u.protocol !== 'https:' || u.username || u.password || u.search || u.hash ||
      !['api.twilio.com','messaging.twilio.com','content.twilio.com','comms.twilio.com'].includes(u.hostname)) fail('UNAPPROVED_API_ENDPOINT');
  const ack = c.acknowledgement;
  if (!ack || !Number.isInteger(ack.statusCode) || ack.statusCode < 200 || ack.statusCode > 299 ||
      !isString(ack.contentType) || typeof ack.body !== 'string') fail('ACKNOWLEDGEMENT_CONTRACT_INCOMPLETE');
  if (ack.contentType.startsWith('application/json')) {
    try { JSON.parse(ack.body); } catch { fail('ACKNOWLEDGEMENT_CONTRACT_INCOMPLETE'); }
  }
  return c;
}
function validateIdentity(context) {
  origin(context.PUBLIC_BASE_URL);
  if (!/^[A-Z0-9]{10}$/.test(context.APPLE_TEAM_ID || '') ||
      !/^[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(context.APPLE_EXTENSION_BUNDLE_ID || '') ||
      !/^[1-9]\d*$/.test(context.APPLE_APP_STORE_ID || '') || !isString(context.APPLE_APP_NAME)) fail('APPLE_IDENTITY_REQUIRED');
  for (const key of ['AMB_TEST_RECIPIENT','AMB_BUSINESS_SENDER','ACCOUNT_SID','SYNC_SERVICE_SID','SYNC_MAP_SID']) {
    if (!isString(context[key])) fail('TEST_CHANNEL_CONFIGURATION_REQUIRED');
  }
}
function selectComponent(text, fallback = 'bar') {
  if (!COMPONENTS.includes(fallback)) fail('INVALID_DEFAULT_COMPONENT');
  // These are our demo commands, not Twilio event types. A confirmation
  // command only opens the review UI; it never submits the review API.
  if (/\b(confirm|confirmation|review)\b/i.test(text)) return 'confirmation';
  if (/\b(pie|donut)\b/i.test(text)) return 'pie';
  if (/\b(data|table|records)\b/i.test(text)) return 'data';
  if (/\b(line|trend)\b/i.test(text)) return 'line';
  if (/\b(bar|bars)\b/i.test(text)) return 'bar';
  return fallback;
}
function buildComponentURL(context, sessionID, component = 'bar') {
  if (!COMPONENTS.includes(component)) fail('INVALID_COMPONENT');
  const base = origin(context.PUBLIC_BASE_URL);
  const url = new URL('/chart', base);
  url.searchParams.set('chart_id', CHART_ID);
  url.searchParams.set('revision_id', REVISION_ID);
  url.searchParams.set('session_id', sessionID);
  url.searchParams.set('component', component);
  return url.href;
}
function buildDescriptor(context, sessionID, component = 'bar') {
  const base = origin(context.PUBLIC_BASE_URL);
  const url = buildComponentURL(context,sessionID,component);
  // Application-owned descriptor. The beta contract MUST map these fields
  // into Twilio's documented request. This is not an invented Twilio payload.
  return {
    appId: context.APPLE_APP_STORE_ID, appName: context.APPLE_APP_NAME,
    bid: `com.apple.messages.MSMessageExtensionBalloonPlugin:${context.APPLE_TEAM_ID}:${context.APPLE_EXTENSION_BUNDLE_ID}`,
    sessionIdentifier: sessionID, useLiveLayout: true, url,
    fallback: { title: `${component === 'confirmation' ? 'Review confirmation' : component + ' view'} · Microsoft FY2025 revenue`,
      subtitle: 'Fiscal · USD · Restated · Q4 calculated',
      imageURL: base + '/revenue-preview.png' }
  };
}
function renderTemplate(template, values) {
  if (typeof template === 'string') {
    const match = /^\{\{([A-Za-z][A-Za-z0-9.]*)\}\}$/.exec(template);
    if (match) { const value = getPath(values, match[1]); if (value === undefined) fail('UNKNOWN_TEMPLATE_TOKEN'); return value; }
    if (template.includes('{{') || template.includes('}}')) fail('TOKENS_MUST_FILL_ENTIRE_VALUE');
    return template;
  }
  if (Array.isArray(template)) return template.map(v => renderTemplate(v, values));
  if (template && typeof template === 'object') {
    // Explicit encoding step for fields such as JSON-in-form values, only
    // when required by the reviewed provider contract.
    if (Object.keys(template).length === 1 && Object.hasOwn(template,'$json')) {
      return JSON.stringify(renderTemplate(template.$json,values));
    }
    const result = {};
    for (const [key,value] of Object.entries(template)) {
      if (forbidden.has(key)) fail('INVALID_TEMPLATE_KEY');
      result[key] = renderTemplate(value, values);
    }
    return result;
  }
  return template;
}
function makeRequest(contract, context, normalized, descriptor) {
  const body = renderTemplate(contract.outbound.bodyTemplate, {
    recipient: normalized.recipient, sender: context.AMB_BUSINESS_SENDER,
    accountSID: context.ACCOUNT_SID, extension: descriptor
  });
  let encoded;
  if (contract.outbound.encoding === 'form') {
    // Nested form values must be explicitly JSON-encoded by a reviewed adapter.
    if (Object.values(body).some(v => v === null || typeof v === 'object')) fail('FORM_VALUES_MUST_BE_SCALARS');
    encoded = new URLSearchParams(Object.entries(body).map(([k,v]) => [k,String(v)])).toString();
  } else encoded = JSON.stringify(body);
  if (Buffer.byteLength(encoded) > 65536) fail('OUTBOUND_PAYLOAD_TOO_LARGE');
  return { url: contract.outbound.endpoint, method: 'POST', body: encoded,
    contentType: contract.outbound.encoding === 'form' ? 'application/x-www-form-urlencoded' : 'application/json' };
}
async function processInbound({ context, event, contract, store, send }) {
  if (context.AMB_ENABLE_LIVE_DELIVERY !== 'true') return { statusCode: 503, code: 'LIVE_DELIVERY_DISABLED' };
  validateContract(contract); validateIdentity(context);
  const m = contract.inbound;
  if (getPath(event,m.accountIDPath) !== context.ACCOUNT_SID ||
      getPath(event,m.channelPath) !== m.channelValue ||
      getPath(event,m.businessSenderPath) !== context.AMB_BUSINESS_SENDER) return { statusCode: 403, code: 'WRONG_ACCOUNT_OR_CHANNEL' };
  if (getPath(event,m.kindPath) !== m.kindValue) return { statusCode: 200, code: 'IGNORED_EVENT' };
  const n = { eventID: getPath(event,m.eventIDPath), recipient: getPath(event,m.recipientPath), text: getPath(event,m.textPath) };
  if (![n.eventID,n.recipient,n.text].every(isString) || n.eventID.length > 256 || n.recipient.length > 2048 || n.text.length > 4096) return { statusCode: 422, code: 'INVALID_EVENT' };
  if (n.recipient !== context.AMB_TEST_RECIPIENT) return { statusCode: 403, code: 'OUTSIDE_TEST_CONVERSATION' };
  if (!/\b(chart|revenue|microsoft|msft|pie|donut|data|table|records|line|trend|bar|bars|review|confirm|confirmation)\b/i.test(n.text)) return { statusCode: 200, code: 'IGNORED_TEXT' };
  const key = createHash('sha256').update(JSON.stringify([context.ACCOUNT_SID,context.AMB_BUSINESS_SENDER,n.recipient,n.eventID])).digest('hex');
  const descriptor = buildDescriptor(context,randomUUID(),selectComponent(n.text, context.NATIVE_DEFAULT_COMPONENT || 'bar'));
  const request = makeRequest(contract,context,n,descriptor);
  const claim = await store.claim(key,{ state: 'reserved', sessionID: descriptor.sessionIdentifier, createdAt: new Date().toISOString() });
  if (!claim.claimed) return { statusCode: 200, code: 'DUPLICATE_SUPPRESSED', priorState: claim.data.state };
  try {
    const response = await send(request);
    if (!contract.outbound.acceptedStatusCodes.includes(response.status)) fail('PROVIDER_REJECTED_REQUEST');
    const id = getPath(response.body,contract.outbound.acceptanceIDPath);
    if (!isString(id)) fail('PROVIDER_ACCEPTANCE_UNCONFIRMED');
    await store.finish(key,{ state: 'accepted', providerAcceptanceID: id, providerAcceptanceType: contract.outbound.acceptanceIDType,
      sessionID: descriptor.sessionIdentifier, updatedAt: new Date().toISOString() });
    return { statusCode: 200, code: 'ACCEPTED_BY_PROVIDER' };
  } catch {
    // Never retry an uncertain outbound request automatically. The reserved
    // record survives even if recording this result also fails.
    try { await store.finish(key,{ state: 'uncertain', sessionID: descriptor.sessionIdentifier, updatedAt: new Date().toISOString() }); } catch {}
    return { statusCode: 502, code: 'DELIVERY_UNCERTAIN_CHECK_PROVIDER' };
  }
}
module.exports = { CHART_ID, REVISION_ID, COMPONENTS, selectComponent, origin, getPath, validateContract, validateIdentity, buildComponentURL, buildDescriptor, renderTemplate, makeRequest, processInbound };
