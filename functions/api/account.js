const json=(v,s=200)=>new Response(JSON.stringify(v),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
const digest=async s=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)));
const hash=async(pass,salt)=>hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:210000,hash:'SHA-256'},await crypto.subtle.importKey('raw',new TextEncoder().encode(pass),'PBKDF2',false,['deriveBits']),256));
const token=()=>crypto.randomUUID()+crypto.randomUUID();
const expire=()=>Date.now()+30*86400000;
async function user(db,req){const bearer=req.headers.get('authorization')||'';if(!bearer.startsWith('Bearer '))return null;const th=await digest(bearer.slice(7));return db.prepare('SELECT users.id,users.email,users.display_name,users.opt_in FROM sessions JOIN users ON sessions.user_id=users.id WHERE sessions.token_hash=? AND sessions.expires_at>?').bind(th,Date.now()).first()}
export async function onRequest({request,env}){if(!env.DB)return json({error:'Account database not connected. In Cloudflare Pages → Settings → Bindings, bind your D1 database as DB and redeploy.'},503);const db=env.DB;let data={};try{if(request.method==='POST')data=await request.json()}catch{return json({error:'Invalid request'},400)}const action=new URL(request.url).searchParams.get('action')||'';try{
if(action==='signup'&&request.method==='POST'){
const email=String(data.email||'').trim().toLowerCase(),pass=String(data.password||''),display=String(data.name||'').trim().slice(0,60);
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||pass.length<12||pass.length>200||!display)return json({error:'Enter a name, valid email and password of at least 12 characters'},400);
const salt=crypto.randomUUID(),id=crypto.randomUUID(),pw=await hash(pass,salt),raw=token();try{await db.prepare('INSERT INTO users(id,email,display_name,salt,password_hash,opt_in,created_at) VALUES(?,?,?,?,?,?,?)').bind(id,email,display,salt,pw,data.opt_in?1:0,Date.now()).run()}catch{return json({error:'Account already exists or signup unavailable'},409)}
await db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').bind(await digest(raw),id,expire()).run();return json({token:raw,user:{id,email,display_name:display,opt_in:data.opt_in?1:0}})}
if(action==='login'&&request.method==='POST'){
const email=String(data.email||'').trim().toLowerCase(),pass=String(data.password||'');const row=await db.prepare('SELECT * FROM users WHERE email=?').bind(email).first();const expected=await hash(pass,row?.salt||'dummy-salt');if(!row||expected!==row.password_hash)return json({error:'Email or password is incorrect'},401);const raw=token();await db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').bind(await digest(raw),row.id,expire()).run();return json({token:raw,user:{id:row.id,email:row.email,display_name:row.display_name,opt_in:row.opt_in}})}
const me=await user(db,request);if(!me)return json({error:'Please sign in again'},401);
if(action==='me')return json({user:me});
if(action==='logout'&&request.method==='POST'){await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await digest(request.headers.get('authorization').slice(7))).run();return json({ok:true})}
if(action==='preferences'&&request.method==='POST'){await db.prepare('UPDATE users SET opt_in=? WHERE id=?').bind(data.opt_in?1:0,me.id).run();return json({ok:true})}
if(action==='link'&&request.method==='GET'){
const row=await db.prepare('SELECT p.id,p.a_id,p.b_id,u.display_name AS partner_name FROM pairs p JOIN users u ON u.id=CASE WHEN p.a_id=? THEN p.b_id ELSE p.a_id END WHERE (p.a_id=? OR p.b_id=?) AND p.active=1').bind(me.id,me.id,me.id).first();return json({link:row||null})}
if(action==='invite'&&request.method==='POST'){
const existing=await db.prepare('SELECT id FROM pairs WHERE active=1 AND (a_id=? OR b_id=?)').bind(me.id,me.id).first();if(existing)return json({error:'Cut your existing link before inviting another partner'},409);
const code=String(Math.floor(100000+Math.random()*900000));await db.prepare('DELETE FROM invites WHERE user_id=?').bind(me.id).run();await db.prepare('INSERT INTO invites(code,user_id,expires_at) VALUES(?,?,?)').bind(code,me.id,Date.now()+15*60000).run();return json({code,expires_at:Date.now()+15*60000})}
if(action==='accept'&&request.method==='POST'){
const code=String(data.code||'').trim();if(!/^\d{6}$/.test(code))return json({error:'Enter the six-digit code'},400);
const attempts=await db.prepare('SELECT count(*) AS n FROM invite_attempts WHERE user_id=? AND at>?').bind(me.id,Date.now()-3600000).first();if(attempts.n>=8)return json({error:'Too many attempts. Try again later.'},429);await db.prepare('INSERT INTO invite_attempts(user_id,at) VALUES(?,?)').bind(me.id,Date.now()).run();
const invite=await db.prepare('SELECT * FROM invites WHERE code=? AND expires_at>?').bind(code,Date.now()).first();if(!invite||invite.user_id===me.id)return json({error:'Invalid or expired invitation'},400);
const paired=await db.prepare('SELECT id FROM pairs WHERE active=1 AND (a_id IN (?,?) OR b_id IN (?,?))').bind(me.id,invite.user_id,me.id,invite.user_id).first();if(paired)return json({error:'One account is already linked'},409);
await db.prepare('INSERT INTO pairs(id,a_id,b_id,active,created_at) VALUES(?,?,?,?,?)').bind(crypto.randomUUID(),invite.user_id,me.id,1,Date.now()).run();await db.prepare('DELETE FROM invites WHERE user_id=?').bind(invite.user_id).run();return json({ok:true})}
if(action==='cut'&&request.method==='POST'){await db.prepare('UPDATE pairs SET active=0,ended_at=? WHERE active=1 AND (a_id=? OR b_id=?)').bind(Date.now(),me.id,me.id).run();await db.prepare('DELETE FROM invites WHERE user_id=?').bind(me.id).run();return json({ok:true})}
if(action==='messages'&&request.method==='GET'){
const link=await db.prepare('SELECT id FROM pairs WHERE active=1 AND (a_id=? OR b_id=?)').bind(me.id,me.id).first();if(!link)return json({messages:[]});const rows=await db.prepare('SELECT id,sender_id,code,text,created_at FROM pages WHERE pair_id=? ORDER BY created_at DESC LIMIT 50').bind(link.id).all();return json({messages:rows.results||[]})}
if(action==='send'&&request.method==='POST'){
const code=String(data.code||'');const allowed={'143':'I love you ❤️','404':'Missing you 🥺','911':'Need a hug 🫂','831':'Thinking of you 💕','222':'Coffee date? ☕','520':'Love you always 💗','007':'Secret kiss delivery 😘','121':'Just you and me tonight 🌙','100':'Proud of you! 🌟','555':'You made my day 😊','101':'Good morning, sunshine ☀️','202':'Have you eaten? 🍜','303':'You got this! 💪','606':'Call me when free 📞','707':'Sending you strength 🌻','808':'Thank you for today 💛','909':'Sweet dreams 🌙','321':'Can we talk? 💬','112':'Thinking of our next date 🍿','888':'Lucky to have you 🍀','131':'You are my favourite person 🥰','414':'Home safe? 🏠','515':'Take a break, love ☕','616':'I appreciate you 💐','717':'Movie night? 🎬','818':'Let’s cook together 🍳','919':'Big virtual hug 🤗','232':'I owe you dessert 🍰','343':'Let’s go for a walk 🌿','454':'Sorry, can we reset? 🕊️'};
if(!allowed[code])return json({error:'Choose a preset message'},400);
const link=await db.prepare('SELECT id FROM pairs WHERE active=1 AND (a_id=? OR b_id=?)').bind(me.id,me.id).first();if(!link)return json({error:'Link with your partner first'},403);
const recent=await db.prepare('SELECT count(*) AS n FROM pages WHERE sender_id=? AND created_at>?').bind(me.id,Date.now()-60000).first();if(recent.n>=5)return json({error:'Too many pages. Try again in a minute'},429);
await db.prepare('INSERT INTO pages(id,pair_id,sender_id,code,text,created_at) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),link.id,me.id,code,allowed[code],Date.now()).run();return json({ok:true})}
return json({error:'Not found'},404)
}catch(e){return json({error:'Database request failed. Confirm schema.sql was executed in D1 and DB binding is active.'},500)} }
