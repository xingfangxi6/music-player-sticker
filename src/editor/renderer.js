import {LiquidMaterial} from './liquid-material.js';
import {drawCollages} from './photo-layers.js';
import airplaySvg from '../vendor/simple-icons/airplayaudio.svg';

// Measured from the supplied 810 × 360 reference. All geometry is in card units.
export const DESIGN = Object.freeze({width:694,height:316,radius:42,cover:[24,28,110,110],title:[152,75],lyric:[152,114],bar:[98,168,483,13]});
export const ICONS = {
 star:'M66 230 L72 245 L88 246 L76 257 L80 273 L66 265 L52 273 L56 257 L44 246 L60 245 Z',
 previous:'M202 234 Q205 232 205 236 L205 268 Q205 272 201 270 L173 253 Q169 251 173 248 Z M237 234 Q240 232 240 236 L240 268 Q240 272 236 270 L208 253 Q204 251 208 248 Z',
 pause:'M327 221 H338 Q341 221 341 224 V280 Q341 284 338 284 H327 Q323 284 323 280 V225 Q323 221 327 221 Z M356 221 H367 Q371 221 371 225 V280 Q371 284 367 284 H356 Q352 284 352 280 V225 Q352 221 356 221 Z',
 next:'M459 234 Q455 232 455 236 V268 Q455 272 459 270 L487 253 Q491 251 487 248 Z M493 234 Q489 232 489 236 V268 Q489 272 493 270 L521 253 Q525 251 521 248 Z',
 waveform:'M613 67 V75 M619 61 V80 M625 66 V76 M631 59 V82 M637 67 V75 M643 70 V72 M649 70 V72'
};
export async function loadAirplay(){
 const doc=new DOMParser().parseFromString(airplaySvg,'image/svg+xml');
 const d=doc.querySelector('path')?.getAttribute('d');
 if(!d||doc.querySelector('parsererror'))throw Error('音频投放 SVG 无效');
 return new Path2D(d);
}
export function color(hex,alpha=1){
 const n=parseInt(hex.replace('#',''),16);
 return `rgba(${n>>16},${n>>8&255},${n&255},${alpha})`;
}
export function bounds(s){
 const scale=s.width/DESIGN.width;
 return {x:(s.canvasWidth-s.width)*s.x,y:(s.canvasHeight-DESIGN.height*scale)*s.y,width:s.width,height:DESIGN.height*scale,scale};
}
export function imageFit(c,img,x,y,w,h,crop){
 const [sx,sy,sw,sh]=crop||[0,0,img.naturalWidth||img.width,img.naturalHeight||img.height];
 const ratio=Math.max(w/sw,h/sh),cw=w/ratio,ch=h/ratio;
 c.drawImage(img,sx+(sw-cw)/2,sy+(sh-ch)/2,cw,ch,x,y,w,h);
}
function round(c,x,y,w,h,r){
 r=Math.min(r,w/2,h/2);c.beginPath();c.moveTo(x+r,y);c.lineTo(x+w-r,y);
 c.arcTo(x+w,y,x+w,y+r,r);c.lineTo(x+w,y+h-r);c.arcTo(x+w,y+h,x+w-r,y+h,r);
 c.lineTo(x+r,y+h);c.arcTo(x,y+h,x,y+h-r,r);c.lineTo(x,y+r);c.arcTo(x,y,x+r,y,r);c.closePath();
}
// Small absolute SVG path interpreter, also supported by mini-program Canvas 2D.
function path(c,d){const t=d.match(/[A-Z]|-?\d+(?:\.\d+)?/g);let i=0,x=0,y=0;c.beginPath();while(i<t.length){const op=t[i++];if(op==='M'||op==='L'){x=+t[i++];y=+t[i++];op==='M'?c.moveTo(x,y):c.lineTo(x,y);}else if(op==='H'){x=+t[i++];c.lineTo(x,y);}else if(op==='V'){y=+t[i++];c.lineTo(x,y);}else if(op==='Q'){const a=+t[i++],b=+t[i++];x=+t[i++];y=+t[i++];c.quadraticCurveTo(a,b,x,y);}else if(op==='Z')c.closePath();else throw Error('Unsupported path: '+op);}}
// Separable box blur, on a reduced buffer. No CSS/filter support required.
function blurPixels(ctx,w,h,r){const image=ctx.getImageData(0,0,w,h),a=image.data,b=new Uint8ClampedArray(a.length);for(let pass=0;pass<3;pass++){for(let y=0;y<h;y++)for(let ch=0;ch<4;ch++){let sum=0;for(let k=-r;k<=r;k++)sum+=a[(y*w+Math.max(0,Math.min(w-1,k)))*4+ch];for(let x=0;x<w;x++){b[(y*w+x)*4+ch]=sum/(2*r+1);sum+=a[(y*w+Math.min(w-1,x+r+1))*4+ch]-a[(y*w+Math.max(0,x-r))*4+ch];}}for(let x=0;x<w;x++)for(let ch=0;ch<4;ch++){let sum=0;for(let k=-r;k<=r;k++)sum+=b[(Math.max(0,Math.min(h-1,k))*w+x)*4+ch];for(let y=0;y<h;y++){a[(y*w+x)*4+ch]=sum/(2*r+1);sum+=b[(Math.min(h-1,y+r+1)*w+x)*4+ch]-b[(Math.max(0,y-r)*w+x)*4+ch];}}}ctx.putImageData(image,0,0);}

