'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {LocalDevelopmentServer}=require('@twilio/runtime-handler/dev');

test('Twilio local runtime serves chart data, fallback and private-asset boundary',async()=>{
  const baseDir=path.resolve(__dirname,'..');
  function resources(folder){return fs.readdirSync(path.join(baseDir,folder)).map(name=>{
    const access=name.includes('.private.')?'private':name.includes('.protected.')?'protected':'public';
    const route=name.replace(/\.(private|protected)\./,'.');
    return{name,access,path:'/'+(folder==='functions'?route.replace(/\.js$/,''):route),
      filePath:path.join(baseDir,folder,name),content:fs.readFileSync(path.join(baseDir,folder,name))};
  })}
  const local=new LocalDevelopmentServer(0,{
    baseDir,env:{AMB_ENABLE_LIVE_DELIVERY:'false'},port:0,url:'http://localhost',
    detailedLogs:false,live:false,logs:false,legacyMode:false,appName:'chart-concierge-test',
    forkProcess:false,enableDebugLogs:false,routes:{functions:resources('functions'),assets:resources('assets')}
  });
  const server=local.getApp().listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  try{
    const response=await fetch(origin+'/chart-manifest');
    assert.equal(response.status,200);
    assert.deepEqual(await response.json(),JSON.parse(fs.readFileSync(path.join(baseDir,'assets/chart-manifest.private.json'))));
    const fallback=await fetch(origin+'/chart');assert.equal(fallback.status,200);assert.match(await fallback.text(),/65585000000/);
    const image=await fetch(origin+'/revenue-preview.png');assert.equal(image.status,200);assert.match(image.headers.get('content-type'),/image\/png/);
    const privateConfig=await fetch(origin+'/amb-contract.json');assert.equal(privateConfig.status,403);
    // The dev runtime does not enforce hosted protected-Function signatures.
    // This tests the disabled handler, not Twilio's gateway authentication.
    const inbound=await fetch(origin+'/amb-inbound',{method:'POST'});assert.equal(inbound.status,503);
    assert.equal((await inbound.json()).error,'LIVE_DELIVERY_DISABLED');
    const payload={schemaVersion:1,requestID:'01bc2b3a-8aaf-4222-9f4c-40e1cc7d15a1',
      chartID:'b71d8906-be7f-499e-a448-044d4ec39825',revisionID:'f47530da-762a-44a1-9c52-ab142462bf6f',action:'confirm_snapshot_review'};
    const confirm=()=>fetch(origin+'/mock-confirm',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const confirmation=await confirm();assert.equal(confirmation.status,200);
    const result=await confirmation.json();assert.equal(result.mode,'mock');assert.equal(result.status,'confirmed');
    assert.equal(result.requestID,payload.requestID);assert.equal(result.receiptID,'mock-'+payload.requestID);
    assert.deepEqual(await (await confirm()).json(),result);
    const invalid=await fetch(origin+'/mock-confirm',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,action:'cancel'})});
    assert.equal(invalid.status,422);
  }finally{await new Promise(resolve=>server.close(resolve))}
});
