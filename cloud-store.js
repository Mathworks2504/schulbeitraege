'use strict';
const crypto=require('crypto');
function initialAdmin(state,env){
  if(state.users.length)return;
  const username=String(env.BILAL_ADMIN_USERNAME||'').trim().toLowerCase(),password=env.BILAL_ADMIN_PASSWORD;
  if(!/^[a-z0-9_.@-]{3,80}$/.test(username)||typeof password!=='string'||password.length<12||password.length>256){
    const e=new Error('BILAL_ADMIN_USERNAME und BILAL_ADMIN_PASSWORD fehlen oder sind ungültig. Passwort: mindestens 12 Zeichen.');e.setup=true;throw e;
  }
  const salt=crypto.randomBytes(16).toString('hex');
  state.users.push({id:crypto.randomUUID(),username,name:'Administrator',role:'admin',active:true,studentIds:[],classIds:[],salt,hash:crypto.scryptSync(password,salt,64).toString('hex')});
  state.revision++;
}
async function transaction(work,{env=process.env,Client,makeState}={}){
  const connectionString=env.DATABASE_URL||env.POSTGRES_URL;
  if(!connectionString){const e=new Error('DATABASE_URL fehlt. Bitte PostgreSQL mit dem Vercel-Projekt verbinden.');e.setup=true;throw e;}
  Client=Client||require('pg').Client;
  const client=new Client({connectionString,connectionTimeoutMillis:10000,statement_timeout:20000,query_timeout:25000});
  try{
    await client.connect();await client.query('BEGIN');
    // Serialize schema creation and read/modify/write across Vercel instances.
    await client.query('SELECT pg_advisory_xact_lock(1982026, 39001)');
    await client.query('CREATE TABLE IF NOT EXISTS bilal_app_state (id text PRIMARY KEY, payload jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now())');
    await client.query('CREATE TABLE IF NOT EXISTS bilal_app_backups (id bigserial PRIMARY KEY, app_id text NOT NULL, payload jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now())');
    const id=env.BILAL_APP_ID||'bilal-schule-verwaltung';
    const result=await client.query('SELECT payload FROM bilal_app_state WHERE id=$1 FOR UPDATE',[id]);
    const state=result.rows[0]?.payload||makeState();initialAdmin(state,env);
    const backup=async value=>{
      await client.query('INSERT INTO bilal_app_backups (app_id,payload) VALUES ($1,$2::jsonb)',[id,JSON.stringify(value)]);
      await client.query('DELETE FROM bilal_app_backups WHERE app_id=$1 AND id NOT IN (SELECT id FROM bilal_app_backups WHERE app_id=$1 ORDER BY id DESC LIMIT 30)',[id]);
    };
    const next=await work(state,backup);
    await client.query('INSERT INTO bilal_app_state (id,payload) VALUES ($1,$2::jsonb) ON CONFLICT (id) DO UPDATE SET payload=EXCLUDED.payload, updated_at=now()',[id,JSON.stringify(next)]);
    await client.query('COMMIT');
  }catch(e){try{await client.query('ROLLBACK');}catch(_){}throw e;}
  finally{try{await client.end();}catch(_){}}
}
module.exports={transaction,initialAdmin};
