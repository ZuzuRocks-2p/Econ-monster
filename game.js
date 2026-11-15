

const TAUNTS=["Plaid up all you like. I eat tartan.","Your opportunity cost of studying was sleep, mortal.","I shift curves for fun. You shift nothing.","Divide by the starting value. Everyone does.","The library is mine. The cafeteria is next.","I have no close substitutes. You have no chance.","Your demand for mercy is perfectly inelastic.","Every wrong answer heals me. Keep going."];
const MOCK=["“%s”? Bold. Wrong, but bold.","You chose “%s.” I wrote that distractor myself.","“%s” is what the freshmen pick.","Ah, “%s.” Delicious.","“%s.” Did you even read page %p?","I fed on “%s” and grew stronger."];
const SULK=["Lucky guess.","Fine. FINE.","That one wasn’t even on the test.","Who taught you that?","Ow. Rude.","I felt that in my index."];
const SLOW=["Too slow. The bell rang.","Time is an opportunity cost, child.","I aged a chapter waiting."];
const RANKS=[[0,"Wee Scot"],[150,"Price Taker"],[400,"Price Maker"],[900,"Invisible Hand"],[1800,"Royal Scot"],[3500,"Tome Slayer"]];
const SESSIONS={1:"Fundamentals",2:"Demand & Supply",3:"Equilibrium & Surplus",4:"Elasticity",5:"Gov’t Policy",6:"Market Structures",7:"Market Failures",8:"GDP, Prices & Growth",9:"Jobs & Finance",10:"Money & the Fed",11:"Transportation I",12:"Transportation II",13:"Gains from Trade"};
// Chapter bosses: one per session, with a palette swap and a signature move the scene renders.
const CHAPTERS={
 1:{name:"Scarcity",sprite:"scarcity",move:"grow",pal:{P:"#8a5a2a",p:"#6a3f1a",d:"#3a200a"},loc:""},
 2:{name:"The Shifter",sprite:"shifter",move:"slide",pal:{P:"#2f6fb5",p:"#1f4f85",d:"#0f2a50"},loc:""},
 3:{name:"Surplus & Shortage",sprite:"surplus",move:"flicker",pal:{P:"#5a5a6a",p:"#3f3f4f",d:"#22222f"},loc:""},
 4:{name:"Midpoint",sprite:"midpoint",move:"crack",pal:{P:"#b04a9a",p:"#80306c",d:"#48163c"},loc:""},
 5:{name:"The Wedge",sprite:"wedge",move:"split",pal:{P:"#c0392b",p:"#8a2418",d:"#4a100a"},loc:""},
 6:{name:"The Monopolist",sprite:"monopolist",move:"spin",pal:{P:"#d4a017",p:"#9a7210",d:"#5a4208"},loc:""},
 7:{name:"The Externality",sprite:"externality",move:"fog",pal:{P:"#2e8b57",p:"#1f5f3c",d:"#0f3320"},loc:""},
 8:{name:"The Deflator",sprite:"deflator",move:"shrink",pal:{P:"#4b2a7a",p:"#2d1650",d:"#1a0f2e"},loc:""},
 9:{name:"The Benchwarmer",sprite:"benchwarmer",move:"flicker",pal:{P:"#4a6a8a",p:"#2a4a6a",d:"#1a2a3a"},loc:""},
 10:{name:"The ASB Cashbox",sprite:"cashbox",move:"grow",pal:{P:"#6a7a6a",p:"#4a5a4a",d:"#2a3a2a"},loc:""},
 11:{name:"The Drop-Off Line",sprite:"dropoff",move:"slide",pal:{P:"#8a8a9a",p:"#5a5a6a",d:"#2a2a3a"},loc:""},
 12:{name:"The Moocher",sprite:"moocher",move:"grow",pal:{P:"#7a7a2a",p:"#5a5a1a",d:"#3a3a0a"},loc:""}
};
Object.keys(CHAPTERS).forEach(s=>{CHAPTERS[s].loc=(CAMPUS.spots[s]||{}).label||"Campus"});
const LOOT=[
 {k:"title",v:"Vanquisher of Deadweight Loss"},{k:"title",v:"Midpoint Enjoyer"},{k:"title",v:"Certified Price Taker"},{k:"title",v:"Curve Shifter"},{k:"title",v:"Surplus Hunter"},{k:"title",v:"Tax Wedge Survivor"},
 {k:"hat",v:"crown"},{k:"hat",v:"wizard"},{k:"hat",v:"cap"},{k:"hat",v:"halo"},
 {k:"item",v:"skip"},{k:"item",v:"skip"},{k:"item",v:"second"},{k:"item",v:"second"}
];
const HATS={crown:"👑",wizard:"🧠",cap:"🧢",halo:"😇"};
function icon(n,cls=""){return `<img class="icon ${cls}" src="art/icons/${n}.png" alt="${n}">`}
const ITEMS={skip:{n:"Skip",d:"Skip one question, no damage either way"},second:{n:"Second Chance",d:"Restore a heart once per fight"}};
const TAUGHT=12;let TOME_MAX=200;const WEEK_MAX=5000;

// ---------- STATE ----------
function load(k,d){try{const v=localStorage.getItem("econ."+k);return v==null?d:JSON.parse(v)}catch(e){return d}}
function save(k,v){try{localStorage.setItem("econ."+k,JSON.stringify(v))}catch(e){}}
let S={seen:load("seen",{}),streak:load("streak",0),lastDay:load("lastDay",null),best:load("best",{}),missed:load("missed",{}),totalDmg:load("totalDmg",0),team:load("team",""),name:load("name",""),
  wins:load("wins",{}),titles:load("titles",[]),hats:load("hats",[]),hat:load("hat",""),title:load("title",""),items:load("items",{skip:0,second:0}),escaped:load("escaped",null),recapture:load("recapture",0),muted:load("muted",false),weekLocal:load("weekLocal",{})};
function saveAll(quiet){for(const k of ["seen","streak","lastDay","best","missed","totalDmg","team","name","wins","titles","hats","hat","title","items","escaped","recapture","muted","weekLocal"])save(k,S[k]);if(!quiet&&typeof cloudPush==="function")cloudPush()}

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

// ---------- SOUND ----------
Music.setMuted(S.muted);
const SFX=new Proxy({},{get:(_,k)=>()=>Music.sfx(k)});
function tone(f,t0,dur){Music.sfx("tick")}
function playTrack(n){if(S.muted)return;Music.play(n)}
// Browsers require a gesture before audio: unlock on first tap and start the pending track.
let pendingTrack=null,_hintShown=false;function pendingTrackShown(){if(_hintShown)return true;_hintShown=true;return false}
document.addEventListener("pointerdown",()=>{const hint=document.getElementById("sndHint");if(hint)hint.remove();Music.unlock();if(pendingTrack&&!S.muted){const t=pendingTrack;pendingTrack=null;Music.play(t)}},{passive:true});
function wantTrack(n){if(S.muted)return;if(Music.current()===n)return;if(Music.unlock()&&Music.unlock().state==="running")Music.play(n);else pendingTrack=n}
// ---------- PIXEL RENDERER ----------
const PAL=Object.assign({".":null,G:"#b8ff9c",E:"#3e3e4e",L:"#5c5c6e",N:"#0a0a0e",k:"#1a0f2e",p:"#4b2a7a",P:"#6a3fa8",d:"#2d1650",w:"#ffffff",b:"#111111",g:"#4ba65a",G:"#b8ff9c",y:"#ffb347",r:"#ff5c5c",t:"#e8d8b0",s:"#f0c9a0",h:"#3a2a1a",j:"#2d4f9d",o:"#e0a060"},BPAL);
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
const HEROES={
 lad:{name:"Lad",icon:"🧑",map:[
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
".kkk..kkk."]},
 lass:{name:"Lass",icon:"👩",map:[
"...hhhh...",
"..hhhhhh..",
".hhssssh..",
".hhsbsbsh.",
".hhsssshh.",
".hh.ssss.h",
"..ggggggs.",
".gggGgggss",
".sgGgggGs.",
".sggggggs.",
".jyjyjyjy.",
".yjyjyjyj.",
"..ss..ss..",
".kkk..kkk."]},
 scottie:{name:"Scottie",icon:"\ud83d\udc15",scale:.5,map:[
"......................k...k.........",
".....................kek.kek........",
".....................kek.kek........",
"....................keeekeeek.......",
"....................keeekeeek.......",
"....................kLLLLLLLk.......",
".k..................kEEEEEEEk.......",
"kLk.................kEeeeEEEkkkkkkkk",
"kLEk...............kkEEEEwEkLLLLLLNN",
"kEEk..............kEEEEEEEEkEEEEEENN",
"kEEk..............kEEEEEEEEkEEEEEEEk",
"kEEkkkkkkkkkkkkkkkkEEEEEEEEkeEEEEEEk",
"kEELLLLLLLLLLLLLLLLEEEEkkkeekkkkkkkk",
".kLLLLLLLLLLLLLLLLLjyjyjkkeeeeeeeeek",
".kEEEEEEEEEEEEEEEEEEEkkk..keeeeeeek.",
".kEEEEEEEEEEEEEEEEEEEk.....keeeeek..",
".kEEEEEEEEEEEEEEEEEEEk......keeek...",
".kEEEEEEEEEEEEEEEEEEEk.......kkk....",
".keeeeeeeeeeeeeeeeeeek..............",
".keeeeeeeeeeeeeeeeeeek..............",
".keeeeeeeeeeeeeeeeeeek..............",
"..keeekkeeekkeeekeeek...............",
"..keeekkeeekkeeekeeek...............",
"...kkk..kkk..kkk.kkk................"]}
};
let HERO=HEROES[load("hero","lad")]?HEROES[load("hero","lad")].map:HEROES.lad.map;
function setHero(k){if(!HEROES[k])return;save("hero",k);HERO=HEROES[k].map;if(typeof cloudPush==="function")cloudPush()}
function heroKey(){const k=load("hero","lad");return HEROES[k]?k:"lad"}
function heroScale(){return HEROES[heroKey()].scale||1}
const HATMAPS={crown:["y.y.y.y","yyyyyyy"],wizard:["...j...","..jjj..",".jjjjj.","jjjjjjj"],cap:["..rrrr.",".rrrrrr","rrrrrrrr"],halo:["yyyyyyy","y.....y"]};

