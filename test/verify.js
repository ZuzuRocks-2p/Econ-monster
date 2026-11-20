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
eval(src);
const E=globalThis.__t;
(async()=>{
let fails=0;
const ok=(label,got,want)=>{const p=JSON.stringify(got)===JSON.stringify(want);if(!p)fails++;
  console.log(`  ${p?'PASS':'FAIL'}  ${label}${p?'':`  got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`)};

console.log('\n--- team code normalisation (the fragmentation bug) ---');
['HHS-ECON','hhs econ','HHSECON',' hhs-ECON ','HHS_ECON!'].forEach(v=>ok(`"${v}"`,E.normTeam(v),'HHSECON'));
ok('blank stays blank',E.normTeam(''),'');
ok('null stays blank',E.normTeam(null),'');
ok('capped at 16',E.normTeam('A'.repeat(30)).length,16);

console.log('\n--- raid id ---');
E.S.team='HHS-ECON';
ok('id is normalised team + week',E.raidId(),'HHSECON_'+E.weekId());
ok('id matches the rules regex',/^[A-Z0-9]{1,16}_[0-9]{8}$/.test(E.raidId()),true);
E.S.team=''; ok('no team -> no raid id',E.raidId(),'');

console.log('\n--- authoritative total ---');
E.S.team='HHSECON';E.dbReady=true;E.S.weekLocal={};
E.raidDoc={total:1234};E.roster=[{weeks:{[E.weekId()]:99}}];
ok('shared doc wins over roster sum',E.teamTotal(),1234);
E.raidDoc=null; ok('falls back to roster sum before the doc loads',E.teamTotal(),99);
E.dbReady=false;E.S.weekLocal={[E.weekId()]:42};
ok('offline falls back to this phone',E.teamTotal(),42);

console.log('\n--- blank team no longer joins a global raid ---');
E.dbReady=true;E.S.team='';E.roster=[{weeks:{[E.weekId()]:5000}}];
let queried=false;
E.DB={collection(){queried=true;return{where(){return this},limit(){return this},onSnapshot(){return()=>{}}}},doc(){return{onSnapshot(){return()=>{}}}}};
E.watchRoster();
ok('blank team runs no roster query',queried,false);
ok('blank team clears the roster',E.roster.length,0);
ok('blank team prompts for a code',E.weeklyBtnSub(),'Add your team code below to join the raid');

console.log('\n--- damage write ---');
E.S.team='HHS-ECON';E.S.weekLocal={};let wrote=null;
global.firebase={firestore:{FieldValue:{increment:n=>({__increment:n})}}};
E.DB={doc(path){return{set(d,o){wrote={path,d,o};return Promise.resolve()}}},collection(){return{where(){return this},limit(){return this},onSnapshot(){return()=>{}}}}};
E.dbReady=true;
await E.postDamage(137.4);
ok('writes to the shared raid doc',wrote.path,'raids/HHSECON_'+E.weekId());
ok('uses an atomic increment',wrote.d.total,{__increment:137});
ok('merges rather than overwrites',wrote.o,{merge:true});
ok('stamps the normalised team',wrote.d.team,'HHSECON');
ok('also credits this player for the leaderboard',E.S.weekLocal[E.weekId()],137.4);
wrote=null;E.S.team='';await E.postDamage(50);
ok('no team -> no shared write',wrote,null);
wrote=null;E.S.team='HHSECON';await E.postDamage(0);
ok('zero damage -> no write',wrote,null);

console.log(fails?`\n${fails} FAILURE(S)`:'\nall checks passed');
process.exit(fails?1:0);
})();
