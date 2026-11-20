// --- repo-relative paths + an honest exit code -----------------------------
// These suites read the engine's source files, so they must resolve them from
// the repo root, not the shell's working directory: `node test/reg.js` and
// `cd test && node reg.js` both have to work.
const __root = require('path').join(__dirname, '..');
const __at = f => require('path').join(__root, f);

// Four of these suites report a bug by PRINTING it and then returning normally,
// which exits 0 and reads as a pass to any runner that only checks the exit
// code. Tally the failure markers as they go past and exit non-zero on them.
let __bad = 0;
{
  const __log = console.log;
  console.log = (...a) => {
    if (/\bBUG\b|\bFAIL\b|\bnot ok\b|\bERROR\b|(?:^|\s)[1-9]\d* issue/.test(a.join(' '))) __bad++;
    __log(...a);
  };
}
process.on('exit', () => { if (__bad && !process.exitCode) process.exitCode = 1; });
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
eval(src);
const R=globalThis.__r;
globalThis.__done=false;


function play(opts,label,maxBeats){
  globalThis.__done=false;globalThis.__err=null;
  R.S.missed={};R.S.seen={};R.S.items={skip:0,second:0};
  R.start(Object.assign({__tut:true},opts));
  let n=0,ids=[];
  while(!globalThis.__done&&n++<maxBeats){
    const g=R.G;
    const q=(!g.forms&&g.i===g.n)?g.boss:g.qs[g.i];
    if(!q){globalThis.__err="ran off the end of the beats at i="+g.i;break}
    ids.push(q.id);
    g.qStart=Date.now()-3000;
    R.answer(q.type==="num"?q.ans:q.a);
    if(globalThis.__done)break;
    R.advance();
    if(!globalThis.__done&&R.G.forms&&R.G.i===0&&R.G.fi>0)R.fight();
  }
  const ok=globalThis.__done&&!globalThis.__err&&n<maxBeats;
  console.log("  "+(ok?"ok  ":"BUG ")+label.padEnd(34)+n+" beats, finished="+globalThis.__done+(globalThis.__err?"  ERROR: "+globalThis.__err:""));
  return {n,ids,err:globalThis.__err};
}
console.log("\n=== every mode still plays to a result (all answers correct) ===");
play({},"daily quest",40);
play({practice:true},"practice fight",40);
play({weekly:true},"the weekly raid",40);
play({review:true},"review drill",40);
play({session:2},"chapter fight",40);

console.log("\n=== and every mode survives answering everything WRONG ===");
function playWrong(opts,label,maxBeats){
  globalThis.__done=false;globalThis.__err=null;
  R.S.missed={};R.S.seen={};R.S.items={skip:0,second:0};
  R.start(Object.assign({__tut:true},opts));
  let n=0;
  while(!globalThis.__done&&n++<maxBeats){
    const g=R.G;
    const q=(!g.forms&&g.i===g.n)?g.boss:g.qs[g.i];
    if(!q){globalThis.__err="ran off the end at i="+g.i;break}
    g.qStart=Date.now()-3000;
    R.answer(q.type==="num"?q.ans+997:(q.a+1)%(q.opts?q.opts.length:2));
    if(globalThis.__done)break;
    R.advance();
    if(!globalThis.__done&&R.G.forms&&R.G.i===0&&R.G.fi>0)R.fight();
  }
  const ok=globalThis.__done&&!globalThis.__err&&n<maxBeats;
  console.log("  "+(ok?"ok  ":"BUG ")+label.padEnd(34)+n+" beats"+(globalThis.__err?"  ERROR: "+globalThis.__err:""));
}
playWrong({},"daily quest",40);
playWrong({weekly:true},"the weekly raid",40);
playWrong({review:true},"review drill",40);

console.log("\n=== timeouts (answer never given) ===");
globalThis.__done=false;globalThis.__err=null;
R.S.missed={};R.S.seen={};
R.start({weekly:true,__tut:true});
let t=0;
while(!globalThis.__done&&t++<40){
  R.G.qStart=Date.now()-99000;
  R.answer(null);
  if(globalThis.__done)break;
  R.advance();
  if(!globalThis.__done&&R.G.forms&&R.G.i===0&&R.G.fi>0)R.fight();
}
console.log("  "+(globalThis.__done&&!globalThis.__err?"ok  ":"BUG ")+"raid where every beat times out".padEnd(34)+t+" beats"+(globalThis.__err?"  ERROR: "+globalThis.__err:""));
console.log("  forms "+R.G.formMarks.join("")+"  damage "+R.G.dmg+"  (a student who answers nothing still finishes)");
