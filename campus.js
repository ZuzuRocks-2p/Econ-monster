// 16-bit overworld of Highland High, drawn procedurally from the aerial layout.
// Coordinates are in a 256x224 SNES-style frame; scaled by the canvas.
const CAMPUS={
  w:256,h:224,
  // boss locations placed on real buildings (session -> position, label)
  spots:{
    1:{x:52,y:108,label:"Snack Bar"},
    2:{x:150,y:100,label:"The Quad"},
    3:{x:118,y:84,label:"The Gym"},
    4:{x:206,y:60,label:"Library"},
    5:{x:236,y:24,label:"Front Office"},
    6:{x:40,y:150,label:"Parking Lot"},
    7:{x:150,y:176,label:"Bus Loop"},
    8:{x:40,y:36,label:"Ball Fields"},
    9:{x:22,y:76,label:"Bleachers"},
    10:{x:200,y:150,label:"ASB Store"},
    11:{x:180,y:12,label:"Charger Dropoff"},
    12:{x:96,y:60,label:"Art Room"}
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

// ---------- IMAGE TILE OVERWORLD ----------
const TILES={};let tilesReady=false;
(function(){const names=["grass","grass2","grass3","grass4","dirtpatch","dirt","path","path2","path_v","road_h_edge","road_v","road_v2","road_v3","road_v4","road_t","tree_fruit","tree_round","bush","roof_a","roof_b","roof_c","wall_window","wall_door","wall_small","gym_a","gym_b","gym_c","gym_d","gymdoor","tennis","solar_a","solar_b","infield","track","bleachers","flagpole","bench_can","fence_lamp"];
  let n=0;names.forEach(k=>{const im=new Image();im.onload=()=>{if(++n>=names.length*0.8)tilesReady=true};im.onerror=()=>{};im.src="art/tiles/"+k+".png";TILES[k]=im})})();
function T(c,k,x,y,w=16,h=16){const im=TILES[k];if(im&&im.complete&&im.naturalWidth){c.drawImage(im,x,y,w,h);return true}return false}
// 16x14 tile map (256x224 at 16px). Letters index TILEMAP_KEY.
const TILEMAP_KEY={".":"grass",",":"grass2",";":"grass3","'":"grass4","d":"dirt","D":"dirtpatch","p":"path","P":"path_v","=":"road_h_edge","|":"road_v","T":"road_t","o":"tree_round","f":"tree_fruit","b":"bush","R":"roof_a","r":"roof_b","W":"wall_window","w":"wall_door","G":"gym_a","g":"gym_b","H":"gym_c","h":"gym_d","e":"gymdoor","t":"tennis","s":"solar_a","S":"solar_b","i":"infield","k":"track","L":"bleachers","F":"flagpole","n":"bench_can","c":"fence_lamp"};
const TILEMAP=[
"================================",
"iiiiiii.,ffffffff,.iiiiii;.RrRrR",
"iiiiiii,.ffffffff.,iiiiii,'WwWwW",
"iiiiiii.,ffffffffD.iiiiii..,.o.,",
"iiiiiii;'ffffffffD,iiiiii.RrRr.R",
"kkkkkkk.,ffffffff.;......,WwWw,W",
"kLLLLkk,.ffffffff,.o.RrRr.....,.",
"kLLLLkk..pppppppppppWwWw.RrRr.o.",
"kLLLLkk,.P.,.GgHh.,.....,WwWw...",
"kLLLLkk..P..GgGgHh,.o.RrRr.....,",
"kLLLLkk,.P.,GgGgHh..,.WwWw.RrRr.",
"kkkkkkk..P..'eeee'.o......'WwWw,",
"n.,DDDD,.P.pppppppppppppppp.....",
".;DDDD..,P.,.o.,.RrRr.;.o.,RrRr,",
"..tttt,.;P..,..;.WwWw.,..,.WwWw.",
",.tttt..,P.o.,.c....,RrRr.......",
"sssSSSs.;P..;.....'.,WwWw.,F.,o.",
"sssSSSs,.Ppppppppppppppppppppp..",
"sssSSSs.,P.,.o..RrRr.,..o.,.RrRr",
"sssSSSs,;P.b..,.WwWw..;..,'.WwWw",
",.,.,.,..P..,..,......o.,.......",
".;.o.,.;.ppppppppppppppppppppp.;",
",..,.;.,.,..;..,..;..,..;..,..,.",
".,.,..,.,.,.,.,..,.,.,.,.,.,..,.",
"================================",
"================================",
"================================",
"================================"];
function drawCampusTiles(c,freedSet,now){
  if(!tilesReady)return false;
  const W=256,H=224,ts=8;
  for(let r=0;r<TILEMAP.length;r++)for(let col=0;col<32;col++){const ch=TILEMAP[r][col];const k=TILEMAP_KEY[ch]||"grass";
    // ground under sprites that have transparency
    if(["tree_round","tree_fruit","bush","flagpole","bench_can","fence_lamp","bleachers","solar_a","solar_b","gym_a","gym_b","gym_c","gym_d","gymdoor"].includes(k))T(c,k.startsWith("solar")?"road_v":k.startsWith("gym")?"path":"grass",col*ts-0.5,r*ts-0.5,ts+1,ts+1);
    T(c,k,col*ts-0.5,r*ts-0.5,ts+1,ts+1)}
  // boss markers
  Object.entries(CAMPUS.spots).forEach(([s,sp])=>{const f=freedSet.has(+s);const bob=Math.sin((now||0)/300+s)*1.5;
    px(c,sp.x-6,sp.y+6,12,2,"rgba(0,0,0,.3)");
    if(f){px(c,sp.x-3,sp.y-10+bob,6,10,"#f1e9d2");px(c,sp.x-1,sp.y-14+bob,2,4,"#ffb347");px(c,sp.x-7,sp.y-16+bob,6,2,"#2d4f9d");px(c,sp.x-7,sp.y-14+bob,6,2,"#4ba65a")}
    else{px(c,sp.x-5,sp.y-12+bob,10,12,"#4b2a7a");px(c,sp.x-5,sp.y-12+bob,10,2,"#6a3fa8");px(c,sp.x-3,sp.y-8+bob,2,2,"#ff5c5c");px(c,sp.x+1,sp.y-8+bob,2,2,"#ff5c5c");px(c,sp.x-6,sp.y-14+bob,12,2,"#000")}});
  return true;
}
const _drawCampusProc=drawCampus;
drawCampus=function(c,freedSet,now){if(!drawCampusTiles(c,freedSet,now))_drawCampusProc(c,freedSet,now)};
