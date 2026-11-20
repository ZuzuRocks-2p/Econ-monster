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
globalThis.__a2={a2hsHTML, setInstall:v=>{installEvt=v},
  setVisits:n=>save("visits",n), setOff:v=>save("a2hsOff",v)};`;
eval(src);
if(!/function isIOS/.test(require("fs").readFileSync(__at("game.js"),"utf8"))) throw new Error("game.js is NOT the patched build");

const R=globalThis.__a2;
let bad=0;const ok=(c,m,x)=>{console.log((c?"  ok  ":"  FAIL")+"  "+m+(x?"   "+x:""));if(!c)bad++};
const UA={
 iphoneSafari:"Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
 iphoneChrome:"Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0 Mobile/15E148 Safari/604.1",
 ipad:"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
 instagram:"Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0.0",
 facebook:"Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 [FBAN/FBIOS;FBAV/450.0]",
 androidChrome:"Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36",
 mac:"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"};
// Node 24 defines navigator as a read-only accessor, so a plain assignment is dropped
// on the floor and every branch silently reads the real one. Replace the property.
const as=(ua,touch=5)=>{Object.defineProperty(globalThis,"navigator",{configurable:true,writable:true,
  value:{userAgent:ua,maxTouchPoints:/Macintosh/.test(ua)?touch:5,standalone:false}})};
const strip=h=>h.replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim();

R.setVisits(5); R.setOff(false); R.setInstall(null);

console.log("\n=== iPhone, Safari ===");
as(UA.iphoneSafari);let h=R.a2hsHTML();
console.log("  "+strip(h));
ok(/Share/.test(h),"names the Share button");
ok(/bottom/.test(h)&&/top right/.test(h),"says WHERE it is, both toolbar positions");
ok(/Add to Home Screen/.test(h),"names the menu entry");
ok(/a2hssteps/.test(h),"reads as numbered steps, not a sentence");

console.log("\n=== iPhone, Chrome ===");
as(UA.iphoneChrome);h=R.a2hsHTML();
console.log("  "+strip(h));
ok(!/Share/.test(h),"does NOT send them to a Share button Chrome does not use there");
ok(/bottom right/.test(h),"points at the dots menu instead");

console.log("\n=== iPad (reports a Macintosh UA) ===");
as(UA.ipad,5);h=R.a2hsHTML();
console.log("  "+strip(h));
ok(/Share/.test(h),"an iPad now gets the iOS steps, not the Android ones");

console.log("\n=== a Mac, same UA but no touch ===");
as(UA.mac,0);h=R.a2hsHTML();
ok(h==="","a desktop is offered nothing at all","\""+strip(h)+"\"");

console.log("\n=== opened from Instagram ===");
as(UA.instagram);h=R.a2hsHTML();
console.log("  "+strip(h));
ok(/can’t add|cannot add/.test(h),"says plainly that this browser cannot do it");
ok(/Open in Safari/.test(h),"sends them to Safari first");
ok(/a2hsCopy/.test(h),"offers the link so they can get there");
ok(!/Tap the <b>Share/.test(h),"never tells them to find a Share button that is not there");

console.log("\n=== opened from Facebook ===");
as(UA.facebook);h=R.a2hsHTML();
ok(/Open in Safari/.test(h),"FBAN/FBAV is caught too");

console.log("\n=== Android, install prompt available ===");
as(UA.androidChrome);R.setInstall({});h=R.a2hsHTML();
console.log("  "+strip(h));
ok(/a2hsGo/.test(h),"offers the one-tap INSTALL button");

console.log("\n=== Android, no install prompt ===");
R.setInstall(null);h=R.a2hsHTML();
console.log("  "+strip(h));
ok(/⋮/.test(h)&&/top right/.test(h),"points at the right menu, with a location");
ok(/Install app/.test(h),"covers phones that word it differently");

console.log("\n=== it still gets out of the way ===");
R.setOff(true);as(UA.iphoneSafari);ok(R.a2hsHTML()==="","NOT NOW is remembered");
R.setOff(false);R.setVisits(0);ok(R.a2hsHTML()==="","nothing on a first visit");
R.setVisits(5);
console.log("\n=== the manifest Android needs ===");
const mf=JSON.parse(require("fs").readFileSync(__at("manifest.json"),"utf8"));
ok(mf.icons.length>0,"manifest has icons at all (empty = no install prompt, ever)",mf.icons.length+" entries");
ok(mf.icons.some(i=>i.sizes==="192x192")&&mf.icons.some(i=>i.sizes==="512x512"),"192 and 512 both present");
ok(mf.icons.some(i=>i.purpose==="maskable"),"a maskable one for Android adaptive icons");
const idx=require("fs").readFileSync(__at("index.html"),"utf8");
ok(/apple-touch-icon/.test(idx),"iOS has a real icon instead of a screenshot of the page");

console.log("\n"+bad+" issue(s)");
process.exit(bad?1:0);