// ---------- IMAGE SPRITES (art/sprites/*.png, fallback to pixel grids) ----------
const IMG={};const IMG_MISSING={};
function spriteImg(key){if(IMG[key])return IMG[key].complete&&IMG[key].naturalWidth?IMG[key]:null;if(IMG_MISSING[key])return null;const im=new Image();im.onerror=()=>{IMG_MISSING[key]=true};im.onload=()=>{document.dispatchEvent(new CustomEvent("spriteload",{detail:key}))};im.src="art/sprites/"+key+".png";IMG[key]=im;return null}
function drawSprite(c,key,cx,bottom,maxW,maxH,flip){const im=spriteImg(key);if(!im)return false;const s=Math.min(maxW/im.naturalWidth,maxH/im.naturalHeight);const w=im.naturalWidth*s,h=im.naturalHeight*s;c.save();c.imageSmoothingEnabled=false;if(flip){c.translate(cx,0);c.scale(-1,1);c.drawImage(im,-w/2,bottom-h,w,h)}else c.drawImage(im,cx-w/2,bottom-h,w,h);c.restore();return true}
["lad","lass","scottie"].forEach(h=>["idle","attack","hit","win"].forEach(p=>spriteImg(h+"_"+p)));
["tome","scarcity","shifter","surplus","midpoint","wedge","monopolist","externality","deflator","moocher","benchwarmer","cashbox","dropoff"].forEach(b=>["idle","cast","hit","dead"].forEach(p=>spriteImg(b+"_"+p)));
const WALK={};["lad","lass","scottie"].forEach(h=>["down","left","right","up"].forEach(d=>[0,1,2].forEach(f=>{const im=new Image();im.src=`art/walk/${h}_${d}_${f}.png`;WALK[`${h}_${d}_${f}`]=im})));
const BG={};for(let i=1;i<=12;i++){const im=new Image();im.src="art/bg/"+i+".jpg";BG[i]=im}
const FX={};["poison","slash","crit","shield","rune","heal","chain","chest"].forEach(n=>{const im=new Image();im.src="art/fx/"+n+".png";FX[n]=im});
function fxSprite(name,x,y,size,ms){const f=$("#fx");if(!f||!FX[name])return;const e=document.createElement("img");e.src=FX[name].src;e.className="fxs";e.style.cssText=`left:${x}%;top:${y}%;width:${size}%;animation-duration:${ms}ms`;f.appendChild(e);setTimeout(()=>e.remove(),ms+50)}
const PX=6;
const BOSS_VARIANTS={};
function bossMaps(id){if(BOSS_VARIANTS[id])return BOSS_VARIANTS[id];const base=BOSS_SPRITES[id];if(!base)return null;
  const eyesRows=base.map((r,i)=>/w[bw]w|wb|bw/.test(r)?i:-1).filter(i=>i>=0);
  const cast=base.map((r,i)=>eyesRows.includes(i)?r.replace(/w/g,"x").replace(/b/g,"X"):r);
  const blink=base.map((r,i)=>eyesRows.includes(i)?r.replace(/[wb]/g,"k"):r);
  const hit=base.map(r=>r.replace(/[^.k]/g,"w"));
  const h=base.length,cut=Math.floor(h*0.4);
  const dead=base.map((r,i)=>i<cut?".".repeat(r.length):base[i-cut]).map(r=>r.replace(/[wW]/g,"e").replace(/b/g,"k"));
  return BOSS_VARIANTS[id]={idle:base,cast,blink,hit,dead}}
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
  const bgImg=Scene.chapterId&&BG[Scene.chapterId]&&BG[Scene.chapterId].complete&&BG[Scene.chapterId].naturalWidth?BG[Scene.chapterId]:null;
  if(bgImg){c.drawImage(bgImg,-20,-20,W+40,H+40);c.fillStyle="rgba(13,26,58,.22)";c.fillRect(-20,-20,W+40,H+40)}
  else{
  // JRPG battle backdrop: dusk sky band over a slice of the campus overworld
  const g=c.createLinearGradient(0,0,0,70);g.addColorStop(0,"#0d1a3a");g.addColorStop(1,"#2d4f9d");c.fillStyle=g;c.fillRect(-20,-20,W+40,90);
  Scene.stars.forEach(s=>{if(s.y>60)return;const a=.4+.6*Math.abs(Math.sin(Scene.t/40+s.tw));c.fillStyle=`rgba(255,240,200,${a})`;c.fillRect(Math.floor(s.x/3)*3,Math.floor(s.y/3)*3,3,3)});
  c.fillStyle="#ffd9a0";c.fillRect(292,26,26,26);c.fillStyle="#e8b880";c.fillRect(300,32,8,8);
  if(!Scene.bg||(!Scene.bgTiled&&tilesReady)){Scene.bg=document.createElement("canvas");Scene.bg.width=256;Scene.bg.height=224;drawCampus(Scene.bg.getContext("2d"),new Set(),0);Scene.bgTiled=tilesReady}
  c.save();c.imageSmoothingEnabled=false;
  const vx=Scene.chapter&&CAMPUS.spots[Scene.chapterId]?CAMPUS.spots[Scene.chapterId].x:118,vy=Scene.chapter&&CAMPUS.spots[Scene.chapterId]?CAMPUS.spots[Scene.chapterId].y:118;
  // perspective slices: draw rows of the map wider toward the bottom
  for(let row=0;row<130;row+=2){const t=row/130;const scale=1.2+t*1.6;const srcW=W/scale,srcH=2/scale;c.drawImage(Scene.bg,Math.max(0,Math.min(256-srcW,vx-srcW/2)),Math.max(0,Math.min(224-srcH,vy-60+row/2.2)),srcW,srcH,-20,70+row,W+40,2.5)}
  c.restore();
  c.fillStyle="rgba(13,26,58,.55)";c.fillRect(-20,70,W+40,130);
  }
  const fogN=Scene.chapter&&Scene.chapter.move==="fog"?10:4;
  for(let i=0;i<fogN;i++){c.fillStyle=`rgba(123,220,90,${.05+.03*i})`;const fx=(Scene.t*(0.3+i*0.2))%(W+120)-60;c.fillRect(fx,H-40-(i>3?i*8:0)+i*5,120,10)}
  // hero
  const heroPose=Scene.heroPose||"idle";
  if(!drawSprite(c,heroKey()+"_"+heroPose,58,H-26,80,92)){const hs=4*heroScale();drawMap(c,HERO,30,H-30-HERO.length*hs,hs)}
  if(S.hat&&HATMAPS[S.hat]&&!spriteImg(heroKey()+"_idle")){const hm=HATMAPS[S.hat];const dog=heroKey()==="scottie";const hs=4*heroScale();const top=H-30-HERO.length*hs;drawMap(c,hm,dog?30+22*hs:30+(10-hm[0].length)*2,dog?top+1*hs-hm.length*4+(S.hat==="halo"?-10:2):top-hm.length*4+(S.hat==="halo"?-10:4),4)}
  // tome
  const bm=Scene.chapterId?bossMaps(Scene.chapterId):null;
  const M=bm||{idle:TOME_IDLE,cast:TOME_CAST,blink:TOME_BLINK,hit:TOME_HIT,dead:TOME_DEAD};
  let map=M.idle;let bob=Math.sin(Scene.t/28)*2;const pal=(Scene.chapter&&!bm)?Object.assign({},PAL,Scene.chapter.pal):PAL;
  if(Scene.dead)map=M.dead,bob=0;
  else if(Scene.state==="hit"){map=Scene.stateT<8?M.hit:M.idle;if(Scene.stateT>14)Scene.state="idle"}
  else if(Scene.state==="cast"){map=M.cast;bob=Math.sin(Scene.t/20)*1.5;c.fillStyle=`rgba(255,92,92,${.15+.1*Math.sin(Scene.t/5)})`;c.beginPath();c.arc(180,100,80,0,6.28);c.fill()}
  else{if(Scene.t%140<6)map=M.blink}
  if(!Scene.dead){c.fillStyle=`rgba(123,220,90,${.12+.06*Math.sin(Scene.t/10)})`;c.beginPath();c.ellipse(180,170,60,8,0,0,6.28);c.fill()}
  const mv=Scene.chapter&&!Scene.dead?Scene.chapter.move:null;
  let tx=180-12*PX,ty=28+bob,sc=PX;
  const bossKey=Scene.chapterId?CHAPTERS[Scene.chapterId].sprite:"tome";
  const bossPose=Scene.dead?"dead":Scene.state==="hit"&&Scene.stateT<10?"hit":Scene.state==="cast"?"cast":"idle";
  let bx=200;if(mv==="slide")bx+=Math.sin(Scene.t/40)*6;
  const bossBob=Scene.dead?0:bob;
  if(drawSprite(c,bossKey+"_"+bossPose,bx,H-22+bossBob*0.5,200,150,true)){
    if(Scene.state==="hit"&&Scene.stateT<6){c.save();c.globalCompositeOperation="source-atop";c.fillStyle="rgba(255,255,255,.55)";c.fillRect(bx-110,0,220,H);c.restore()}
    c.restore();
    if(Scene.crit>0){c.fillStyle=`rgba(255,255,255,${Scene.crit/12})`;c.fillRect(-20,-20,W+40,H+40);Scene.crit--}
    Scene.parts=Scene.parts.filter(p=>p.l>0);Scene.parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.25;p.l--;c.fillStyle=p.col;c.globalAlpha=Math.min(1,p.l/15);c.fillRect(Math.floor(p.x/3)*3,Math.floor(p.y/3)*3,4,4)});c.globalAlpha=1;
    return;
  }
  c.save();
  if(mv==="slide")tx+=Math.sin(Scene.t/22)*45;
  if(mv==="grow"){const s=1+.12*Math.sin(Scene.t/16);c.translate(180,100);c.scale(s,s);c.translate(-180,-100)}
  if(mv==="shrink"){const s=.85+.1*Math.sin(Scene.t/12);c.translate(180,100);c.scale(s,s);c.translate(-180,-100)}
  if(mv==="spin"){c.translate(180,100);c.rotate(Math.sin(Scene.t/18)*.25);c.translate(-180,-100)}
  if(mv==="flicker"&&Math.random()<.08)c.globalAlpha=.35;
  if(mv==="split"){const off=8+6*Math.sin(Scene.t/10);drawMap(c,map,tx-off,ty,sc,pal,0,12);drawMap(c,map,tx+off,ty,sc,pal,12,24);c.fillStyle="#ffb347";c.fillRect(178,ty+20,4,80)}
  else drawMap(c,map,tx,ty,sc,pal);
  if(mv==="crack"&&!bm){c.strokeStyle="#000";c.lineWidth=3;c.beginPath();c.moveTo(tx+12*PX,ty+6);for(let i=1;i<12;i++)c.lineTo(tx+12*PX+((i%2)?6:-6),ty+6+i*13);c.stroke()}
  if(mv==="spin"&&!bm){drawMap(c,HATMAPS.crown,tx+8*PX+4,ty-12,PX,PAL)}
  c.restore();
  if(Scene.crit>0){c.fillStyle=`rgba(255,255,255,${Scene.crit/12})`;c.fillRect(-20,-20,W+40,H+40);Scene.crit--}
  Scene.parts=Scene.parts.filter(p=>p.l>0);Scene.parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.25;p.l--;c.fillStyle=p.col;c.globalAlpha=Math.min(1,p.l/15);c.fillRect(Math.floor(p.x/3)*3,Math.floor(p.y/3)*3,4,4)});c.globalAlpha=1;
}

