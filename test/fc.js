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
globalThis.__fc={BANK,SESSIONS,TAUGHT,troubled,cardFront,blitzLabel,review,
  get S(){return S}, appHTML:()=>globalThis.__html||""};`;
eval(src);

const R=globalThis.__fc;
let bad=0; const ok=(c,m,x)=>{console.log((c?"  ok  ":"  FAIL")+"  "+m+(x?"   "+x:""));if(!c)bad++};

console.log("\n=== the review flashcard front ===");
// pretend the Tome has beaten them on a spread of questions across every taught session
const QB=R.BANK, SESS=R.SESSIONS, TGT=R.TAUGHT;
const pick=[];
for(let s=1;s<=TGT;s++) BANK.filter(q=>q.s===s).slice(0,6).forEach(q=>pick.push(q));
const St=R.S;
St.missed={};St.seen={};
pick.forEach((q,i)=>{St.missed[q.id]=1+(i%3);St.seen[q.id]=4});

const t=R.troubled();
ok(t.length===pick.length,"every missed question becomes a card",t.length+" cards");

const fronts=t.map(x=>R.cardFront(x.q));
const n=x=>String(x||"").toLowerCase().replace(/[^a-z0-9]/g,"");
const generic=new Set([...Object.values(SESS),"Transportation"].map(n));
const dud=t.filter(x=>generic.has(n(R.cardFront(x.q))));
ok(dud.length===0,"no card front is just the session name",dud.length?dud.map(x=>x.q.id+"="+R.cardFront(x.q)).join(" "):"");
ok(fronts.every(f=>f&&f.trim().length>=2),"every front is a real label");
ok(Math.max(...fronts.map(f=>f.length))<=34,"longest front "+Math.max(...fronts.map(f=>f.length))+" chars (wraps in <p class=q>)");

console.log("\n=== the rendered card actually shows it ===");
R.review();
const html=R.appHTML();
ok(/class="card fc"/.test(html),"the flashcard mounted");
const m=html.match(/<p class="q">([^<]*)<\/p>/);
ok(!!m,"the card has a front");
if(m){const front=m[1];
  ok(!generic.has(n(front)),"the front on screen is a concept, not a session","\""+front+"\"");
  const eye=html.match(/<p class="eyebrow">([^<]*)/);
  ok(eye&&n(eye[1].split("•")[0])!==n(front),"front and eyebrow are not the same words","eyebrow \""+(eye?eye[1].trim():"")+"\"");
}

console.log("\n=== the coach's copy-review list ===");
const lbl=q=>{const tt=q.term||q.spell||"";const pg=(q.src||"").match(/RG p\.([\d;, ]+)/);if(SESS[q.s]===tt)return "RG p."+(pg?pg[1].trim():"?");return tt};
const pageRefs=t.filter(x=>lbl(x.q).startsWith("RG p."));
ok(pageRefs.length===0,"no line falls back to a page reference",pageRefs.length?pageRefs.map(x=>x.q.id).join(" "):"");
console.log("  sample: "+t.slice(0,5).map(x=>lbl(x.q)).join(" / "));

console.log("\n=== the blitz miss list ===");
const dupes=BANK.filter(q=>q.s<=TGT).filter(q=>{const l=R.blitzLabel(q);return n(l)===n(SESS[q.s])});
ok(dupes.length===0,"blitzLabel never has to fall back to the session name",dupes.length+" of "+BANK.filter(q=>q.s<=TGT).length);

console.log("\n=== every taught question, end to end ===");
const taught=BANK.filter(q=>q.s<=TGT);
const stillGeneric=taught.filter(q=>generic.has(n(R.cardFront(q))));
ok(stillGeneric.length===0,"0 of "+taught.length+" taught questions show a generic front");
const byTerm={};taught.forEach(q=>{(byTerm[q.term]=byTerm[q.term]||[]).push(q.s)});
const crossSession=Object.entries(byTerm).filter(([k,v])=>new Set(v).size>1);
console.log("  terms shared across sessions (intentional, e.g. Opportunity Cost): "+crossSession.length);
crossSession.slice(0,8).forEach(([k,v])=>console.log("    "+k+" -> sessions "+[...new Set(v)].join(","))); 

console.log("\n"+bad+" issue(s)");
process.exit(bad?1:0);
