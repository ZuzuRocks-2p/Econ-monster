

const TAUNTS=["Plaid up all you like. I eat tartan.","Your opportunity cost of studying was sleep, mortal.","I shift curves for fun. You shift nothing.","Divide by the starting value. Everyone does.","The library is mine. The cafeteria is next.","I have no close substitutes. You have no chance.","Your demand for mercy is perfectly inelastic.","Every wrong answer heals me. Keep going."];
const MOCK=["“%s”? Bold. Wrong, but bold.","You chose “%s.” I wrote that distractor myself.","“%s” is what the freshmen pick.","Ah, “%s.” Delicious.","“%s.” Did you even read page %p?","I fed on “%s” and grew stronger."];
const SULK=["Lucky guess.","Fine. FINE.","That one wasn’t even on the test.","Who taught you that?","Ow. Rude.","I felt that in my index."];
const SLOW=["Too slow. The bell rang.","Time is an opportunity cost, child.","I aged a chapter waiting."];
const RANKS=[[0,"Wee Scot"],[150,"Price Taker"],[400,"Price Maker"],[900,"Invisible Hand"],[1800,"Royal Scot"],[3500,"Tome Slayer"]];
const SESSIONS={1:"Fundamentals",2:"Demand & Supply",3:"Equilibrium & Surplus",4:"Elasticity",5:"Gov’t Policy",6:"Market Structures",7:"Market Failures",8:"GDP, Prices & Growth",9:"Gains from Trade",10:"Money & Fluctuations",11:"Transportation"};
// Chapter bosses: one per session, with a palette swap and a signature move the scene renders.
const CHAPTERS={
 1:{name:"The Hoarder",move:"grow",pal:{P:"#8a5a2a",p:"#6a3f1a",d:"#3a200a"},loc:""},
 2:{name:"The Shifter",move:"slide",pal:{P:"#2f6fb5",p:"#1f4f85",d:"#0f2a50"},loc:""},
 3:{name:"Disequilibrium",move:"flicker",pal:{P:"#5a5a6a",p:"#3f3f4f",d:"#22222f"},loc:""},
 4:{name:"Midpoint",move:"crack",pal:{P:"#b04a9a",p:"#80306c",d:"#48163c"},loc:""},
 5:{name:"The Wedge",move:"split",pal:{P:"#c0392b",p:"#8a2418",d:"#4a100a"},loc:""},
 6:{name:"The Monopolist",move:"spin",pal:{P:"#d4a017",p:"#9a7210",d:"#5a4208"},loc:""},
 7:{name:"The Externality",move:"fog",pal:{P:"#2e8b57",p:"#1f5f3c",d:"#0f3320"},loc:""},
 8:{name:"The Deflator",move:"shrink",pal:{P:"#4b2a7a",p:"#2d1650",d:"#1a0f2e"},loc:""}
};
Object.keys(CHAPTERS).forEach(s=>{CHAPTERS[s].loc=(CAMPUS.spots[s]||{}).label||"Campus"});
const LOOT=[
 {k:"title",v:"Vanquisher of Deadweight Loss"},{k:"title",v:"Midpoint Enjoyer"},{k:"title",v:"Certified Price Taker"},{k:"title",v:"Curve Shifter"},{k:"title",v:"Surplus Hunter"},{k:"title",v:"Tax Wedge Survivor"},
 {k:"hat",v:"crown"},{k:"hat",v:"wizard"},{k:"hat",v:"cap"},{k:"hat",v:"halo"},
 {k:"item",v:"skip"},{k:"item",v:"skip"},{k:"item",v:"second"},{k:"item",v:"second"}
];
const HATS={crown:"👑",wizard:"🧠",cap:"🧢",halo:"😇"};
const ITEMS={skip:{n:"Skip",d:"Skip one question, no damage either way"},second:{n:"Second Chance",d:"Restore a heart once per fight"}};
const TAUGHT=8;let TOME_MAX=200;const WEEK_MAX=5000;

// ---------- STATE ----------
function load(k,d){try{const v=localStorage.getItem("econ."+k);return v==null?d:JSON.parse(v)}catch(e){return d}}
function save(k,v){try{localStorage.setItem("econ."+k,JSON.stringify(v))}catch(e){}}
let S={streak:load("streak",0),lastDay:load("lastDay",null),best:load("best",{}),missed:load("missed",{}),totalDmg:load("totalDmg",0),team:load("team",""),name:load("name",""),
  wins:load("wins",{}),titles:load("titles",[]),hats:load("hats",[]),hat:load("hat",""),title:load("title",""),items:load("items",{skip:0,second:0}),escaped:load("escaped",null),recapture:load("recapture",0),muted:load("muted",false),weekLocal:load("weekLocal",{})};
function saveAll(){for(const k of ["streak","lastDay","best","missed","totalDmg","team","name","wins","titles","hats","hat","title","items","escaped","recapture","muted","weekLocal"])save(k,S[k])}

function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function dayKey(d=new Date()){return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate()}
const EPOCH=new Date(2026,10,1).setHours(0,0,0,0);
function questDay(){return Math.max(1,Math.floor((new Date().setHours(0,0,0,0)-EPOCH)/86400000)+1)}
function weekId(){const d=new Date();const day=(d.getDay()+6)%7;const mon=new Date(d);mon.setDate(d.getDate()-day);return dayKey(mon)+""}
function daysBetween(a,b){const pa=new Date(Math.floor(a/10000),Math.floor(a/100)%100-1,a%100),pb=new Date(Math.floor(b/10000),Math.floor(b/100)%100-1,b%100);return Math.round((pb-pa)/86400000)}

function buildChapter(s,seed){
  const rnd=mulberry(seed);let pool=BANK.filter(q=>q.s===s);if(pool.length<5)pool=BANK.filter(q=>q.s<=TAUGHT);
  const picked=[];const used=new Set();
  for(let i=0;i<5&&picked.length<pool.length;i++){const w=[];pool.forEach(q=>{if(used.has(q.id))return;const m=1+(S.missed[q.id]||0)*2;for(let k=0;k<m;k++)w.push(q)});const q=w[Math.floor(rnd()*w.length)];used.add(q.id);picked.push(q)}
  let bosses=BOSSES.filter(b=>b.s===s);if(!bosses.length)bosses=BOSSES.filter(b=>b.s<=TAUGHT);
  return {qs:picked,boss:bosses[Math.floor(rnd()*bosses.length)],seed};
}
function buildQuest(seed,n){
  const rnd=mulberry(seed);const pool=BANK.filter(q=>q.s<=TAUGHT);
  const sessions=[...new Set(pool.map(q=>q.s))];const picked=[];const used=new Set();
  const off=Math.floor(rnd()*sessions.length);
  for(let i=0;i<n;i++){
    const s=sessions[(off+i)%sessions.length];
    let cands=pool.filter(q=>q.s===s&&!used.has(q.id));if(!cands.length)cands=pool.filter(q=>!used.has(q.id));
    const w=[];cands.forEach(q=>{const m=1+(S.missed[q.id]||0)*2;for(let k=0;k<m;k++)w.push(q)});
    const q=w[Math.floor(rnd()*w.length)];used.add(q.id);picked.push(q);
  }
  const bs=picked[picked.length-1].s;
  let bosses=BOSSES.filter(b=>b.s===bs&&b.s<=TAUGHT);if(!bosses.length)bosses=BOSSES.filter(b=>b.s<=TAUGHT);
  return {qs:picked,boss:bosses[Math.floor(rnd()*bosses.length)],seed};
}

