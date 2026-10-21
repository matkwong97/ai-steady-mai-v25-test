/* AI Steady Mai SG — friend conversations. Chat history is stored locally on this device. */
const friendStages=['Before a relationship','Dating and getting to know each other','Committed relationship','Marriage and married life'];
const friendVoices=[
  'Thoughtful, observant, gently direct. Sometimes cheeky with a light Singaporean lah. Asks good questions, respects boundaries.',
  'Energetic, playful, upbeat and practical; light Singlish like aiyo or bestie occasionally. Suggests creative affordable plans.',
  'Warm, steady, emotionally perceptive. Encourages teamwork, listening and repair after disagreements, not scorekeeping.',
  'Grounded, calm, mature and organised. Talks practical household teamwork, family boundaries, finances and married life.'
];
let friendQuoteBank=null;
fetch('friend-quotes.json').then(r=>r.ok?r.json():null).then(x=>{if(x&&x.length===4){friendQuoteBank=x;const el=document.getElementById('friend-quote');if(el&&page.startsWith('friend')){const i=Number(page.slice(-1));el.textContent='“'+pickFriendQuote(i)+'”';}}}).catch(()=>{});
function pickFriendQuote(i){const bank=friendQuoteBank?.[i]||quotes[i];const last=load('quoteLast'+i,-1);let index=Math.floor(Math.random()*bank.length);if(index===last)index=(index+1)%bank.length;store('quoteLast'+i,index);return bank[index]}
function todayQuote(i){return `<p id="friend-quote" class="quote">“${esc(pickFriendQuote(i))}”</p>${friendOccasion(i)}`}
function friendOccasion(i){const now=new Date(),month=now.getMonth()+1,day=now.getDate(),d=load('milestones',{}),w=load('wedding',{});let occasion='';if(month===2&&day===14)occasion=`Happy Valentine's Day! Whether you're single, dating or married, kindness starts with how you treat yourself and each other. 💝`;
const candidates=[d['Officially together']?.date,d.anniversary,d.date,d.startDate,w.date,load('anniversary','')].filter(Boolean);
if(candidates.some(x=>{const m=String(x).match(/^(\d{4})-(\d{2})-(\d{2})/);return m&&Number(m[2])===month&&Number(m[3])===day}))occasion=`Happy anniversary! 🎉 Take a moment to celebrate what you've learned together, not just the highlight reel.`;
return occasion?`<div class="event-wish" role="note"><strong>${esc(name(i))} says:</strong> ${esc(occasion)}</div>`:''}
// Eight distinct invitations: four stages × male/female character presentation.
// Personalised display names still come from name(i), never hard-coded.
const friendInvitations={
 male:[
  {heading:"Got something on your mind? 💬",body:"Got a crush, feeling unsure, or just had a small win? Tell me what happened. We'll sort the signals from the guesses and work out a respectful next step.",button:"Let's talk"},
  {heading:"Eh, got story to share? 💬",body:"First-date butterflies, awkward texts, or something exciting? Spill lah. I'll help you think of a thoughtful move without making things more complicated.",button:"Tell me more"},
  {heading:"How are things between you two? 💬",body:"Whether you're celebrating a good week or working through a disagreement, you don't have to figure it out all at once. Let's find a way to talk and move forward together.",button:"Talk it through"},
  {heading:"Let's talk about married life 💬",body:"Big decisions, family matters, everyday teamwork—or a happy milestone? Tell me what's going on. We'll look at the practical options with care for both partners.",button:"Have a chat"}
 ],
 female:[
  {heading:"Hey, what's on your heart? 💬",body:"Someone caught your eye? Feeling nervous, hopeful, or a bit confused? You can tell me. We'll make sense of it together, at your own pace and with your boundaries intact.",button:"Chat with me"},
  {heading:"Girl, tell me everything! 💬",body:"Cute date story, mixed signals, or a plan that went sideways? I'm listening! We'll find a kind, confident next step that feels like you.",button:"Let's chat"},
  {heading:"Want to get something off your chest? 💬",body:"Relationships bring lovely moments and tricky conversations. Whether you need to celebrate or untangle a worry, let's work out what a healthy next step could look like.",button:"I'm listening"},
  {heading:"How's life as a team? 💬",body:"Marriage can be beautiful, messy, and everything in between. Share a joy or a concern—let's think through what supports both of you, without judgment or pressure.",button:"Talk to me"}
 ]
};
function friendChatInvitation(i){
 const gender=profile.gender==='female'?'female':'male';
 const invitation=friendInvitations[gender][i]||friendInvitations.male[0];
 return `<div class="card chat-invite"><h2>${esc(invitation.heading)}</h2><p>${esc(invitation.body)}</p><button onclick="go('chat${i}')">${esc(invitation.button)} — Text ${esc(name(i))} →</button><p class="small muted">Private on this device · Offline topic-based guidance, not generative AI. Please avoid sensitive identifying details.</p></div>`;
}
function chatKey(i){return 'chat_'+(profile.gender==='female'?'female':'male')+'_'+i}
function savedKey(i){return 'chat_saved_'+(profile.gender==='female'?'female':'male')+'_'+i}
function feedbackKey(i){return 'chat_feedback_'+(profile.gender==='female'?'female':'male')+'_'+i}
const CHAT_LIFETIME=24*60*60*1000;
function getChat(i){
 const raw=load(chatKey(i),[]);
 const rows=Array.isArray(raw)?raw:[];
 const valid=rows.filter(x=>x&&['user','assistant'].includes(x.role)&&typeof x.content==='string'&&Number.isFinite(x.at)&&Date.now()-x.at<CHAT_LIFETIME&&x.at<=Date.now()+60000).slice(-36);
 if(valid.length!==rows.length)store(chatKey(i),valid);
 return valid;
}
function putChat(i,items){store(chatKey(i),items.slice(-36))}
function getSaved(i){const x=load(savedKey(i),[]);return Array.isArray(x)?x.slice(-60):[]}
function messageActions(i,m){
 if(m.role!=='assistant')return '';
 const id=esc(m.id||'');
 const saved=getSaved(i).some(x=>x.id===m.id);
 const liked=Boolean(m.liked);
 const symbol=profile.gender==='female'?'♥':'👍';
 return `<div class="reply-actions"><button type="button" class="mini-action ${liked?'chosen':''}" onclick="reactFriend(${i},'${id}')" aria-label="${liked?'Remove reaction':'Appreciate this response'}" aria-pressed="${liked}">${symbol} ${liked?'Liked':'Like'}</button><button type="button" class="mini-action ${saved?'chosen':''}" onclick="saveFriend(${i},'${id}')" aria-pressed="${saved}">${saved?'✓ Saved':'☆ Save'}</button></div>`;
}
function messageMarkup(i,m){return `<div class="chat-entry ${m.role==='user'?'sent':'received'}"><div class="bubble ${m.role==='user'?'mine':'theirs'}">${esc(m.content)}</div>${messageActions(i,m)}</div>`}
function reactFriend(i,id){
 const items=getChat(i),m=items.find(x=>x.id===id&&x.role==='assistant');if(!m)return;
 m.liked=!m.liked;putChat(i,items);
 const fb=load(feedbackKey(i),{});if(m.topic){
   fb[m.topic]=Math.max(0,Math.min(100,(Number(fb[m.topic])||0)+(m.liked?1:-1)));
   store(feedbackKey(i),fb);
 }
 render();
}
function saveFriend(i,id){
 const items=getChat(i),m=items.find(x=>x.id===id&&x.role==='assistant');if(!m)return;
 let saved=getSaved(i);const exists=saved.some(x=>x.id===id);
 saved=exists?saved.filter(x=>x.id!==id):[...saved,{id:m.id,content:m.content,at:m.at,topic:m.topic}].slice(-60);
 store(savedKey(i),saved);render();
}
function deleteSavedFriend(i,id){
 store(savedKey(i),getSaved(i).filter(x=>x.id!==id));render();
}
function savedMessagesMarkup(i){
 const saved=getSaved(i);
 return `<details class="saved-replies"><summary>Saved advice (${saved.length})</summary>${saved.length?saved.map(m=>`<div class="saved-note"><p>${esc(m.content)}</p><button type="button" class="mini-action" onclick="deleteSavedFriend(${i},'${esc(m.id)}')">Remove saved message</button></div>`).join(''):'<p class="small muted">Tap ☆ Save under a reply to keep it beyond 24 hours.</p>'}</details>`;
}
function chatPage(i){if(!(i>=0&&i<=3))return '<p>Friend not found.</p>';
 const person=esc(name(i)),photo=`assets/${profile.gender==='female'?'women':'men'}-${i}.jpg`,messages=getChat(i);
 const starter=['Hey! Tell me what’s on your mind. No need to impress anyone here.','Aiyo, what happened? Good news or dating drama, I’m listening!','Hey you. How are things between you two? We can work through it together.','Hello! Married life has its ups and downs. What would you like to talk through?'][i];
 return `<div class="chat-head"><img src="${photo}" alt="${person}'s portrait"><div><strong>${person}</strong><div class="small muted">${esc(friendStages[i])} · Digital friend</div></div></div><div id="chat-log" class="chat-log" aria-live="polite">${messages.length?messages.map(m=>messageMarkup(i,m)).join(''):`<div class="chat-entry received"><div class="bubble theirs">${esc(starter)}</div></div>`}</div><form id="chat-form" class="chat-form" onsubmit="sendFriendMessage(event,${i})"><label for="chat-text" class="hidden">Message ${person}</label><textarea id="chat-text" maxlength="1500" rows="2" placeholder="Text ${person}..." required></textarea><button id="chat-send" type="submit">Send</button></form><p id="chat-status" class="chat-note" role="status" aria-live="polite">Messages disappear after 24 hours. Save helpful replies to keep them. Reactions adjust local topic preferences, not AI training. Offline guided advice may miss nuance.</p>${savedMessagesMarkup(i)}<details><summary>Conversation & privacy</summary><p class="small">Recent chat is automatically cleared 24 hours after each message. Saved advice stays on this device until removed. Feedback preferences also stay on this browser. Nothing from this chat is sent to an AI service. Avoid identifying details; this is not counselling or an emergency service.</p><button class="secondary" onclick="clearFriendChat(${i})">Clear this conversation</button></details><div class="card"><h3>Useful resources for this stage</h3>${links(i)}</div>`}
