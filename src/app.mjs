import finance from '../finance/dist/server/index.js';
import { buildRichLink, openGraphHead, validatePublicOrigin, CHART_PATH } from './message.mjs';
import { unavailableAdapter, assertVerifiedEvent } from './twilio-amb-adapter.mjs';
import { previewPage, sourcePage, decorateChart } from './pages.mjs';

const headers = {
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  // Do not index a review build or leak a client-specific deployment via search.
  'x-robots-tag': 'noindex, nofollow'
};
const json = (body, status=200) => new Response(JSON.stringify(body, null, 2), {status,headers:{...headers,'content-type':'application/json; charset=utf-8'}});
const html = body => new Response(body,{headers:{...headers,'content-type':'text/html; charset=utf-8'}});

export function createApp({ publicOrigin=null, adapter=unavailableAdapter, assetHandler=null }={}) {
  const origin=validatePublicOrigin(publicOrigin);
  async function chartPayload() {
    return (await finance.fetch(new Request('https://internal.invalid/api/chart'))).json();
  }
  return {
    async fetch(request) {
      const url=new URL(request.url), path=url.pathname;
      if (path==='/webhooks/twilio/amb') {
        if(request.method!=='POST') return json({error:'METHOD_NOT_ALLOWED'},405);
        if(!adapter.configured || !origin) return json({error:'AMB_ADAPTER_NOT_CONFIGURED',message:'A verified Twilio AMB beta adapter and deployed HTTPS origin are required. No message was sent.'},503);
        let event;
        try { event=await adapter.verifyAndParseInbound(request); }
        catch { return json({error:'WEBHOOK_NOT_VERIFIED'},401); }
        if(event===null) return new Response(null,{status:204,headers});
        try { assertVerifiedEvent(event); }
        catch { return json({error:'INVALID_MESSAGE_EVENT'},422); }
        // Only an authenticated inbound request for this single public-company
        // chart can trigger a reply. No arbitrary recipient or chart URL accepted.
        if (!/\b(revenue|chart|microsoft|msft)\b/i.test(event.text)) return json({status:'ignored',message:'No chart request recognized.'});
        try {
          const result=await adapter.replyWithRichLink({eventId:event.eventId,conversationId:event.conversationId,message:buildRichLink(origin)});
          if(!result || !['sent','duplicate'].includes(result.status)) return json({error:'DELIVERY_STATE_UNKNOWN'},502);
          return json({status:result.status});
        } catch {
          // Provider errors/credentials/recipient IDs are never echoed.
          return json({error:'DELIVERY_STATE_UNKNOWN',message:'Consult the adapter delivery record before retrying.'},502);
        }
      }
      if(!['GET','HEAD'].includes(request.method)) return json({error:'METHOD_NOT_ALLOWED'},405);
      let response;
      if(path==='/' || path==='/preview') response=html(previewPage());
      else if(path===CHART_PATH) {
        const rendered=await finance.fetch(new Request('https://internal.invalid/'));
        response=html(decorateChart(await rendered.text(),openGraphHead(origin)));
      } else if(path==='/sources') response=html(sourcePage(await chartPayload()));
      else if(path==='/api/chart' || path==='/api/package') response=await finance.fetch(new Request('https://internal.invalid'+path));
      else if(path==='/api/message-preview') response=json({schema:'application.chart-rich-link.v1',note:'Application-owned content; not a Twilio API request.',message:buildRichLink(origin)});
      else if(path==='/api/integration-status') response=json({mode:'prototype',provider:'Twilio',channel:'Apple Messages for Business',chartExportAvailable:true,publicHttpsOriginConfigured:!!origin,accountSpecificAdapterConfigured:!!adapter.configured,liveDeliveryReady:!!origin&&!!adapter.configured,blockers:[...(!origin?['DEPLOYED_HTTPS_ORIGIN_REQUIRED']:[]),...(!adapter.configured?['TWILIO_AMB_BETA_ACCESS_AND_VERIFIED_API_CONTRACT_REQUIRED']:[])]});
      else if(path==='/assets/revenue-preview.png' && assetHandler) response=await assetHandler(path);
      else response=json({error:'NOT_FOUND'},404);
      return request.method==='HEAD' ? new Response(null,{status:response.status,headers:response.headers}) : response;
    }
  };
}