// ---------- SOUND (synth, no files) ----------
let AC=null;
function ac(){if(S.muted)return null;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==="suspended")AC.resume()}catch(e){return null}return AC}
function tone(f,t0,dur,type="square",vol=.12,slide=0){const c=ac();if(!c)return;const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,c.currentTime+t0);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),c.currentTime+t0+dur);g.gain.setValueAtTime(vol,c.currentTime+t0);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+t0+dur);o.connect(g);g.connect(c.destination);o.start(c.currentTime+t0);o.stop(c.currentTime+t0+dur+.02)}
const SFX={
 hit:()=>{tone(440,0,.08);tone(660,.06,.1)},
 crit:()=>{tone(523,0,.07);tone(784,.07,.07);tone(1047,.14,.18,"square",.14)},
 miss:()=>{tone(220,0,.18,"sawtooth",.1,-120);tone(110,.12,.3,"sawtooth",.08,-60)},
 death:()=>{[0,.15,.3,.45].forEach((t,i)=>tone(400-i*80,t,.25,"sawtooth",.12,-150))},
 combo:()=>{tone(200,0,.25,"triangle",.1,-150)},
 loot:()=>{[523,659,784,1047].forEach((f,i)=>tone(f,i*.09,.12,"triangle",.1))},
 click:()=>tone(880,0,.03,"square",.05)
};

// ---------- PIXEL RENDERER ----------
const PAL={".":null,G:"#b8ff9c",k:"#1a0f2e",p:"#4b2a7a",P:"#6a3fa8",d:"#2d1650",w:"#ffffff",b:"#111111",g:"#4ba65a",G:"#b8ff9c",y:"#ffb347",r:"#ff5c5c",t:"#e8d8b0",s:"#f0c9a0",h:"#3a2a1a",j:"#2d4f9d",o:"#e0a060"};
const TOME_IDLE=[
"......kkkkkkkkkkkkkkkk..",
".....kdPPPPPPPPPPPPPPkk.",
"....kdpPPyyPPPPPPyyPPpdk",
"....kdpPPPyyPPPPyyPPPpdk",
"....kdpPPPPPPPPPPPPPPpdk",
"....kdpPkkkPPPPPPkkkPpdk",
"....kdpPPkkkwPPwkkkPPpdk",
"....kdpPwwwwwPPwwwwwPpdk",
"....kdpPwbbwwPPwwbbwPpdk",
"....kdpPwbbwwPPwwbbwPpdk",
"....kdpPwwwwwPPwwwwwPpdk",
"....kdpPPPPPPPPPPPPPPpdk",
"....kdpPPPPPPPPPPPPPPpdk",
"....kdpPbbbbbbbbbbbbPpdk",
"....kdpPbwgwgwgwgwgbPpdk",
"....kdpPbgggggggggggbpdk",
"....kdpPbggrrrrrrrggbpdk",
"....kdpPbgrrrrrrrrrgbpdk",
"....kdpPbbwgwgwgwgwbbpdk",
"....kdpPPbbbbbbbbbbbPpdk",
"....kdpPPPPPPPPPPPPPPpdk",
"....kdpPPPPyyyyyyPPPPpdk",
"....kdpPPPPyPPPPyPPPPpdk",
"....kdpPPPPyyyyyyPPPPpdk",
"....kdpPPPPPPPPPPPPPPpdk",
".....kdddddddddddddddk..",
".....kttttttttttttttkk..",
"......kkkkkkkkkkkkkkk...",
"........................",
"........................"];
const TOME_CAST=TOME_IDLE.map((row,i)=>(i>=7&&i<=10)?row.replace(/w/g,"r").replace(/b/g,"y"):row);
const TOME_BLINK=TOME_IDLE.map((row,i)=>(i===7||i===10)?row.replace(/w/g,"P"):(i===8||i===9)?row.replace(/[wb]/g,"k"):row);
const TOME_HIT=TOME_IDLE.map(row=>row.replace(/[pPdtgGby]/g,"w"));
const TOME_DEAD=TOME_IDLE.map((row,i)=>i<12?"........................":row).map((row,i)=>(i>=14&&i<=18)?row.replace(/[grw]/g,"b"):row);
// Hero: a decathlete with a backpack, 10x14
const HERO=[
"...hhhh...",
"..hhhhhh..",
"..hssssh..",
"..hsbsbs..",
"..hsssss..",
"...ssss...",
"..ggggggs.",
".gggGgggss",
".sgGgggGs.",
".sggggggs.",
"..jyjyjy..",
"..yjyjyj..",
"..ss..ss..",
".kkk..kkk."];
const HATMAPS={crown:["y.y.y.y","yyyyyyy"],wizard:["...j...","..jjj..",".jjjjj.","jjjjjjj"],cap:["..rrrr.",".rrrrrr","rrrrrrrr"],halo:["yyyyyyy","y.....y"]};

const PX=6;
function drawMap(ctx,map,x,y,sc,pal=PAL,c0=0,c1=99){for(let r=0;r<map.length;r++)for(let c=Math.max(0,c0);c<Math.min(map[r].length,c1);c++){const col=pal[map[r][c]];if(col){ctx.fillStyle=col;ctx.fillRect(x+c*sc,y+r*sc,sc,sc)}}}