// ---------- CLOUD SAVE + TEAM (Firebase, no personal data) ----------
// Identity = a random save code kept on the phone. No email, no login, no real names required.
let DB=null,UID=null,dbReady=false,roster=[],unsubRoster=null,cloudTimer=null;
const CLOUD_KEYS=["streak","lastDay","best","totalDmg","team","name","wins","titles","hats","hat","title","items","escaped","recapture"];
function newCode(){const A="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let s="";const r=crypto.getRandomValues(new Uint8Array(12));for(let i=0;i<12;i++)s+=A[r[i]%A.length];return "SCOT-"+s.slice(0,4)+"-"+s.slice(4,8)+"-"+s.slice(8)}
function saveCode(){let c=load("saveCode","");if(!c){c=newCode();save("saveCode",c)}return c}
function cleanCode(s){return String(s||"").toUpperCase().replace(/[^A-Z0-9]/g,"").replace(/^SCOT/,"").replace(/(.{4})(.{4})(.{4})/,"SCOT-$1-$2-$3")}
function cloudDoc(){return {v:1,name:S.name||"",team:S.team||"",hero:heroKey(),hat:S.hat||"",title:S.title||"",streak:S.streak,lastDay:S.lastDay,best:S.best||{},totalDmg:S.totalDmg,wins:S.wins||{},titles:S.titles||[],hats:S.hats||[],items:S.items||{},escaped:S.escaped||null,recapture:S.recapture||0,weeks:S.weekLocal||{},
  missed:Object.fromEntries(Object.entries(S.missed||{}).sort((a,b)=>b[1]-a[1]).slice(0,40)),seen:Object.fromEntries(Object.entries(S.seen||{}).sort((a,b)=>b[1]-a[1]).slice(0,80)),updated:Date.now()}}
function applyCloud(d){if(!d)return;CLOUD_KEYS.forEach(k=>{if(d[k]!==undefined&&d[k]!==null)S[k]=d[k]});S.weekLocal=d.weeks||{};S.missed=d.missed||{};S.seen=d.seen||{};if(d.hero)save("hero",d.hero);saveAll(true);save("weekLocal",S.weekLocal);save("synced",d.updated||Date.now())}
function cloudPush(){if(!dbReady)return;clearTimeout(cloudTimer);cloudTimer=setTimeout(async()=>{try{const d=cloudDoc();await DB.doc("players/"+saveCode()).set(d);save("synced",d.updated)}catch(e){console.warn("cloud push",e)}},800)}
async function cloudPull(){if(!dbReady)return false;try{const snap=await DB.doc("players/"+saveCode()).get();if(!snap.exists)return false;const d=snap.data();if((d.updated||0)>load("synced",0)){applyCloud(d);return true}}catch(e){}return false}
async function restoreCode(code){const c=cleanCode(code);if(!/^SCOT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(c))return "That code is not the right shape.";if(!dbReady)return "Not connected. Check your signal and try again.";
  try{const snap=await DB.doc("players/"+c).get();if(!snap.exists)return "No save found for that code.";save("saveCode",c);save("synced",0);applyCloud(snap.data());watchRoster();return null}catch(e){return "Could not reach the save."}}
function watchRoster(){if(unsubRoster)unsubRoster();let q=DB.collection("players");if(S.team)q=q.where("team","==",S.team);
  unsubRoster=q.limit(200).onSnapshot(snap=>{roster=snap.docs.map(x=>Object.assign({id:x.id},x.data()));if(document.getElementById("weekly"))renderWeekly();const wb=document.querySelector("#weeklyBtn .sub");if(wb){const wt=weeklyTotals();wb.textContent="Team HP "+Math.max(0,WEEK_MAX-wt.total).toLocaleString()+" / "+WEEK_MAX.toLocaleString()+" • "+wt.rows.length+" fighter"+(wt.rows.length===1?"":"s")}},()=>{})}
(async()=>{try{
  if(typeof firebase==="undefined"||typeof FIREBASE_CONFIG==="undefined"||!FIREBASE_CONFIG.apiKey)return;
  firebase.initializeApp(FIREBASE_CONFIG);
  const cred=await firebase.auth().signInAnonymously();UID=cred.user.uid;DB=firebase.firestore();dbReady=true;
  const pulled=await cloudPull();if(!pulled)cloudPush();
  watchRoster();if(!G)home()}catch(e){console.warn("firebase off",e)}})();
async function postDamage(dmg){
  const wk=weekId();S.weekLocal[wk]=(S.weekLocal[wk]||0)+dmg;save("weekLocal",S.weekLocal);cloudPush();
}
function weeklyTotals(){const wk=weekId();const me=saveCode();if(dbReady){const rows=roster.map(r=>({name:r.name||"Someone",dmg:(r.weeks||{})[wk]||0,hat:r.hat||"",hero:r.hero||"",me:r.id===me})).filter(r=>r.dmg>0).sort((a,b)=>b.dmg-a.dmg);
    if(!rows.some(r=>r.me)&&(S.weekLocal[wk]||0)>0)rows.push({name:S.name||"You",dmg:S.weekLocal[wk],hat:S.hat,hero:heroKey(),me:true});return {rows,total:rows.reduce((a,r)=>a+r.dmg,0)}}
  const mine=S.weekLocal[wk]||0;return {rows:mine?[{name:S.name||"You",dmg:mine,hat:S.hat,hero:heroKey(),me:true}]:[],total:mine}}

// ---------- COACH PIN ----------
async function sha(s){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function teamPinHash(){if(!dbReady||!S.team)return load("coachPinLocal",null);try{const s=await DB.doc("teams/"+S.team).get();return s.exists?(s.data().pinHash||null):null}catch(e){return null}}
async function setTeamPin(pin){const h=await sha(S.team+"|"+pin);if(!dbReady||!S.team){save("coachPinLocal",h);return true}try{await DB.doc("teams/"+S.team).set({pinHash:h,created:Date.now()});return true}catch(e){return false}}
function coachGate(){wantTrack("overworld");
  if(load("coachOK","")===(S.team||"local")){coach();return}
  app.innerHTML=`<header class="title"><p class="eyebrow">Coach mode</p><h1>Coach PIN</h1><div class="tartan" aria-hidden="true"></div></header>
  <div class="card"><p class="small">${S.team?`Team <b>${esc(S.team)}</b>. `:"No team code set; this PIN only works on this phone. "}Students do not have this PIN.</p>
  <div class="field"><label class="eyebrow" for="pin">PIN</label><input type="password" id="pin" inputmode="numeric" autocomplete="off" maxlength="12" placeholder="••••"></div>
  <button class="big center" id="pinGo"><span class="lbl">UNLOCK</span></button><p class="muted small" id="pinMsg"></p></div>
  <button class="ghost center" id="home"><span class="lbl">BACK</span></button>`;
  let confirmSet=false;$("#home").onclick=home;
  $("#pinGo").onclick=async()=>{const pin=$("#pin").value.trim();const msg=$("#pinMsg");if(pin.length<4){msg.textContent="At least 4 characters.";return}
    const cur=await teamPinHash();
    if(cur===null){if(!confirmSet){confirmSet=true;msg.textContent="No coach PIN exists yet for this team. Tap UNLOCK again to make this the coach PIN. Remember it: there is no reset.";return}
      if(!(await setTeamPin(pin))){msg.textContent="Could not save the PIN. Check your signal.";return}save("coachOK",S.team||"local");SFX.loot();coach();return}
    const h=await sha(S.team+"|"+pin);if(h===cur){save("coachOK",S.team||"local");SFX.loot();coach()}else{msg.textContent="Wrong PIN.";SFX.miss()}};
}
// ---------- SEASON ARCHIVE (from each player's weekly history) ----------
function weekLabel(wk){return wk.slice(4,6)+"/"+wk.slice(6)}
function seasonRows(rows){const by={};rows.forEach(r=>Object.entries(r.weeks||{}).forEach(([wk,d])=>{by[wk]=by[wk]||{wk,dmg:0,n:0};by[wk].dmg+=d;if(d>0)by[wk].n++}));return Object.values(by).sort((a,b)=>a.wk<b.wk?-1:1)}
function seasonHTML(rows){const s=seasonRows(rows);if(!s.length)return "";const cur=weekId();const mx=Math.max(WEEK_MAX,...s.map(x=>x.dmg));
  return `<div class="card"><p class="eyebrow">Season • Tome kills by week</p>${s.map(x=>`<div class="srow"><span class="sn">${weekLabel(x.wk)}${x.wk===cur?" •":""}</span><div class="sbar"><i style="width:${Math.round(x.dmg/mx*100)}%" class="${x.dmg>=WEEK_MAX?"":"low"}"></i></div><span class="sv">${x.dmg>=WEEK_MAX?"☠":""} ${x.dmg.toLocaleString()}<small> ${x.n}</small></span></div>`).join("")}<p class="muted small">☠ = Tome slain that week. Small number = fighters. Bar full = ${WEEK_MAX.toLocaleString()}.</p></div>`}
// ---------- PRINTABLE SAVE-CODE CARDS ----------
function codeCards(){const rows=(dbReady&&roster.length?roster:[{id:saveCode(),name:S.name,hero:heroKey(),streak:S.streak}]).slice().sort((a,b)=>(a.name||"").localeCompare(b.name||""));
  const w=window.open("","_blank");if(!w){toast("Pop-up blocked");return}
  w.document.write(`<!doctype html><title>Econ Monster save codes</title><style>body{font:14px/1.3 Arial,sans-serif;margin:16px}h1{font-size:18px}.g{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.c{border:2px dashed #2d4f9d;border-radius:8px;padding:10px;break-inside:avoid}.n{font-weight:900;font-size:16px}.k{font:700 18px/1.2 Menlo,monospace;letter-spacing:.06em;margin:6px 0}.s{color:#555;font-size:12px}@media print{button{display:none}}</style>
  <h1>Escape from the Econ Monster • save codes${S.team?" • "+S.team.replace(/[<>&]/g,""):""}</h1><p class="s">Hand each student their card. Bag → LOAD SAVE on any phone restores their progress. ${new Date().toLocaleDateString()}</p><button onclick="print()">Print</button><div class="g">${rows.map(r=>`<div class="c"><div class="n">${String(r.name||"(no name)").replace(/[<>&]/g,"")}</div><div class="k">${r.id}</div><div class="s">${HEROES[r.hero]?HEROES[r.hero].name:""} • streak ${r.streak||0}</div></div>`).join("")}</div>`);w.document.close()}
// ---------- ADD TO HOME SCREEN ----------
let installEvt=null;window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installEvt=e});
function standalone(){return window.matchMedia("(display-mode: standalone)").matches||navigator.standalone===true}
function a2hsHTML(){if(standalone()||load("a2hsOff",false))return "";const visits=load("visits",0);if(visits<2)return "";
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  return `<div class="card a2hs"><p class="eyebrow">Put it on your home screen</p><p class="small">${ios?"Tap <b>Share</b> (the box with the arrow) then <b>Add to Home Screen</b>. Full screen, no browser bar.":installEvt?"One tap installs it like an app.":"Open the browser menu (⋮) and tap <b>Add to Home screen</b>."}</p><div class="two">${!ios&&installEvt?`<button class="big center" id="a2hsGo"><span class="lbl">INSTALL</span></button>`:""}<button class="ghost center" id="a2hsNo"><span class="lbl">NOT NOW</span></button></div></div>`}
function a2hsWire(){const g=$("#a2hsGo");if(g)g.onclick=async()=>{if(!installEvt)return;installEvt.prompt();const r=await installEvt.userChoice;installEvt=null;if(r&&r.outcome==="accepted")save("a2hsOff",true);home()};const n=$("#a2hsNo");if(n)n.onclick=()=>{save("a2hsOff",true);home()}}
save("visits",load("visits",0)+1);