function clearFriendChat(i){if(!confirm('Clear this conversation from this device? Saved advice is kept.'))return;store(chatKey(i),[]);render()}

/* AI Steady Mai SG v22 — offline conversation engine.
 * Honest limitation: a curated pattern-and-response system, not a language model.
 * Prioritises specificity, follow-up context, stage voice, and safe guidance. */
const dialogueLibrary={
 safety:{
  patterns:[/\b(abus(?:e|ive)|violent|violence|hit me|slap(?:ped)? me|punch(?:ed)? me|threat(?:s|en|ened)?|stalk(?:ing|ed)?|coerc(?:e|ion)|unsafe|afraid for my safety|scared of (?:him|her|them)|forced sex|sexual assault|controlling me|locked me|hurt me|physically hurt|forced me)\b/i],
  acknowledge:["That sounds frightening, and you deserve to be safe.","I'm taking what you said seriously. No relationship should require you to live in fear.","This isn't something you need to minimise to keep the peace."],
  insights:["Threats, intimidation and coercion aren't normal relationship disagreements.","You do not owe someone a confrontation or a second chance when your safety is at risk."],
  actions:["If you're in immediate danger in Singapore, call 999; call 995 for an ambulance.","If safe, move somewhere secure and contact a trusted person. Avoid confronting someone who may retaliate.","Consider professional support through a Family Service Centre or a specialist family-violence service."],
  ask:["Are you somewhere safe right now?","Is there someone you trust who can support you today?"]},
 crisis:{
  patterns:[/\b(suicid(?:e|al)?|kill myself|end my life|self.harm|hurt myself|want to die|don't want to live)\b/i],
  acknowledge:["I'm concerned about your safety, and I'm glad you told me.","You deserve immediate human support with this.","I don't want you to face this on your own."],
  insights:["A relationship conversation can wait; your safety matters right now."],
  actions:["Tell someone you trust that you need them with you now.","If you might act on these thoughts or are in immediate danger in Singapore, call 995 or go to an emergency department.","Move away from anything you could use to hurt yourself while you seek help."],
  ask:["Are you safe right now?"]},
 goals:{
  patterns:[/\b(life goals?|different (?:goals|plans|future|values)|want different things|not compatible|compatib(?:le|ility)|our futures?|career plans?|ambitions?|moving overseas|settle down|want kids|don't want kids|children)\b/i],
  acknowledge:["That worry about your futures lining up is a real one.","It's thoughtful that you're considering compatibility, not just chemistry.","You don't need identical dreams, but you do need to understand each other's non-negotiables."],
  insights:["Different goals aren't automatically a deal-breaker. What matters is whether both people can respect the differences without one person giving up something essential.","It's kinder to discover a genuine mismatch early than to promise something you can't follow through on."],
  actions:["Pick two or three areas that matter most to you: location, career, marriage timing, finances or children.","When the time feels right, ask open questions like 'What would a good life look like to you in five years?'","Listen without treating the conversation as a test. Notice where you're aligned and where a compromise would be unfair."],
  ask:["Which life goal worries you most: where to live, career, marriage, or children?","Is this a difference you've discussed, or one you're imagining might exist?"]},
 conversation:{
  patterns:[/\b(what (?:do|should|can) i say|don't know what to say|dont know what to say|conversation|awkward|talk to (?:her|him|them)|when i meet|first meeting|run out of things|small talk|shy|speechless|icebreaker)\b/i],
  acknowledge:["You don't need a perfect line. You just need a genuine starting point.","A bit of awkwardness is normal — the goal isn't to perform, it's to connect.","The fact that you care about making conversation is already a good start."],
  insights:["Good conversation is usually curiosity plus listening, not a rehearsed speech.","You don't have to fill every silence; a thoughtful follow-up is better than ten random questions."],
  actions:["Start with something simple and situational: 'How has your week been?' or 'What made you choose this place?'","Follow their answer with one curious question, then share a little about yourself so it doesn't feel like an interview.","If you're both comfortable, ask about what they enjoy doing or something they're looking forward to."],
  ask:["Is this your first time meeting, or do you already know each other?","What is one thing you genuinely want to know about her or him?"]},
 rejection:{
  patterns:[/\b(reject(?:ed|ion)?|friend.?zone|not interested|doesn't like me|doesnt like me|left on read|ghost(?:ed|ing)?|no reply|not replying|seen my message)\b/i],
  acknowledge:["Ouch, that can sting, especially when you were hopeful.","It's understandable to feel disappointed when the effort doesn't feel mutual.","Rejection can hurt without saying anything about your worth."],
  insights:["Interest can't be negotiated. Respecting someone's answer also protects your own dignity."],
  actions:["If things are unclear, one friendly check-in is enough; don't keep sending messages for a response.","Take their response, or lack of one, as information rather than a challenge to win.","Spend time with people and activities that help you feel like yourself again."],
  ask:["Did they tell you directly, or have they simply stopped replying?"]},
 firstdate:{
  patterns:[/\b(first date|date ideas?|ask (?:her|him|them) out|asking (?:her|him|them) out|dating app|meet up|meeting (?:her|him|them)|going on a date|nervous about (?:a |the )?date)\b/i],
  acknowledge:["First-date nerves are very normal, lah.","You don't have to impress them with a grand production.","A good date is about whether you both feel comfortable being yourselves."],
  insights:["An easy setting with room to talk is often better than an elaborate plan.","Mutual interest matters more than getting every detail right."],
  actions:["Choose a public, comfortable place and suggest a clear time and plan.","Prepare two or three open questions about interests, recent experiences or favourite places.","Afterwards, if you enjoyed yourself, say so clearly and invite another date without pressure."],
  ask:["Do you already have a date planned, or are you still thinking of asking them out?"]},
 arguments:{
  patterns:[/\b(argu(?:e|ed|ing|ment)|fight(?:ing)?|disagree(?:ment)?|quarrel|shout(?:ing)?|angry|silent treatment|misunderstand(?:ing)?|conflict|not listening|keep fighting)\b/i],
  acknowledge:["That sounds draining, especially when you care about each other.","I hear that this disagreement has been weighing on you.","Being on the same team doesn't mean agreeing on everything."],
  insights:["The aim isn't to win the argument; it's to understand the concern underneath it.","A repair attempt matters more than finding the perfect words."],
  actions:["Wait until both of you are calm enough to listen.","Describe one specific incident using 'I felt...' instead of 'You always...'","Ask what your partner experienced, then agree on one change each and revisit it later."],
  ask:["Is this about one recent incident, or a pattern that keeps coming back?"]},
 trust:{
  patterns:[/\b(cheat(?:ed|ing)?|affair|unfaithful|betray(?:ed|al)?|lied|lying|dishonest|secret(?:s)?|trust issues?|suspicious|flirt(?:ing)? with someone else)\b/i],
  acknowledge:["Trust worries can make even ordinary moments feel heavy.","That uncertainty sounds painful.","You deserve honesty, and you also deserve to base decisions on facts."],
  insights:["Trust is rebuilt through consistent behaviour, not a single promise.","You can set boundaries without monitoring or controlling another person."],
  actions:["Separate what you know from what you suspect.","Explain the specific behaviour that damaged trust and what transparency would mean to you.","Pay attention to consistent change, and remember you can choose to leave if trust can't be rebuilt."],
  ask:["Has something specific happened, or is this mainly a fear from past experiences?"]},
 boundaries:{
  patterns:[/\b(jealous(?:y)?|possessive|check(?:ing)? my phone|privacy|boundar(?:y|ies)|manipulat(?:e|ion|ive)|gaslight|isolate me|respect my|controlling|pressure me)\b/i],
  acknowledge:["It's reasonable to want both closeness and personal space.","You shouldn't have to trade your independence for affection.","That sounds uncomfortable, and your boundaries matter."],
  insights:["A healthy boundary explains what you will or won't accept; it isn't a way to control the other person."],
  actions:["Name the behaviour and why it troubles you.","State a specific boundary calmly: 'I'm not comfortable sharing my private messages.'","Notice whether your boundary is respected. If there's intimidation or fear, prioritise safety and outside support."],
  ask:["What boundary feels hardest to communicate right now?"]},
 money:{
  patterns:[/\b(money|financ(?:e|es|ial)|salary|debt|budget|sav(?:e|ing|ings)|cpf|bto|hdb|house|housing|expensive|afford|spend(?:ing)?|mortgage|bills|joint account)\b/i],
  acknowledge:["Money conversations can feel personal, even when you're both trying to be responsible.","This is exactly the sort of practical topic worth discussing early.","Different spending habits don't have to turn into a fight."],
  insights:["Fair doesn't always mean splitting every cost 50–50; it means an arrangement both people freely understand and accept."],
  actions:["Write down income, essential expenses, debts and the goal you're planning for.","Discuss what each person considers fair, including non-financial contributions.","Agree on a realistic amount and schedule a short monthly review. Verify CPF or HDB rules on official websites."],
  ask:["Is the main disagreement about spending, saving, housing or how to split costs?"]},
 family:{
  patterns:[/\b(in.law|mother.in.law|father.in.law|parents?|mother|father|family|relatives?|siblings?|traditions?|culture|religion|filial)\b/i],
  acknowledge:["Family expectations can be tricky because there are feelings on several sides.","It makes sense that you want to respect family without losing your own voice.","This is a situation where a united approach can help."],
  insights:["Respecting parents doesn't require agreeing to every request.","It's easier to set a boundary when partners discuss it privately first."],
  actions:["Talk with your partner about what each of you needs before speaking to relatives.","Choose one clear boundary or request you can communicate together.","Be courteous but consistent, and give people time to adjust."],
  ask:["Are you and your partner aligned, or is that part of the difficulty?"]},
 time:{
  patterns:[/\b(long.distance|ldr|busy|no time|neglect(?:ed)?|lonely|apart|miss (?:him|her|them)|work hours|quality time|not enough time|always working)\b/i],
  acknowledge:["Missing someone can be hard even when nobody is doing anything wrong.","It sounds like you're craving more connection, not just more messages.","Busy schedules can quietly crowd out quality time."],
  insights:["A small reliable ritual is often more reassuring than occasional grand gestures."],
  actions:["Tell them specifically what you miss, without making it a character judgment.","Try a realistic shared ritual, such as a ten-minute call or a weekly date.","Check in after two weeks about whether both of you feel connected."],
  ask:["Would more frequent contact or more meaningful time together help most?"]},
 affection:{
  patterns:[/\b(intima(?:cy|te)|sex|physical affection|affection|love language|touch|consent|romance|not romantic|spark|chemistry)\b/i],
  acknowledge:["Closeness can mean different things to different people.","It's okay to want affection and also respect different comfort levels.","This is worth discussing gently rather than guessing."],
  insights:["Neither partner owes physical intimacy. Consent and comfort matter every time."],
  actions:["Share what helps you feel loved and ask the same of your partner.","Discuss boundaries without pressure or blame.","Choose one pressure-free way to connect this week, such as a walk or an intentional date."],
  ask:["Are you missing emotional closeness, physical affection, or both?"]},
 marriage:{
  patterns:[/\b(marr(?:y|ied|iage)|wedding|rom\b|proposal|engag(?:ed|ement)|husband|wife|spouse|newlywed|married life|divorce|separat(?:e|ion))\b/i],
  acknowledge:["That's a meaningful part of building a shared life.","Big commitments bring both excitement and real decisions.","You don't have to have everything figured out in one conversation."],
  insights:["A strong marriage is built through repeated teamwork, not a perfect wedding day."],
  actions:["Discuss your expectations about money, chores, family time and personal space.","Identify one area where you agree and one that needs a longer conversation.","Consider a marriage preparation or enrichment programme if you both find that helpful."],
  ask:["Is the bigger concern preparing for marriage, or navigating day-to-day married life?"]},
 children:{
  patterns:[/\b(children|child|kids|baby|babies|pregnan(?:t|cy)|fertility|parenthood|having a family|don't want kids|want kids)\b/i],
  acknowledge:["That's a big life decision, and it's okay to have complicated feelings about it.","It's important that both partners can speak honestly about this.","Neither person should feel pressured into parenthood."],
  insights:["Wanting different things about children may be a genuine incompatibility, not a problem one partner must 'fix'."],
  actions:["Share what you each want and why, without trying to persuade immediately.","Discuss timing, support, finances, caregiving and what each of you is uncertain about.","Give yourselves time to reflect, and seek qualified guidance for medical questions."],
  ask:["Are you two disagreeing about whether to have children, or about when?"]},
 joy:{
  patterns:[/\b(happy|great news|wonderful|anniversary|excited|good news|said yes|celebrat(?:e|ing|ion)|grateful|thankful|fantastic|she said yes|he said yes|we got engaged)\b/i],
  acknowledge:["Wah, that's lovely news! I'm smiling for you.","Aww, that's a moment worth remembering.","I love hearing the good moments too — not just the worries."],
  insights:["Noticing the good things helps a relationship feel appreciated, not taken for granted."],
  actions:["Tell them one specific thing you're grateful for.","Celebrate in a way that suits both your personalities and budget.","Keep a small memory of today — a photo, note or shared tradition."],
  ask:["What's the part of this moment that made you happiest?"]},
 nerves:{
  patterns:[/\b(nervous|anxious|anxiety|overthink(?:ing)?|worried|worry|insecure|afraid|scared|uncertain|unsure|mixed signals|confus(?:ed|ing))\b/i],
  acknowledge:["I can hear how much this matters to you.","When you care about someone, it's easy for your mind to race ahead.","You're allowed to feel uncertain without needing to solve everything tonight."],
  insights:["Feelings are real, but they aren't always reliable predictions about what someone else thinks."],
  actions:["Separate the facts from the assumptions you're making.","Pick one question you genuinely need answered.","Take a small, respectful step toward clarity rather than replaying every possibility."],
  ask:["What part is a fact you've observed, and what part is your fear about what might happen?"]}
};
const friendStyles=[
 {open:["Okay, let's unpack that a bit.","Hmm, I can see why that's on your mind.","Thanks for telling me. Let's think it through.","You don't need to have all the answers yet."],
  insight:["Here's what I'd keep in mind:","One thing worth remembering:","My read on this:"],
  action:["Here's what I'd try, step by step:","A gentle way forward:","You could start here:"],
  end:["No rush to answer, but I'm curious:","Can I ask you something?"]},
 {open:["Aiyo, come, tell me more.","Okay, bestie, I've got you.","Wah, that is a lot to think about.","Let's make this less stressful, can?"],
  insight:["Real talk, though:","Here's the thing, lah:","One thing I'd remember:"],
  action:["Let's keep it practical:","Here's your game plan:","Try this instead of stressing:"],
  end:["So tell me:","I'm curious:"]},
 {open:["Hey, thanks for being open with me.","I hear you. That sounds important.","Let's take this one piece at a time.","I can see why this is weighing on you."],
  insight:["What matters here is this:","Something I'd gently point out:","It's worth remembering:"],
  action:["A way to approach it together:","Here's a constructive starting point:","A few steps you could take:"],
  end:["I'd love to understand:","Can I ask:"]},
 {open:["Let's look at this carefully.","That's an important conversation to have.","I appreciate you bringing up something that matters.","Let's separate the emotions from the decisions without dismissing either."],
  insight:["The bigger picture:","A principle I'd keep in mind:","One practical observation:"],
  action:["I'd suggest this approach:","Here's a manageable plan:","Start with these practical steps:"],
  end:["To make the next step more useful:","One question for you:"]}
];
function dialogueHash(s){let h=2166136261;for(let j=0;j<s.length;j++){h^=s.charCodeAt(j);h=Math.imul(h,16777619)}return h>>>0}
function dialoguePick(a,n){return a[n%a.length]}
function detectDialogue(message){
 const matches=Object.entries(dialogueLibrary).filter(([k,v])=>v.patterns.some(p=>p.test(message)));
 const priority=['crisis','safety','goals','conversation','children','rejection','trust','boundaries','arguments','money','family','time','affection','firstdate','marriage','joy','nerves'];
 matches.sort((a,b)=>priority.indexOf(a[0])-priority.indexOf(b[0]));
 return matches.map(x=>x[0]);
}
function offlineReply(i,message,history){
 const current=detectDialogue(message);
 const prev=history.slice(0,-1).filter(m=>m.role==='user').slice(-2).flatMap(m=>detectDialogue(m.content));
 const count=history.filter(m=>m.role==='user').length;
 const prefs=load(feedbackKey(i),{});
 const preference=Number(prefs[current[0]||''])||0;
 const seed=dialogueHash(message+'|'+i+'|'+count+'|'+preference);
 const style=friendStyles[i];
 // Follow-ups like "yes", "what do I say?", "tell me more" may rely on earlier context.
 let keys=current.slice(0,3);
 if(!keys.length&&prev.length)keys=[prev[0]];
 if(!keys.length)keys=['nerves'];
 const primary=keys[0],d=dialogueLibrary[primary];
 const urgent=['crisis','safety'].includes(primary);
 const secondary=keys.find(k=>k!==primary&&!['crisis','safety'].includes(k));
 const first=dialoguePick(d.acknowledge,seed);
 const insight=dialoguePick(d.insights,seed>>>5);
 const steps=d.actions;
 const ask=dialoguePick(d.ask,seed>>>9);
 if(urgent)return `${first}\n\n${insight}\n\n${steps.map((x,n)=>`${n+1}. ${x}`).join('\n')}\n\n${ask}`;
 const opening=dialoguePick(style.open,seed>>>2);
 const insightPrefix=dialoguePick(style.insight,seed>>>7);
 const actionPrefix=dialoguePick(style.action,seed>>>11);
 let bridge='';
 if(secondary==='goals')bridge="And about your different life goals: you don't need to settle that on the first meeting. Get to know each other, then talk openly about what matters when you're both comfortable.";
 else if(secondary==='conversation')bridge="For the conversation itself, keep it natural: ask a genuine question, listen to the answer, and share a little about yourself.";
 else if(secondary==='nerves')bridge="Also, feeling nervous doesn't mean you're doing anything wrong. You can slow things down.";
 else if(secondary&&dialogueLibrary[secondary])bridge=dialoguePick(dialogueLibrary[secondary].insights,seed>>>13);
 const stepsCount=(count%3===0)?2:3;
 const chosen=stepsCount===2?[steps[0],steps[1]]:steps;
 const format=(count%2===0)?chosen.map((x,n)=>`${n+1}) ${x}`).join('\n'):chosen.map(x=>`• ${x}`).join('\n');
 const closer=dialoguePick(style.end,seed>>>16);
 return `${opening} ${first}\n\n${insightPrefix} ${insight}${bridge?'\n'+bridge:''}\n\n${actionPrefix}\n${format}\n\n${closer} ${ask}`;
}
let chatSending=false;
async function sendFriendMessage(event,i){
 event.preventDefault();if(chatSending)return;
 const input=document.getElementById('chat-text'),message=input.value.trim();if(!message)return;
 chatSending=true;
 const log=document.getElementById('chat-log'),button=document.getElementById('chat-send'),status=document.getElementById('chat-status');
 button.disabled=true;input.value='';
 const now=Date.now();
 let items=getChat(i);
 const userItem={role:'user',content:message,at:now,id:'u'+now};
 items.push(userItem);putChat(i,items);
 const mine=document.createElement('div');mine.className='chat-entry sent';
 const mineBubble=document.createElement('div');mineBubble.className='bubble mine';mineBubble.textContent=message;mine.append(mineBubble);log.append(mine);
 const waiting=document.createElement('div');waiting.className='chat-entry received';
 const waitingBubble=document.createElement('div');waitingBubble.className='bubble theirs';waitingBubble.textContent='Let me think about that…';waiting.append(waitingBubble);log.append(waiting);
 log.scrollTop=log.scrollHeight;
 try{
  await new Promise(resolve=>setTimeout(resolve,250));
  const reply=offlineReply(i,message,items);
  const topic=detectDialogue(message)[0]||'general';
  const answer={role:'assistant',content:reply,at:Date.now(),id:'a'+Date.now()+'-'+Math.floor(Math.random()*1e6),topic,liked:false};
  items.push(answer);putChat(i,items);
  waiting.outerHTML=messageMarkup(i,answer);
  status.textContent='Chat clears after 24 hours. Save advice you want to keep; likes tune local topic preferences.';
 }catch(e){waitingBubble.textContent='Sorry, something went wrong. Please try again.'}
 finally{chatSending=false;button.disabled=false;log.scrollTop=log.scrollHeight;input.focus()}
}
