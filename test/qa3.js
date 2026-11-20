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
eval(src);
src+=`\nglobalThis.__q={normTeam,raidId,cloudDoc,applyCloud,buildReview,
  get S(){return S}, get teamFixed(){return teamFixed}, get BOSSES(){return BOSSES}, get BANK(){return BANK}, TAUGHT};`;
eval(src);
const Q=globalThis.__q;
let bugs=0;
const check=(l,p,d)=>{if(!p)bugs++;console.log(`  ${p?'ok  ':'BUG '} ${l}${p?'':'  -> '+d}`)};

console.log('\n=== FIX 1: restoring a pre-normalisation save ===');
Q.applyCloud({team:"HHS-ECON",name:"Sam",weeks:{},missed:{},seen:{},updated:Date.now()});
console.log(`  S.team after restore     = ${JSON.stringify(Q.S.team)}`);
console.log(`  their player doc records = ${JSON.stringify(Q.cloudDoc().team)}`);
check('doc matches what teammates query for', Q.cloudDoc().team===Q.normTeam(Q.S.team), 'still mismatched');
check('the fold is flagged so it gets pushed', Q.teamFixed===true, 'teamFixed not set -> stale doc never corrected');

console.log('\n=== FIX 1b: an already-clean save does not trigger a pointless write ===');
Q.applyCloud({team:"HHSECON",name:"Sam",weeks:{},missed:{},seen:{},updated:Date.now()});
check('no spurious push flagged', Q.teamFixed===false, 'would bump "last played" for every student every boot');

console.log('\n=== FIX 1c: messy forms all fold to one raid ===');
['HHS-ECON','hhs econ','  HHS econ  ','HHS_ECON'].forEach(t=>{
  Q.S.team=t;
  check(`${JSON.stringify(t)} -> doc "${Q.cloudDoc().team}"`, Q.cloudDoc().team==='HHSECON', Q.cloudDoc().team);
});

console.log('\n=== FIX 2: blank team writes nothing that pools players together ===');
Q.S.team="";
check('blank team stays blank', Q.cloudDoc().team==='', JSON.stringify(Q.cloudDoc().team));
check('blank team joins no raid', Q.raidId()==='', Q.raidId());

console.log('\n=== FIX 3: the drill after missing a boss ===');
Q.S.team="HHSECON"; Q.S.missed={}; Q.S.seen={};
Q.S.missed['b-mid']=3; Q.S.seen['b-mid']=4;
Q.BANK.filter(q=>q.s<=Q.TAUGHT).slice(0,6).forEach((q,i)=>{Q.S.missed[q.id]=4-i%3;Q.S.seen[q.id]=6});
let bossAsBeat=0,dup=0,shortDeck=0;
for(let s=1;s<=400;s++){
  const r=Q.buildReview(s,5);
  const ids=r.qs.map(q=>q.id);
  if(ids.some(id=>Q.BOSSES.some(b=>b.id===id)))bossAsBeat++;
  if(r.boss&&ids.includes(r.boss.id))dup++;
  if(ids.length!==5)shortDeck++;
}
check('no boss served as a plain beat', bossAsBeat===0, `${bossAsBeat}/400 runs`);
check('no question asked twice in one run', dup===0, `${dup}/400 runs`);
check('deck is always full', shortDeck===0, `${shortDeck}/400 runs short`);
const bossPick=Q.buildReview(11,5).boss;
check('the drill boss is one you actually missed', bossPick.id==='b-mid', `picked ${bossPick.id}`);

console.log('\n=== FIX 3b: drill still works when no boss was missed ===');
Q.S.missed={};Q.S.seen={};
Q.BANK.filter(q=>q.s<=Q.TAUGHT).slice(0,6).forEach(q=>{Q.S.missed[q.id]=2;Q.S.seen[q.id]=5});
const nb=Q.buildReview(5,5);
check('boss still chosen', !!nb.boss, 'undefined boss -> fight crashes');
check('deck still full', nb.qs.length===5, `${nb.qs.length}`);

console.log(`\n${bugs} issue(s) remaining`);
