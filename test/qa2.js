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
src+=`\nglobalThis.__q={troubled,gotIt,buildReview,cardFront,qIndex,sessionAccuracy,reviewSub,
  get S(){return S}, TAUGHT, get BANK(){return BANK}, get BOSSES(){return BOSSES}, get SESSIONS(){return SESSIONS}};`;
eval(src);
const Q=globalThis.__q;
let bugs=0;
const check=(l,p,d)=>{if(!p)bugs++;console.log(`  ${p?'ok  ':'BUG '} ${l}${p?'':'  -> '+d}`)};
const reset=()=>{Q.S.missed={};Q.S.seen={}};

console.log('\n=== what a BOSS question looks like vs a BANK question ===');
const b0=Q.BOSSES[0], q0=Q.BANK[0];
console.log('  boss keys:', Object.keys(b0).join(','));
console.log('  bank keys:', Object.keys(q0).join(','));

console.log('\n=== can a missed BOSS id leak into the review as a normal question? ===');
reset();
Q.S.missed[b0.id]=3; Q.S.seen[b0.id]=3;
const t=Q.troubled();
const leaked=t.some(x=>x.id===b0.id);
console.log(`  troubled() returned ${t.length} item(s); boss present: ${leaked}`);
if(leaked){
  const rv=Q.buildReview(1,5);
  const bossInQs=rv.qs.filter(x=>Q.BOSSES.some(b=>b.id===x.id));
  check('boss questions stay out of the normal-question list', bossInQs.length===0,
        `${bossInQs.length} boss question(s) served as normal beats: ${bossInQs.map(x=>x.id).join(',')}`);
} else check('boss id excluded from troubled()', true);

console.log('\n=== review with nothing missed at all ===');
reset();
const empty=Q.buildReview(7,5);
check('still builds a full deck', empty.qs.length===5, `got ${empty.qs.length}`);
check('still picks a boss', !!empty.boss, 'boss undefined -> fight would crash');
check('sub line is honest', Q.reviewSub()==='Nothing to review yet', Q.reviewSub());

console.log('\n=== review asked for more cards than exist ===');
reset();
const huge=Q.buildReview(3,9999);
const pool=Q.BANK.filter(q=>q.s<=Q.TAUGHT).length;
console.log(`  pool of taught questions = ${pool}`);
check('deck caps at the pool, no infinite loop', huge.qs.length<=pool, `${huge.qs.length} > ${pool}`);
check('no duplicate cards in the deck', new Set(huge.qs.map(x=>x.id)).size===huge.qs.length, 'duplicates present');

console.log('\n=== a missed id for a question that no longer exists ===');
reset();
Q.S.missed['ghost-id-that-was-deleted']=4;
check('ghost ids are dropped', Q.troubled().length===0, 'a deleted question still shows in review');
check('reviewSub does not count ghosts', Q.reviewSub()==='Nothing to review yet', Q.reviewSub());

console.log('\n=== miss count larger than seen count (imported/legacy save) ===');
reset();
const tq=Q.BANK.find(q=>q.s<=Q.TAUGHT);
Q.S.missed[tq.id]=50; Q.S.seen[tq.id]=2;
const r=Q.troubled()[0];
check('accuracy cannot exceed 100%', r.rate<=100, `rate = ${r.rate}%`);

console.log('\n=== "got it" decay ===');
reset();
Q.S.missed[tq.id]=1;
const l1=Q.gotIt(tq.id);
check('one miss clears outright', l1===0&&Q.S.missed[tq.id]===undefined, `left=${l1}, stored=${Q.S.missed[tq.id]}`);
Q.S.missed[tq.id]=5;
const l2=Q.gotIt(tq.id);
check('5 misses halve to 2', l2===2&&Q.S.missed[tq.id]===2, `left=${l2}`);

console.log('\n=== coach view: session accuracy ===');
reset();
Q.S.seen[tq.id]=10; Q.S.missed[tq.id]=3;
const sa=Q.sessionAccuracy();
check('one session reported', sa.length===1, `${sa.length} sessions`);
check('70% accuracy computed', sa[0].acc===70, `${sa[0].acc}%`);
check('session has a name', !!sa[0].name, 'name missing -> blank row in coach view');
reset();
check('no data -> no rows', Q.sessionAccuracy().length===0, 'phantom rows');

console.log('\n=== untaught sessions stay hidden ===');
reset();
const untaught=Q.BANK.find(q=>q.s>Q.TAUGHT);
if(untaught){Q.S.missed[untaught.id]=5;Q.S.seen[untaught.id]=5;
  check('locked-session misses excluded', Q.troubled().length===0, 'review serves locked content');
} else console.log(`  (no questions past session ${Q.TAUGHT} exist — nothing to leak)`);

console.log(`\n${bugs} issue(s) found`);
