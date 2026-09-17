export function paintBackground(canvas,image,state,backdrop){
 const W=state.canvasWidth,H=state.canvasHeight;
 canvas.width=W;canvas.height=H;
 const c=canvas.getContext('2d',{willReadFrequently:true});
 c.fillStyle=state.canvasColor||'#ffffff';c.fillRect(0,0,W,H);
 if(state.canvasFill==='image'&&backdrop){
  const scale=Math.max(W/backdrop.naturalWidth,H/backdrop.naturalHeight);
  const w=backdrop.naturalWidth*scale,h=backdrop.naturalHeight*scale;
  c.drawImage(backdrop,(W-w)/2,(H-h)/2,w,h);
 }
 if(state.photoVisible===false||!image)return;
 const fit=state.photoFit==='contain'?Math.min:Math.max;
 const scale=fit(W/image.naturalWidth,H/image.naturalHeight)*state.photoZoom/100;
 const w=image.naturalWidth*scale,h=image.naturalHeight*scale;
 c.drawImage(image,W*state.photoX-w/2,H*state.photoY-h/2,w,h);
}

export function collageBounds(item,state){
 const width=item.size/100*state.canvasWidth;
 return {x:item.x*state.canvasWidth,y:item.y*state.canvasHeight,width,height:width*item.image.naturalHeight/item.image.naturalWidth,angle:item.rotation*Math.PI/180};
}

export function hitCollage(item,state,point){
 const b=collageBounds(item,state),dx=point.x-b.x,dy=point.y-b.y;
 const x=dx*Math.cos(b.angle)+dy*Math.sin(b.angle),y=-dx*Math.sin(b.angle)+dy*Math.cos(b.angle);
 return Math.abs(x)<=b.width/2&&Math.abs(y)<=b.height/2;
}

export function drawCollages(ctx,state,behind){
 for(const item of state.collages||[]){
  if(item.behind!==behind)continue;
  const b=collageBounds(item,state);
  ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.angle);ctx.globalAlpha=item.opacity/100;
  ctx.drawImage(item.image,-b.width/2,-b.height/2,b.width,b.height);ctx.restore();
 }
}
