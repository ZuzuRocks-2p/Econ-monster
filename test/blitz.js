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
src+=`\nglobalThis.__z={blitzPool,buildBlitz,blitzRun,blitzAnswer,blitzEnd,blitzMult,blitzStop,
  get B(){return B}, set B(v){B=v}, get BLITZ(){return BLITZ}, get S(){return S}};`;
eval(src);
const R=globalThis.__r;
globalThis.__done=false;


// run deferred callbacks immediately so the blitz can advance in the harness
global.setTimeout=(f)=>{try{f()}catch(e){globalThis.__err=String(e)}return 0};
let ticks=[];
global.setInterval=(f)=>{ticks.push(f);return ticks.length};
global.clearInterval=(id)=>{};

const Z=globalThis.__z;
let bugs=0;
const check=(l,p,d)=>{if(!p)bugs++;console.log(`  ${p?'ok  ':'BUG '}${l}${p?'':'  -> '+d}`)};

console.log("\n=== what the blitz draws from ===");
const pool=Z.blitzPool();
check("every taught session is represented",
  new Set(pool.map(q=>q.s)).size===12, `${new Set(pool.map(q=>q.s)).size} of 12 sessions`);
check("no typing questions", pool.every(q=>q.type!=="num"), "a numeric question slipped in");
check("every question has options", pool.every(q=>q.opts&&q.opts.length>1), "an option-less question");
console.log(`  pool: ${pool.length} questions across ${new Set(pool.map(q=>q.s)).size} sessions`);

console.log("\n=== a queue never repeats itself ===");
Z.S.missed={};Z.S.seen={};
const q1=Z.buildBlitz();
check("no duplicates in one run", new Set(q1.map(q=>q.id)).size===q1.length, "a question appears twice");
check("long enough to outlast the clock", q1.length>=40, `${q1.length} questions`);

console.log("\n=== mastery weighting actually biases the draw ===");
Z.S.missed={};Z.S.seen={};
const hot=pool.filter(q=>q.s===3).slice(0,5).map(q=>q.id);
hot.forEach(id=>Z.S.missed[id]=8);
let early=0,runs=200;
for(let i=0;i<runs;i++){const qq=Z.buildBlitz().slice(0,10).map(q=>q.id);early+=qq.filter(id=>hot.includes(id)).length}
const withW=early/runs;
Z.S.missed={};
let base=0;
for(let i=0;i<runs;i++){const qq=Z.buildBlitz().slice(0,10).map(q=>q.id);base+=qq.filter(id=>hot.includes(id)).length}
const noW=base/runs;
check("missed terms come round sooner", withW>noW*1.5, `weighted ${withW.toFixed(2)} vs unweighted ${noW.toFixed(2)} in the first ten`);
console.log(`  first ten questions contain ${withW.toFixed(2)} troubled terms when weighted, ${noW.toFixed(2)} when not`);

console.log("\n=== a full run: right, wrong, and the clock ===");
Z.S.missed={};Z.S.seen={};Z.S.totalDmg=0;
globalThis.__err=null;
Z.blitzRun();
let n=0,given=0;
while(Z.B&&n++<200){
  const b=Z.B,q=b.queue[b.i];
  if(!q)break;
  given++;
  const right=given%3!==0;      // miss every third
  Z.blitzAnswer(right?q.a:(q.a+1)%q.opts.length);
  if(!Z.B)break;
  // the clock is driven by the harness, one second per answer
  Z.B.left--;
  if(Z.B.left<=0){Z.blitzEnd();break}
}
check("the run ends on its own", !Z.B, "the blitz never terminated");
check("no error thrown", !globalThis.__err, globalThis.__err);
check("misses were recorded for review", Object.keys(Z.S.missed).length>0, "nothing reached the review list");
check("sightings were recorded", Object.keys(Z.S.seen).length>0, "nothing recorded as seen");
check("damage reached the team total", Z.S.totalDmg>0, "no damage banked");
console.log(`  answered ${given}, S.missed now holds ${Object.keys(Z.S.missed).length}, totalDmg ${Z.S.totalDmg}`);

console.log("\n=== the penalty really costs time ===");
Z.blitzRun();
const before=Z.B.left;
const bq=Z.B.queue[0];
Z.blitzAnswer((bq.a+1)%bq.opts.length);
check(`a miss costs ${Z.BLITZ.penalty} seconds`, before-Z.B.left===Z.BLITZ.penalty || !Z.B, `${before} -> ${Z.B?Z.B.left:"ended"}`);

console.log("\n=== running the clock to zero mid-answer ends cleanly ===");
Z.blitzRun();
Z.B.left=1;
const q0=Z.B.queue[Z.B.i];
Z.blitzAnswer((q0.a+1)%q0.opts.length);   // -3s takes it below zero
check("ends rather than going negative", !Z.B, "the blitz kept running past zero");

console.log("\n=== streak multiplier is capped ===");
Z.blitzRun();
Z.B.streak=50;
check(`multiplier capped at ${Z.BLITZ.cap}`, Z.blitzMult()===Z.BLITZ.cap, String(Z.blitzMult()));
Z.blitzEnd();

console.log(`\n${bugs} issue(s)`);