// ---------- UI ----------
var G=null,timerId=null;
const app=document.getElementById("app");
const $=s=>document.querySelector(s);
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("on");setTimeout(()=>t.classList.remove("on"),1600)}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function rankFor(p){let r=RANKS[0][1];RANKS.forEach(([t,n])=>{if(p>=t)r=n});return r}
function hpBar(v,max,cls=""){const segs=10,on=Math.ceil(v/max*segs);let s='<div class="hpwrap"><div class="hpbar '+cls+'" role="img" aria-label="HP '+v+'">';for(let i=0;i<segs;i++)s+=`<i class="${i<on?(on<=3?"on low":"on"):""}"></i>`;return s+'</div></div>'}
function heartsHTML(h){let s='<div class="hearts" aria-label="'+h+' lives">';for(let i=0;i<3;i++)s+=`<span class="heart ${i<h?"":"off"}"></span>`;return s+'</div>'}
function sceneHTML(){return `<div class="scene"><canvas id="scene" width="360" height="200"></canvas><div class="scan"></div><div id="fx"></div>${(!S.muted&&!Music.current()&&!pendingTrackShown())?`<div class="sndHint" id="sndHint">\ud83c\udfb5 tap anywhere for music</div>`:""}<button class="mute" id="mute" aria-label="toggle sound">${S.muted?"🔇":"🔊"}</button></div>`}
function mountScene(ch){const cv=$("#scene");if(cv)sceneInit(cv);Scene.heroPose="idle";Scene.chapter=ch||null;Scene.chapterId=ch?Object.keys(CHAPTERS).find(k=>CHAPTERS[k]===ch):null;const m=$("#mute");if(m)m.onclick=()=>{S.muted=!S.muted;save("muted",S.muted);m.textContent=S.muted?"🔇":"🔊";if(!S.muted)SFX.click()}}
function sessionWins(s){return S.wins[s]||0}
function freed(s){return sessionWins(s)>=3}
function checkEscape(){
  const today=dayKey();
  if(S.lastDay&&S.streak>0&&daysBetween(S.lastDay,today)>1&&!S.escaped){S.escaped={streak:S.streak,when:today};S.streak=0;S.recapture=0;saveAll();return true}
  return false;
}

