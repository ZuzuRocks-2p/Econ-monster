// 16-bit chiptune engine: pulse leads, triangle bass, noise drums. No audio files.
// Tracks are written as note strings per channel: "C4 E4 G4 -" (- = rest, . = hold).
const Music=(()=>{
  let ctx=null,master=null,cur=null,timer=null,muted=false;
  const NOTE={C:0,"C#":1,D:2,"D#":3,E:4,F:5,"F#":6,G:7,"G#":8,A:9,"A#":10,B:11};
  function freq(n){const m=n.match(/^([A-G]#?)(\d)$/);if(!m)return 0;return 440*Math.pow(2,(NOTE[m[1]]+12*(+m[2]-4)-9)/12)}
  function ac(){if(muted)return null;try{if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();master=ctx.createGain();master.gain.value=.5;const comp=ctx.createDynamicsCompressor();master.connect(comp);comp.connect(ctx.destination)}if(ctx.state==="suspended")ctx.resume()}catch(e){return null}return ctx}
  function pulse(duty){const c=ac();if(!c)return null;const n=4096,real=new Float32Array(n),imag=new Float32Array(n);for(let i=1;i<n;i++){real[i]=0;imag[i]=(2/(i*Math.PI))*Math.sin(i*Math.PI*duty)}return c.createPeriodicWave(real,imag,{disableNormalization:false})}
  let W25=null,W12=null;
  function osc(f,t0,dur,kind,vol,dest){const c=ac();if(!c||!f)return;const o=c.createOscillator(),g=c.createGain();
    if(kind==="p25"){W25=W25||pulse(.25);o.setPeriodicWave(W25)}else if(kind==="p12"){W12=W12||pulse(.125);o.setPeriodicWave(W12)}else o.type=kind;
    o.frequency.setValueAtTime(f,t0);g.gain.setValueAtTime(0,t0);g.gain.linearRampToValueAtTime(vol,t0+.01);g.gain.setValueAtTime(vol,t0+dur*.7);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
    o.connect(g);g.connect(dest||master);o.start(t0);o.stop(t0+dur+.02)}
  function noise(t0,dur,vol,hp){const c=ac();if(!c)return;const n=Math.floor(c.sampleRate*dur),b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
    const s=c.createBufferSource();s.buffer=b;const f=c.createBiquadFilter();f.type=hp?"highpass":"lowpass";f.frequency.value=hp?4000:800;const g=c.createGain();g.gain.setValueAtTime(vol,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);s.connect(f);f.connect(g);g.connect(master);s.start(t0);s.stop(t0+dur)}
  // ---- tracks ----
  // Each channel: notes array; step = 1/8 note. 16 steps per bar.
  const TRACKS={
    overworld:{bpm:112,loop:true,ch:[
      {kind:"p25",vol:.09,seq:"E4 . G4 . A4 . B4 . A4 . G4 . E4 . D4 . E4 . G4 . A4 . B4 . D5 . B4 . A4 . G4 . E4 . G4 . A4 . G4 . E4 . D4 . B3 . D4 . E4 . . . - - - -"},
      {kind:"p12",vol:.05,seq:"- - B3 . - - B3 . - - C4 . - - C4 . - - D4 . - - D4 . - - B3 . - - B3 . - - G3 . - - G3 . - - A3 . - - A3 . - - B3 . - - B3 . - - - -"},
      {kind:"triangle",vol:.16,seq:"E2 . . . E2 . . . C2 . . . C2 . . . D2 . . . D2 . . . G2 . . . G2 . . . E2 . . . E2 . . . A2 . . . A2 . . . B2 . . . B2 . . . E2 . . . - - - -"},
      {kind:"drum",seq:"k - h - s - h - k - h - s - h h k - h - s - h - k - h - s - h h k - h - s - h - k - h - s - h h k - h - s - h - k k s - s s s s"}
    ]},
    battle:{bpm:150,loop:true,ch:[
      {kind:"p25",vol:.09,seq:"E4 E4 - E4 G4 - E4 - D4 D4 - D4 F4 - D4 - C4 C4 - C4 E4 - C4 - B3 - D4 - F4 - G4 - E4 E4 - E4 G4 - E4 - A4 - G4 - E4 - D4 - C4 - E4 - G4 - A4 - B4 . . . - - - -"},
      {kind:"p12",vol:.05,seq:"- - E3 - - - E3 - - - D3 - - - D3 - - - C3 - - - C3 - - - B2 - - - B2 - - - E3 - - - E3 - - - A3 - - - A3 - - - C3 - - - C3 - - - B2 - - - - - -"},
      {kind:"triangle",vol:.17,seq:"E2 - E2 E2 - E2 - E2 D2 - D2 D2 - D2 - D2 C2 - C2 C2 - C2 - C2 B1 - B1 B1 - B1 - B1 E2 - E2 E2 - E2 - E2 A2 - A2 A2 - A2 - A2 C2 - C2 C2 - C2 - C2 B1 - B1 B1 - B1 B1 B1"},
      {kind:"drum",seq:"k h s h k h s h k h s h k h s s k h s h k h s h k h s h k k s s k h s h k h s h k h s h k h s s k h s h k h s h k h s h s s s s"}
    ]},
    boss:{bpm:160,loop:true,ch:[
      {kind:"p25",vol:.1,seq:"E4 - E4 - F4 - E4 - D#4 - E4 - B3 - - - E4 - E4 - F4 - G4 - F4 - E4 - D#4 - - - A4 - G4 - F4 - E4 - F4 - E4 - D#4 - - - E4 - D#4 - E4 - F4 - G4 - A4 - B4 - - -"},
      {kind:"p12",vol:.06,seq:"E3 - - - E3 - - - E3 - - - E3 - - - F3 - - - F3 - - - E3 - - - E3 - - - A3 - - - A3 - - - F3 - - - F3 - - - E3 - - - E3 - - - B3 - - - B3 - - -"},
      {kind:"triangle",vol:.18,seq:"E2 E2 E2 - E2 E2 E2 - E2 E2 E2 - E2 E2 E2 - F2 F2 F2 - F2 F2 F2 - E2 E2 E2 - E2 E2 E2 - A1 A1 A1 - A1 A1 A1 - F2 F2 F2 - F2 F2 F2 - E2 E2 E2 - E2 E2 E2 - B1 B1 B1 - B1 B1 B1 -"},
      {kind:"drum",seq:"k k s - k k s - k k s - k k s s k k s - k k s - k k s - k k s s k k s - k k s - k k s - k k s s k k s - k k s - k s k s s s s s"}
    ]},
    victory:{bpm:140,loop:false,ch:[
      {kind:"p25",vol:.11,seq:"C5 C5 C5 . - - G4 . C5 . . . - - - - E5 . D5 . C5 . D5 . C5 . . . . . . ."},
      {kind:"p12",vol:.06,seq:"E4 E4 E4 . - - E4 . E4 . . . - - - - G4 . F4 . E4 . F4 . E4 . . . . . . ."},
      {kind:"triangle",vol:.16,seq:"C3 - C3 - G2 - G2 - C3 - C3 - - - - - F2 - F2 - G2 - G2 - C3 . . . . . . ."},
      {kind:"drum",seq:"k - s - k - s - k - - - - - - - k - s - k - s - k - - - - - - -"}
    ]},
    defeat:{bpm:80,loop:false,ch:[
      {kind:"p25",vol:.1,seq:"E4 . . D#4 . . D4 . . C#4 . . . . . . C4 . . . . . . . . . . . . . . ."},
      {kind:"triangle",vol:.16,seq:"E2 . . . . . D2 . . . . . C2 . . . . . . . . . . . . . . . . . . ."}
    ]},
    loot:{bpm:170,loop:false,ch:[
      {kind:"p25",vol:.1,seq:"G4 B4 D5 G5 . . . ."},
      {kind:"p12",vol:.06,seq:"D4 G4 B4 D5 . . . ."}
    ]}
  };
  function parse(seq){return seq.trim().split(/\s+/)}
  function play(name,opts={}){const c=ac();stop();if(!c)return;const T=TRACKS[name];if(!T)return;cur=name;
    const stepDur=60/T.bpm/2;const chans=T.ch.map(ch=>({...ch,notes:parse(ch.seq)}));const len=Math.max(...chans.map(ch=>ch.notes.length));
    let step=0,nextT=c.currentTime+.05;
    const schedule=()=>{while(nextT<c.currentTime+.25){const i=step%len;
        chans.forEach(ch=>{const n=ch.notes[i];if(!n||n==="-"||n===".")return;
          if(ch.kind==="drum"){if(n==="k"){osc(110,nextT,.08,"sine",.3);noise(nextT,.05,.15,false)}else if(n==="s")noise(nextT,.12,.18,true);else if(n==="h")noise(nextT,.03,.06,true);return}
          let hold=1;for(let j=i+1;j<ch.notes.length&&ch.notes[j]===".";j++)hold++;
          osc(freq(n),nextT,stepDur*hold*.95,ch.kind,ch.vol)});
        step++;nextT+=stepDur;
        if(!T.loop&&step>=len){clearInterval(timer);timer=null;if(opts.then)setTimeout(opts.then,(nextT-c.currentTime)*1000);return}}};
    schedule();timer=setInterval(schedule,100)}
  function stop(){if(timer){clearInterval(timer);timer=null}cur=null}
  function setMuted(m){muted=m;if(m){stop();if(ctx&&ctx.state==="running")ctx.suspend()}else if(ctx)ctx.resume()}
  function sfx(name){const c=ac();if(!c)return;const t=c.currentTime;
    switch(name){
      case "hit":osc(440,t,.06,"p25",.12);osc(660,t+.05,.08,"p25",.12);noise(t,.04,.12,true);break;
      case "crit":osc(523,t,.06,"p25",.14);osc(784,t+.06,.06,"p25",.14);osc(1047,t+.12,.16,"p25",.16);noise(t,.08,.2,true);noise(t+.12,.1,.12,false);break;
      case "miss":osc(220,t,.18,"sawtooth",.1);osc(160,t+.1,.25,"sawtooth",.09);noise(t,.1,.1,false);break;
      case "death":[0,.15,.3,.45,.6].forEach((d,i)=>osc(400-i*70,t+d,.22,"sawtooth",.12));noise(t+.7,.4,.25,false);break;
      case "combo":osc(200,t,.25,"triangle",.12);noise(t,.15,.15,true);break;
      case "loot":play("loot");break;
      case "click":osc(880,t,.03,"p12",.05);break;
      case "tick":osc(1200,t,.04,"p12",.04);break;
      case "step":noise(t,.03,.05,false);break;
      case "bossIn":osc(80,t,.5,"sawtooth",.15);noise(t,.3,.3,false);osc(60,t+.3,.6,"sawtooth",.15);break;
    }}
  return {play,stop,sfx,setMuted,current:()=>cur,unlock:ac};
})();