export function render(canvas,s,assets,surfaces){
 const W=s.canvasWidth,H=s.canvasHeight;canvas.width=W;canvas.height=H;
 const c=canvas.getContext('2d',{willReadFrequently:true});
 if(assets.backgroundCanvas)c.drawImage(assets.backgroundCanvas,0,0);else imageFit(c,assets.background,0,0,W,H);
 drawCollages(c,s,true);
 const backdropVersion=`${assets.backgroundVersion||0}/${s.collageRevision||0}`;
 const {scale,x,y}=bounds(s),ink=s.inkColor||'#ffffff';
 // The sticker is composited as one layer so opacity affects the entire player.
 const layer=surfaces?.layer||document.createElement('canvas');layer.width=W;layer.height=H;const g=layer.getContext('2d',{willReadFrequently:true});
 const liquid=s.material==='liquid';
 if(!liquid){
  const key=[W,H,scale,backdropVersion].join('/');if(assets.blurKey!==key||assets.blurSource!==assets.background){const blur=surfaces?.blur||document.createElement('canvas');blur.width=Math.ceil(W/4);blur.height=Math.ceil(H/4);const bc=blur.getContext('2d');bc.drawImage(canvas,0,0,blur.width,blur.height);blurPixels(bc,blur.width,blur.height,Math.max(1,Math.round(8*scale/4)));assets.blurred=blur;assets.blurKey=key;assets.blurSource=assets.background;}
 }
 g.save();g.setTransform(scale,0,0,scale,x,y);round(g,0,0,694,316,42);g.clip();
 if(liquid){
  assets.liquidMaterial??=new LiquidMaterial();
  assets.liquidMaterial.draw(g,s,{...assets,backgroundCanvas:canvas,backgroundVersion:backdropVersion},bounds(s));
 }else{
  g.save();g.setTransform(1,0,0,1,0,0);g.drawImage(assets.blurred,0,0,W,H);g.restore();
 }
 g.fillStyle=color(s.panelColor||'#6e6e6c',(s.tintStrength??66)/100);g.fillRect(0,0,694,316);
 if(liquid){
  const shine=(s.glassShine??55)/100;
  const rim=g.createLinearGradient(0,0,694,316);
  rim.addColorStop(0,color('#ffffff',.95*shine));rim.addColorStop(.45,color('#ffffff',.12*shine));
  rim.addColorStop(.7,color('#ffffff',.08*shine));rim.addColorStop(1,color('#ffffff',.6*shine));
  g.strokeStyle=rim;g.lineWidth=1.6;round(g,.9,.9,692.2,314.2,41.1);g.stroke();
 }
 g.save();round(g,24,28,110,110,13);g.clip();imageFit(g,assets.cover,24,28,110,110,assets.referenceCover?[60,56,110,110]:null);g.restore();
 const fontSize=Math.max(20,Math.min(36,s.fontSize||32));
 g.save();g.beginPath();g.rect(152,36,438,99);g.clip();g.fillStyle=color(ink,.94);g.font=`550 ${fontSize}px -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif`;g.fillText(s.title+(s.artist?' — '+s.artist:''),152,75);g.fillStyle=color(ink,.70);g.font=`400 ${fontSize}px -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif`;g.fillText(s.lyric,152,114);g.restore();
 g.fillStyle=color(ink,.24);round(g,98,168,483,13,6.5);g.fill();g.save();g.clip();g.fillStyle=color(ink,.94);g.fillRect(98,168,483*s.progress/100,13);g.restore();
 g.font='500 22px -apple-system, BlinkMacSystemFont, Arial, sans-serif';g.fillStyle=color(ink,.86);g.fillText(s.current,34,182);g.textAlign='right';g.fillText(s.remaining,659,182);
 for(const name of ['star','previous','pause','next','waveform']){path(g,ICONS[name]);if(['star','waveform'].includes(name)){g.strokeStyle=color(ink,name==='waveform'?.38:.56);g.lineWidth=name==='star'?3.7:3;g.lineJoin='round';g.lineCap='round';g.stroke();}else{g.fillStyle=color(ink,.96);g.fill();}}
 if(assets.airplay){
  g.save();g.translate(611,229);g.scale(42/24,42/24);g.fillStyle=color(ink,.66);g.fill(assets.airplay);g.restore();
 }
 g.restore();
 if(s.strokes?.length){
  g.save();g.setTransform(scale,0,0,scale,x,y);g.globalCompositeOperation='destination-out';
  for(const stroke of s.strokes)drawStroke(g,stroke);
  g.restore();
 }
 c.globalAlpha=1-s.transparency/100;c.drawImage(layer,0,0);c.globalAlpha=1;
 drawCollages(c,s,false);
 return {x,y,width:s.width,height:s.width*316/694,scale};
}

// Strokes use sticker-local coordinates so masks survive resize, move and export.
export function drawStroke(c,stroke){
 const radius=stroke.size/2,points=stroke.points;
 if(!points.length)return;
 if(stroke.hardness>=100){
  c.fillStyle='#000';c.strokeStyle='#000';c.lineWidth=stroke.size;c.lineCap='round';c.lineJoin='round';
  c.beginPath();c.arc(points[0][0],points[0][1],radius,0,Math.PI*2);c.fill();
  c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.stroke();return;
 }
 const stamp=(x,y)=>{
  const fill=c.createRadialGradient(x,y,radius*stroke.hardness/100,x,y,radius);
  fill.addColorStop(0,'rgba(0,0,0,1)');fill.addColorStop(1,'rgba(0,0,0,0)');
  c.fillStyle=fill;c.fillRect(x-radius,y-radius,stroke.size,stroke.size);
 };
 stamp(...points[0]);
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/Math.max(1,radius*.18));
  for(let j=1;j<=steps;j++)stamp(a[0]+(b[0]-a[0])*j/steps,a[1]+(b[1]-a[1])*j/steps);
 }
}