const Scene={cv:null,ctx:null,w:360,h:200,t:0,state:"idle",stateT:0,shake:0,parts:[],dead:false,raf:null,stars:[],bld:[],chapter:null,crit:0};
function sceneInit(cv){
  Scene.cv=cv;Scene.ctx=cv.getContext("2d");Scene.ctx.imageSmoothingEnabled=false;
  const rnd=mulberry(7);Scene.stars=Array.from({length:40},()=>({x:rnd()*360,y:rnd()*110,tw:rnd()*6.28}));
  Scene.bld=[];let x=-10;while(x<380){const w=18+Math.floor(rnd()*26),h=30+Math.floor(rnd()*60);Scene.bld.push({x,w,h,win:Math.floor(rnd()*9)});x+=w+2}
  if(!Scene.raf)loop();
}
function sceneSet(st){Scene.state=st;Scene.stateT=0;if(st==="hit")Scene.shake=10;if(st==="dead")Scene.dead=true}
function burst(n,col){for(let i=0;i<n;i++)Scene.parts.push({x:180,y:95,vx:(Math.random()-.5)*7,vy:-Math.random()*6-1,l:30+Math.random()*20,col})}
function loop(){
  Scene.raf=requestAnimationFrame(loop);
  const c=Scene.ctx;if(!c||!Scene.cv.isConnected){Scene.raf=null;return}
  const W=Scene.w,H=Scene.h;Scene.t++;Scene.stateT++;
  c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,W,H);
  const sx=Scene.shake>0?(Math.random()-.5)*Scene.shake:0,sy=Scene.shake>0?(Math.random()-.5)*Scene.shake:0;if(Scene.shake>0)Scene.shake-=1;
  c.translate(sx,sy);
  // JRPG battle backdrop: dusk sky band over a slice of the campus overworld
  const g=c.createLinearGradient(0,0,0,70);g.addColorStop(0,"#0d1a3a");g.addColorStop(1,"#2d4f9d");c.fillStyle=g;c.fillRect(-20,-20,W+40,90);
  Scene.stars.forEach(s=>{if(s.y>60)return;const a=.4+.6*Math.abs(Math.sin(Scene.t/40+s.tw));c.fillStyle=`rgba(255,240,200,${a})`;c.fillRect(Math.floor(s.x/3)*3,Math.floor(s.y/3)*3,3,3)});
  c.fillStyle="#ffd9a0";c.fillRect(292,26,26,26);c.fillStyle="#e8b880";c.fillRect(300,32,8,8);
  if(!Scene.bg){Scene.bg=document.createElement("canvas");Scene.bg.width=256;Scene.bg.height=224;drawCampus(Scene.bg.getContext("2d"),new Set(),0)}
  c.save();c.imageSmoothingEnabled=false;
  const vx=Scene.chapter&&CAMPUS.spots[Scene.chapterId]?CAMPUS.spots[Scene.chapterId].x:118,vy=Scene.chapter&&CAMPUS.spots[Scene.chapterId]?CAMPUS.spots[Scene.chapterId].y:118;
  // perspective slices: draw rows of the map wider toward the bottom
  for(let row=0;row<130;row+=2){const t=row/130;const scale=1.2+t*1.6;const srcW=W/scale,srcH=2/scale;c.drawImage(Scene.bg,Math.max(0,Math.min(256-srcW,vx-srcW/2)),Math.max(0,Math.min(224-srcH,vy-60+row/2.2)),srcW,srcH,-20,70+row,W+40,2.5)}
  c.restore();
  c.fillStyle="rgba(13,26,58,.35)";c.fillRect(-20,70,W+40,130);
  const fogN=Scene.chapter&&Scene.chapter.move==="fog"?10:4;
  for(let i=0;i<fogN;i++){c.fillStyle=`rgba(123,220,90,${.05+.03*i})`;const fx=(Scene.t*(0.3+i*0.2))%(W+120)-60;c.fillRect(fx,H-40-(i>3?i*8:0)+i*5,120,10)}
  // hero
  drawMap(c,HERO,30,H-30-14*4,4);
  if(S.hat&&HATMAPS[S.hat]){const hm=HATMAPS[S.hat];drawMap(c,hm,30+(10-hm[0].length)*2,H-30-14*4-hm.length*4+(S.hat==="halo"?-10:4),4)}
  // tome
  let map=TOME_IDLE;let bob=Math.sin(Scene.t/14)*4;const pal=Scene.chapter?Object.assign({},PAL,Scene.chapter.pal):PAL;
  if(Scene.dead)map=TOME_DEAD,bob=0;
  else if(Scene.state==="hit"){map=Scene.stateT<8?TOME_HIT:TOME_IDLE;if(Scene.stateT>14)Scene.state="idle"}
  else if(Scene.state==="cast"){map=TOME_CAST;bob=Math.sin(Scene.t/4)*2;c.fillStyle=`rgba(255,92,92,${.15+.1*Math.sin(Scene.t/5)})`;c.beginPath();c.arc(180,100,80,0,6.28);c.fill()}
  else{if(Scene.t%140<6)map=TOME_BLINK}
  if(!Scene.dead){c.fillStyle=`rgba(123,220,90,${.12+.06*Math.sin(Scene.t/10)})`;c.beginPath();c.ellipse(180,170,60,8,0,0,6.28);c.fill()}
  const mv=Scene.chapter&&!Scene.dead?Scene.chapter.move:null;
  let tx=180-12*PX,ty=28+bob,sc=PX;
  c.save();
  if(mv==="slide")tx+=Math.sin(Scene.t/22)*45;
  if(mv==="grow"){const s=1+.12*Math.sin(Scene.t/16);c.translate(180,100);c.scale(s,s);c.translate(-180,-100)}
  if(mv==="shrink"){const s=.85+.1*Math.sin(Scene.t/12);c.translate(180,100);c.scale(s,s);c.translate(-180,-100)}
  if(mv==="spin"){c.translate(180,100);c.rotate(Math.sin(Scene.t/18)*.25);c.translate(-180,-100)}
  if(mv==="flicker"&&Math.random()<.08)c.globalAlpha=.35;
  if(mv==="split"){const off=8+6*Math.sin(Scene.t/10);drawMap(c,map,tx-off,ty,sc,pal,0,12);drawMap(c,map,tx+off,ty,sc,pal,12,24);c.fillStyle="#ffb347";c.fillRect(178,ty+20,4,80)}
  else drawMap(c,map,tx,ty,sc,pal);
  if(mv==="crack"){c.strokeStyle="#000";c.lineWidth=3;c.beginPath();c.moveTo(tx+12*PX,ty+6);for(let i=1;i<12;i++)c.lineTo(tx+12*PX+((i%2)?6:-6),ty+6+i*13);c.stroke()}
  if(mv==="spin"){drawMap(c,HATMAPS.crown,tx+8*PX+4,ty-12,PX,PAL)}
  c.restore();
  if(Scene.crit>0){c.fillStyle=`rgba(255,255,255,${Scene.crit/12})`;c.fillRect(-20,-20,W+40,H+40);Scene.crit--}
  Scene.parts=Scene.parts.filter(p=>p.l>0);Scene.parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.25;p.l--;c.fillStyle=p.col;c.globalAlpha=Math.min(1,p.l/15);c.fillRect(Math.floor(p.x/3)*3,Math.floor(p.y/3)*3,4,4)});c.globalAlpha=1;
}

// ---------- SHARED STATE (weekly boss) ----------
let DB=null,USER=null,UID=null,dbReady=false,roster=[],unsubRoster=null;
(async()=>{try{
  if(!window.firebase||!window.FIREBASE_CONFIG||!FIREBASE_CONFIG.apiKey)return;
  firebase.initializeApp(FIREBASE_CONFIG);
  const cred=await firebase.auth().signInAnonymously();UID=cred.user.uid;DB=firebase.firestore();dbReady=true;
  unsubRoster=DB.collection("hits").onSnapshot(snap=>{roster=snap.docs.map(x=>Object.assign({id:x.id},x.data()));const el=document.getElementById("weekly");if(el)renderWeekly()},()=>{});
  const el=document.getElementById("weekly");if(el)renderWeekly()}catch(e){console.warn("firebase off",e)}})();
async function postDamage(dmg){
  const wk=weekId();S.weekLocal[wk]=(S.weekLocal[wk]||0)+dmg;save("weekLocal",S.weekLocal);
  if(!dbReady)return;
  try{const ref=DB.doc("hits/"+UID);const snap=await ref.get();const cur=snap.exists?snap.data():{};const weeks=Object.assign({},cur.weeks||{});weeks[wk]=(weeks[wk]||0)+dmg;
    await ref.set({name:S.name||"Anonymous",team:S.team||"",weeks,hat:S.hat||"",title:S.title||"",updated:Date.now()})}catch(e){}
}
function weeklyTotals(){const wk=weekId();if(dbReady){const rows=roster.map(r=>({name:r.name||"Someone",dmg:(r.weeks||{})[wk]||0,hat:r.hat||"",me:r.id===UID})).filter(r=>r.dmg>0).sort((a,b)=>b.dmg-a.dmg);return {rows,total:rows.reduce((a,r)=>a+r.dmg,0)}}
  const me=S.weekLocal[wk]||0;return {rows:me?[{name:S.name||"You",dmg:me,hat:S.hat,me:true}]:[],total:me}}

