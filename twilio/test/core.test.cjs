'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const core = require('../assets/core.private.js');
const syncStore = require('../assets/sync-store.private.js');

// SYNTHETIC CONTRACT ONLY. These field names, event kinds, and /TEST_ONLY path
// are invented test fixtures, not Twilio AMB API documentation or deploy config.
function fixture() {
  const context = {
    AMB_ENABLE_LIVE_DELIVERY:'true',PUBLIC_BASE_URL:'https://unit-test.invalid',
    APPLE_TEAM_ID:'ABCDEFGHIJ',APPLE_EXTENSION_BUNDLE_ID:'com.test.Chart.Messages',
    APPLE_APP_STORE_ID:'123456789',APPLE_APP_NAME:'Test Chart',
    AMB_TEST_RECIPIENT:'synthetic-user',AMB_BUSINESS_SENDER:'synthetic-brand',
    ACCOUNT_SID:'synthetic-account',SYNC_SERVICE_SID:'synthetic-service',SYNC_MAP_SID:'synthetic-map'
  };
  const contract = {
    verified:true,documentationRef:'SYNTHETIC TEST FIXTURE',reviewedOn:'2026-10-12',protectedFunctionsCompatible:true,
    inbound:{eventIDPath:'id',accountIDPath:'account',recipientPath:'user',businessSenderPath:'brand',textPath:'text',
      channelPath:'channel',channelValue:'SYNTHETIC_AMB',kindPath:'kind',kindValue:'SYNTHETIC_INBOUND'},
    outbound:{endpoint:'https://api.twilio.com/TEST_ONLY',authentication:'account-basic',encoding:'json',
      bodyTemplate:{target:'{{recipient}}',from:'{{sender}}',custom:'{{extension}}'},acceptedStatusCodes:[202],acceptanceIDPath:'id',acceptanceIDType:'message'},
    acknowledgement:{statusCode:200,contentType:'application/json',body:'{}'}
  };
  const event={id:'event-1',account:'synthetic-account',user:'synthetic-user',brand:'synthetic-brand',
    text:'show Microsoft revenue chart',channel:'SYNTHETIC_AMB',kind:'SYNTHETIC_INBOUND'};
  const records=new Map(),calls=[];
  const store={async claim(k,data){if(records.has(k))return{claimed:false,data:records.get(k)};records.set(k,data);return{claimed:true}},
    async finish(k,data){records.set(k,data)}};
  const send=async request=>{calls.push(request);return{status:202,body:{id:'synthetic-accepted-id'}}};
  return{context,contract,event,store,send,records,calls};
}
test('checked-in contract cannot enable delivery',()=>assert.throws(()=>core.validateContract(require('../assets/amb-contract.private.json')),/UNVERIFIED/));
test('delivery disabled does not parse, reserve or send',async()=>{const f=fixture();f.context.AMB_ENABLE_LIVE_DELIVERY='false';assert.equal((await core.processInbound(f)).code,'LIVE_DELIVERY_DISABLED');assert.equal(f.records.size,0);assert.equal(f.calls.length,0)});
test('account, business and channel checks reject mismatches',async()=>{for(const k of ['account','brand','channel']){const f=fixture();f.event[k]='other';assert.equal((await core.processInbound(f)).statusCode,403);assert.equal(f.calls.length,0)}});
test('test-recipient allowlist is enforced',async()=>{const f=fixture();f.event.user='another-user';assert.equal((await core.processInbound(f)).code,'OUTSIDE_TEST_CONVERSATION');assert.equal(f.calls.length,0)});
test('status events and unrelated text do not send',async()=>{for(const change of [{kind:'SYNTHETIC_STATUS'},{text:'hello'}]){const f=fixture();Object.assign(f.event,change);assert.match((await core.processInbound(f)).code,/IGNORED/);assert.equal(f.calls.length,0)}});
test('oversize and missing event fields rejected before reserve',async()=>{for(const change of [{id:''},{text:'x'.repeat(4097)}]){const f=fixture();Object.assign(f.event,change);assert.equal((await core.processInbound(f)).statusCode,422);assert.equal(f.records.size,0)}});
test('verified event builds fixed revision URL and native descriptor',async()=>{const f=fixture();assert.equal((await core.processInbound(f)).code,'ACCEPTED_BY_PROVIDER');const b=JSON.parse(f.calls[0].body);assert.equal(b.target,f.event.user);assert.equal(b.custom.useLiveLayout,true);assert.equal(b.custom.bid,'com.apple.messages.MSMessageExtensionBalloonPlugin:ABCDEFGHIJ:com.test.Chart.Messages');const url=new URL(b.custom.url);assert.equal(url.pathname,'/chart');assert.equal(url.searchParams.get('revision_id'),core.REVISION_ID);assert.equal(url.searchParams.get('chart_id'),core.CHART_ID);assert.equal(url.searchParams.get('session_id'),b.custom.sessionIdentifier);assert.equal([...f.records.values()][0].state,'accepted')});
test('concurrent duplicate events produce only one provider request',async()=>{const f=fixture();const result=await Promise.all([core.processInbound(f),core.processInbound(f)]);assert.equal(f.calls.length,1);assert.equal(result.filter(x=>x.code==='DUPLICATE_SUPPRESSED').length,1)});
test('timeout is retained as uncertain and replay never resends',async()=>{const f=fixture();f.send=async()=>{f.calls.push(1);throw Error('timeout after remote acceptance')};assert.equal((await core.processInbound(f)).statusCode,502);assert.equal([...f.records.values()][0].state,'uncertain');assert.equal((await core.processInbound(f)).code,'DUPLICATE_SUPPRESSED');assert.equal(f.calls.length,1)});
test('missing acceptance ID is not reported as accepted',async()=>{const f=fixture();f.send=async()=>({status:202,body:{}});assert.equal((await core.processInbound(f)).code,'DELIVERY_UNCERTAIN_CHECK_PROVIDER')});
test('reserved record suppresses retry if final recording fails',async()=>{const f=fixture();f.store.finish=async()=>{throw Error('db unavailable')};await core.processInbound(f);assert.equal([...f.records.values()][0].state,'reserved');await core.processInbound(f);assert.equal(f.calls.length,1)});
test('endpoint cannot redirect credentials to another host',()=>{for(const url of ['https://evil.invalid/send','http://api.twilio.com/send','https://api.twilio.com.evil.invalid/send','https://a:b@api.twilio.com/send']){const f=fixture();f.contract.outbound.endpoint=url;assert.throws(()=>core.validateContract(f.contract),/UNAPPROVED/)} });
test('URL origins reject credentials and non-HTTPS',()=>{for(const value of ['http://unit-test.invalid','https://u:p@unit-test.invalid','https://unit-test.invalid/path','https://localhost'])assert.throws(()=>core.origin(value))});
test('template supports explicit JSON field without coercing native booleans',()=>{const b=core.renderTemplate({object:'{{extension}}',encoded:{$json:{live:'{{extension.useLiveLayout}}'}}},{extension:{useLiveLayout:true}});assert.equal(b.object.useLiveLayout,true);assert.equal(b.encoded,'{"live":true}');assert.throws(()=>core.renderTemplate('{{missing}}',{}));assert.throws(()=>core.renderTemplate('prefix {{extension}}',{extension:{}}));assert.throws(()=>core.getPath({},'__proto__.x'))});
test('form encoding requires explicit nested JSON serialization',()=>{const f=fixture();f.contract.outbound.encoding='form';const d=core.buildDescriptor(f.context,crypto.randomUUID());assert.throws(()=>core.makeRequest(f.contract,f.context,{recipient:f.event.user},d),/SCALARS/);f.contract.outbound.bodyTemplate={target:'{{recipient}}',content:{$json:'{{extension}}'}};const request=core.makeRequest(f.contract,f.context,{recipient:f.event.user},d);assert.equal(JSON.parse(new URLSearchParams(request.body).get('content')).useLiveLayout,true)});
test('Sync claim after ambiguous create checks exact existing record',async()=>{const factory=()=>({fetch:async()=>({data:{state:'reserved'}}),update:async()=>{}});factory.create=async()=>{throw Error('timeout')};const client={sync:{v1:{services:()=>({syncMaps:()=>({syncMapItems:factory})})}}};assert.deepEqual(await syncStore(client,{SYNC_SERVICE_SID:'s',SYNC_MAP_SID:'m'}).claim('key',{}),{claimed:false,data:{state:'reserved'}})});
test('native and server snapshots preserve every source row and raw null',()=>{const here=path.join(__dirname,'../assets/chart-manifest.private.json');const native=path.join(__dirname,'../../ios/Shared/chart-manifest.json');assert.deepEqual(fs.readFileSync(here),fs.readFileSync(native));const manifest=JSON.parse(fs.readFileSync(here));const originalBytes=fs.readFileSync(path.join(__dirname,'../../finance/dist/client/data/chart.json'));const original=JSON.parse(originalBytes);assert.deepEqual(manifest.rows,original.table.rows);assert.equal(manifest.sourceSnapshotSHA256,crypto.createHash('sha256').update(originalBytes).digest('hex'));assert.equal(manifest.rows[3].is_calculated,true);assert.equal(manifest.rows[0].original_value,null);assert.equal(manifest.valueBasis,'base USD')});
test('all component commands route to the requested native view',async()=>{
  for(const [text,component] of [['pie chart','pie'],['revenue trend','line'],['data table','data'],['review','confirmation'],['confirm','confirmation'],['bars','bar']]){
    const f=fixture();f.event.text=text;await core.processInbound(f);
    assert.equal(f.calls.length,1);
    const url=new URL(JSON.parse(f.calls[0].body).custom.url);
    assert.equal(url.searchParams.get('component'),component);
    assert.equal(url.searchParams.get('chart_id'),core.CHART_ID);
  }
});
test('configuration selects the default view but rejects unknown components',()=>{
  assert.equal(core.selectComponent('Microsoft revenue','pie'),'pie');
  assert.throws(()=>core.selectComponent('revenue','webview'),/INVALID_DEFAULT/);
  const f=fixture();assert.throws(()=>core.buildDescriptor(f.context,crypto.randomUUID(),'trade'),/INVALID_COMPONENT/);
});
test('confirmation command only builds the native message, never calls the mock API',async()=>{
  const f=fixture();f.event.text='confirm review';await core.processInbound(f);
  assert.equal(f.calls.length,1);assert.equal(f.calls[0].url,'https://api.twilio.com/TEST_ONLY');
  assert.equal(JSON.parse(f.calls[0].body).custom.url.includes('/mock-confirm'),false);
});
test('operation acceptance is recorded separately from a message ID',async()=>{
  const f=fixture();
  f.contract.outbound.endpoint='https://comms.twilio.com/v1/Messages';
  f.contract.outbound.acceptanceIDPath='operationId';f.contract.outbound.acceptanceIDType='operation';
  f.send=async request=>{f.calls.push(request);return{status:202,body:{operationId:'synthetic-operation'}}};
  assert.equal((await core.processInbound(f)).code,'ACCEPTED_BY_PROVIDER');
  const saved=[...f.records.values()][0];
  assert.equal(saved.providerAcceptanceType,'operation');assert.equal(saved.providerAcceptanceID,'synthetic-operation');
  assert.equal(saved.providerMessageID,undefined);
});
