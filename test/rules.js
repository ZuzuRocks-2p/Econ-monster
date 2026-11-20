// --- repo-relative paths + an honest exit code -----------------------------
// These suites read the engine's source files, so they must resolve them from
// the repo root, not the shell's working directory: `node test/reg.js` and
// `cd test && node reg.js` both have to work.
const __root = require('path').join(__dirname, '..');
const __at = f => require('path').join(__root, f);
const fs=require('fs');
const mk=()=>new Proxy(function(){},{get(t,k){
  if(k==='classList')return{add(){},remove(){},toggle(){}};
  if(k==='dataset')return{};
  if(k==='textContent'||k==='innerHTML'||k==='outerHTML'||k==='value')return '';
  if(k==='length')return 0; if(k==='forEach'||k==='map')return ()=>[];
  if(k==='style')return{}; if(k===Symbol.toPrimitive)return()=>'';
  return mk()},set(){return true},apply(){return mk()}});
const store={};
global.localStorage={getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=v},removeItem:k=>{delete store[k]},clear(){for(const k in store)delete store[k]}};
global.document={getElementById:(id)=>id==="app"?mk():null,querySelector:()=>mk(),querySelectorAll:()=>[],createElement:mk,body:{classList:{add(){},remove(){}}},addEventListener(){}};
global.window={addEventListener(){},removeEventListener(){},matchMedia:()=>({matches:false,addEventListener(){}}),location:{href:"",search:""},scrollTo(){}};global.navigator={};global.getSelection=mk;
global.requestAnimationFrame=()=>0;global.cancelAnimationFrame=()=>{};
global.setInterval=()=>0;global.clearInterval=()=>{};global.setTimeout=(f)=>0;global.clearTimeout=()=>{};
global.crypto={getRandomValues:a=>{for(let i=0;i<a.length;i++)a[i]=i*7%251;return a},subtle:{digest:async()=>new ArrayBuffer(32)}};
global.firebase=undefined;
global.Image=function(){return{complete:false,naturalWidth:0,set src(v){},get src(){return ''}}};
global.Audio=function(){return{play(){},pause(){},addEventListener(){}}};

let src=['questions.js','bosses.js','campus.js','music.js','game.js'].map(f=>fs.readFileSync(__at(f),'utf8')).join('\n');
src=src.replace(/\bconst\s+([A-Z][A-Z0-9_]*)\s*=/g,'globalThis.$1=');
src+=`\nglobalThis.__t={normTeam,raidId,teamTotal,weeklyBtnSub,weeklyTotals,postDamage,watchRoster,watchRaid,weekId,
 get S(){return S},get roster(){return roster},set roster(v){roster=v},
 get raidDoc(){return raidDoc},set raidDoc(v){raidDoc=v},
 get dbReady(){return dbReady},set dbReady(v){dbReady=v},
 get DB(){return DB},set DB(v){DB=v}};`;
src+=`\nglobalThis.__r={start,answer,advance,fight,buildRaid,qtext,heavy,unmade,nextLabel,
  get G(){return G}, get RAID(){return RAID}, get S(){return S}, get CHAIN(){return CHAIN}};
result=function(){globalThis.__done=true;try{__realResult.call(null)}catch(e){globalThis.__err=String(e&&e.stack||e)}};`;
src=src.replace('function result(){','function __realResult(){');
// keep the name `result` bound so the engine's calls route through our wrapper
src=src.replace('globalThis.__r={start','var result;\nglobalThis.__r={start');
src+=`\nglobalThis.__x={cloudDoc,saveCode,sha,setTeamPin,cleanCode,get S(){return S}};`;
eval(src);