// ---------- UI ----------
var G=null,timerId=null;
const app=document.getElementById("app");
const $=s=>document.querySelector(s);
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("on");setTimeout(()=>t.classList.remove("on"),1600)}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function rankFor(p){let r=RANKS[0][1];RANKS.forEach(([t,n])=>{if(p>=t)r=n});return r}
function hpBar(v,max,cls=""){const segs=10,on=Math.ceil(v/max*segs);let s='<div class="hpbar '+cls+'" role="img" aria-label="HP '+v+'">';for(let i=0;i<segs;i++)s+=`<i class="${i<on?(on<=3?"on low":"on"):""}"></i>`;return s+'</div>'}
function heartsHTML(h){let s='<div class="hearts" aria-label="'+h+' lives">';for(let i=0;i<3;i++)s+=`<span class="heart ${i<h?"":"off"}"></span>`;return s+'</div>'}
function sceneHTML(){return `<div class="scene"><canvas id="scene" width="360" height="200"></canvas><div class="scan"></div><div id="fx"></div><button class="mute" id="mute" aria-label="toggle sound">${S.muted?"🔇":"🔊"}</button></div>`}
function mountScene(ch){const cv=$("#scene");if(cv)sceneInit(cv);Scene.chapter=ch||null;Scene.chapterId=ch?Object.keys(CHAPTERS).find(k=>CHAPTERS[k]===ch):null;const m=$("#mute");if(m)m.onclick=()=>{S.muted=!S.muted;save("muted",S.muted);m.textContent=S.muted?"🔇":"🔊";if(!S.muted)SFX.click()}}
function sessionWins(s){return S.wins[s]||0}
function freed(s){return sessionWins(s)>=3}
function checkEscape(){
  const today=dayKey();
  if(S.lastDay&&S.streak>0&&daysBetween(S.lastDay,today)>1&&!S.escaped){S.escaped={streak:S.streak,when:today};S.streak=0;S.recapture=0;saveAll();return true}
  return false;
}

function home(){
  G=null;clearInterval(timerId);Scene.dead=false;Scene.state="idle";
  const justEscaped=checkEscape();
  const today=dayKey(),played=S.lastDay===today,dn=questDay();const wt=weeklyTotals();
  app.innerHTML=`
  <header class="title"><p class="eyebrow">Highland High \u2022 Home of the Scots</p><h1>Escape from<br>the Econ Monster</h1><div class="tartan" aria-hidden="true"></div></header>
  ${sceneHTML()}
  ${S.escaped?`<div class="taunt cast"><b>THE TOME ESCAPED</b> with your ${S.escaped.streak}-day streak${justEscaped?"":""}. Win ${2-S.recapture} more daily quest${2-S.recapture===1?"":"s"} in a row to recapture it.</div>`:`<div class="taunt">“${esc(TAUNTS[dn%TAUNTS.length])}”</div>`}
  <div class="stats">
    <div><div class="n">${S.streak}</div><div class="l">Streak</div></div>
    <div><div class="n">${Math.round(S.totalDmg)}</div><div class="l">Damage</div></div>
    <div><div class="n rk">${rankFor(S.totalDmg)}</div><div class="l">Rank</div></div>
  </div>
  ${S.title?`<p class="ptitle">${S.hat?HATS[S.hat]+" ":""}${esc(S.name||"You")}, <em>${esc(S.title)}</em></p>`:""}
  <button class="big pulse" id="startDaily"><span class="lbl">${played?"REPLAY QUEST #"+dn:"\u25b6 DAILY QUEST #"+dn}</span><span class="sub">5 questions + chapter boss • Sessions 1–${TAUGHT}</span></button>
  <button class="ghost" id="weeklyBtn"><span class="lbl">WEEKLY BOSS</span><span class="sub">Team HP ${Math.max(0,WEEK_MAX-wt.total).toLocaleString()} / ${WEEK_MAX.toLocaleString()} • ${wt.rows.length} fighter${wt.rows.length===1?"":"s"}</span></button>
  <div class="two"><button class="ghost center" id="mapBtn"><span class="lbl">CAMPUS MAP</span></button><button class="ghost center" id="rivalBtn"><span class="lbl">RIVAL</span></button></div>
  <button class="ghost center" id="storyBtn"><span class="lbl">\ud83d\udcd6 THE STORY${load("storySeen",false)?"":" \u2022 NEW"}</span></button>
  <div class="two"><button class="ghost center" id="startPractice"><span class="lbl">PRACTICE</span></button><button class="ghost center" id="bagBtn"><span class="lbl">BAG (${(S.items.skip||0)+(S.items.second||0)})</span></button></div>
  <div class="field"><label class="eyebrow" for="pname">Your name (shows on the team roster)</label><input type="text" id="pname" value="${esc(S.name)}" placeholder="First name" maxlength="20"></div>
  <div class="field"><label class="eyebrow" for="team">Team code (prefixes share cards)</label><input type="text" id="team" value="${esc(S.team)}" placeholder="HHS-ECON" maxlength="16"></div>
  <p class="footer">Questions from DemiDec Section Exams 1–3 and the session case studies.</p>`;
  mountScene(null);attract();
  $("#startDaily").onclick=()=>{SFX.click();start({practice:false})};$("#startPractice").onclick=()=>{SFX.click();start({practice:true})};
  $("#weeklyBtn").onclick=()=>{SFX.click();weekly()};$("#storyBtn").onclick=()=>{SFX.click();story()};$("#mapBtn").onclick=()=>{SFX.click();campus()};$("#rivalBtn").onclick=()=>{SFX.click();rival()};$("#bagBtn").onclick=()=>{SFX.click();bag()};
  $("#pname").oninput=e=>{S.name=e.target.value.trim();save("name",S.name)};
  $("#team").oninput=e=>{S.team=e.target.value.trim();save("team",S.team)};
}

