'use strict';
const fs = require('node:fs');
const path = require('node:path');
const core = require('../assets/core.private.js');
const contract = require('../assets/amb-contract.private.json');
const context = {...process.env,ACCOUNT_SID:process.env.ACCOUNT_SID||process.env.TWILIO_ACCOUNT_SID};
const checks = [
  ['Twilio CIM contract',()=>core.validateContract(contract)],
  ['Apple identity and test channel',()=>core.validateIdentity(context)],
  ['Native default component',()=>core.selectComponent('',context.NATIVE_DEFAULT_COMPONENT || 'bar')],
  ['Delivery switch',()=>{if(context.AMB_ENABLE_LIVE_DELIVERY!=='true')throw new Error('LIVE_DELIVERY_DISABLED');}],
  ['Same verified native/server snapshot',()=>{
    const a=fs.readFileSync(path.join(__dirname,'../assets/chart-manifest.private.json'));
    const b=fs.readFileSync(path.join(__dirname,'../../ios/Shared/chart-manifest.json'));
    if(!a.equals(b)) throw new Error('SNAPSHOT_MISMATCH');
  }]
];
let blocked=false;
for(const [name,fn] of checks){try{fn();console.log('PASS '+name);}catch(e){blocked=true;console.log('BLOCKED '+name+': '+e.message);}}
console.log('Preflight does not send messages or prove provider/device delivery.');
process.exitCode=blocked?1:0;