(function(){
// ---------------------------------------------------------------------------
// Does the client's own write actually satisfy firestore.rules?
// A rule the client violates is denied SILENTLY -- postDamage swallows the
// error in a catch, so the bar just stops moving and nothing says why.
// ---------------------------------------------------------------------------
const T=globalThis.__t, R=globalThis.__r, Z=globalThis.__z;
let bad=0, nck=0;
const chk=(c,label,extra)=>{nck++;console.log("  "+(c?"ok   ":"FAIL ")+label.padEnd(52)+(extra===undefined?"":extra));if(!c)bad++};

// --- a DB stub that records what the engine really sends -------------------
let writes=[];
global.firebase={firestore:{FieldValue:{increment:n=>({__inc:n})}}};
T.DB={doc:(p)=>({set:(data,opts)=>{writes.push({path:p,data,opts});return Promise.resolve()},
                 get:()=>Promise.resolve({exists:false,data:()=>null}),
                 onSnapshot:()=>(()=>{})})};
T.dbReady=true;

// --- the rules, transcribed from firestore.rules ---------------------------
const isNum=v=>typeof v==="number", isStr=v=>typeof v==="string";
const resolve=(v,old)=>(v&&typeof v==="object"&&"__inc" in v)?((old||0)+v.__inc):v;
const RAID_KEYS=['team','week','max','total','updated'];
const PLAYER_KEYS=['v','name','team','hero','hat','title','streak','lastDay','best','totalDmg',
  'wins','titles','hats','items','escaped','recapture','weeks','missed','seen','updated'];
const hasOnly=(d,allowed)=>Object.keys(d).every(k=>allowed.includes(k));

function raidCreateAllowed(id,d){
  const t=resolve(d.total,0);
  return {id:/^[A-Z0-9]{1,16}_[0-9]{8}$/.test(id), keys:hasOnly(d,RAID_KEYS),
    team:isStr(d.team)&&d.team.length<=16, week:isStr(d.week), max:isNum(d.max),
    total_type:isNum(t), total_lo:t>=0, total_hi:t<=4000, updated:isNum(d.updated), _total:t};
}
function raidUpdateAllowed(d,old){
  const t=resolve(d.total,old.total);
  return {keys:hasOnly(d,RAID_KEYS), team:d.team===old.team, week:d.week===old.week,
    total_type:isNum(t), mono:t>=old.total, cap:t<=old.total+4000, updated:isNum(d.updated), _total:t};
}
function playerAllowed(code,d){
  return {code:/^SCOT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code), keys:hasOnly(d,PLAYER_KEYS),
    name:isStr(d.name)&&d.name.length<=20, team:isStr(d.team)&&d.team.length<=16, updated:isNum(d.updated)};
}
const allTrue=o=>Object.entries(o).filter(([k])=>!k.startsWith("_")).every(([,v])=>v===true);
const why=o=>Object.entries(o).filter(([k,v])=>!k.startsWith("_")&&v!==true).map(([k])=>k).join(",");

// --- drive a PERFECT raid: instant answers => crit => max damage -----------
function perfectRun(opts,label){
  writes=[];globalThis.__done=false;globalThis.__err=null;
  R.S.missed={};R.S.seen={};R.S.items={skip:0,second:0};R.S.team="HHS-ECON";R.S.name="ScotRocket";
  R.start(Object.assign({__tut:true},opts));
  let n=0,heavy=0;
  while(!globalThis.__done&&n++<60){
    const g=R.G;const q=(!g.forms&&g.i===g.n)?g.boss:g.qs[g.i];
    if(!q){globalThis.__err="ran off the beats at i="+g.i;break}
    if(g.forms?R.heavy(q):(g.i===g.n))heavy++;
    g.qStart=Date.now();                      // answered instantly -> crit, speed 2.0
    R.answer(q.type==="num"?q.ans:q.a);
    if(globalThis.__done)break;
    R.advance();
    if(!globalThis.__done&&R.G.forms&&R.G.i===0&&R.G.fi>0)R.fight();
  }
  const raid=writes.filter(w=>w.path.startsWith("raids/"));
  return {label,beats:n,heavy,dmg:R.S.totalDmg,raid,writes:writes.slice()};
}

console.log("=== what a perfect run actually sends to raids/ ===");
const runs=[perfectRun({weekly:true},"the weekly raid"),
            perfectRun({},"daily quest"),
            perfectRun({practice:true},"practice fight"),
            perfectRun({session:2},"chapter fight"),
            perfectRun({review:true},"review drill")];
let worst=0,worstLabel="";
for(const r of runs){
  const w=r.raid[0];
  if(!w){chk(false,r.label+": no raid write at all");continue}
  const inc=w.data.total.__inc;
  if(inc>worst){worst=inc;worstLabel=r.label}
  const c=raidCreateAllowed(w.path.slice(6),w.data);
  const u=raidUpdateAllowed(w.data,{team:w.data.team,week:w.data.week,total:0});
  chk(allTrue(c)&&allTrue(u),r.label+" ("+r.beats+" beats) passes the rules",
     inc+" dmg"+(allTrue(c)&&allTrue(u)?"":"  DENIED BY: "+why(c)+" / "+why(u)));
}
console.log("\n  worst single write measured: "+worst+" dmg ("+worstLabel+"), rule caps a write at 4000");
chk(worst<=4000,"no measured write exceeds the 4000 cap","margin "+(4000-worst));

// --- the absolute ceiling: every beat heavy AND critted --------------------
const COMBO_CAP=1.8, mult=i=>Math.min(1+0.1*i,COMBO_CAP);
let ceiling=0;const beats=runs[0].beats;
for(let i=0;i<beats;i++)ceiling+=Math.round(35*2.0*mult(i));
console.log("\n=== the arithmetic ceiling, if every one of the "+beats+" raid beats were heavy ===");
console.log("  base 35 x crit 2.0 x combo capped at 1.8 = 126 max per hit");
chk(ceiling<=4000,"even an all-heavy perfect raid stays under the cap",ceiling+" dmg, margin "+(4000-ceiling));
console.log("  heavy beats in this week's actual raid: "+runs[0].heavy+" of "+beats);

// --- the players/ write ---------------------------------------------------
// cloudPush() defers its write 800ms, which the harness's no-op setTimeout
// never fires, so build the document the same way cloudPush does.
console.log("\n=== the players/ save the rules must accept ===");
{
  const X=globalThis.__x;
  X.S.name="ScotRocket";X.S.team="HHS-ECON";
  const d=X.cloudDoc(), code=X.saveCode(), p=playerAllowed(code,d);
  chk(p.code,"the save code matches the rule's shape",code);
  chk(p.keys,"no field the rules would reject",Object.keys(d).length+" fields sent");
  const extra=Object.keys(d).filter(k=>!PLAYER_KEYS.includes(k));
  const unused=PLAYER_KEYS.filter(k=>!(k in d));
  if(extra.length)console.log("    client sends but rules FORBID: "+extra.join(","));
  if(unused.length)console.log("    rules allow but client omits: "+unused.join(","));
  chk(p.name,"name fits the 20-char rule",JSON.stringify(d.name));
  chk(p.team,"team fits the 16-char rule",JSON.stringify(d.team));
  chk(p.updated,"updated is a number");
  // the rule caps name at 20 and the input has maxlength=20, but a pasted
  // name or a restored cloud save bypasses the attribute entirely
  X.S.name="x".repeat(21);
  chk(!playerAllowed(code,X.cloudDoc()).name,
      "a 21-char name WOULD be rejected (so the cap matters)","denied as expected");
  X.S.name="ScotRocket";
}

// --- the id the rules key on ----------------------------------------------
console.log("\n=== raidId() against the rule's id pattern ===");
for(const raw of ["HHS-ECON","hhs econ","HHSECON","Highland High Econ Team 2026","h","HHS_ECON!!"]){
  R.S.team=raw;const id=T.raidId();
  chk(/^[A-Z0-9]{1,16}_[0-9]{8}$/.test(id),"\""+raw.slice(0,26)+"\" -> a legal doc id",id);
}
R.S.team="";
chk(T.raidId()==="","a blank team code yields no id at all, so nothing is written");

console.log("\n=== the teams/ coach-PIN write ===");
(async()=>{
  const X=globalThis.__x;
  X.S.team="HHS-ECON";writes=[];
  await X.setTeamPin("1234");
  const w=writes.find(w=>w.path.startsWith("teams/"));
  if(!w){chk(false,"setTeamPin writes to teams/")}
  else{
    chk(/^[A-Z0-9]{1,16}$/.test(w.path.slice(6)),"the team doc id is legal",w.path);
    chk(Object.keys(w.data).every(k=>['pinHash','created'].includes(k)),
        "only pinHash and created are sent",Object.keys(w.data).join(","));
    chk(typeof w.data.pinHash==="string"&&w.data.pinHash.length===64,
        "pinHash is exactly 64 chars, as the rule demands",w.data.pinHash.length+" chars");
    chk(typeof w.data.created==="number","created is a number");
  }
  console.log("\n"+bad+" issue(s) across "+nck+" checks");
  process.exit(bad?1:0);
})();
})();