let attractT=null;function attract(){clearInterval(attractT);attractT=setInterval(()=>{if(!G&&Scene.cv&&Scene.cv.isConnected){sceneSet("cast");setTimeout(()=>{if(!G)sceneSet("idle")},1200)}else clearInterval(attractT)},5000)}
function start(o){clearInterval(attractT);
  const seed=o.seed||(o.practice?Math.floor(Math.random()*1e9):o.weekly?parseInt(weekId())+7:dayKey());
  const n=o.weekly?12:5;
  TOME_MAX=o.weekly?420:200;
  const quest=o.session?buildChapter(o.session,seed):buildQuest(seed,n);
  G=Object.assign({},quest,{n,i:0,tome:TOME_MAX,hearts:3,session:o.session||null,combo:0,best:0,dmg:0,log:[],t0:Date.now(),qStart:0,done:false,practice:!!o.practice,weekly:!!o.weekly,rival:o.rival||null,usedSecond:false,crits:0});
  G.chapter=CHAPTERS[G.boss.s]||CHAPTERS[1];
  Scene.dead=false;fight();
}
function fight(){
  clearInterval(timerId);
  const isBoss=G.i===G.n,q=isBoss?G.boss:G.qs[G.i];G.qStart=Date.now();G.done=false;
  const limit=isBoss?30:q.type==="num"?30:20;
  app.innerHTML=`
  <div class="hud">
    <div class="row"><span class="eyebrow">${isBoss?"☠ "+esc(G.chapter.name).toUpperCase():(G.weekly?"WEEKLY ":"")+"Q "+(G.i+1)+"/"+G.n} • ${esc(SESSIONS[q.s])}</span>${heartsHTML(G.hearts)}</div>
    ${sceneHTML()}
    <div class="row"><span class="eyebrow">TOME</span><span class="combo" id="combo">${G.combo>1?"x"+G.combo+" COMBO":""}</span><span class="hpnum" id="hpTxt">${G.tome}</span><span class="timer" id="timer">${limit}</span></div>
    <div id="hp">${hpBar(G.tome,TOME_MAX)}</div>
    ${isBoss?`<div class="taunt cast">${esc(G.chapter.name)} casts <b>${esc(q.spell)}</b>! Dodge by answering it right.</div>`:""}
  </div>
  <div class="card"><p class="q">${esc(q.q)}</p><div id="answer"></div><div id="why"></div></div>
  <div class="two">${S.items.skip>0&&!isBoss?`<button class="ghost center item" id="useSkip"><span class="lbl">SKIP (${S.items.skip})</span></button>`:""}${S.items.second>0&&G.hearts<3&&!G.usedSecond?`<button class="ghost center item" id="useSecond"><span class="lbl">2ND CHANCE (${S.items.second})</span></button>`:""}</div>
  <button class="ghost center" id="quit">Flee to campus</button>`;
  window.scrollTo({top:0});
  mountScene(isBoss?G.chapter:null);sceneSet(isBoss?"cast":"idle");
  if(isBoss){const f=$("#fx");if(f){const e=document.createElement("div");e.className="bossIntro";e.innerHTML=`<span>${esc(G.chapter.name)}</span><small>appears</small>`;f.appendChild(e);setTimeout(()=>e.remove(),2200);SFX.combo()}}
  $("#quit").onclick=home;
  const sk=$("#useSkip");if(sk)sk.onclick=()=>{S.items.skip--;save("items",S.items);G.log.push("⬜");G.i++;SFX.click();toast("Skipped");G.i>G.n?result():fight()};
  const sc=$("#useSecond");if(sc)sc.onclick=()=>{S.items.second--;save("items",S.items);G.hearts++;G.usedSecond=true;SFX.loot();toast("Heart restored");sc.remove();document.querySelector(".hearts").outerHTML=heartsHTML(G.hearts)};
  const ans=$("#answer");
  if(q.type==="mc"){ans.className="opts";ans.innerHTML=q.opts.map((o,k)=>`<button class="opt" data-k="${k}"><span class="key">${"ABCD"[k]}</span><span>${esc(o)}</span></button>`).join("");ans.querySelectorAll("button").forEach(b=>b.onclick=()=>answer(+b.dataset.k))}
  else if(q.type==="two"){ans.className="two";ans.innerHTML=q.opts.map((o,k)=>`<button class="opt" data-k="${k}">${k===0?"◀ ":""}${esc(o)}${k===1?" ▶":""}</button>`).join("");ans.querySelectorAll("button").forEach(b=>b.onclick=()=>answer(+b.dataset.k));
    let sx=null;ans.addEventListener("touchstart",e=>{sx=e.touches[0].clientX},{passive:true});ans.addEventListener("touchend",e=>{if(sx==null||G.done)return;const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>60)answer(dx<0?0:1);sx=null})}
  else{ans.innerHTML=`<input type="number" inputmode="decimal" step="any" id="num" placeholder="Type a number"><button class="big center" id="go"><span class="lbl">STRIKE</span></button>`;
    const go=()=>{const v=parseFloat($("#num").value);if(isNaN(v))return;answer(v)};$("#go").onclick=go;$("#num").onkeydown=e=>{if(e.key==="Enter")go()};setTimeout(()=>$("#num").focus(),50)}
  let left=limit;const tEl=$("#timer");
  timerId=setInterval(()=>{left--;tEl.textContent=left;if(left<=5){tEl.classList.add("low");if(left<=3)tone(1200,0,.04,"square",.04)}if(left<=0){clearInterval(timerId);answer(null)}},1000);
}
function fx(txt,cls){const f=$("#fx");if(!f)return;const e=document.createElement("span");e.className="dmgpop "+cls;e.textContent=txt;f.appendChild(e);setTimeout(()=>e.remove(),1000)}
function fmt(t,opt,pg){return t.replace("%s",opt.length>38?opt.slice(0,36)+"…":opt).replace("%p",pg||"?")}
function answer(v){
  if(G.done)return;G.done=true;clearInterval(timerId);
  const isBoss=G.i===G.n,q=isBoss?G.boss:G.qs[G.i],secs=(Date.now()-G.qStart)/1000;
  let ok;if(v===null)ok=false;else if(q.type==="num")ok=Math.abs(v-q.ans)<=q.tol+1e-9;else ok=v===q.a;
  const ans=$("#answer");
  ans.querySelectorAll("button.opt").forEach(b=>{b.disabled=true;if(+b.dataset.k===q.a)setTimeout(()=>b.classList.add("right"),ok?0:350);else if(v!==null&&+b.dataset.k===v&&!ok)b.classList.add("wrong","shakeX");else b.classList.add("dim")});
  if(q.type==="num"){const n=$("#num");if(n){n.disabled=true;n.classList.add(ok?"good":"bad")}const g=$("#go");if(g)g.disabled=true}
  document.querySelectorAll(".item").forEach(b=>b.remove());
  let dealt=0,crit=false,taunt="";
  if(ok){
    G.combo++;G.best=Math.max(G.best,G.combo);crit=secs<3;
    const speed=crit?2.0:secs<8?1.3:1.0,base=isBoss?35:20;
    dealt=Math.round(base*speed*(1+0.1*(G.combo-1)));
    G.tome=Math.max(isBoss?0:1,G.tome-dealt);G.dmg+=dealt;G.log.push("🟩");sceneSet("hit");burst(crit?50:24,crit?"#ffffff":"#ffb347");
    if(crit){G.crits++;Scene.crit=12;Scene.shake=18;fx("CRITICAL −"+dealt,"crit");SFX.crit()}else{fx("−"+dealt,"hit");SFX.hit()}
    taunt=SULK[Math.floor(Math.random()*SULK.length)];
    if(G.tome<=0){setTimeout(()=>{sceneSet("dead");burst(60,"#7bdc5a");SFX.death()},300)}
  }else{
    const broke=G.combo>1;G.combo=0;G.hearts--;G.log.push("🟥");const heal=isBoss?15:8;G.tome=Math.min(TOME_MAX,G.tome+heal);
    S.missed[q.id]=(S.missed[q.id]||0)+1;save("missed",S.missed);sceneSet("cast");burst(14,"#ff5c5c");fx("+"+heal,"heal");SFX.miss();if(broke){setTimeout(SFX.combo,250);fx("COMBO BROKEN","broke")}
    document.body.classList.add("flash");setTimeout(()=>document.body.classList.remove("flash"),400);
    const hd=document.querySelector(".hearts");if(hd)hd.outerHTML=heartsHTML(G.hearts);
    const pg=(q.src||"").match(/p\.([\d;, ]+)/);
    taunt=v===null?SLOW[Math.floor(Math.random()*SLOW.length)]:q.type==="num"?"“"+v+"”? My calculator weeps.":fmt(MOCK[Math.floor(Math.random()*MOCK.length)],q.opts[v],pg?pg[1]:null);
  }
  $("#hp").innerHTML=hpBar(G.tome,TOME_MAX);$("#hpTxt").textContent=G.tome;const cb=$("#combo");if(cb){cb.textContent=G.combo>1?"x"+G.combo+" COMBO":"";cb.classList.toggle("hot",G.combo>=3)}
  const correctTxt=q.type==="num"?q.ans.toLocaleString():q.opts[q.a];
  $("#why").innerHTML=`<div class="taunt ${ok?"":"cast"}">“${esc(taunt)}”</div><div class="why ${ok?"ok":"bad"}"><b>${ok?(crit?"CRITICAL. ":isBoss?"DODGED. ":"HIT. "):v===null?"TOO SLOW. ":"MISS. "}</b>${esc(q.why)}${ok?"":" <span class='muted'>Answer: "+esc(correctTxt)+"</span>"}${q.src?"<div class='src'>"+esc(q.src)+"</div>":""}</div>
  ${(!isBoss&&G.tome<=1)?`<div class="taunt">The Tome is at 1 HP and clinging to its spine. Only the chapter boss can finish it.</div>`:""}<button class="big center" id="next"><span class="lbl">${G.hearts<=0||G.tome<=0||G.i>=G.n?"SEE RESULT":"NEXT ▶"}</span></button>`;
  $("#next").onclick=()=>{G.i++;if(G.hearts<=0||G.tome<=0||G.i>G.n)result();else fight()};
  setTimeout(()=>{const w=$("#why");if(w)w.scrollIntoView({behavior:"smooth",block:"nearest"})},200);
}
function rollLoot(){if(Math.random()<.35)return null;const l=LOOT[Math.floor(Math.random()*LOOT.length)];
  if(l.k==="title"){if(S.titles.includes(l.v))return {k:"item",v:"skip"};S.titles.push(l.v);S.title=l.v}
  else if(l.k==="hat"){if(S.hats.includes(l.v))return {k:"item",v:"second"};S.hats.push(l.v);S.hat=l.v}
  if(l.k==="item")S.items[l.v]=(S.items[l.v]||0)+1;
  saveAll();return l}
