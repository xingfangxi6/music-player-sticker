import {WebGLGlass} from '../vendor/liquid-glass/liquid-glass-webgl.js';

// Adapter only: the vendored WebGLGlass shader and API are unchanged.
export class LiquidMaterial {
 constructor(){
  this.canvas=document.createElement('canvas');
  this.engine=new WebGLGlass(this.canvas);
  this.source=document.createElement('canvas');
  this.output=document.createElement('canvas');
  this.sourceKey='';this.outputKey='';
  this.low=false;this.slow=0;
  this.onLost=e=>{e.preventDefault();this.lost=true;this.outputKey='';};
  this.onRestored=()=>{this.lost=true;};
  this.canvas.addEventListener('webglcontextlost',this.onLost);
  this.canvas.addEventListener('webglcontextrestored',this.onRestored);
 }
 draw(ctx,state,assets,rect){
  const started=performance.now();
  const {canvasWidth:fullW,canvasHeight:fullH}=state;
  const gl=this.engine.gl;
  if(this.lost||gl.isContextLost())throw Error('WebGL 上下文已丢失');
  const limit=gl.getParameter(gl.MAX_TEXTURE_SIZE),viewport=gl.getParameter(gl.MAX_VIEWPORT_DIMS);
  const edge=Math.min(this.low?1024:2048,limit,viewport[0],viewport[1]);
  const dpr=Math.min(window.devicePixelRatio||1,this.low?1:1.5);
  const displayWidth=assets.displayWidth||Math.min(fullW,720);
  const factor=Math.min(1,displayWidth*dpr/fullW,edge/fullW,edge/fullH,Math.sqrt((this.low?1000000:2000000)/(fullW*fullH)));
  const W=Math.max(1,Math.floor(fullW*factor)),H=Math.max(1,Math.floor(fullH*factor));
  const sx=W/fullW,sy=H/fullH;
  const sourceKey=[W,H,assets.backgroundVersion||0,state.glassBlur,rect.scale].join('/');
  if(this.sourceKey!==sourceKey||this.background!==assets.background){
   this.source.width=W;this.source.height=H;
   const c=this.source.getContext('2d');
   const blur=(state.glassBlur??1)*rect.scale*sx;
   if(blur)c.filter=`blur(${blur}px)`;
   c.drawImage(assets.backgroundCanvas,0,0,W,H);c.filter='none';
   this.engine.resize(W,H,1);
   this.engine.setSource(this.source);
   if(gl.getError()!==gl.NO_ERROR)throw Error('无法创建液态玻璃纹理');
   this.sourceKey=sourceKey;this.background=assets.background;this.outputKey='';
  }
  const key=[sourceKey,rect.x,rect.y,rect.width,state.refraction,state.glassShine].join('/');
  if(this.outputKey!==key){
   this.engine.setLenses([{
    x:rect.x*sx,y:rect.y*sy,w:rect.width*sx,h:rect.height*sy,
    radius:42*rect.scale*sx,depth:22*rect.scale*sx,
    scale:(state.refraction??45)*.65*rect.scale*sx,
    chroma:.25,specular:(state.glassShine??55)/100*.7
   }]);
   this.engine.render();
   if(gl.getError()!==gl.NO_ERROR)throw Error('液态玻璃渲染失败');
   // Copy synchronously before WebGL discards the drawing buffer.
   this.output.width=Math.max(1,Math.ceil(rect.width*sx));this.output.height=Math.max(1,Math.ceil(rect.height*sy));
   this.output.getContext('2d').drawImage(this.canvas,rect.x*sx,rect.y*sy,rect.width*sx,rect.height*sy,0,0,this.output.width,this.output.height);
   this.outputKey=key;
  }
  ctx.drawImage(this.output,0,0,694,316);
  this.slow=performance.now()-started>70?this.slow+1:Math.max(0,this.slow-1);
  if(this.slow>=4){
   if(this.low)throw Error('当前设备渲染较慢，已使用轻量材质');
   this.low=true;this.slow=0;this.sourceKey='';this.outputKey='';
  }
 }
 destroy(){
  this.canvas.removeEventListener('webglcontextlost',this.onLost);
  this.canvas.removeEventListener('webglcontextrestored',this.onRestored);
  this.engine.destroy();
  this.engine.gl.getExtension('WEBGL_lose_context')?.loseContext();
  this.source.width=this.source.height=this.output.width=this.output.height=1;
 }
}
