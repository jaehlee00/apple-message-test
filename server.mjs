import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createApp } from './src/app.mjs';

const port=Number(process.env.PORT || 3000);
const host=process.env.HOST || '127.0.0.1';
const app=createApp({
  publicOrigin:process.env.PUBLIC_BASE_URL || null,
  assetHandler:async()=>new Response(await readFile(new URL('./public/revenue-preview.png',import.meta.url)),{headers:{'content-type':'image/png','x-content-type-options':'nosniff','cache-control':'public, max-age=300'}})
});
createServer(async(req,res)=>{
  try {
    const chunks=[];let size=0;
    for await(const chunk of req){size+=chunk.length;if(size>65536){res.writeHead(413);res.end('Request too large');return;}chunks.push(chunk);}
    // Fixed internal origin; a caller-controlled Host header cannot affect links.
    const request=new Request(new URL(req.url,'http://localhost'),{method:req.method,headers:req.headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)});
    const response=await app.fetch(request);
    res.writeHead(response.status,Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  }catch{res.writeHead(500,{'content-type':'application/json'});res.end('{"error":"INTERNAL_ERROR"}');}
}).listen(port,host,()=>console.log(`Review prototype: http://${host}:${port} — Twilio live delivery disabled`));