function rivalCode(dmg,secs){return "EM-"+G.seed.toString(36)+"-"+dmg.toString(36)+"-"+secs.toString(36)+"-"+(S.name||"anon").replace(/[^a-z0-9]/gi,"").slice(0,12)}
function result(){
  clearInterval(timerId);
  const won=G.tome<=0,secs=Math.round((Date.now()-G.t0)/1000),mm=Math.floor(secs/60),ss=String(secs%60).padStart(2,"0"),dn=questDay(),today=dayKey();
  let streakMsg="";
  if(!G.practice&&!G.weekly&&!G.rival&&S.lastDay!==today){
    const y=new Date();y.setDate(y.getDate()-1);
    if(S.escaped){if(won){S.recapture++;if(S.recapture>=2){S.streak=S.escaped.streak+2;S.escaped=null;S.recapture=0;streakMsg="STREAK RECAPTURED: "+S.streak+" days"}else{streakMsg="One more win to recapture your "+S.escaped.streak+"-day streak"}}else{S.recapture=0;streakMsg="The Tome still holds your streak"}}
    else S.streak=S.lastDay===dayKey(y)?S.streak+1:1;
    S.lastDay=today;
  }
  S.totalDmg+=G.dmg;if(won)S.wins[G.boss.s]=(S.wins[G.boss.s]||0)+1;
  const prev=S.best[today];if(!G.practice&&(!prev||G.dmg>prev.dmg))S.best[today]={dmg:G.dmg,secs};
  const loot=won?rollLoot():null;saveAll();postDamage(G.dmg);
  const newlyFreed=won&&sessionWins(G.boss.s)===3;
  const code=rivalCode(G.dmg,secs);
  const card=`${S.team?S.team+" • ":""}${S.hat?HATS[S.hat]+" ":""}Econ Monster ${G.weekly?"Weekly":G.practice?"Practice":"Day "+dn} — ${won?G.chapter.name+" slain":"Tome HP "+G.tome} in ${mm}:${ss} ⚔️${G.log.join("")} — ${G.dmg} dmg${G.crits?" • "+G.crits+" crit":""} • x${G.best} combo — 🔥${S.streak}${G.rival?"\nvs "+G.rival.name+": "+G.rival.dmg+" dmg in "+Math.floor(G.rival.secs/60)+":"+String(G.rival.secs%60).padStart(2,"0")+" — "+(G.dmg>G.rival.dmg?"I WIN":G.dmg<G.rival.dmg?"THEY WIN":"TIE"):"\nRival me: "+code}`;
  const correct=G.log.filter(x=>x==="🟩").length,total=G.n+1;
  app.innerHTML=`
  <header class="title"><p class="eyebrow">${G.weekly?"Weekly boss":G.session?CHAPTERS[G.session].loc:G.practice?"Practice fight":G.rival?"Rival fight":"Daily Quest #"+dn}</p><h1 class="${won?"victory":"lose"}">${won?esc(G.chapter.name).toUpperCase()+"<br>SLAIN":G.hearts<=0?"DEVOURED":"TOME ESCAPED"}</h1></header>
  ${sceneHTML()}
  ${streakMsg?`<div class="taunt"><b>${esc(streakMsg)}</b></div>`:""}
  ${loot?`<div class="loot"><span class="eyebrow">LOOT DROP</span><p>${loot.k==="hat"?HATS[loot.v]+" "+loot.v+" hat (equipped)":loot.k==="title"?"Title: <em>"+esc(loot.v)+"</em>":ITEMS[loot.v].n+" — "+ITEMS[loot.v].d}</p></div>`:""}
  ${newlyFreed?`<div class="loot"><span class="eyebrow">LOCATION FREED</span><p>${esc(G.chapter.loc)} is safe from ${esc(G.chapter.name)}. Check the campus map.</p></div>`:""}
  ${G.rival?`<div class="card"><p class="eyebrow">Rival result</p><div class="vs"><div><div class="n">${G.dmg}</div><div class="l">${esc(S.name||"You")}</div></div><div class="vsx">${G.dmg>G.rival.dmg?"WIN":G.dmg<G.rival.dmg?"LOSS":"TIE"}</div><div><div class="n">${G.rival.dmg}</div><div class="l">${esc(G.rival.name)}</div></div></div></div>`:""}
  <div class="taunt ${won?"":"cast"}">“${esc(won?"I’ll be back in the next unit.":TAUNTS[(dn+G.dmg)%TAUNTS.length])}”</div>
  <div class="stats"><div><div class="n">${G.dmg}</div><div class="l">Damage</div></div><div><div class="n">${mm}:${ss}</div><div class="l">Time</div></div><div><div class="n">${correct}/${total}</div><div class="l">Correct</div></div></div>
  <div class="stats"><div><div class="n">x${G.best}</div><div class="l">Best combo</div></div><div><div class="n">${G.crits}</div><div class="l">Crits</div></div><div><div class="n rk">${rankFor(S.totalDmg)}</div><div class="l">Rank</div></div></div>
  <div class="card"><p class="eyebrow">Share card</p><div class="share" id="card">${esc(card)}</div><button class="big center" id="copy"><span class="lbl">COPY FOR GROUP CHAT</span></button></div>
  ${G.log.includes("🟥")?`<div class="card"><p class="eyebrow">The Tome beat you on</p>${[...G.qs,G.boss].filter((q,k)=>G.log[k]==="🟥").map(q=>`<p class="miss"><b>${esc(q.term||q.spell)}</b> <span class="muted small">${esc(SESSIONS[q.s])}</span></p>`).join("")}<p class="muted small">These show up more often next time.</p></div>`:""}
  <button class="ghost center" id="again"><span class="lbl">${G.practice?"FIGHT AGAIN":"PRACTICE FIGHT"}</span></button>
  <button class="ghost center" id="home"><span class="lbl">BACK TO CAMPUS</span></button>`;
  mountScene(G.chapter);Scene.dead=won;if(!won)sceneSet("cast");if(loot)setTimeout(SFX.loot,500);
  $("#copy").onclick=()=>{const txt=$("#card").textContent;const fb=()=>{const r=document.createRange();r.selectNodeContents($("#card"));const s=getSelection();s.removeAllRanges();s.addRange(r);toast("Select & copy")};try{navigator.clipboard.writeText(txt).then(()=>toast("Copied!")).catch(fb)}catch(e){fb()}};
  $("#again").onclick=()=>start({practice:true});$("#home").onclick=home;
}


