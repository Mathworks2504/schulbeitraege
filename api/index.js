'use strict';
const {createApplication}=require('../app');
const {transaction}=require('../cloud-store');
function bufferedResponse(){
  const headers={},chunks=[];
  return {
    statusCode:200,headersSent:false,
    setHeader(name,value){headers[name.toLowerCase()]=value;return this;},getHeader(name){return headers[name.toLowerCase()];},
    writeHead(status,extra){this.statusCode=status;Object.entries(extra||{}).forEach(([k,v])=>this.setHeader(k,v));this.headersSent=true;return this;},
    write(value){if(value!==undefined)chunks.push(Buffer.isBuffer(value)?value:Buffer.from(String(value)));return true;},
    end(value){this.write(value);this.headersSent=true;},
    flush(res){res.writeHead(this.statusCode,headers);res.end(Buffer.concat(chunks));}
  };
}
function configurationError(req,res,e){
  const status=e.setup?503:500;
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  const message=e.setup?e.message:'Die Datenbank ist momentan nicht erreichbar. Bitte Verbindung und Vercel-Protokolle prüfen.';
  if((req.url||'').startsWith('/api/')){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:message}));return;}
  res.writeHead(status,{'Content-Type':'text/html; charset=utf-8'});
  const escaped=message.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  res.end('<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bilal-Schule Verwaltung – Einrichtung</title><body style="margin:0;background:#f7f3e8;color:#16372b;font-family:Calibri,Arial,sans-serif"><main style="max-width:650px;margin:12vh auto;padding:32px;background:white;border-top:5px solid #c9a227;border-radius:16px"><h1>Bilal-Schule Verwaltung</h1><h2>Online-Einrichtung vervollständigen</h2><p>'+escaped+'</p><ol><li>In Vercel unter Storage eine PostgreSQL-Datenbank verbinden.</li><li>Unter Settings → Environment Variables DATABASE_URL sowie BILAL_ADMIN_USERNAME und BILAL_ADMIN_PASSWORD setzen.</li><li>Unter Deployments → Redeploy erneut bereitstellen.</li></ol><p>Passwörter und Datenbank-Verbindungsdaten ausschließlich in Vercel hinterlegen.</p></main></body></html>');
}
function makeHandler({runTransaction=transaction,env=process.env}={}){
  return async function handler(req,res){
    const allowedHosts=[env.VERCEL_URL,env.VERCEL_PROJECT_PRODUCTION_URL,env.BILAL_PUBLIC_HOST];
    if(!env.VERCEL&&req.headers.host)allowedHosts.push(req.headers.host);
    const buffered=bufferedResponse();
    try{
      await runTransaction(async(state,backup)=>{
        const security=state._auth||{sessions:[],attempts:[]};delete state._auth;
        const app=createApplication({cloud:true,state,security,allowedHosts,backup});
        await app.handler(req,buffered);
        const next=app.getState();next._auth=app.getSecurity();return next;
      },{env,makeState:()=>createApplication().getState()});
      // A successful response is sent only after PostgreSQL has committed.
      buffered.flush(res);
    }catch(e){console.error('Bilal cloud request failed:',e.code||'CONFIGURATION_OR_DATABASE_ERROR');configurationError(req,res,e);}
  };
}
module.exports=makeHandler();
module.exports.makeHandler=makeHandler;
module.exports.bufferedResponse=bufferedResponse;