function home(){
  if(!load("hero",null)){pickHero();return}
  G=null;clearInterval(timerId);Scene.dead=false;Scene.state="idle";
  const justEscaped=checkEscape();
  const today=dayKey(),played=S.lastDay===today,dn=questDay();const wt=weeklyTotals();
  app.innerHTML=`
  <div class="titleCard" role="img" aria-label="The possessed Tome looms over Highland High"></div>
  <header class="title"><p class="eyebrow">Highland High \u2022 Home of the Scots</p><h1>Escape from<br>the Econ Monster</h1><div class="tartan" aria-hidden="true"></div></header>
  ${S.escaped?`<div class="taunt cast"><b>THE TOME ESCAPED</b> with your ${S.escaped.streak}-day streak${justEscaped?"":""}. Win ${2-S.recapture} more daily quest${2-S.recapture===1?"":"s"} in a row to recapture it.</div>`:`<div class="taunt">“${esc(TAUNTS[dn%TAUNTS.length])}”</div>`}
  <div class="stats">
    <div><div class="n">${S.streak}</div><div class="l">Streak</div></div>
    <div><div class="n">${Math.round(S.totalDmg)}</div><div class="l">Damage</div></div>
    <div><div class="n rk">${rankFor(S.totalDmg)}</div><div class="l">Rank</div></div>
  </div>
  ${a2hsHTML()}
  ${S.title?`<p class="ptitle">${S.hat?HATS[S.hat]+" ":""}${esc(S.name||"You")}, <em>${esc(S.title)}</em></p>`:""}
  <button class="big pulse" id="startDaily"><span class="lbl">${played?"REPLAY QUEST #"+dn:"\u25b6 DAILY QUEST #"+dn}</span><span class="sub">5 questions + chapter boss • Sessions 1–${TAUGHT}</span></button>
  <button class="ghost" id="weeklyBtn"><span class="lbl">WEEKLY BOSS</span><span class="sub">Team HP ${Math.max(0,WEEK_MAX-wt.total).toLocaleString()} / ${WEEK_MAX.toLocaleString()} • ${wt.rows.length} fighter${wt.rows.length===1?"":"s"}</span></button>
  <div class="two"><button class="ghost center" id="mapBtn"><span class="lbl">CAMPUS MAP</span></button><button class="ghost center" id="rivalBtn"><span class="lbl">RIVAL</span></button></div>
  <button class="ghost center" id="storyBtn"><span class="lbl">\ud83d\udcd6 THE STORY${load("storySeen",false)?"":" \u2022 NEW"}</span></button>
  <div class="two"><button class="ghost center" id="startPractice"><span class="lbl">PRACTICE</span></button><button class="ghost center" id="bagBtn"><span class="lbl">BAG (${(S.items.skip||0)+(S.items.second||0)})</span></button></div>
  <div class="field"><label class="eyebrow" for="pname">Game name (a nickname — not your real name)</label><input type="text" id="pname" value="${esc(S.name)}" placeholder="First name" maxlength="20"></div>
  <div class="field"><label class="eyebrow" for="team">Team code from your coach</label><input type="text" id="team" value="${esc(S.team)}" placeholder="HHS-ECON" maxlength="16"></div>
  <button class="ghost center" id="coachBtn"><span class="lbl">COACH MODE</span></button>
  <p class="footer">Questions from DemiDec Section Exams 1–3 and the session case studies.</p>`;
  wantTrack("overworld");
  $("#startDaily").onclick=()=>{SFX.click();start({practice:false})};$("#startPractice").onclick=()=>{SFX.click();start({practice:true})};
  $("#weeklyBtn").onclick=()=>{SFX.click();weekly()};$("#storyBtn").onclick=()=>{SFX.click();story()};$("#mapBtn").onclick=()=>{SFX.click();campus()};$("#rivalBtn").onclick=()=>{SFX.click();rival()};$("#bagBtn").onclick=()=>{SFX.click();bag()};
  $("#coachBtn").onclick=()=>{SFX.click();coachGate()};
  a2hsWire();
  $("#pname").oninput=e=>{S.name=e.target.value.trim();save("name",S.name);cloudPush()};
  $("#team").oninput=e=>{S.team=e.target.value.trim().toUpperCase();e.target.value=S.team;save("team",S.team);cloudPush();if(dbReady)watchRoster()};
}

