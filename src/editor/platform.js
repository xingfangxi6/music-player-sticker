export function miniTool(){
 const api=window.xhs&&window.xhs.miniTool;
 if(!api||typeof api.writeTempFile!=='function'||typeof api.saveImageToPhotosAlbum!=='function'){
  throw Error('请在小红书小工具内保存到相册');
 }
 return api;
}

export async function saveToAlbum(data){
 const api=miniTool();
 const result=await api.writeTempFile({data});
 if(!result||typeof result.filePath!=='string'||!result.filePath)throw Error('临时图片生成失败，请重试');
 await api.saveImageToPhotosAlbum({filePath:result.filePath});
}

export function failureMessage(error){
 const message=error&&(error.errMsg||error.message)||'保存失败，请重试';
 if(/auth|permission|denied|权限|授权/i.test(message))return '未获得相册权限，请允许相册访问后重试';
 if(/cancel|取消/i.test(message))return '已取消保存，可再次尝试';
 return message;
}

export function installCompatibility(){
 // Lucide combines class lists with flatMap (not present in Chrome 61).
 if(!Array.prototype.flatMap){
  Object.defineProperty(Array.prototype,'flatMap',{configurable:true,writable:true,value:function(callback,thisArg){
   const result=[];
   this.forEach((value,index)=>{
    const mapped=callback.call(thisArg,value,index,this);
    if(Array.isArray(mapped))mapped.forEach(item=>result.push(item));else result.push(mapped);
   });return result;
  }});
 }
 // Only the DOM methods used by the editor need a local Chrome 61 fallback.
 if(!Element.prototype.replaceChildren){
  Element.prototype.replaceChildren=function(...nodes){
   while(this.firstChild)this.removeChild(this.firstChild);
   for(const node of nodes)this.appendChild(typeof node==='string'?document.createTextNode(node):node);
  };
 }
 const flex=document.createElement('div');
 flex.style.cssText='position:absolute;visibility:hidden;display:flex;flex-direction:column;row-gap:1px';
 flex.append(document.createElement('div'),document.createElement('div'));document.body.appendChild(flex);
 if(flex.scrollHeight!==1)document.documentElement.classList.add('no-flex-gap');
 flex.remove();
 const viewport=window.visualViewport;
 const syncViewport=()=>{
  const height=viewport?viewport.height:window.innerHeight;
  const style=document.documentElement.style;
  style.setProperty('--app-height',height+'px');
  style.setProperty('--app-top',(viewport?viewport.offsetTop:0)+'px');
  style.setProperty('--preview-height',Math.max(90,Math.min(280,height*.30))+'px');
 };
 syncViewport();
 window.addEventListener('resize',syncViewport);
 if(viewport){
  viewport.addEventListener('resize',()=>{
   syncViewport();
   const active=document.activeElement;
   if(active&&active.matches('input:not([type=range]),textarea')){
    requestAnimationFrame(()=>active.scrollIntoView({block:'nearest'}));
   }
  });
  viewport.addEventListener('scroll',syncViewport);
 }
}