// ---------- STORY ----------
function story(){
  save("storySeen",true);
  const pages=[
    {t:"Chapter 0: The Tome",b:"Every fall the Highland Academic Decathlon team receives one copy of the USAD Economics Resource Guide. This year's copy arrived early, unmarked, and already warm.<br><br>By Monday it had read itself. By Tuesday it had opinions."},
    {t:"Possession",b:"The Tome knows every curve, every elasticity, every tax wedge in the book, and it has decided the campus is a market it would like to corner.<br><br>It shifted the snack bar's supply curve left. It priced the parking lot like a monopolist. It put a ceiling on the water fountains and a floor on the vending machines. The Quad is in disequilibrium."},
    {t:"The Chapters Break Loose",b:"Eight chapters tore free and took up residence around the school, each with its favorite trap:<br><br><b>The Hoarder</b> at the Snack Bar forgets forgone income. <b>The Shifter</b> on the Quad calls every movement a shift. <b>Disequilibrium</b> haunts the Gym. <b>Midpoint</b> cracks the Library by dividing by the starting value. <b>The Wedge</b> splits the Front Office. <b>The Monopolist</b> rules the Parking Lot. <b>The Externality</b> fogs the Bus Loop. <b>The Deflator</b> shrinks the Ball Fields."},
    {t:"Why You",b:"Only a Scot who knows the material can hurt it. A correct answer lands as a hit. A fast correct answer lands as a critical. A wrong answer feeds it, because a wrong answer is exactly what it wants you to carry into the exam in February.<br><br>The Tome is not afraid of you yet. That is the point of the daily quest."},
    {t:"How to Win",b:"<b>Daily Quest</b>: five questions and a chapter boss, same for everyone, new each day. Keep the streak or the Tome runs off with it.<br><b>Weekly Boss</b>: the whole team pools damage into one bar. Every fight counts.<br><b>Campus Map</b>: beat a chapter three times to free its location.<br><b>Rival</b>: paste a teammate's code to fight their exact quest.<br><br>Free all eight locations and the Tome goes back to being a book. Then we take the real test."}
  ];
  let i=0;
  const render=()=>{const p=pages[i];
    app.innerHTML=`<header class="title"><p class="eyebrow">Escape from the Econ Monster</p><h1>${esc(p.t)}</h1><div class="tartan" aria-hidden="true"></div></header>
    ${sceneHTML()}
    <div class="card story"><p>${p.b}</p></div>
    <div class="two"><button class="ghost center" id="prev" ${i===0?"disabled":""}><span class="lbl">\u25c0 BACK</span></button><button class="big center" id="nextp"><span class="lbl">${i<pages.length-1?"NEXT \u25b6":"TO CAMPUS"}</span></button></div>
    <p class="muted small" style="text-align:center">${i+1} / ${pages.length}</p>`;
    mountScene(i===2?CHAPTERS[2]:null);if(i===1||i===2)sceneSet("cast");
    $("#prev").onclick=()=>{if(i>0){i--;SFX.click();render()}};
    $("#nextp").onclick=()=>{SFX.click();if(i<pages.length-1){i++;render()}else home()};
  };
  render();
}
// ---------- WEEKLY BOSS ----------
function renderWeekly(){const el=$("#weekly");if(!el)return;const wt=weeklyTotals();const hp=Math.max(0,WEEK_MAX-wt.total);
  el.innerHTML=`<div class="row"><span class="eyebrow">TEAM TOME • week of ${weekId().slice(4,6)}/${weekId().slice(6)}</span><span class="hpnum">${hp.toLocaleString()}</span></div>${hpBar(hp,WEEK_MAX,"wide")}
  ${hp<=0?`<div class="loot"><span class="eyebrow">SLAIN</span><p>The team took the Tome down this week. It respawns Monday.</p></div>`:""}
  <div class="card"><p class="eyebrow">Roster • damage this week</p>${wt.rows.length?wt.rows.map((r,i)=>`<div class="rrow ${r.me?"me":""}"><span class="pos">${i+1}</span><span class="rn">${r.hat?HATS[r.hat]+" ":""}${esc(r.name)}</span><span class="rd">${r.dmg.toLocaleString()}</span></div>`).join(""):"<p class='muted'>No damage logged yet this week. Every daily and practice fight counts.</p>"}
  ${dbReady?"":"<p class='muted small'>Showing this phone only. Team pooling is not configured yet.</p>"}</div>`}
function weekly(){
  app.innerHTML=`<header class="title"><p class="eyebrow">Everyone’s damage pools into one bar</p><h1>Weekly Boss</h1></header>${sceneHTML()}<div id="weekly"></div>
  <button class="big" id="fightW"><span class="lbl">WEEKLY RAID</span><span class="sub">12 questions across every session + boss. Same seed for the whole team.</span></button>
  <button class="ghost center" id="home"><span class="lbl">BACK TO CAMPUS</span></button>`;
  mountScene(CHAPTERS[((parseInt(weekId())%8)+1)]);sceneSet("cast");renderWeekly();
  $("#fightW").onclick=()=>{SFX.click();start({weekly:true})};$("#home").onclick=home;
}

