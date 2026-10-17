'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {Readable}=require('node:stream');
const {makeHandler}=require('../api/index'),{transaction}=require('../cloud-store');
const envBase={VERCEL:'1',VERCEL_URL:'bilal-test.vercel.app',BILAL_ADMIN_USERNAME:'test-admin',BILAL_ADMIN_PASSWORD:crypto.randomBytes(24).toString('hex')};
async function invoke(handler,url,{method='GET',data,cookie,origin='https://bilal-test.vercel.app'}={}){
  const req=Readable.from([]);req.url=url;req.method=method;req.body=data;
  req.headers={host:envBase.VERCEL_URL,origin,'x-bilal-request':'1','x-vercel-forwarded-for':'127.0.0.1'};
  req.socket={remoteAddress:'127.0.0.1'};if(cookie)req.headers.cookie=cookie;
  const result={status:200,headers:{},body:''};
  const res={setHeader(k,v){result.headers[k.toLowerCase()]=v;},writeHead(status,headers){result.status=status;for(const [k,v]of Object.entries(headers||{}))this.setHeader(k,v);},end(value){result.body=value?.toString()||'';}};
  await handler(req,res);result.json=()=>JSON.parse(result.body);return result;
}
test('missing database gives a useful setup page and never returns success',async()=>{
  const res=await invoke(makeHandler({env:{...envBase}}),'/');
  assert.equal(res.status,503);assert.match(res.body,/DATABASE_URL/);assert.doesNotMatch(res.body,/FUNCTION_INVOCATION_FAILED/);
});
test('PostgreSQL persists accounts, sessions, school data and access limits across fresh invocations',{skip:!process.env.TEST_DATABASE_URL},async()=>{
  const env={...envBase,DATABASE_URL:process.env.TEST_DATABASE_URL,BILAL_APP_ID:'qa-'+crypto.randomUUID()};
  const call=(url,options)=>invoke(makeHandler({env}),url,options);
  let cookie;
  try{
    const landing=await call('/');assert.equal(landing.status,200);assert.match(landing.body,/admin-app\.js/);
    for(const asset of ['/admin-app.js','/admin-app.css','/domain.js','/planning-core.js','/vendor/xlsx.full.min.js'])assert.equal((await call(asset)).status,200,asset+' is required for the login screen');
    assert.equal((await call('/api/admin')).status,401);
    assert.equal((await call('/api/setup',{method:'POST',data:{}})).status,403);
    assert.equal((await call('/api/local-stop',{method:'POST',data:{}})).status,404);
    const login=await call('/api/login',{method:'POST',data:{username:env.BILAL_ADMIN_USERNAME,password:env.BILAL_ADMIN_PASSWORD}});
    assert.equal(login.status,200);assert.match(login.headers['set-cookie'],/Secure/);
    cookie=login.headers['set-cookie'].split(';')[0];
    let data=(await call('/api/legacy',{cookie})).json();
    data.members=[{id:1,firstName:'Testkind',lastName:'A',group:'Klasse A',guardians:[{name:'Kontakt',phone:'123'}],payments:{September:'Bezahlt'}}];
    data.db.classes=[{id:1,name:'Klasse A'}];
    assert.equal((await call('/api/legacy',{method:'PUT',cookie,data})).status,200);
    const saved=(await call('/api/legacy',{cookie})).json();
    assert.equal(saved.members[0].payments.September,'Bezahlt');
    const pair=await Promise.all([call('/api/legacy',{method:'PUT',cookie,data:{...saved,brand:{name:'Stand A'}}}),call('/api/legacy',{method:'PUT',cookie,data:{...saved,brand:{name:'Stand B'}}})]);
    assert.deepEqual(pair.map(r=>r.status).sort(),[200,409]);
    const parentPassword=crypto.randomBytes(24).toString('hex');
    assert.equal((await call('/api/users',{method:'POST',cookie,data:{username:'test-parent',password:parentPassword,role:'eltern',studentIds:['1'],classIds:[]}})).status,200);
    const parent=await call('/api/login',{method:'POST',data:{username:'test-parent',password:parentPassword}});
    const parentCookie=parent.headers['set-cookie'].split(';')[0];
    assert.equal((await call('/api/legacy',{cookie:parentCookie})).status,403);
    assert.equal((await call('/api/admin',{cookie:parentCookie})).status,403);
    assert.equal((await call('/api/portal',{cookie:parentCookie})).json().members.length,1);
    assert.equal((await call('/api/legacy',{method:'PUT',cookie,data:saved,origin:'https://other.example'})).status,403);
    const beforeFailure=(await call('/api/legacy',{cookie})).json();
    const failing=makeHandler({env,runTransaction:(work,options)=>transaction(async(state,backup)=>{await work(state,backup);throw Error('test rollback');},options)});
    const failed=await invoke(failing,'/api/legacy',{method:'PUT',cookie,data:{...beforeFailure,brand:{name:'Never commit'}}});
    assert.equal(failed.status,500);assert.deepEqual((await call('/api/legacy',{cookie})).json(),beforeFailure);
    const second=await call('/api/login',{method:'POST',data:{username:env.BILAL_ADMIN_USERNAME,password:env.BILAL_ADMIN_PASSWORD}});
    const secondCookie=second.headers['set-cookie'].split(';')[0],newPassword=crypto.randomBytes(24).toString('hex');
    assert.equal((await call('/api/password',{method:'POST',cookie,data:{currentPassword:env.BILAL_ADMIN_PASSWORD,newPassword}})).status,200);
    assert.equal((await call('/api/admin',{cookie:secondCookie})).status,401);
    assert.equal((await call('/api/login',{method:'POST',data:{username:env.BILAL_ADMIN_USERNAME,password:env.BILAL_ADMIN_PASSWORD}})).status,401);
    assert.equal((await call('/api/login',{method:'POST',data:{username:env.BILAL_ADMIN_USERNAME,password:newPassword}})).status,200);
  }finally{
    const {Client}=require('pg'),client=new Client({connectionString:env.DATABASE_URL});await client.connect();
    try{await client.query('DELETE FROM bilal_app_backups WHERE app_id=$1',[env.BILAL_APP_ID]);await client.query('DELETE FROM bilal_app_state WHERE id=$1',[env.BILAL_APP_ID]);}finally{await client.end();}
  }
});
