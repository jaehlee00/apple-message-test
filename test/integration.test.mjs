import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../src/app.mjs';
import {buildRichLink,validatePublicOrigin} from '../src/message.mjs';

const request=(path,method='GET',body)=>new Request('http://localhost'+path,{method,body});
test('exact reviewed revenue, date, unit, provider and flag preservation',async()=>{
  const r=await (await createApp().fetch(request('/api/chart'))).json();
  assert.deepEqual(r.table.rows.map(r=>[r.date,r.value,r.currency,r.provider,r.is_restated,r.is_calculated]),[
    ['2024-09-30',65585000000,'USD','Fiscal',true,false],
    ['2024-12-31',69632000000,'USD','Fiscal',true,false],
    ['2025-03-31',70066000000,'USD','Fiscal',true,false],
    ['2025-06-30',76441000000,'USD','Fiscal',true,true]
  ]);
  assert.equal(r.table.rows[3].source_ref_ids.length,2);
  assert.equal(r.display.currency_scale,'billions');
  assert.equal(r.package_info.retrievalDetailsIncluded,false);
});
test('outbound metadata has no invented deployment address',()=>{
  assert.equal(buildRichLink(null).url,null);
  assert.equal(buildRichLink(null).imageUrl,null);
  assert.throws(()=>validatePublicOrigin('http://charts.example.test'));
  assert.throws(()=>validatePublicOrigin('https://user:password@charts.example.test'));
  assert.throws(()=>validatePublicOrigin('https://charts.example.test/anypath'));
  assert.throws(()=>validatePublicOrigin('https://localhost'));
});
test('HTTPS origin yields exact chart and image URLs',()=>{
  const m=buildRichLink('https://charts.example.test');
  assert.equal(m.url,'https://charts.example.test/chart/msft-fy2025');
  assert.equal(m.imageUrl,'https://charts.example.test/assets/revenue-preview.png');
});
test('native Finance HTML retained and server-side Open Graph visible',async()=>{
  const app=createApp({publicOrigin:'https://charts.example.test'});
  const html=await (await app.fetch(request('/chart/msft-fy2025'))).text();
  assert.match(html,/__CHATGPT_FINANCE_CHART_HOSTING__/);
  assert.match(html,/<meta property="og:image" content="https:\/\/charts\.example\.test\/assets\/revenue-preview\.png">/);
  assert.match(html,/class="integration-nav"/);
});
test('source table contains current-vintage caveat and both Q4 references',async()=>{
  const html=await (await createApp().fetch(request('/sources'))).text();
  assert.match(html,/76,441,000,000/);
  assert.match(html,/derived_lineitem/);
  assert.match(html,/2026-07-29/);
  assert.match(html,/Filing 2/);
});
test('default webhook fails closed and confirms no delivery',async()=>{
  const r=await createApp().fetch(request('/webhooks/twilio/amb','POST','{}'));
  assert.equal(r.status,503);
  assert.equal((await r.json()).error,'AMB_ADAPTER_NOT_CONFIGURED');
});
test('invalid signature never reaches reply logic',async()=>{
  let sends=0;
  const app=createApp({publicOrigin:'https://charts.example.test',adapter:{configured:true,verifyAndParseInbound:async()=>{throw Error('private provider detail');},replyWithRichLink:async()=>{sends++;}}});
  const r=await app.fetch(request('/webhooks/twilio/amb','POST','{}'));
  assert.equal(r.status,401);assert.equal(sends,0);
  assert.doesNotMatch(await r.text(),/private provider detail/);
});
test('malformed verified event is rejected',async()=>{
  const app=createApp({publicOrigin:'https://charts.example.test',adapter:{configured:true,verifyAndParseInbound:async()=>({text:'chart'})}});
  assert.equal((await app.fetch(request('/webhooks/twilio/amb','POST','{}'))).status,422);
});
test('unrelated inbound message creates no reply',async()=>{
  let sends=0;
  const app=createApp({publicOrigin:'https://charts.example.test',adapter:{configured:true,verifyAndParseInbound:async()=>({eventId:'e1',conversationId:'c1',text:'hello'}),replyWithRichLink:async()=>{sends++;}}});
  assert.equal((await (await app.fetch(request('/webhooks/twilio/amb','POST','{}'))).json()).status,'ignored');
  assert.equal(sends,0);
});
test('verified chart request uses only authenticated conversation and stable event ID',async()=>{
  let got;
  const app=createApp({publicOrigin:'https://charts.example.test',adapter:{configured:true,verifyAndParseInbound:async()=>({eventId:'verified-event',conversationId:'verified-conversation',text:'Microsoft revenue'}),replyWithRichLink:async x=>{got=x;return {status:'sent'};}}});
  const r=await app.fetch(request('/webhooks/twilio/amb','POST','{"conversationId":"attacker"}'));
  assert.equal((await r.json()).status,'sent');
  assert.equal(got.conversationId,'verified-conversation');
  assert.equal(got.eventId,'verified-event');
  assert.equal(got.message.url,'https://charts.example.test/chart/msft-fy2025');
});
test('adapter duplicate result is preserved',async()=>{
  const app=createApp({publicOrigin:'https://charts.example.test',adapter:{configured:true,verifyAndParseInbound:async()=>({eventId:'e1',conversationId:'c1',text:'chart'}),replyWithRichLink:async()=>({status:'duplicate'})}});
  assert.equal((await (await app.fetch(request('/webhooks/twilio/amb','POST','{}'))).json()).status,'duplicate');
});
test('uncertain provider outcomes never become sent',async()=>{
  const app=createApp({publicOrigin:'https://charts.example.test',adapter:{configured:true,verifyAndParseInbound:async()=>({eventId:'e1',conversationId:'c1',text:'chart'}),replyWithRichLink:async()=>{throw Error('secret');}}});
  const r=await app.fetch(request('/webhooks/twilio/amb','POST','{}'));
  assert.equal(r.status,502);assert.equal((await r.json()).error,'DELIVERY_STATE_UNKNOWN');
});
test('preview is explicitly labeled and no arbitrary send API exists',async()=>{
  const app=createApp();
  assert.match(await (await app.fetch(request('/'))).text(),/Live delivery is not configured/);
  assert.equal((await app.fetch(request('/api/send','POST','{}'))).status,405);
  const status=await (await app.fetch(request('/api/integration-status'))).json();
  assert.equal(status.liveDeliveryReady,false);
  assert.equal(status.blockers.length,2);
});
test('HEAD returns no body and image has explicit MIME type',async()=>{
  const app=createApp({assetHandler:async()=>new Response('PNG',{headers:{'content-type':'image/png'}})});
  const r=await app.fetch(request('/assets/revenue-preview.png','HEAD'));
  assert.equal(await r.text(),'');assert.equal(r.headers.get('content-type'),'image/png');
});