// ---------- CAMPUS MAP ----------
function campus(){
  app.innerHTML=`<header class="title"><p class="eyebrow">Tap a spot to walk there. Tap again to fight.</p><h1>Highland High</h1><div class="tartan" aria-hidden="true"></div></header>
  <div class="scene map"><canvas id="map" width="512" height="448"></canvas><div class="scan"></div><div class="mapHud" id="mapHud"></div></div>
  <div class="win" id="spotInfo"><p class="muted">Walk the Scot to a location.</p></div>
  <button class="ghost center" id="home"><span class="lbl">BACK</span></button>`;
  $("#home").onclick=home;
  const cv=$("#map"),c=cv.getContext("2d");c.imageSmoothingEnabled=false;
  const fs=new Set(Object.keys(CHAPTERS).map(Number).filter(freed));
  const hero=load("heroPos",{x:118,y:140});let target=null,atSpot=null,step=0;
  const spotAt=(x,y)=>Object.entries(CAMPUS.spots).find(([s,sp])=>Math.hypot(sp.x-x,sp.y-y)<14);
  function info(){const el=$("#spotInfo");if(!el)return;if(!atSpot){el.innerHTML="<p class='muted'>Walk the Scot to a location.</p>";return}
    const [s,sp]=atSpot;const ch=CHAPTERS[s];const w=Math.min(3,sessionWins(+s));
    el.innerHTML=`<div class="row"><div><p class="eyebrow">${esc(sp.label)}</p><p><b>${esc(ch.name)}</b> • ${esc(SESSIONS[s])}</p><p class="muted small">${fs.has(+s)?"Freed. Fight again for loot.":w+"/3 wins to free"}</p></div><button class="big center" id="fightHere" style="width:auto"><span class="lbl">FIGHT</span></button></div>`;
    $("#fightHere").onclick=()=>{SFX.click();start({practice:true,session:+s})};}
  cv.addEventListener("click",e=>{const r=cv.getBoundingClientRect();const x=(e.clientX-r.left)/r.width*256,y=(e.clientY-r.top)/r.height*224;const sp=spotAt(x,y);
    if(sp&&atSpot&&sp[0]===atSpot[0]){SFX.click();start({practice:true,session:+sp[0]});return}
    target=sp?{x:sp[1].x,y:sp[1].y+4}:{x:Math.max(8,Math.min(248,x)),y:Math.max(14,Math.min(208,y))};SFX.click()});
  (function draw(){if(!cv.isConnected)return;
    if(target){const dx=target.x-hero.x,dy=target.y-hero.y,d=Math.hypot(dx,dy);if(d<1.5){hero.x=target.x;hero.y=target.y;target=null;save("heroPos",hero);const sp=spotAt(hero.x,hero.y-4);if(sp&&(!atSpot||sp[0]!==atSpot[0])){atSpot=sp;SFX.hit();info()}else if(!sp&&atSpot){atSpot=null;info()}}else{hero.x+=dx/d*1.6;hero.y+=dy/d*1.6;step++}}
    c.setTransform(2,0,0,2,0,0);drawCampus(c,fs,performance.now());
    // hero (facing by direction, 2-frame walk)
    const bobY=target&&Math.floor(step/6)%2?-1:0;const hx=hero.x-7,hy=hero.y-20+bobY;
    px(c,hx+2,hero.y-1,11,2,CP.shadow);drawMap(c,HERO,hx,hy,1.5);
    if(S.hat&&HATMAPS[S.hat]){const hm=HATMAPS[S.hat];drawMap(c,hm,hx+(10-hm[0].length)*.75,hy-hm.length*1.5+(S.hat==="halo"?-3:1.5),1.5)}
    if(target){c.fillStyle="rgba(255,211,107,.8)";c.fillRect(target.x-2,target.y-2,4,4)}
    c.setTransform(1,0,0,1,0,0);c.font="8px 'Press Start 2P',monospace";c.textAlign="center";
    Object.entries(CAMPUS.spots).forEach(([s,sp])=>{const lab=sp.label.toUpperCase();const w=c.measureText(lab).width+8;c.fillStyle="rgba(0,0,0,.6)";c.fillRect(sp.x*2-w/2,sp.y*2+6,w,12);c.fillStyle=fs.has(+s)?"#9fd8aa":"#fff";c.fillText(lab,sp.x*2,sp.y*2+15)});
    requestAnimationFrame(draw)})();
  const sp0=spotAt(hero.x,hero.y-4);if(sp0){atSpot=sp0;info()}
}
// ---------- RIVAL ----------
function rival(){
  app.innerHTML=`<header class="title"><p class="eyebrow">Fight the exact same quest as a friend</p><h1>Rival Mode</h1></header>
  <div class="card"><p>Every share card ends with a code like <b>EM-abc-12-3f-maya</b>. Paste one here to fight the same questions and see both results side by side.</p>
  <input type="text" id="code" placeholder="EM-..." autocapitalize="off" autocomplete="off">
  <button class="big center" id="goR"><span class="lbl">FIGHT THEIR QUEST</span></button><p class="muted small" id="rerr"></p></div>
  <button class="ghost center" id="home"><span class="lbl">BACK TO CAMPUS</span></button>`;
  $("#home").onclick=home;
  $("#goR").onclick=()=>{const m=$("#code").value.trim().match(/^EM-([0-9a-z]+)-([0-9a-z]+)-([0-9a-z]+)-([a-z0-9]*)$/i);if(!m){$("#rerr").textContent="That code does not look right.";return}
    SFX.click();start({seed:parseInt(m[1],36),rival:{dmg:parseInt(m[2],36),secs:parseInt(m[3],36),name:m[4]||"rival"}})};
}
// ---------- BAG ----------
function bag(){
  app.innerHTML=`<header class="title"><p class="eyebrow">Loot drops after a win</p><h1>Your Bag</h1></header>
  <div class="card"><p class="eyebrow">Items</p><p>${ITEMS.skip.n}: <b>${S.items.skip||0}</b> — ${ITEMS.skip.d}</p><p>${ITEMS.second.n}: <b>${S.items.second||0}</b> — ${ITEMS.second.d}</p></div>
  <div class="card"><p class="eyebrow">Hats</p>${S.hats.length?`<div class="chips">${S.hats.map(h=>`<button class="chip ${S.hat===h?"on":""}" data-h="${h}">${HATS[h]} ${h}</button>`).join("")}<button class="chip ${S.hat?"":"on"}" data-h="">none</button></div>`:"<p class='muted'>None yet.</p>"}</div>
  <div class="card"><p class="eyebrow">Titles</p>${S.titles.length?`<div class="chips">${S.titles.map(t=>`<button class="chip ${S.title===t?"on":""}" data-t="${esc(t)}">${esc(t)}</button>`).join("")}</div>`:"<p class='muted'>None yet.</p>"}</div>
  <button class="ghost center" id="home"><span class="lbl">BACK TO CAMPUS</span></button>`;
  $("#home").onclick=home;
  document.querySelectorAll("[data-h]").forEach(b=>b.onclick=()=>{S.hat=b.dataset.h;save("hat",S.hat);SFX.click();bag()});
  document.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{S.title=b.dataset.t;save("title",S.title);SFX.click();bag()});
}
home();
