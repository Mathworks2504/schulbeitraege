'use strict';
// Local entry point. Vercel uses api/index.js without starting a listener.
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto'),os=require('os');
const {createApplication}=require('./app'),storage=require('./storage');
const PORT=Number(process.env.PORT||3001),HOST=process.env.BILAL_LAN==='1'?'0.0.0.0':'127.0.0.1';
const DATA=storage.prepare(__dirname),FILE=path.join(DATA,'database.json');
const runtimeToken=crypto.randomBytes(32).toString('hex');
let server;
const app=createApplication({
  state:fs.existsSync(FILE)?JSON.parse(fs.readFileSync(FILE,'utf8')):undefined,
  seedFile:process.env.BILAL_DATA_DIR?path.join(DATA,'seed.js'):path.join(__dirname,'data','seed.js'),runtimeToken,
  persist(state){const tmp=FILE+'.tmp';fs.writeFileSync(tmp,JSON.stringify(state),{mode:0o600});fs.renameSync(tmp,FILE);},
  backup(state){fs.writeFileSync(path.join(DATA,'before-import-'+Date.now()+'.json'),JSON.stringify(state),{mode:0o600});},
  closeLocal(){server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),1500).unref();}
});
server=http.createServer(app.handler);
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`Port ${PORT} ist belegt. Alten Server mit Ctrl+C beenden.`:e.message);process.exit(1);});
server.listen(PORT,HOST,()=>{
  fs.writeFileSync(path.join(DATA,'runtime.json'),JSON.stringify({token:runtimeToken,port:PORT}),{mode:0o600});
  if(process.env.BILAL_OPEN==='1'){
    const url=`http://localhost:${PORT}`,platform=process.platform;
    const command=platform==='darwin'?'open':platform==='win32'?'cmd':'xdg-open';
    const args=platform==='win32'?['/c','start','',url]:[url];
    const child=require('child_process').spawn(command,args,{stdio:'ignore',detached:true});child.on('error',()=>{});child.unref();
  }
  console.log(`Bilal-Schule Verwaltung: http://localhost:${PORT}`);
  if(!app.getState().users.length)console.log('Beim ersten Öffnen eigenes Administratorkonto einrichten.');
  if(HOST==='0.0.0.0')for(const entries of Object.values(os.networkInterfaces()))for(const ip of entries||[])if(ip.family==='IPv4'&&!ip.internal)console.log(`WLAN: http://${ip.address}:${PORT}`);
});
