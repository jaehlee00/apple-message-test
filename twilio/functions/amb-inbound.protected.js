'use strict';
// MUST remain protected. Twilio's gateway validates X-Twilio-Signature before
// invocation. Only enable after beta documentation confirms compatibility.
exports.handler = async (context,event,callback) => {
  const assets = Runtime.getAssets();
  const core = require(assets['/core.js'].path);
  const contract = JSON.parse(assets['/amb-contract.json'].open());
  const respond = (status,body,type='application/json') => {
    const r = new Twilio.Response(); r.setStatusCode(status);
    r.appendHeader('Content-Type',type); r.appendHeader('Cache-Control','no-store');
    r.setBody(type.startsWith('application/json') && typeof body==='string' ? JSON.parse(body) : body);
    return callback(null,r);
  };
  try {
    const result = await core.processInbound({context,event,contract,
      store: {
        async claim(...args) {
          const factory = require(assets['/sync-store.js'].path);
          return factory(context.getTwilioClient(),context).claim(...args);
        },
        async finish(...args) {
          const factory = require(assets['/sync-store.js'].path);
          return factory(context.getTwilioClient(),context).finish(...args);
        }
      },
      send: async request => {
        // Basic authentication is available ONLY after the account-specific
        // contract explicitly names it. No URL comes from an inbound message.
        if (!context.AUTH_TOKEN) throw new Error('AUTH_TOKEN_UNAVAILABLE');
        const response = await fetch(request.url,{
          method:request.method, body:request.body, redirect:'error',
          signal:AbortSignal.timeout(4500),
          headers:{'Content-Type':request.contentType,
            Authorization:'Basic '+Buffer.from(context.ACCOUNT_SID+':'+context.AUTH_TOKEN).toString('base64')}
        });
        return {status:response.status,body:await response.json()};
      }
    });
    // Log no recipient, message body, token, payload, or account secret.
    console.log(JSON.stringify({code:result.code}));
    if (result.statusCode >= 200 && result.statusCode < 300) {
      const ack=contract.acknowledgement;
      return respond(ack.statusCode,ack.body,ack.contentType);
    }
    return respond(result.statusCode,{error:result.code});
  } catch (error) {
    const safeCodes = new Set(['TWILIO_CIM_CONTRACT_UNVERIFIED','INBOUND_CONTRACT_INCOMPLETE','OUTBOUND_CONTRACT_INCOMPLETE',
      'ACKNOWLEDGEMENT_CONTRACT_INCOMPLETE','PUBLIC_HTTPS_ORIGIN_REQUIRED','APPLE_IDENTITY_REQUIRED','TEST_CHANNEL_CONFIGURATION_REQUIRED',
      'UNAPPROVED_API_ENDPOINT','FORM_VALUES_MUST_BE_SCALARS']);
    return respond(503,{error:safeCodes.has(error.code)?error.code:'CHANNEL_NOT_READY'});
  }
};
