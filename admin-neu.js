'use strict';
// Local recovery only: this file is never exposed as a web endpoint.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),vm=require('vm'),storage=require('./storage');
async function main(){
  const dir=storage.prepare(__dirname);
  await storage.stopRunning();
  const file=path.join(dir,'database.json'),exists=fs.existsSync(file);
  let db;
  if(exists){
    db=JSON.parse(fs.readFileSync(file,'utf8'));
    if(!Array.isArray(db.users)||!Array.isArray(db.members)||!db.db)throw Error('Datenbankformat unbekannt. Es wurde nichts geändert.');
  }else{
    const seedFile=process.env.BILAL_DATA_DIR?path.join(dir,'seed.js'):path.join(__dirname,'data','seed.js');
    if(!fs.existsSync(seedFile))throw Error('Kein Datenstand gefunden. Bitte zuerst die App starten oder eine vollständige Sicherung wiederherstellen.');
    const ctx={window:{}};vm.runInNewContext(fs.readFileSync(seedFile,'utf8'),ctx,{timeout:5000});
    const seed=JSON.parse(JSON.stringify(ctx.window.BILAL_EXCEL_SOURCE));
    if(!Array.isArray(seed.members)||!Array.isArray(seed.classes))throw Error('Excel-Ausgangsdaten unvollständig. Es wurde nichts geändert.');
    const permissions=['students.read','students.write','classes.read','grades.read','grades.write','tasks.read','tasks.write','messages.read','messages.write','fees.read'];
    const limited=['students.read','classes.read','grades.read','tasks.read','messages.read'];
    const arrays=['attendance','grades','invoices','reminders','whatsappGroups','events','tasks','projects','notes','templates','library'];
    db={version:39,revision:0,users:[],roles:{admin:permissions,verwaltung:permissions,lehrkraft:permissions.filter(p=>!['students.write','fees.read'].includes(p)),eltern:[...limited,'fees.read'],schueler:limited},members:seed.members,db:{...Object.fromEntries(arrays.map(k=>[k,[]])),classes:seed.classes,teachers:seed.teachers||[],rooms:seed.rooms||[],interns:seed.interns||[]},brand:{},records:[]};
  }
  const username='admin-'+crypto.randomBytes(5).toString('hex');
  const password=crypto.randomBytes(18).toString('base64url');
  const salt=crypto.randomBytes(16).toString('hex');
  const hash=crypto.scryptSync(password,salt,64).toString('hex');
  const stamp=Date.now()+'-'+crypto.randomBytes(4).toString('hex');
  if(exists)fs.copyFileSync(file,path.join(dir,'before-new-admin-'+stamp+'.json'),fs.constants.COPYFILE_EXCL);
  db.users.push({id:crypto.randomUUID(),username,name:'Administrator',role:'admin',active:true,studentIds:[],classIds:[],salt,hash});
  db.revision=(Number(db.revision)||0)+1;
  const tmp=file+'.admin-'+stamp;
  try{fs.writeFileSync(tmp,JSON.stringify(db),{mode:0o600,flag:'wx'});fs.renameSync(tmp,file);}finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}
  console.log('\nNEUER ADMINISTRATORZUGANG\n');
  console.log('Benutzername: '+username);
  console.log('Passwort:     '+password);
  console.log('\nDiese Zugangsdaten jetzt sicher notieren. Sie werden nur hier angezeigt.');
  console.log('Rechte: vollständiger Administratorzugang zu allen Verwaltungsbereichen.');
  console.log(exists?'Vorheriger Datenstand gesichert. Bestehende Konten und Schuldaten bleiben erhalten.':'Neue Installation mit den mitgelieferten Excel-Ausgangsdaten eingerichtet. Frühere Änderungen sind nur aus deinem bisherigen Datenstand oder einer Sicherung wiederherstellbar.');
  console.log('Nach der Anmeldung kannst du das Passwort unter Mein Konto / Passwort ändern.\n');
}
if(require.main===module)main().catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={main};
