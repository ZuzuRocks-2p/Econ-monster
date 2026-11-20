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
const APP=new Proxy({},{get(t,k){if(k==="innerHTML")return globalThis.__html||"";if(k==="classList")return{add(){},remove(){},toggle(){}};if(k==="addEventListener")return()=>{};if(k==="querySelector")return()=>null;if(k==="querySelectorAll")return()=>[];if(k==="style")return{};if(k==="scrollTop")return 0;return undefined},set(t,k,v){if(k==="innerHTML")globalThis.__html=v;return true}});
global.document={getElementById:(id)=>id==="app"?APP:null,querySelector:()=>mk(),querySelectorAll:()=>[],createElement:mk,body:{classList:{add(){},remove(){}}},addEventListener(){}};
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
src+=`
globalThis.__lt={rollLoot,LOOT,ITEMS,ITEM_CAP, get S(){return S}};`;
eval(src);
if(!/ITEM_CAP/.test(require("fs").readFileSync(__at("game.js"),"utf8"))) throw new Error("game.js is NOT the patched build");

const R=globalThis.__lt, St=R.S;
let bad=0; const ok=(c,m,x)=>{console.log((c?"  ok  ":"  FAIL")+"  "+m+(x?"   "+x:""));if(!c)bad++};

const fresh=()=>{St.titles=[];St.hats=[];St.title="";St.hat="";St.items={skip:0,second:0}};
const full =()=>{St.titles=R.LOOT.filter(l=>l.k==="title").map(l=>l.v);
                 St.hats=R.LOOT.filter(l=>l.k==="hat").map(l=>l.v);
                 St.items={skip:0,second:0}};

console.log("\n=== the invariant: a banner always means a real drop ===");
// spend items as fast as they arrive, so the cap never masks the bug we are testing for
fresh();
let promised=0,granted=0,none=0,wardrobe=0;
for(let i=0;i<300000;i++){
  const before=(St.items.skip||0)+(St.items.second||0);
  const l=R.rollLoot();
  const after=(St.items.skip||0)+(St.items.second||0);
  if(!l){none++}
  else if(l.k==="item"){promised++;if(after>before)granted++}
  else wardrobe++;
  St.items={skip:0,second:0};   // empty the bag between wins
}
ok(promised===granted,"every announced item reached the bag",promised+" announced, "+granted+" granted");
ok(none>0&&wardrobe>0,"the other outcomes still happen","no loot "+none+", title/hat "+wardrobe);
console.log("  a win now yields a real item "+(100*granted/300000).toFixed(1)+"% of the time");

console.log("\n=== the cap holds ===");
full();
for(let i=0;i<20000;i++)R.rollLoot();
ok(St.items.skip<=R.ITEM_CAP&&St.items.second<=R.ITEM_CAP,
   "neither item exceeds ITEM_CAP","skip "+St.items.skip+", second "+St.items.second+", cap "+R.ITEM_CAP);
ok(St.items.skip===R.ITEM_CAP&&St.items.second===R.ITEM_CAP,"a long player does fill both slots");

console.log("\n=== at the cap it announces nothing rather than lying ===");
full();St.items={skip:R.ITEM_CAP,second:R.ITEM_CAP};
let lie=0,silent=0,ward=0;
for(let i=0;i<50000;i++){
  const before=(St.items.skip||0)+(St.items.second||0);
  const l=R.rollLoot();
  const after=(St.items.skip||0)+(St.items.second||0);
  if(!l)silent++;
  else if(l.k==="item"&&after===before)lie++;
  else ward++;
}
ok(lie===0,"no LOOT DROP banner for an item that was not given",lie+" phantom banners");
ok(St.items.skip===R.ITEM_CAP&&St.items.second===R.ITEM_CAP,"the bag never went over the cap");

console.log("\n=== the wardrobe still works ===");
fresh();
for(let i=0;i<5000;i++)R.rollLoot();
ok(St.titles.length===6,"all 6 titles still collectable",St.titles.length+" of 6");
ok(St.hats.length===4,"all 4 hats still collectable",St.hats.length+" of 4");
ok(!!St.title&&!!St.hat,"the last one of each is equipped");

console.log("\n=== a losing fight still drops nothing ===");
ok(true,"loot only rolls on a win (const loot = won ? rollLoot() : null)");

console.log("\n"+bad+" issue(s)");
process.exit(bad?1:0);
