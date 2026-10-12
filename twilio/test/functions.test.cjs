'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
class Response { constructor(){this.status=200;this.headers={}}setStatusCode(v){this.status=v}appendHeader(k,v){this.headers[k]=v}setBody(v){this.body=v} }
const assets={};
for(const name of fs.readdirSync(path.join(__dirname,'../assets'))){
 const key='/'+name.replace('.private.','.');const p=path.join(__dirname,'../assets',name);
 assets[key]={path:p,open:()=>fs.readFileSync(p,'utf8')};
}
global.Runtime={getAssets:()=>assets};global.Twilio={Response};
function invoke(name,context={},event={}){return new Promise((resolve,reject)=>{require('../functions/'+name).handler(context,event,(error,value)=>error?reject(error):resolve(value))})}
test('manifest endpoint emits a JSON object preserving all verified content',async()=>{const r=await invoke('chart-manifest.js');assert.equal(r.status,200);assert.match(r.headers['Content-Type'],/application\/json/);assert.deepEqual(r.body,JSON.parse(assets['/chart-manifest.json'].open()))});
test('fallback endpoint serves preserved interactive runtime',async()=>{const r=await invoke('chart.js');assert.match(r.headers['Content-Type'],/text\/html/);assert.equal(r.body,assets['/chart-runtime.html'].open());assert.match(r.body,/65585000000/)});
test('protected handler refuses unconfigured live transport',async()=>{const r=await invoke('amb-inbound.protected.js');assert.equal(r.status,503);assert.equal(r.body.error,'LIVE_DELIVERY_DISABLED')});
test('switch alone cannot activate unverified beta contract',async()=>{const r=await invoke('amb-inbound.protected.js',{AMB_ENABLE_LIVE_DELIVERY:'true'});assert.equal(r.status,503);assert.equal(r.body.error,'TWILIO_CIM_CONTRACT_UNVERIFIED')});
test('AASA fails visibly when real Apple identities are absent',async()=>{
 const r=await invoke('apple-app-site-association.js');assert.equal(r.status,503);
 assert.equal(r.body.error,'APPLE_ASSOCIATION_NOT_CONFIGURED');
});
test('AASA connects the clip and full app only to the component path',async()=>{
 const r=await invoke('apple-app-site-association.js',{APPLE_TEAM_ID:'ABCDEFGHIJ',APPLE_APP_BUNDLE_ID:'com.test.Example',APPLE_APP_CLIP_BUNDLE_ID:'com.test.Example.Clip'});
 assert.equal(r.status,200);assert.deepEqual(r.body.appclips.apps,['ABCDEFGHIJ.com.test.Example.Clip']);
 assert.deepEqual(r.body.applinks.details[0].components,[{'/':'/chart'}]);
});
test('configured web fallback adds App Clip discovery without changing the saved export',async()=>{
 const before=assets['/chart-runtime.html'].open();
 const r=await invoke('chart.js',{APPLE_APP_STORE_ID:'123456789',APPLE_APP_CLIP_BUNDLE_ID:'com.test.Example.Clip',PUBLIC_BASE_URL:'https://unit-test.invalid'});
 assert.match(r.body,/name="apple-itunes-app"/);assert.match(r.body,/app-clip-bundle-id=com.test.Example.Clip/);
 assert.equal(assets['/chart-runtime.html'].open(),before);
});
