// 16-bit overworld of Highland High, drawn procedurally from the aerial layout.
// Coordinates are in a 256x224 SNES-style frame; scaled by the canvas.
const CAMPUS={
  w:256,h:224,
  // boss locations placed on real buildings (session -> position, label)
  spots:{
    1:{x:46,y:80,label:"Snack Bar"},
    2:{x:178,y:116,label:"The Quad"},
    3:{x:146,y:138,label:"The Gym"},
    4:{x:214,y:76,label:"Library"},
    5:{x:244,y:28,label:"Front Office"},
    6:{x:98,y:196,label:"Parking Lot"},
    7:{x:164,y:196,label:"Bus Loop"},
    8:{x:32,y:40,label:"Ball Fields"},
    9:{x:56,y:140,label:"Bleachers"},
    10:{x:226,y:174,label:"ASB Store"},
    11:{x:200,y:6,label:"Charger Ave Dropoff"},
    12:{x:100,y:132,label:"Art Room"}
  }
};
const CP={grass:"#3d8f45",grass2:"#48a050",dirt:"#b89258",dirt2:"#a07e46",orchard:"#5d7f3c",tree:"#2e6b2a",treeHi:"#4f9a44",path:"#cfc8a8",road:"#4a4a55",roadLine:"#e8d26b",roof:"#5a3f36",roofHi:"#7a5a4c",roofLo:"#3f2a24",wall:"#d9cfb3",solar:"#243a66",solarHi:"#3b5aa0",court:"#2f6f8f",courtLine:"#dfe8ee",track:"#9e3b3b",trackLine:"#f1e9d2",field:"#4ba65a",water:"#3f78c0",shadow:"rgba(0,0,0,.25)",outline:"#1a1a26"};
function px(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function tile(c,x,y,w,h,a,b,s=4){for(let j=0;j<h;j+=s)for(let i=0;i<w;i+=s)px(c,x+i,y+j,s,s,((i/s+j/s)%2)?a:b)}
function tree(c,x,y){px(c,x+2,y+6,4,3,"#5a3a1a");px(c,x,y,8,7,CP.tree);px(c,x+1,y,3,3,CP.treeHi);px(c,x+1,y+6,6,1,CP.shadow)}
function building(c,x,y,w,h,hip=true){
  px(c,x+2,y+h,w,3,CP.shadow);
  px(c,x,y,w,h,CP.roof);px(c,x,y,w,2,CP.roofHi);px(c,x,y+h-2,w,2,CP.roofLo);px(c,x,y,2,h,CP.roofHi);px(c,x+w-2,y,2,h,CP.roofLo);
  if(hip){px(c,x+w/2-1,y+2,2,h-4,CP.roofHi);px(c,x+2,y+h/2-1,w-4,2,CP.roofLo)}
  c.strokeStyle=CP.outline;c.lineWidth=1;c.strokeRect(x+.5,y+.5,w-1,h-1);
}
function diamond(c,x,y,r){px(c,x-r,y-r,2*r,2*r,CP.field);c.fillStyle=CP.dirt;c.beginPath();c.moveTo(x,y-r+2);c.lineTo(x+r-2,y);c.lineTo(x,y+r-2);c.lineTo(x-r+2,y);c.closePath();c.fill();px(c,x-3,y-3,6,6,CP.field);px(c,x-1,y-1,2,2,CP.dirt2);c.strokeStyle=CP.trackLine;c.lineWidth=1;c.beginPath();c.moveTo(x,y+r-2);c.lineTo(x+r-2,y);c.moveTo(x,y+r-2);c.lineTo(x-r+2,y);c.stroke()}
var drawCampus=function(c,freedSet,now){
  const W=CAMPUS.w,H=CAMPUS.h;
  tile(c,0,0,W,H,CP.grass,CP.grass2);
  // roads: Charger Ave (top, curving) and Claymore St (bottom)
  px(c,0,0,W,10,CP.road);px(c,0,4,W,1,CP.roadLine);
  px(c,0,H-12,W,12,CP.road);px(c,0,H-7,W,1,CP.roadLine);
  // orchard (dirt with tree circles) top-middle
  tile(c,70,12,100,70,CP.dirt,CP.dirt2,4);
  for(let j=0;j<5;j++)for(let i=0;i<8;i++){const ox=76+i*12+((j%2)?6:0),oy=16+j*13;px(c,ox,oy,8,8,CP.orchard);px(c,ox+2,oy+2,4,4,CP.dirt2)}
  // ball fields top-left and top-right
  diamond(c,30,34,22);diamond(c,86,30,14);diamond(c,190,28,18);
  // track & field left
  px(c,8,86,52,96,CP.track);c.fillStyle=CP.track;c.beginPath();c.ellipse(34,86,26,12,0,0,6.28);c.fill();c.beginPath();c.ellipse(34,182,26,12,0,0,6.28);c.fill();
  px(c,16,92,36,84,CP.field);c.fillStyle=CP.field;c.beginPath();c.ellipse(34,92,18,8,0,0,6.28);c.fill();c.beginPath();c.ellipse(34,176,18,8,0,0,6.28);c.fill();
  for(let y=100;y<170;y+=10)px(c,18,y,32,1,CP.trackLine);
  // snack bar / small buildings near track
  building(c,66,80,18,10,false);building(c,66,96,14,8,false);
  // construction / dirt lot
  tile(c,70,120,40,30,CP.dirt,CP.dirt2,4);px(c,74,126,12,8,CP.wall);px(c,92,130,10,6,CP.wall);
  // tennis courts
  px(c,70,160,40,20,CP.court);for(let i=0;i<4;i++)px(c,72+i*10,160,1,20,CP.courtLine);px(c,70,170,40,1,CP.courtLine);
  // solar carports along Claymore
  for(let i=0;i<2;i++){px(c,66+i*34,186,30,22,CP.solar);for(let j=0;j<22;j+=4)px(c,66+i*34,186+j,30,1,CP.solarHi)}
  for(let i=0;i<2;i++){px(c,140+i*26,190,22,18,CP.solar);for(let j=0;j<18;j+=4)px(c,140+i*26,190+j,22,1,CP.solarHi)}
  // paths
  px(c,118,86,4,110,CP.path);px(c,118,110,110,4,CP.path);px(c,150,60,4,60,CP.path);px(c,118,150,70,4,CP.path);
  // octagon gym
  c.fillStyle=CP.shadow;c.beginPath();for(let k=0;k<8;k++){const a=k/8*6.28+.39;c.lineTo(122+22*Math.cos(a),122+22*Math.sin(a))}c.closePath();c.fill();
  c.fillStyle=CP.roof;c.beginPath();for(let k=0;k<8;k++){const a=k/8*6.28+.39;c.lineTo(118+22*Math.cos(a),118+22*Math.sin(a))}c.closePath();c.fill();c.strokeStyle=CP.outline;c.stroke();
  c.fillStyle=CP.wall;c.beginPath();c.arc(118,118,8,0,6.28);c.fill();
  // classroom pods (hip roofs) in a cluster on the right
  const pods=[[160,40],[186,30],[212,22],[236,36],[170,66],[196,60],[222,58],[180,92],[206,88],[232,84],[190,124],[216,122],[240,118],[200,150],[226,148],[212,176],[238,172]];
  pods.forEach(([x,y])=>building(c,x,y,22,20,true));
  // scattered trees
  [[62,112],[140,70],[128,160],[160,180],[246,100],[150,30],[100,88]].forEach(([x,y])=>tree(c,x,y));
  // boss markers
  Object.entries(CAMPUS.spots).forEach(([s,sp])=>{const f=freedSet.has(+s);const bob=Math.sin((now||0)/300+s)*1.5;
    px(c,sp.x-6,sp.y+6,12,2,CP.shadow);
    if(f){px(c,sp.x-3,sp.y-10+bob,6,10,"#f1e9d2");px(c,sp.x-1,sp.y-14+bob,2,4,"#ffb347");px(c,sp.x-7,sp.y-16+bob,6,2,"#2d4f9d");px(c,sp.x-7,sp.y-14+bob,6,2,"#4ba65a")}
    else{px(c,sp.x-5,sp.y-12+bob,10,12,"#4b2a7a");px(c,sp.x-5,sp.y-12+bob,10,2,"#6a3fa8");px(c,sp.x-3,sp.y-8+bob,2,2,"#ff5c5c");px(c,sp.x+1,sp.y-8+bob,2,2,"#ff5c5c");px(c,sp.x-6,sp.y-14+bob,12,2,"#000")}
  });
}

// ---------- LANDMARKS ----------
const LM={};["gym","diamond","track","bleachers","tennis","carport","pod","snackbar","flag","tree"].forEach(k=>{const im=new Image();im.src="art/landmarks/"+k+".png";LM[k]=im});
function L(c,k,x,y,w,h){const im=LM[k];if(!(im&&im.complete&&im.naturalWidth))return false;const s=Math.min(w/im.naturalWidth,h/im.naturalHeight);const dw=im.naturalWidth*s,dh=im.naturalHeight*s;c.drawImage(im,x+(w-dw)/2,y+(h-dh)/2,dw,dh);return true}
// positions traced from the aerial, in 256x224 map space: [key,x,y,w,h]
const LANDMARKS=[
 ["diamond",2,6,62,62],["diamond",66,8,30,30],["diamond",142,8,42,42],
 ["track",14,100,40,88],["bleachers",50,110,12,56],
 ["gym",118,104,56,60],
 ["tennis",58,164,64,26],["carport",56,186,84,26],["carport",142,186,46,26],
 ["snackbar",34,78,24,20],["flag",190,116,8,22],
 // upper-right pod cluster
 ["pod",150,24,18,18],["pod",172,20,18,18],["pod",194,14,18,18],["pod",216,10,18,18],["pod",236,16,18,18],
 ["pod",156,48,18,18],["pod",178,46,18,18],["pod",200,44,18,18],["pod",222,44,18,18],
 ["pod",186,68,18,18],["pod",208,66,18,18],["pod",230,66,18,18],
 ["pod",196,88,18,18],["pod",218,88,18,18],["pod",240,86,18,18],
 // lower-right cluster
 ["pod",186,142,18,18],["pod",208,140,18,18],["pod",230,140,18,18],
 ["pod",196,164,18,18],["pod",218,164,18,18],["pod",240,164,18,18],
 ["pod",206,186,18,18],["pod",228,186,18,18]
];
// orchard trees on a grid inside the dirt block
// scattered trees
[[4,92],[6,200],[120,154],[176,124],[246,124],[246,200],[100,150]].forEach(([x,y])=>LANDMARKS.push(["tree",x,y,12,12]));
// ---------- IMAGE TILE OVERWORLD ----------
const TILES={};let tilesReady=false;
(function(){const names=["grass","grass2","grass3","grass4","dirtpatch","dirt","path","path2","path_v","road_h_edge","road_v","road_v2","road_v3","road_v4","road_t","tree_fruit","tree_round","bush","roof_a","roof_b","roof_c","wall_window","wall_door","wall_small","gym_a","gym_b","gym_c","gym_d","gymdoor","tennis","solar_a","solar_b","infield","track","bleachers","flagpole","bench_can","fence_lamp"];
  let n=0;names.forEach(k=>{const im=new Image();im.onload=()=>{if(++n>=names.length*0.8)tilesReady=true};im.onerror=()=>{};im.src="art/tiles/"+k+".png";TILES[k]=im})})();
function T(c,k,x,y,w=16,h=16){const im=TILES[k];if(im&&im.complete&&im.naturalWidth){c.drawImage(im,x,y,w,h);return true}return false}
// 16x14 tile map (256x224 at 16px). Letters index TILEMAP_KEY.
const TILEMAP_KEY={".":"grass",",":"grass2",";":"grass3","'":"grass4","d":"dirt","D":"dirtpatch","p":"path","P":"path_v","=":"road_h_edge","|":"road_v","T":"road_t","o":"tree_round","f":"tree_fruit","b":"bush","R":"roof_a","r":"roof_b","W":"wall_window","w":"wall_door","G":"gym_a","g":"gym_b","H":"gym_c","h":"gym_d","e":"gymdoor","t":"tennis","s":"solar_a","S":"solar_b","i":"infield","k":"track","L":"bleachers","F":"flagpole","n":"bench_can","c":"fence_lamp"};
const TILEMAP=[
"================================",
"...............................=",
"...............................=",
"...............................=",
"...............................=",
"...............................=",
"................................",
"................................",
"................................",
"................................",
"................................",
"................................",
".......ppppppppppppppppppppppppp",
".....................P..........",
"........DDDDDDDDD....P..........",
"........DDDDDDDDD....P..........",
"........DDDDDDDDD....P..........",
"........DDDDDDDDD....P..........",
"........DDDDDDDDD....P..........",
".....................P..........",
".......ppppppppppppppppppppppppp",
"................................",
"................................",
"................................",
"................................",
"................................",
"================================",
"================================"];
function drawCampusTiles(c,freedSet,now){
  if(!tilesReady)return false;
  const W=256,H=224,ts=8;
  for(let r=0;r<TILEMAP.length;r++)for(let col=0;col<32;col++){const ch=TILEMAP[r][col];const k=TILEMAP_KEY[ch]||"grass";
    // ground under sprites that have transparency
    if(["tree_round","tree_fruit","bush","flagpole","bench_can","fence_lamp","bleachers","solar_a","solar_b","gym_a","gym_b","gym_c","gym_d","gymdoor"].includes(k))T(c,k.startsWith("solar")?"road_v":k.startsWith("gym")?"path":"grass",col*ts-0.5,r*ts-0.5,ts+1,ts+1);
    T(c,k,col*ts-0.5,r*ts-0.5,ts+1,ts+1)}
  // athletic practice field where the orchard used to be
  c.fillStyle="rgba(255,255,255,.35)";for(let y=30;y<106;y+=10)c.fillRect(70,y,70,1);c.fillRect(70,28,1,80);c.fillRect(139,28,1,80);
  c.fillStyle="#f1e9d2";c.fillRect(96,26,18,1);c.fillRect(96,26,1,5);c.fillRect(113,26,1,5);c.fillRect(96,108,18,1);c.fillRect(96,104,1,5);c.fillRect(113,104,1,5);
  // placed landmark sprites (sorted by bottom edge for depth)
  LANDMARKS.slice().sort((a,b)=>(a[2]+a[4])-(b[2]+b[4])).forEach(([k,x,y,w,h])=>L(c,k,x,y,w,h));
  // boss markers
  Object.entries(CAMPUS.spots).forEach(([s,sp])=>{const f=freedSet.has(+s);const bob=Math.sin((now||0)/300+s)*1.5;
    px(c,sp.x-6,sp.y+6,12,2,"rgba(0,0,0,.3)");
    if(f){px(c,sp.x-3,sp.y-10+bob,6,10,"#f1e9d2");px(c,sp.x-1,sp.y-14+bob,2,4,"#ffb347");px(c,sp.x-7,sp.y-16+bob,6,2,"#2d4f9d");px(c,sp.x-7,sp.y-14+bob,6,2,"#4ba65a")}
    else{px(c,sp.x-5,sp.y-12+bob,10,12,"#4b2a7a");px(c,sp.x-5,sp.y-12+bob,10,2,"#6a3fa8");px(c,sp.x-3,sp.y-8+bob,2,2,"#ff5c5c");px(c,sp.x+1,sp.y-8+bob,2,2,"#ff5c5c");px(c,sp.x-6,sp.y-14+bob,12,2,"#000")}});
  return true;
}
const _drawCampusProc=drawCampus;
drawCampus=function(c,freedSet,now){if(!drawCampusTiles(c,freedSet,now))_drawCampusProc(c,freedSet,now)};