let attractT=null;function attract(){clearInterval(attractT);attractT=setInterval(()=>{if(!G&&Scene.cv&&Scene.cv.isConnected){sceneSet("cast");setTimeout(()=>{if(!G)sceneSet("idle")},1200)}else clearInterval(attractT)},5000)}
function start(o){clearInterval(attractT);if(!o.__tut&&!load("tutSeen",false)){tutorial(()=>start(Object.assign({__tut:true},o)));return}
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
  <div class="two">${S.items.skip>0&&!isBoss?`<button class="ghost center item" id="useSkip">${icon("skip","sm")}<span class="lbl">SKIP (${S.items.skip})</span></button>`:""}${S.items.second>0&&G.hearts<3&&!G.usedSecond?`<button class="ghost center item" id="useSecond">${icon("second","sm")}<span class="lbl">2ND CHANCE (${S.items.second})</span></button>`:""}</div>
  <button class="ghost center" id="quit">Flee to campus</button>`;
  window.scrollTo({top:0});wantTrack(isBoss?"boss":"battle");
  mountScene((isBoss||G.session)?G.chapter:null);sceneSet(isBoss?"cast":"idle");
  if(isBoss){const f=$("#fx");if(f){const e=document.createElement("div");e.className="bossIntro";e.innerHTML=`<span>${esc(G.chapter.name)}</span><small>appears</small>`;f.appendChild(e);fxSprite("rune",38,55,44,2200);setTimeout(()=>e.remove(),2200);SFX.bossIn()}}
  $("#quit").onclick=home;
  const sk=$("#useSkip");if(sk)sk.onclick=()=>{S.items.skip--;save("items",S.items);G.log.push("⬜");G.i++;SFX.click();toast("Skipped");G.i>G.n?result():fight()};
  const sc=$("#useSecond");if(sc)sc.onclick=()=>{S.items.second--;save("items",S.items);G.hearts++;G.usedSecond=true;SFX.loot();fxSprite("heal",6,20,32,900);toast("Heart restored");sc.remove();document.querySelector(".hearts").outerHTML=heartsHTML(G.hearts)};
  const ans=$("#answer");
  if(q.type==="mc"){ans.className="opts";ans.innerHTML=q.opts.map((o,k)=>`<button class="opt" data-k="${k}"><span class="key">${"ABCD"[k]}</span><span>${esc(o)}</span></button>`).join("");ans.querySelectorAll("button").forEach(b=>b.onclick=()=>answer(+b.dataset.k))}
  else if(q.type==="two"){ans.className="two";ans.innerHTML=q.opts.map((o,k)=>`<button class="opt" data-k="${k}">${k===0?"◀ ":""}${esc(o)}${k===1?" ▶":""}</button>`).join("");ans.querySelectorAll("button").forEach(b=>b.onclick=()=>answer(+b.dataset.k));
    let sx=null;ans.addEventListener("touchstart",e=>{sx=e.touches[0].clientX},{passive:true});ans.addEventListener("touchend",e=>{if(sx==null||G.done)return;const dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>60)answer(dx<0?0:1);sx=null})}
  else{ans.innerHTML=`<input type="number" inputmode="decimal" step="any" id="num" placeholder="Type a number"><button class="big center" id="go"><span class="lbl">STRIKE</span></button>`;
    const go=()=>{const v=parseFloat($("#num").value);if(isNaN(v))return;answer(v)};$("#go").onclick=go;$("#num").onkeydown=e=>{if(e.key==="Enter")go()};setTimeout(()=>$("#num").focus(),50)}
  let left=limit;const tEl=$("#timer");
  timerId=setInterval(()=>{left--;tEl.textContent=left;if(left<=5){tEl.classList.add("low");if(left<=3)SFX.tick()}if(left<=0){clearInterval(timerId);answer(null)}},1000);
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
    G.combo++;G.best=Math.max(G.best,G.combo);const critWin=q.type==="num"?10:q.type==="two"?4:6;crit=secs<critWin;
    const speed=crit?2.0:secs<critWin*2?1.3:1.0,base=isBoss?35:20;
    dealt=Math.round(base*speed*(1+0.1*(G.combo-1)));
    S.seen=S.seen||{};S.seen[q.id]=(S.seen[q.id]||0)+1;save("seen",S.seen);G.tome=Math.max(isBoss?0:1,G.tome-dealt);G.dmg+=dealt;G.log.push("🟩");sceneSet("hit");fxSprite(crit?"crit":"slash",56,25,crit?44:34,crit?700:450);Scene.heroPose="attack";setTimeout(()=>{if(Scene.heroPose==="attack")Scene.heroPose="idle"},700);burst(crit?50:24,crit?"#ffffff":"#ffb347");
    if(crit){G.crits++;Scene.crit=12;Scene.shake=18;fx("CRITICAL −"+dealt,"crit");SFX.crit()}else{fx("−"+dealt,"hit");SFX.hit()}
    taunt=SULK[Math.floor(Math.random()*SULK.length)];
    if(G.tome<=0){setTimeout(()=>{sceneSet("dead");burst(60,"#7bdc5a");SFX.death()},300)}
  }else{
    const broke=G.combo>1;G.combo=0;G.hearts--;G.log.push("🟥");const heal=isBoss?15:8;G.tome=Math.min(TOME_MAX,G.tome+heal);
    S.missed[q.id]=(S.missed[q.id]||0)+1;save("missed",S.missed);S.seen=S.seen||{};S.seen[q.id]=(S.seen[q.id]||0)+1;save("seen",S.seen);sceneSet("cast");Scene.heroPose="hit";setTimeout(()=>{if(Scene.heroPose==="hit")Scene.heroPose="idle"},900);burst(14,"#ff5c5c");fx("+"+heal,"heal");SFX.miss();if(broke){setTimeout(SFX.combo,250);fx("COMBO BROKEN","broke")}
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
  mountScene(G.chapter);Scene.dead=won;Scene.heroPose=won?"win":"hit";if(loot)setTimeout(()=>fxSprite("chest",40,30,36,1400),600);if(!won)sceneSet("cast");
  if(!S.muted){Music.stop();setTimeout(()=>{Music.play(won?"victory":"defeat",{then:()=>{if(loot)Music.sfx("loot");setTimeout(()=>{if(!G||document.querySelector("#copy"))Music.play("overworld")},loot?900:200)}})},won?400:200)}
  $("#copy").onclick=()=>{const txt=$("#card").textContent;const fb=()=>{const r=document.createRange();r.selectNodeContents($("#card"));const s=getSelection();s.removeAllRanges();s.addRange(r);toast("Select & copy")};try{navigator.clipboard.writeText(txt).then(()=>toast("Copied!")).catch(fb)}catch(e){fb()}};
  $("#again").onclick=()=>start({practice:true});$("#home").onclick=home;
}



// ---------- HERO PICKER ----------
function pickHero(){
  app.innerHTML=`<header class="title"><p class="eyebrow">Choose your Scot</p><h1>Who faces<br>the Tome?</h1><div class="tartan" aria-hidden="true"></div></header>
  <div class="heroes">${Object.entries(HEROES).map(([k,h])=>`<button class="ghost heroBtn ${heroKey()===k?"on":""}" data-h="${k}"><canvas width="120" height="80" data-c="${k}"></canvas><span class="lbl">${esc(h.name).toUpperCase()}</span></button>`).join("")}</div>
  <p class="muted small" style="text-align:center">You can change this later in the Bag.</p>
  <button class="big center" id="go"><span class="lbl">▶ ONWARD</span></button>`;
  document.querySelectorAll("canvas[data-c]").forEach(cv=>{const c=cv.getContext("2d");c.imageSmoothingEnabled=false;const draw=()=>{c.clearRect(0,0,120,80);if(!drawSprite(c,cv.dataset.c+"_idle",60,78,110,76)){const h=HEROES[cv.dataset.c];const m=h.map;const s=Math.floor(Math.min(110/m[0].length,74/m.length));drawMap(c,m,(120-m[0].length*s)/2,(80-m.length*s)/2,s)}};draw();const onl=e=>{if(e.detail===cv.dataset.c+"_idle"){draw();document.removeEventListener("spriteload",onl)}};document.addEventListener("spriteload",onl);setTimeout(draw,1500);setTimeout(draw,4000)});
  document.querySelectorAll(".heroBtn").forEach(b=>b.onclick=()=>{setHero(b.dataset.h);SFX.click();document.querySelectorAll(".heroBtn").forEach(x=>x.classList.toggle("on",x===b))});
  $("#go").onclick=()=>{if(!load("hero",null))setHero("lad");SFX.loot();home()};
}

// ---------- COACH MODE ----------
function teamRows(){
  if(dbReady&&roster.length)return roster.map(r=>({name:r.name||"Someone",hero:r.hero||"",streak:r.streak||0,updated:r.updated||0,missed:r.missed||{},seen:r.seen||{},weeks:r.weeks||{}}));
  const imported=load("coachImports",[]);
  const me={name:(S.name||"You")+" (this phone)",hero:heroKey(),streak:S.streak,updated:Date.now(),missed:S.missed,seen:S.seen||{},weeks:S.weekLocal};
  return [me,...imported];
}
function exportCode(){const d={n:S.name||"anon",h:heroKey(),s:S.streak,m:Object.fromEntries(Object.entries(S.missed).sort((a,b)=>b[1]-a[1]).slice(0,40)),e:Object.fromEntries(Object.entries(S.seen||{}).slice(0,80)),w:S.weekLocal,t:Date.now()};return "EMC1."+btoa(unescape(encodeURIComponent(JSON.stringify(d)))).replace(/=+$/,"")}
function importCode(code){const m=code.trim().match(/^EMC1\.([A-Za-z0-9+/]+)$/);if(!m)return null;try{const d=JSON.parse(decodeURIComponent(escape(atob(m[1]))));return {name:d.n,hero:d.h,streak:d.s,missed:d.m||{},seen:d.e||{},weeks:d.w||{},updated:d.t||Date.now()}}catch(e){return null}}
function coach(){
  wantTrack("overworld");
  const rows=teamRows();const byId=Object.fromEntries(BANK.map(q=>[q.id,q]));BOSSES.forEach(b=>byId[b.id]=b);
  // aggregate misses by question and by session
  const missQ={},seenQ={},sessMiss={},sessSeen={};
  rows.forEach(r=>{Object.entries(r.missed).forEach(([id,n])=>{missQ[id]=(missQ[id]||0)+n;const q=byId[id];if(q){sessMiss[q.s]=(sessMiss[q.s]||0)+n}});Object.entries(r.seen).forEach(([id,n])=>{seenQ[id]=(seenQ[id]||0)+n;const q=byId[id];if(q){sessSeen[q.s]=(sessSeen[q.s]||0)+n}})});
  const top=Object.entries(missQ).sort((a,b)=>b[1]-a[1]).slice(0,12).map(([id,n])=>({q:byId[id],n,rate:seenQ[id]?Math.round(n/seenQ[id]*100):100})).filter(x=>x.q);
  const sess=Object.keys(SESSIONS).filter(s=>+s<=TAUGHT).map(s=>({s:+s,name:SESSIONS[s],seen:sessSeen[s]||0,miss:sessMiss[s]||0,acc:sessSeen[s]?Math.round((1-(sessMiss[s]||0)/sessSeen[s])*100):null}));
  const wk=weekId();const now=Date.now();
  const people=rows.map(r=>({...r,wkDmg:r.weeks[wk]||0,days:Math.floor((now-r.updated)/86400000)})).sort((a,b)=>b.wkDmg-a.wkDmg);
  const label=q=>{const t=q.term||q.spell||"";const pg=(q.src||"").match(/RG p\.([\d;, ]+)/);if(SESSIONS[q.s]===t)return "RG p."+(pg?pg[1].trim():"?");return t};
  const review=top.slice(0,6).map(x=>label(x.q)+(x.q.src?" ("+x.q.src.replace(/DemiDec /,"")+")":"")).join("\n");
  app.innerHTML=`<header class="title"><p class="eyebrow">Coach mode • ${dbReady?(S.team?"team "+esc(S.team):"all players"):"this phone"+(load("coachImports",[]).length?" + "+load("coachImports",[]).length+" imported":"")}</p><h1>Where the Tome<br>is winning</h1><div class="tartan" aria-hidden="true"></div></header>
  <div class="card"><p class="eyebrow">Today’s review list</p>${top.length?`<ol class="review">${top.slice(0,6).map(x=>`<li><b>${esc(x.q.term||x.q.spell)}</b> <span class="muted small">${esc(SESSIONS[x.q.s])} • missed ${x.n}× • ${x.rate}% miss rate</span><div class="small">${esc(x.q.q)}</div></li>`).join("")}</ol><div class="two"><button class="big center" id="copyReview"><span class="lbl">COPY REVIEW</span></button><button class="ghost center" id="csvBtn"><span class="lbl">COPY CSV</span></button></div>`:"<p class='muted'>No misses logged yet. Play a quest or import a student code below.</p>"}</div>
  <div class="card"><p class="eyebrow">Accuracy by session</p>${sess.map(x=>`<div class="srow"><span class="sn">${x.s}. ${esc(x.name)}</span><div class="sbar"><i style="width:${x.acc==null?0:x.acc}%" class="${x.acc!=null&&x.acc<70?"low":""}"></i></div><span class="sv">${x.acc==null?"—":x.acc+"%"}<small> ${x.seen}</small></span></div>`).join("")}<p class="muted small">Bar = correct rate. Small number = attempts.</p></div>
  <div class="card"><p class="eyebrow">Roster • week of ${wk.slice(4,6)}/${wk.slice(6)}</p>${people.map(p=>`<div class="rrow"><span class="pos">${p.days>2?"💤":"⚔️"}</span><span class="rn">${HEROES[p.hero]?HEROES[p.hero].icon+" ":""}${esc(p.name)} <small class="muted">🔥${p.streak}${p.days>0?" • "+p.days+"d ago":""}</small></span><span class="rd">${p.wkDmg.toLocaleString()}</span></div>`).join("")}<p class="muted small">💤 = no fight in 3+ days.</p></div>
  ${dbReady?"":`<div class="card"><p class="eyebrow">Pool without Firebase</p><p class="small">Students tap <b>Bag → Copy my coach code</b> and send it to you. Paste codes here.</p><input type="text" id="imp" placeholder="EMC1...." autocapitalize="off"><div class="two"><button class="ghost center" id="impBtn"><span class="lbl">IMPORT</span></button><button class="ghost center" id="impClear"><span class="lbl">CLEAR IMPORTS</span></button></div><p class="muted small" id="impMsg"></p></div>`}
  ${seasonHTML(rows)}
  <div class="two"><button class="ghost center" id="cardsBtn"><span class="lbl">SAVE CODE CARDS</span></button><button class="ghost center" id="lockBtn"><span class="lbl">LOCK COACH MODE</span></button></div>
  <button class="ghost center" id="home"><span class="lbl">BACK</span></button>`;
  $("#home").onclick=home;$("#cardsBtn").onclick=codeCards;$("#lockBtn").onclick=()=>{save("coachOK","");toast("Locked");home()};
  const ce=$("#csvBtn");if(ce)ce.onclick=()=>{const wk=weekId();const lines=[["name","hero","streak","week_damage","days_since_fight","top_missed"].join(",")];
    people.forEach(p=>{const tm=Object.entries(p.missed).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id,n])=>{const q=byId[id];return (q?label(q):id)+" x"+n}).join("; ");lines.push([p.name,p.hero,p.streak,p.wkDmg,p.days,tm].map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(","))});
    lines.push("");lines.push("question_id,session,term,missed,seen,miss_rate");
    Object.entries(missQ).sort((a,b)=>b[1]-a[1]).forEach(([id,n])=>{const q=byId[id];if(!q)return;lines.push([id,q.s,'"'+label(q).replace(/"/g,'""')+'"',n,seenQ[id]||0,seenQ[id]?Math.round(n/seenQ[id]*100):100].join(","))});
    const txt=lines.join("\n");try{navigator.clipboard.writeText(txt).then(()=>toast("CSV copied")).catch(()=>toast("Copy failed"))}catch(e){toast("Copy failed")}};
  const cr=$("#copyReview");if(cr)cr.onclick=()=>{const txt="Econ review — "+new Date().toLocaleDateString()+"\n"+review;try{navigator.clipboard.writeText(txt).then(()=>toast("Copied")).catch(()=>toast("Copy failed"))}catch(e){toast("Copy failed")}};
  const ib=$("#impBtn");if(ib)ib.onclick=()=>{const r=importCode($("#imp").value);if(!r){$("#impMsg").textContent="That code did not parse.";return}const arr=load("coachImports",[]).filter(x=>x.name!==r.name);arr.push(r);save("coachImports",arr);SFX.loot();coach()};
  const ic=$("#impClear");if(ic)ic.onclick=()=>{save("coachImports",[]);coach()};
}

// ---------- TUTORIAL ----------
function tutorial(then){
  if(load("tutSeen",false)){then();return}
  const steps=[
    {t:"How to hurt the Tome",b:"Answer right and you hit. Answer fast and you land a <b>CRITICAL</b> for double damage: under <b>6 seconds</b> on multiple choice, 4 on swipes, 10 on math."},
    {t:"Combos",b:"Each correct answer in a row raises your combo and your damage. One miss breaks it, costs a heart, and heals the Tome."},
    {t:"The boss round",b:"The Tome holds at <b>1 HP</b> until the chapter boss appears. The boss casts a trap from the test. Dodge it by answering the trap right."},
    {t:"Three hearts",b:"Lose all three and the Tome devours you. Items from your Bag (Skip, Second Chance) can save a run."}
  ];
  let i=0;const ov=document.createElement("div");ov.className="tut";document.body.appendChild(ov);
  const render=()=>{const s=steps[i];ov.innerHTML=`<div class="card tutcard"><p class="eyebrow">Tutorial ${i+1}/${steps.length}</p><h2>${s.t}</h2><p>${s.b}</p><button class="big center" id="tutNext"><span class="lbl">${i<steps.length-1?"NEXT \u25b6":"FIGHT"}</span></button><button class="ghost center small" id="tutSkip"><span class="lbl">SKIP</span></button></div>`;
    $("#tutNext").onclick=()=>{SFX.click();if(i<steps.length-1){i++;render()}else done()};$("#tutSkip").onclick=done};
  const done=()=>{save("tutSeen",true);ov.remove();then()};render();
}
// ---------- STORY ----------
function story(){
  save("storySeen",true);
  const pages=[
    {t:"Chapter 0: The Tome",b:"Every fall the Highland Academic Decathlon team receives one copy of the USAD Economics Resource Guide. This year's copy arrived early, unmarked, and already warm.<br><br>By Monday it had read itself. By Tuesday it had opinions."},
    {t:"Possession",b:"The Tome knows every curve, every elasticity, every tax wedge in the book, and it has decided the campus is a market it would like to corner.<br><br>It shifted the snack bar's supply curve left. It priced the parking lot like a monopolist. It put a ceiling on the water fountains and a floor on the vending machines. The Quad is in disequilibrium."},
    {t:"The Chapters Break Loose",b:"Twelve chapters tore free and took up residence around the school, each with its favorite trap:<br><br><b>Scarcity</b> emptied the Snack Bar. <b>The Shifter</b> calls every movement on the Quad a shift. <b>Surplus & Shortage</b> fight over a price line in the Gym. <b>Midpoint</b> cracked the Library by dividing by the starting value. <b>The Wedge</b> split the Front Office. <b>The Monopolist</b> runs the only bus in the Parking Lot. <b>The Externality</b> fogs the Bus Loop. <b>The Deflator</b> leaks on the Ball Fields. <b>The Benchwarmer</b> miscounts the jobless on the Bleachers. <b>The ASB Cashbox</b> prints Scot Bucks in the Student Store. <b>The Drop-Off Line</b> owns Charger Ave and counts only money. <b>The Moocher</b> rides the roads for free from the Art Room."},
    {t:"Why You",b:"Only a Scot who knows the material can hurt it. A correct answer lands as a hit. A fast correct answer lands as a critical. A wrong answer feeds it, because a wrong answer is exactly what it wants you to carry into the exam in February.<br><br>The Tome is not afraid of you yet. That is the point of the daily quest."},
    {t:"How to Win",b:"<b>Daily Quest</b>: five questions and a chapter boss, same for everyone, new each day. Keep the streak or the Tome runs off with it.<br><b>Weekly Boss</b>: the whole team pools damage into one bar. Every fight counts.<br><b>Campus Map</b>: beat a chapter three times to free its location.<br><b>Rival</b>: paste a teammate's code to fight their exact quest.<br><br>Free all twelve locations and the Tome goes back to being a book. Then we take the real test."}
  ];
  let i=0;
  const render=()=>{wantTrack("overworld");const p=pages[i];
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
  <div class="card"><p class="eyebrow">Roster • damage this week</p>${wt.rows.length?wt.rows.map((r,i)=>`<div class="rrow ${r.me?"me":""}"><span class="pos">${i+1}</span><span class="rn">${HEROES[r.hero]?HEROES[r.hero].icon+" ":""}${r.hat?HATS[r.hat]+" ":""}${esc(r.name)}</span><span class="rd">${r.dmg.toLocaleString()}</span></div>`).join(""):"<p class='muted'>No damage logged yet this week. Every daily and practice fight counts.</p>"}
  ${dbReady?"":"<p class='muted small'>Showing this phone only. Team pooling is not configured yet.</p>"}</div>${seasonHTML(dbReady?roster:[{weeks:S.weekLocal}])}`}
function weekly(){wantTrack("overworld");
  app.innerHTML=`<header class="title"><p class="eyebrow">Everyone’s damage pools into one bar</p><h1>Weekly Boss</h1></header>${sceneHTML()}<div id="weekly"></div>
  <button class="big" id="fightW"><span class="lbl">WEEKLY RAID</span><span class="sub">12 questions across every session + boss. Same seed for the whole team.</span></button>
  <button class="ghost center" id="home"><span class="lbl">BACK TO CAMPUS</span></button>`;
  mountScene(CHAPTERS[((parseInt(weekId())%8)+1)]);sceneSet("cast");renderWeekly();
  $("#fightW").onclick=()=>{SFX.click();start({weekly:true})};$("#home").onclick=home;
}

// ---------- CAMPUS MAP ----------
function campus(){wantTrack("overworld");
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
    if(target){const dx=target.x-hero.x,dy=target.y-hero.y,d=Math.hypot(dx,dy);if(d<1.5){hero.x=target.x;hero.y=target.y;target=null;save("heroPos",hero);const sp=spotAt(hero.x,hero.y-4);if(sp&&(!atSpot||sp[0]!==atSpot[0])){atSpot=sp;SFX.hit();info()}else if(!sp&&atSpot){atSpot=null;info()}}else{hero.x+=dx/d*1.6;hero.y+=dy/d*1.6;step++;if(step%8===0)SFX.step()}}
    c.setTransform(2,0,0,2,0,0);drawCampus(c,fs,performance.now());
    // hero (facing by direction, 2-frame walk)
    if(target){const dx=target.x-hero.x,dy=target.y-hero.y;hero.face=Math.abs(dx)>Math.abs(dy)?(dx<0?"left":"right"):(dy<0?"up":"down")}
    const wf=target?[0,1,0,2][Math.floor(step/5)%4]:0;const wimg=WALK[heroKey()+"_"+(hero.face||"down")+"_"+wf];
    const ms=1.5*heroScale();const bobY=target&&Math.floor(step/6)%2?-1:0;const hx=hero.x-HERO[0].length*ms/2,hy=hero.y-HERO.length*ms+bobY;
    px(c,hero.x-5,hero.y-1,10,2,CP.shadow);
    if(wimg&&wimg.complete&&wimg.naturalWidth){const hh=heroKey()==="scottie"?14:22;const ww=wimg.naturalWidth/wimg.naturalHeight*hh;c.drawImage(wimg,hero.x-ww/2,hero.y-hh,ww,hh)}else drawMap(c,HERO,hx,hy,ms);
    
    if(target){c.fillStyle="rgba(255,211,107,.8)";c.fillRect(target.x-2,target.y-2,4,4)}
    c.setTransform(1,0,0,1,0,0);c.font="8px 'Press Start 2P',monospace";c.textAlign="center";
    Object.entries(CAMPUS.spots).forEach(([s,sp])=>{const lab=sp.label.toUpperCase();const w=c.measureText(lab).width+8;c.fillStyle="rgba(0,0,0,.6)";c.fillRect(sp.x*2-w/2,sp.y*2+6,w,12);c.fillStyle=fs.has(+s)?"#9fd8aa":"#fff";c.fillText(lab,sp.x*2,sp.y*2+15)});
    requestAnimationFrame(draw)})();
  const sp0=spotAt(hero.x,hero.y-4);if(sp0){atSpot=sp0;info()}
}
// ---------- RIVAL ----------
function rival(){wantTrack("overworld");
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
function bag(){wantTrack("overworld");
  app.innerHTML=`<header class="title"><p class="eyebrow">Loot drops after a win</p><h1>Your Bag</h1></header>
  <div class="card"><p class="eyebrow">Items</p><div class="itemrow">${icon("skip")}<div><b>${ITEMS.skip.n}</b> × ${S.items.skip||0}<br><span class="small muted">${ITEMS.skip.d}</span></div></div><div class="itemrow">${icon("second")}<div><b>${ITEMS.second.n}</b> × ${S.items.second||0}<br><span class="small muted">${ITEMS.second.d}</span></div></div></div>
  <div class="card"><p class="eyebrow">Hero</p><div class="chips">${Object.entries(HEROES).map(([k,h])=>`<button class="chip ${heroKey()===k?"on":""}" data-hero="${k}"><img class="icon sm" src="art/sprites/${k}_idle.png" alt=""> ${esc(h.name)}</button>`).join("")}</div></div>
  <div class="card"><p class="eyebrow">Hats</p>${S.hats.length?`<div class="chips">${S.hats.map(h=>`<button class="chip ${S.hat===h?"on":""}" data-h="${h}">${icon(h,"sm")} ${h}</button>`).join("")}<button class="chip ${S.hat?"":"on"}" data-h="">none</button></div>`:"<p class='muted'>None yet.</p>"}</div>
  <div class="card"><p class="eyebrow">Titles</p>${S.titles.length?`<div class="chips">${S.titles.map(t=>`<button class="chip ${S.title===t?"on":""}" data-t="${esc(t)}">${esc(t)}</button>`).join("")}</div>`:"<p class='muted'>None yet.</p>"}</div>
  <div class="card"><p class="eyebrow">Save code • ${dbReady?"synced to the cloud":"cloud off, saved on this phone"}</p><p class="code" id="saveCode">${esc(saveCode())}</p><p class="muted small">This code is your save. Copy it somewhere safe. Type it into a new phone to pick up where you left off.</p><button class="ghost center" id="copyCode"><span class="lbl">COPY SAVE CODE</span></button>${dbReady?'<div class="field"><label class="eyebrow" for="restore">Load a save from another phone</label><input type="text" id="restore" placeholder="SCOT-XXXX-XXXX-XXXX" autocapitalize="characters" autocomplete="off"></div><button class="ghost center" id="restoreBtn"><span class="lbl">LOAD SAVE</span></button><p class="muted small" id="restoreMsg"></p>':""}</div>
  <div class="card"><p class="eyebrow">For your coach</p><button class="ghost center" id="coachCode"><span class="lbl">COPY MY COACH CODE</span></button><p class="muted small">Sends your misses and streak, nothing else.</p></div>
  <button class="ghost center" id="home"><span class="lbl">BACK TO CAMPUS</span></button>`;
  $("#home").onclick=home;
  $("#copyCode").onclick=()=>{try{navigator.clipboard.writeText(saveCode()).then(()=>toast("Copied")).catch(()=>toast("Copy failed"))}catch(e){toast("Copy failed")}};
  const rb=$("#restoreBtn");if(rb)rb.onclick=async()=>{rb.disabled=true;const err=await restoreCode($("#restore").value);if(err){$("#restoreMsg").textContent=err;rb.disabled=false}else{SFX.loot();toast("Save loaded");home()}};
  $("#coachCode").onclick=()=>{const c=exportCode();try{navigator.clipboard.writeText(c).then(()=>toast("Copied")).catch(()=>toast("Copy failed"))}catch(e){toast("Copy failed")}};
  document.querySelectorAll("[data-h]").forEach(b=>b.onclick=()=>{S.hat=b.dataset.h;save("hat",S.hat);SFX.click();bag()});
  document.querySelectorAll("[data-hero]").forEach(b=>b.onclick=()=>{setHero(b.dataset.hero);SFX.click();bag()});
  document.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{S.title=b.dataset.t;save("title",S.title);SFX.click();bag()});
}
home();
