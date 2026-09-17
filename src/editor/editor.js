import {render,bounds,DESIGN,loadAirplay} from './renderer.js?v=collage-4';
import {paintBackground,collageBounds,hitCollage} from './photo-layers.js?v=canvas-5';
import {saveToAlbum,failureMessage} from './platform.js';

const icon=name=>`<i data-lucide="${name}" aria-hidden="true"></i>`;
const tool=(id,name,label)=>`<button type="button" id="${id}" title="${label}" aria-label="${label}">${icon(name)}</button>`;
const field=(id,label,value,max=150)=>`<label class="field">${label}<input id="${id}" value="${value}" maxlength="${max}"></label>`;

export function mountEditor(root,urls={}){
 root.innerHTML=`
 <header><div class="brand">BGM贴纸</div><button id="export" class="primary">${icon('image')}生成图片</button></header>
 <div class="layout">
 <section class="workspace">
  <div class="toolbar" role="toolbar" aria-label="画布工具">
   <div class="toolgroup" aria-label="编辑模式">
    ${tool('move','move','移动所选图层')}${tool('pick','pipette','从背景取色')}<button type="button" id="erase" title="擦除播放器贴纸" aria-label="擦除播放器贴纸">${icon('eraser')}<span>橡皮擦</span></button>
   </div>
   <div class="toolgroup">${tool('undo','undo-2','撤销擦除')}${tool('redo','redo-2','重做擦除')}${tool('restore','rotate-ccw','恢复全部擦除')}</div>
   <select id="editTarget" aria-label="当前编辑图层"><option value="background">照片</option><option value="player">播放器</option></select>
   <span id="dimensions"></span>
  </div>
  <div class="size-controls">
   <div class="size-heading"><label for="sizeScale">播放器整体大小</label><output id="sizeScaleValue" for="sizeScale" title="占画布宽度"></output></div>
   <div class="size-row">
    ${tool('sizeDown','minus','缩小播放器')}
    <input id="sizeScale" aria-label="播放器整体大小" type="range" min="20" max="100" step=".1" value="52.8">
    ${tool('sizeUp','plus','放大播放器')}
    <label class="size-pixels"><input id="width" aria-label="播放器宽度（px）" type="number" min="216" max="2160" step="1" value="570"><span>px</span></label>
   </div>
   <div class="presets"><button data-size=".2">最小</button><button data-size=".75">默认</button><button data-size="1">最大</button></div>
  </div>
  <div id="viewTools" class="view-tools" hidden>
   <label for="viewZoom">放大视图 · 可双指</label><input id="viewZoom" aria-label="放大编辑视图" type="range" min="100" max="400" step="25" value="100"><output id="viewZoomValue">100%</output>
   <button id="panView" type="button" aria-pressed="false">移动画面</button><button id="resetView" type="button">复位</button>
  </div>
  <div class="stage"><div class="canvas-wrap">
   <canvas id="composition" aria-label="播放器贴纸画布"></canvas><div id="selectionFrame" hidden></div><div id="brushCursor" hidden></div>
  </div></div>
  <div class="statusline"><span id="sampleBadge">示例效果</span><span id="modeStatus">移动贴纸</span><span role="status" id="status">正在加载图片</span><button type="button" id="exportSecondary" aria-label="生成图片">${icon('image')}<span>生成图片</span></button></div>
 </section>
 <aside>
  <div class="editor-tabs" role="tablist" aria-label="编辑分类">
   <button id="tab-background" role="tab" aria-selected="true" aria-controls="panel-background" data-tab="background">${icon('image')}照片</button>
   <button id="tab-player" role="tab" aria-selected="false" aria-controls="panel-player" tabindex="-1" data-tab="player">${icon('music-2')}歌曲</button>
   <button id="tab-style" role="tab" aria-selected="false" aria-controls="panel-style" tabindex="-1" data-tab="style">${icon('sliders-horizontal')}播放器样式</button>
   <button id="tab-collage" role="tab" aria-selected="false" aria-controls="panel-collage" tabindex="-1" data-tab="collage">${icon('layers')}拼贴</button>
  </div>
  <div class="panel-scroll">
  <div id="panel-background" role="tabpanel" aria-labelledby="tab-background">
  <section id="photoSettings">
   <div id="photoCommands" class="photo-commands">
    <label class="upload photo-upload">${icon('image-plus')}<span id="photoUploadText">上传我的照片</span><input id="backgroundFile" aria-label="上传或更换照片" type="file" accept="image/*"></label>
    <button id="nextMusic" class="primary" type="button" hidden>编辑歌曲${icon('arrow-right')}</button>
   </div>
   <div id="canvasSettings" class="canvas-settings"><h2>画布尺寸</h2>
    <div class="pair"><label class="field">画布比例<select id="ratio"><option value="landscape">3:2</option><option value="portrait" selected>3:4</option><option value="square">1:1</option><option value="story">9:16</option><option value="reference">810:360</option></select></label>
    <label class="field">导出宽度<select id="resolution"><option value="1080" selected>1080 px</option><option value="2160">2160 px</option></select></label></div>
   </div>
   <label class="field">照片大小 <output id="photoZoomValue"></output><input id="photoZoom" aria-label="照片缩放" type="range" min="20" max="300" value="100"></label>
   <div class="photo-actions"><select id="photoFit" aria-label="照片适配"><option value="cover">铺满画布</option><option value="contain">完整显示</option></select>${tool('movePhoto','move','移动照片')}${tool('resetPhoto','rotate-ccw','重置照片大小和位置')}</div>
   <p class="photo-gesture-hint">画布上单指移动 · 双指缩放照片</p>
   <label class="check-field"><input id="photoVisible" type="checkbox" checked>显示照片</label>
  </section>
  <details id="backdropSettings"><summary>画布底色 / 背景图</summary>
  <section>
   <div class="material-switch" role="group" aria-label="画布背景类型">
    <button type="button" data-fill="color" aria-pressed="true">纯色</button>
    <button type="button" data-fill="image" aria-pressed="false">图片</button>
   </div>
   <div id="canvasColorControls">
    <div class="colorrow"><label for="canvasColor">画布底色</label><input id="canvasColor" type="color" value="#ffffff"><input id="canvasHex" aria-label="画布底色 HEX" maxlength="7" value="#FFFFFF" spellcheck="false"></div>
    <div class="swatches" aria-label="画布底色预设">
     <button data-canvas-color="#ffffff" style="--swatch:#ffffff" aria-label="白色画布" title="白色"></button>
     <button data-canvas-color="#191c20" style="--swatch:#191c20" aria-label="黑色画布" title="黑色"></button>
     <button data-canvas-color="#e6b6c5" style="--swatch:#e6b6c5" aria-label="粉色画布" title="粉色"></button>
     <button data-canvas-color="#b7dce2" style="--swatch:#b7dce2" aria-label="浅青画布" title="浅青"></button>
     <button data-canvas-color="#c5d7b5" style="--swatch:#c5d7b5" aria-label="浅绿画布" title="浅绿"></button>
    </div>
   </div>
   <div id="canvasImageControls" hidden>
    <label class="upload">${icon('image-plus')}上传画布背景<input id="canvasFile" aria-label="上传画布背景" type="file" accept="image/png,image/jpeg,image/webp"></label>
    <div class="backdrop-info"><span id="canvasImageName">未选择图片</span>${tool('removeCanvasImage','trash-2','移除画布背景图片')}</div>
   </div>
  </section></details>
  </div>
  <div id="panel-collage" role="tabpanel" aria-labelledby="tab-collage" hidden>
  <section><h2>拼贴素材 <span id="collageCount">0 / 20</span></h2>
   <label class="upload" id="collageUpload">${icon('images')}添加拼贴素材<input id="collageFiles" aria-label="添加拼贴素材" type="file" accept="image/png,image/jpeg,image/webp" multiple></label>
   <div id="collageList" aria-label="拼贴素材列表"></div>
   <div id="collageControls" hidden>
    <label class="field">素材大小 <output id="collageSizeValue"></output><input id="collageSize" aria-label="拼贴素材大小" type="range" min="5" max="150" step=".5" value="35"></label>
    <label class="field">宽度（px）<input id="collageWidth" aria-label="拼贴素材宽度（px）" type="number" min="1" step="1"></label>
    <label class="field">旋转 <output id="collageRotationValue"></output><input id="collageRotation" aria-label="拼贴素材旋转" type="range" min="-180" max="180" value="0"></label>
    <label class="field">不透明度 <output id="collageOpacityValue"></output><input id="collageOpacity" aria-label="拼贴素材不透明度" type="range" min="0" max="100" value="100"></label>
    <label class="field">图层位置<select id="collagePlacement"><option value="front">播放器前面</option><option value="behind">播放器后面</option></select></label>
    <div class="toolgroup">${tool('collageBack','arrow-down','素材后移一层')}${tool('collageForward','arrow-up','素材前移一层')}${tool('collageReset','rotate-ccw','重置素材变换')}${tool('collageDelete','trash-2','删除所选素材')}</div>
   </div>
  </section>
  </div>
  <div id="panel-style" role="tabpanel" aria-labelledby="tab-style" hidden>
  <section id="styleSettings"><div class="style-heading"><h2>播放器样式</h2><button type="button" id="eraserEntry">${icon('eraser')}<span>橡皮擦</span></button></div>
   <div class="material-switch" role="group" aria-label="贴纸材质">
    <button type="button" data-material="frost" aria-pressed="true">毛玻璃</button>
    <button type="button" data-material="liquid" aria-pressed="false">液态玻璃</button>
   </div>
   <details id="glassControls" hidden><summary>液态玻璃细节</summary>
    <label class="field">折射强度 <output id="refractionValue"></output><input id="refraction" aria-label="折射强度" type="range" min="0" max="100" value="45"></label>
    <label class="field">边缘高光 <output id="glassShineValue"></output><input id="glassShine" aria-label="边缘高光" type="range" min="0" max="100" value="55"></label>
    <label class="field">雾化程度 <output id="glassBlurValue"></output><input id="glassBlur" aria-label="雾化程度" type="range" min="0" max="12" step=".5" value="1"></label>
   </details>
   <div class="colorrow"><label for="panelColor">贴纸底色</label><input id="panelColor" type="color" value="#18251f"><input id="panelHex" aria-label="贴纸底色 HEX" value="#18251F" maxlength="7" spellcheck="false"></div>
   <div class="colorrow"><label for="inkColor">文字 / 图标</label><input id="inkColor" type="color" value="#f3eee0"><input id="inkHex" aria-label="文字图标 HEX" value="#F3EEE0" maxlength="7" spellcheck="false"></div>
   <div class="swatches" aria-label="配色预设">
    <button data-panel="#18251f" data-ink="#f3eee0" style="--swatch:#18251f" title="森林深绿" aria-label="森林深绿"></button>
    <button data-panel="#6e6e6c" data-ink="#ffffff" style="--swatch:#6e6e6c" title="灰色毛玻璃" aria-label="灰色毛玻璃"></button>
    <button data-panel="#d4a6b2" data-ink="#38252e" style="--swatch:#d4a6b2" title="浅粉" aria-label="浅粉"></button>
    <button data-panel="#b1d0d8" data-ink="#17323b" style="--swatch:#b1d0d8" title="浅青" aria-label="浅青"></button>
    <button data-panel="#eceeea" data-ink="#242721" style="--swatch:#eceeea" title="雾白" aria-label="雾白"></button>
   </div>
   <label class="field">取色目标<select id="pickTarget"><option value="panel">贴纸底色</option><option value="ink">文字 / 图标</option></select></label>
   <label class="field">底色浓度 <output id="tintStrengthValue"></output><input id="tintStrength" aria-label="底色浓度" type="range" min="0" max="100" value="58"></label>
   <label class="field">整体透明度 <output id="transparencyValue"></output><input id="transparency" aria-label="整体透明度" type="range" min="0" max="100" value="0"></label>
  </section>
  <section id="eraserSettings"><div class="eraser-heading"><h2>橡皮擦</h2><button type="button" id="finishErase">完成擦除</button></div>
   <p class="eraser-help" id="eraseHelp">照片与播放器位置已锁定，仅擦除播放器。放大视图可处理细节。</p>
   <label class="field">笔刷大小 <output id="brushSizeValue"></output><input id="brushSize" aria-label="笔刷大小" type="range" min="4" max="180" value="48"></label>
   <label class="field">边缘硬度 <output id="hardnessValue"></output><input id="hardness" aria-label="边缘硬度" type="range" min="0" max="100" value="100"></label>
  </section>
  </div>
  <div id="panel-player" role="tabpanel" aria-labelledby="tab-player" hidden>
  <section id="songSettings"><h2>歌曲信息</h2>
   <label class="upload cover-upload"><img id="coverThumb" alt="专辑封面"><span>更换封面</span>${icon('image-plus')}<input id="coverFile" aria-label="更换封面" type="file" accept="image/*"></label>
   ${field('title','歌名','Stay Awhile')}${field('artist','歌手','Luma',100)}${field('lyric','第二行','Stay here. Let it fade.',200)}
   <details class="song-details"><summary>字号与播放进度</summary>
   <label class="field">文字大小 <output id="fontSizeValue"></output><input id="fontSize" aria-label="文字大小" type="range" min="20" max="36" step="1" value="32"></label>
   <div class="pair">${field('current','当前时间','0:24',8)}${field('remaining','剩余时间','−3:03',8)}</div>
   <label class="field">播放进度 <output id="progressValue"></output><input id="progress" aria-label="播放进度" type="range" min="0" max="100" step=".5" value="11.5"></label>
   </details>
  </section>
  </div></div>
 </aside></div>
 <div id="result" class="result-overlay" role="dialog" aria-modal="true" aria-labelledby="resultTitle" hidden><div class="result-sheet"><div class="dialog-head"><strong id="resultTitle">图片已生成</strong>${tool('closeResult','x','关闭导出预览')}</div><img id="exportPreview" alt="PNG 导出预览"><div class="dialog-foot"><span id="exportInfo"></span><button id="saveAlbum" class="primary">${icon('download')}保存到相册</button></div><p id="saveStatus" role="status"></p></div></div>`;
 window.lucide?.createIcons();
 const $=id=>root.querySelector('#'+id),canvas=$('composition'),cursor=$('brushCursor');
 const state={title:'Stay Awhile',artist:'Luma',lyric:'Stay here. Let it fade.',fontSize:32,current:'0:24',remaining:'−3:03',progress:11.5,transparency:0,canvasWidth:1080,canvasHeight:1440,width:810,x:.5,y:.14,panelColor:'#36353d',inkColor:'#ffffff',tintStrength:58,strokes:[],material:'frost',refraction:45,glassShine:55,glassBlur:1};
 Object.assign(state,{photoZoom:100,photoFit:'cover',photoX:.5,photoY:.5,photoVisible:Boolean(urls.background),canvasColor:'#ffffff',canvasFill:'color',collages:[],collageRevision:0});
 const looks={frost:{panelColor:'#36353d',inkColor:'#ffffff',tintStrength:58},liquid:{panelColor:'#36353d',inkColor:'#ffffff',tintStrength:20}};
 const surfaces={layer:document.createElement('canvas'),blur:document.createElement('canvas')};
 const backgroundCanvas=document.createElement('canvas');
 let assets={},frame=0,disposed=false,mode='move',gesture=null,redo=[],brushSize=48,hardness=100,exportUrl;
 let selected='background',photoDirty=false,collageSequence=0;
 let playerOutline=false,outlineTimer;
 let viewZoom=1,viewX=0,viewY=0,panView=false,pinch=null;
 let exporting=false,saving=false;
 const urlsToRelease=new Set(),uploadVersions={background:0,cover:0,canvas:0};
 const load=(src,limit=2048)=>new Promise((resolve,reject)=>{
  const image=new Image();image.onerror=()=>reject(Error('图片读取失败，请选择有效图片'));
  image.onload=()=>{
   if(image.naturalWidth*image.naturalHeight>32000000){reject(Error('图片不能超过 3200 万像素'));return;}
   if(Math.max(image.naturalWidth,image.naturalHeight)<=limit){resolve(image);return;}
   const buffer=document.createElement('canvas'),scale=limit/Math.max(image.naturalWidth,image.naturalHeight);
   buffer.width=Math.max(1,Math.round(image.naturalWidth*scale));buffer.height=Math.max(1,Math.round(image.naturalHeight*scale));
   buffer.getContext('2d').drawImage(image,0,0,buffer.width,buffer.height);
   buffer.toBlob(blob=>{
    buffer.width=buffer.height=1;if(!blob){reject(Error('图片处理失败'));return;}
    const url=URL.createObjectURL(blob),small=new Image();
    small.onload=()=>{URL.revokeObjectURL(url);resolve(small);};
    small.onerror=()=>{URL.revokeObjectURL(url);reject(Error('图片处理失败'));};small.src=url;
   },'image/png');
  };image.src=src;
 });
 const status=text=>$('status').textContent=text;
 const maxWidth=()=>Math.min(state.canvasWidth,state.canvasHeight*DESIGN.width/DESIGN.height);
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 // Keep the existing controls and listeners; tab switching only changes visibility.
 const sizeControls=root.querySelector('.size-controls');
 $('styleSettings').after(sizeControls);
 $('styleSettings').append($('glassControls'));
 $('coverThumb').src=urls.cover;
 const panelScroll=root.querySelector('.panel-scroll'),tabScroll={};
 let activeTab='background';
 function openTab(name){
  hidePlayerOutline();
  const changed=name!==activeTab;
  if(changed){
   tabScroll[activeTab]=panelScroll.scrollTop;
   activeTab=name;
  }
  for(const tab of root.querySelectorAll('[data-tab]')){
   const active=tab.dataset.tab===name;
   tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;
   $('panel-'+tab.dataset.tab).hidden=!active;
  }
  if(changed)panelScroll.scrollTop=tabScroll[name]||0;
 }
 root.querySelectorAll('[data-tab]').forEach(tab=>{
  tab.onclick=()=>{
   const name=tab.dataset.tab;
   selectLayer(name==='background'?'background':name==='collage'?selectedCollage()?.id||'player':'player',name);
  };
  tab.onkeydown=e=>{
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
   e.preventDefault();const tabs=[...root.querySelectorAll('[data-tab]')],i=tabs.indexOf(tab);
   const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length;
   tabs[next].click();tabs[next].focus();
  };
 });
 $('nextMusic').onclick=()=>{selectLayer('player','player');panelScroll.scrollTop=0;};
 function hidePlayerOutline(){
  clearTimeout(outlineTimer);playerOutline=false;
  if(selected==='player')$('selectionFrame').hidden=true;
 }
 function flashPlayerOutline(){
  hidePlayerOutline();playerOutline=true;syncLayerControls();
  outlineTimer=setTimeout(hidePlayerOutline,900);
 }
 for(const event of ['pointerdown','focusin','input','change']){
  panelScroll.addEventListener(event,hidePlayerOutline,true);
 }
 function syncCanvasFill(){
  root.querySelectorAll('[data-fill]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.fill===state.canvasFill)));
  $('canvasColorControls').hidden=state.canvasFill!=='color';$('canvasImageControls').hidden=state.canvasFill!=='image';
  $('canvasColor').value=state.canvasColor;$('canvasHex').value=state.canvasColor.toUpperCase();$('canvasHex').removeAttribute('aria-invalid');
  $('canvasImageName').textContent=assets.canvasImageName||'未选择图片';
  $('removeCanvasImage').disabled=!assets.canvasBackdrop;
 }
 root.querySelectorAll('[data-fill]').forEach(el=>el.onclick=()=>{state.canvasFill=el.dataset.fill;syncCanvasFill();photoDirty=true;schedule();});
 $('canvasColor').oninput=e=>{state.canvasColor=e.target.value;syncCanvasFill();photoDirty=true;schedule();};
 $('canvasHex').oninput=e=>{
  if(!/^#[0-9a-f]{6}$/i.test(e.target.value)){e.target.setAttribute('aria-invalid','true');return;}
  state.canvasColor=e.target.value;e.target.removeAttribute('aria-invalid');$('canvasColor').value=state.canvasColor;photoDirty=true;schedule();
 };
 $('canvasHex').onblur=syncCanvasFill;
 root.querySelectorAll('[data-canvas-color]').forEach(el=>el.onclick=()=>{state.canvasColor=el.dataset.canvasColor;syncCanvasFill();photoDirty=true;schedule();});
 $('photoVisible').onchange=e=>{state.photoVisible=e.target.checked;photoDirty=true;schedule();};
 $('canvasFile').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  const version=++uploadVersions.canvas;
  if(file.size>20*1024*1024){status('请选择 20MB 内的背景图片');e.target.value='';return;}
  const url=URL.createObjectURL(file);urlsToRelease.add(url);
  try{
   const image=await load(url);if(disposed||version!==uploadVersions.canvas)return;
   if(image.naturalWidth*image.naturalHeight>16000000)throw Error('背景图片不能超过 1600 万像素');
   assets.canvasBackdrop=image;assets.canvasImageName=file.name;state.canvasFill='image';
   syncCanvasFill();photoDirty=true;paint();status('画布背景已更新');
  }catch(error){status(error.message);}
  finally{URL.revokeObjectURL(url);urlsToRelease.delete(url);e.target.value='';}
 };
 $('removeCanvasImage').onclick=()=>{uploadVersions.canvas++;delete assets.canvasBackdrop;delete assets.canvasImageName;state.canvasFill='color';syncCanvasFill();photoDirty=true;schedule();};
 function paint(){
  if(disposed||!assets.background||!assets.cover)return;
  if(photoDirty){cacheBackground();photoDirty=false;}
  fitPreview();
  const preview=previewState();assets.displayWidth=canvas.clientWidth||360;
  try{render(canvas,preview,assets,surfaces);}
  catch(error){
   if(state.material!=='liquid'){status(error.message);return;}
   assets.liquidMaterial?.destroy();delete assets.liquidMaterial;
   state.material='frost';Object.assign(state,looks.frost);syncMaterial();
   render(canvas,previewState(),assets,surfaces);
   status('液态玻璃不可用，已切回毛玻璃：'+error.message);
  }
  canvas.dataset.material=state.material;
  $('dimensions').textContent=`${state.canvasWidth} × ${state.canvasHeight}`;
  $('width').value=Math.round(state.width);
  $('width').min=Math.ceil(state.canvasWidth*.2);$('width').max=Math.floor(maxWidth());
  $('sizeScale').max=maxWidth()/state.canvasWidth*100;
  $('sizeScale').value=state.width/state.canvasWidth*100;
  $('sizeScaleValue').textContent=(state.width/state.canvasWidth*100).toFixed(1)+'%';
  $('sizeScale').setAttribute('aria-valuetext',`${Math.round(state.width)} 像素，画布宽度的 ${$('sizeScaleValue').textContent}`);
  $('sizeDown').disabled=state.width<=state.canvasWidth*.2;
  $('sizeUp').disabled=state.width>=maxWidth();
  for(const key of ['progress','transparency','tintStrength'])$(key+'Value').textContent=state[key]+'%';
  for(const key of ['refraction','glassShine','glassBlur'])$(key+'Value').textContent=state[key];
  $('fontSizeValue').textContent=state.fontSize;
  $('undo').disabled=!state.strokes.length;$('redo').disabled=!redo.length;$('restore').disabled=!state.strokes.length;
  $('export').disabled=exporting;
  syncLayerControls();
 }
 function schedule(){cancelAnimationFrame(frame);if(!document.hidden)frame=requestAnimationFrame(paint);}
 function fitPreview(){
  const mobile=window.matchMedia('(max-width:800px)').matches;
  const wrap=canvas.parentElement,stage=wrap.parentElement;
  if(mobile){
   const compactLandscape=window.matchMedia('(min-width:600px) and (max-height:460px)').matches;
   const available=root.querySelector('.layout').clientHeight-root.querySelector('.toolbar').offsetHeight-$('viewTools').offsetHeight;
   const shortEditor=root.clientHeight<640;
   stage.style.height=(compactLandscape?Math.max(60,available-38):Math.max(80,Math.min(400,root.clientHeight*(shortEditor ? .30 : .43),available-235)))+'px';
   const w=Math.max(1,Math.min(stage.clientWidth-16,(stage.clientHeight-16)*state.canvasWidth/state.canvasHeight));
   wrap.style.width=w+'px';
  }else{
   stage.style.removeProperty('height');
   wrap.style.removeProperty('width');
  }
  applyView();
 }
 // View transforms never change photo/player geometry or export resolution.
 function applyView(){
  const wrap=canvas.parentElement,stage=wrap.parentElement;
  const mx=Math.max(0,(wrap.offsetWidth*viewZoom-stage.clientWidth+16)/2);
  const my=Math.max(0,(wrap.offsetHeight*viewZoom-stage.clientHeight+16)/2);
  viewX=clamp(viewX,-mx,mx);viewY=clamp(viewY,-my,my);
  wrap.style.transform=`translate(${viewX}px,${viewY}px) scale(${viewZoom})`;
  $('viewZoom').value=Math.round(viewZoom*100);$('viewZoomValue').textContent=Math.round(viewZoom*100)+'%';
 }
 $('viewZoom').oninput=e=>{
  if(gesture)return;
  const next=+e.target.value/100,wrap=canvas.parentElement;
  if(viewZoom===1&&next>1){
   const b=bounds(state);
   viewX=(.5-(b.x+b.width/2)/state.canvasWidth)*wrap.offsetWidth*next;
   viewY=(.5-(b.y+b.height/2)/state.canvasHeight)*wrap.offsetHeight*next;
  }else{viewX*=next/viewZoom;viewY*=next/viewZoom;}
  viewZoom=next;cursor.hidden=true;applyView();
 };
 $('panView').onclick=()=>{
  if(gesture)return;
  panView=!panView;syncPanView();
 };
 function syncPanView(){
  $('panView').setAttribute('aria-pressed',String(panView));
  $('panView').textContent=panView?'返回擦除':'移动画面';
  $('eraseHelp').textContent=panView?'拖动画面查看其他位置，不改变照片和播放器位置；点“返回擦除”继续。':'照片与播放器位置已锁定，仅擦除播放器。放大视图可处理细节。';
  cursor.hidden=true;canvas.style.cursor=panView?'grab':mode==='move'?'grab':'crosshair';
 }
 $('resetView').onclick=()=>{if(!gesture){viewZoom=1;viewX=viewY=0;applyView();}};
 $('finishErase').onclick=()=>setMode('move');
 $('eraserEntry').onclick=()=>setMode('erase');
 window.addEventListener('resize',schedule);
 const viewport=window.visualViewport;
 if(viewport)viewport.addEventListener('resize',schedule);
 const onVisibility=()=>{if(document.hidden)cancelAnimationFrame(frame);else schedule();};
 document.addEventListener('visibilitychange',onVisibility);
 function previewState(){
  const width=Math.min(720,state.canvasWidth),scale=width/state.canvasWidth;
  return {...state,canvasWidth:width,canvasHeight:Math.round(state.canvasHeight*scale),width:state.width*scale};
 }
 function cacheBackground(){
  paintBackground(backgroundCanvas,assets.background,previewState(),assets.canvasBackdrop);
  assets.backgroundCanvas=backgroundCanvas;
  assets.backgroundVersion=(assets.backgroundVersion||0)+1;
 }
 function selectedCollage(){return state.collages.find(item=>item.id===selected);}
 function syncLayerControls(){
  $('photoZoom').value=state.photoZoom;$('photoZoomValue').textContent=state.photoZoom+'%';$('photoFit').value=state.photoFit;
  $('photoVisible').checked=state.photoVisible;
  for(const id of ['photoZoom','photoFit','movePhoto','resetPhoto'])$(id).disabled=!state.photoVisible;
  const item=selectedCollage();$('collageControls').hidden=!item;
  const outline=$('selectionFrame');outline.hidden=!item&&!(selected==='player'&&playerOutline);
  if(selected==='player'){
   const b=bounds(state);
   outline.style.left=b.x/state.canvasWidth*100+'%';outline.style.top=b.y/state.canvasHeight*100+'%';
   outline.style.width=b.width/state.canvasWidth*100+'%';outline.style.height=b.height/state.canvasHeight*100+'%';
   outline.style.transform='none';
  }
  $('collageList').querySelectorAll('button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.id===selected)));
  if(!item)return;
  $('collageSize').value=item.size;$('collageSizeValue').textContent=item.size.toFixed(1)+'%';
  $('collageWidth').value=Math.round(state.canvasWidth*item.size/100);
  $('collageWidth').min=Math.ceil(state.canvasWidth*.05);$('collageWidth').max=Math.floor(state.canvasWidth*1.5);
  $('collageRotation').value=item.rotation;$('collageRotationValue').textContent=item.rotation+'°';
  $('collageOpacity').value=item.opacity;$('collageOpacityValue').textContent=item.opacity+'%';
  $('collagePlacement').value=item.behind?'behind':'front';
  const group=state.collages.filter(i=>i.behind===item.behind),index=group.indexOf(item);
  $('collageBack').disabled=index===0;$('collageForward').disabled=index===group.length-1;
  const b=collageBounds(item,state);
  outline.style.left=item.x*100+'%';outline.style.top=item.y*100+'%';
  outline.style.width=b.width/state.canvasWidth*100+'%';outline.style.height=b.height/state.canvasHeight*100+'%';
  outline.style.transform=`translate(-50%,-50%) rotate(${item.rotation}deg)`;
 }
 function selectLayer(id,tab){
  hidePlayerOutline();
  openTab(tab||(id==='player'?(activeTab==='style'?'style':'player'):id==='background'?'background':'collage'));
  selected=id;$('editTarget').value=id;setMode('move');syncLayerControls();
 }
 function rebuildLayers(){
  const options=[new Option('照片','background'),new Option('播放器','player')];
  const buttons=[];
  for(const item of [...state.collages].reverse()){
   options.push(new Option(item.name,item.id));
   const button=document.createElement('button'),image=document.createElement('img'),label=document.createElement('span');
   button.type='button';button.dataset.id=item.id;button.title=item.name;button.onclick=()=>selectLayer(item.id);
   image.src=item.url;image.alt='';label.textContent=item.name;button.append(image,label);buttons.push(button);
  }
  $('editTarget').replaceChildren(...options);$('editTarget').value=selected;
  $('collageList').replaceChildren(...buttons);$('collageCount').textContent=state.collages.length+' / 20';
  syncLayerControls();
 }
 function changedCollage(){state.collageRevision++;schedule();}
 $('editTarget').onchange=e=>selectLayer(e.target.value);
 $('photoZoom').oninput=e=>{state.photoZoom=+e.target.value;photoDirty=true;selectLayer('background');schedule();};
 $('photoFit').onchange=e=>{state.photoFit=e.target.value;state.photoZoom=100;state.photoX=state.photoY=.5;photoDirty=true;selectLayer('background');schedule();};
 $('movePhoto').onclick=()=>selectLayer('background');
 $('resetPhoto').onclick=()=>{state.photoZoom=100;state.photoX=state.photoY=.5;photoDirty=true;selectLayer('background');schedule();};
 for(const [id,key] of [['collageSize','size'],['collageRotation','rotation'],['collageOpacity','opacity']]){
  $(id).oninput=e=>{const item=selectedCollage();if(item){item[key]=+e.target.value;changedCollage();}};
 }
 $('collageWidth').onchange=e=>{
  const item=selectedCollage();if(!item)return;
  const n=e.target.valueAsNumber;if(Number.isFinite(n))item.size=clamp(n/state.canvasWidth*100,5,150);
  changedCollage();
 };
 $('collagePlacement').onchange=e=>{const item=selectedCollage();if(item){item.behind=e.target.value==='behind';changedCollage();rebuildLayers();}};
 for(const [id,direction] of [['collageBack',-1],['collageForward',1]]){
  $(id).onclick=()=>{
   const item=selectedCollage();if(!item)return;
   const group=state.collages.filter(i=>i.behind===item.behind),other=group[group.indexOf(item)+direction];if(!other)return;
   const a=state.collages.indexOf(item),b=state.collages.indexOf(other);
   [state.collages[a],state.collages[b]]=[state.collages[b],state.collages[a]];rebuildLayers();changedCollage();
  };
 }
 $('collageReset').onclick=()=>{const item=selectedCollage();if(item){Object.assign(item,{size:35,x:.5,y:.55,rotation:0,opacity:100});changedCollage();}};
 $('collageDelete').onclick=()=>{
  const item=selectedCollage();if(!item)return;
  state.collages=state.collages.filter(i=>i!==item);URL.revokeObjectURL(item.url);urlsToRelease.delete(item.url);
  selectLayer('player');rebuildLayers();changedCollage();status('素材已移除');
 };
 $('collageFiles').onchange=async e=>{
  const files=[...e.target.files];if(!files.length)return;
  e.target.disabled=true;let added=0;const failures=[];
  try{
   for(const file of files){
    if(disposed)break;
    if(state.collages.length>=20){failures.push('最多添加 20 张素材');break;}
    if(!/\.(png|jpe?g|webp)$/i.test(file.name)||file.size>20*1024*1024){failures.push(file.name+'：请选择 20MB 内的 PNG、JPG 或 WebP');continue;}
    const url=URL.createObjectURL(file);urlsToRelease.add(url);
    try{
     const image=await load(url,1024);if(disposed){URL.revokeObjectURL(url);urlsToRelease.delete(url);break;}
     if(image.naturalWidth*image.naturalHeight>16000000)throw Error('素材不能超过 1600 万像素');
     const item={id:'collage-'+(++collageSequence),name:file.name,image,url,size:35,x:.5,y:.55,rotation:0,opacity:100,behind:false};
     state.collages.push(item);added++;selected=item.id;
    }catch(error){URL.revokeObjectURL(url);urlsToRelease.delete(url);failures.push(file.name+'：'+error.message);}
   }
   if(!disposed){rebuildLayers();selectLayer(selected);changedCollage();status(`已添加 ${added} 张素材`+(failures.length?'；'+failures.join('；'):''));}
  }finally{e.target.disabled=false;e.target.value='';}
 };
 function syncColors(){
  for(const key of ['panel','ink']){$(key+'Color').value=state[key+'Color'];$(key+'Hex').value=state[key+'Color'].toUpperCase();$(key+'Hex').removeAttribute('aria-invalid');}
 }
 function syncMaterial(){
  root.querySelectorAll('button[data-material]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.material===state.material)));
  $('glassControls').hidden=state.material!=='liquid';
  $('tintStrength').value=state.tintStrength;syncColors();
 }
 root.querySelectorAll('button[data-material]').forEach(el=>el.onclick=()=>{
  const next=el.dataset.material;if(next===state.material)return;
  looks[state.material]={panelColor:state.panelColor,inkColor:state.inkColor,tintStrength:state.tintStrength};
  state.material=next;Object.assign(state,looks[next]);syncMaterial();paint();
  if(state.material===next)status(next==='liquid'?'液态玻璃':'毛玻璃');
 });
 function setMode(next){
  if(gesture)finish({pointerId:gesture.pointer},true);
  hidePlayerOutline();
  if(next==='erase'||next==='pick'){selected='player';$('editTarget').value=selected;openTab('style');syncLayerControls();}
  mode=next;cursor.hidden=true;
  panView=false;syncPanView();
  $('viewTools').hidden=next!=='erase';
  $('eraserEntry').hidden=next==='erase';
  $('eraserSettings').hidden=next!=='erase';
  if(next==='erase'){
   $('panel-style').prepend($('eraserSettings'));panelScroll.scrollTop=0;
  }else{
   $('panel-style').append($('eraserSettings'));viewZoom=1;viewX=viewY=0;
  }
  schedule();
  for(const key of ['move','pick','erase'])$(key).setAttribute('aria-pressed',String(key===mode));
  canvas.style.cursor=mode==='move'?'grab':mode==='pick'?'crosshair':'crosshair';
  $('modeStatus').textContent={move:selected==='player'?'移动播放器':selected==='background'?'移动照片':'移动拼贴素材',pick:'背景取色 · '+($('pickTarget').value==='panel'?'贴纸底色':'文字 / 图标'),erase:'擦除播放器贴纸'}[mode];
 }
 for(const key of ['move','pick','erase'])$(key).onclick=()=>setMode(key);
 $('pickTarget').onchange=()=>setMode('pick');
 for(const key of ['panel','ink']){
  $(key+'Color').oninput=e=>{state[key+'Color']=e.target.value;syncColors();schedule();};
  $(key+'Hex').oninput=e=>{
   const hex=e.target.value;
   if(/^#[0-9a-f]{6}$/i.test(hex)){state[key+'Color']=hex;$(key+'Color').value=hex;e.target.removeAttribute('aria-invalid');schedule();}
   else e.target.setAttribute('aria-invalid','true');
  };
  $(key+'Hex').onblur=syncColors;
 }
 root.querySelectorAll('[data-panel]').forEach(el=>el.onclick=()=>{
  state.panelColor=el.dataset.panel;state.inkColor=el.dataset.ink;
  state.tintStrength=state.material==='liquid'?12:el.dataset.panel==='#6e6e6c'?66:92;$('tintStrength').value=state.tintStrength;syncColors();paint();
 });
 for(const key of ['title','artist','lyric','current','remaining'])$(key).oninput=e=>{state[key]=e.target.value;schedule();};
 for(const key of ['progress','transparency','tintStrength','refraction','glassShine','glassBlur','fontSize'])$(key).oninput=e=>{state[key]=+e.target.value;schedule();};
 function brushLabels(){$('brushSizeValue').textContent=brushSize;$('hardnessValue').textContent=hardness+'%';}
 $('brushSize').oninput=e=>{brushSize=+e.target.value;brushLabels();};
 $('hardness').oninput=e=>{hardness=+e.target.value;brushLabels();};
 function setWidth(value){
  state.width=clamp(Number.isFinite(value)?value:state.width,state.canvasWidth*.2,maxWidth());selectLayer('player');schedule();
 }
 $('width').onchange=e=>setWidth(e.target.value===''?state.width:+e.target.value);
 $('sizeScale').oninput=e=>setWidth(state.canvasWidth*+e.target.value/100);
 $('sizeDown').onclick=()=>setWidth(state.width-state.canvasWidth*.01);
 $('sizeUp').onclick=()=>setWidth(state.width+state.canvasWidth*.01);
 root.querySelectorAll('[data-size]').forEach(el=>el.onclick=()=>setWidth(state.canvasWidth*+el.dataset.size));
 function resize(){
  const old=state.canvasWidth;state.canvasWidth=+$('resolution').value;
  state.canvasHeight=Math.round(state.canvasWidth*({landscape:2/3,portrait:4/3,square:1,story:16/9,reference:360/810}[$('ratio').value]));
  state.width=Math.min(maxWidth(),state.width/old*state.canvasWidth);
  if(assets.background)cacheBackground();paint();
 }
 $('ratio').onchange=resize;$('resolution').onchange=resize;
 for(const kind of ['background','cover'])$(kind+'File').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;const version=++uploadVersions[kind];
  if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type)||file.size>20*1024*1024){status('请选择 20MB 内的 PNG、JPG、WebP 或 GIF 图片');e.target.value='';return;}
  const url=URL.createObjectURL(file);urlsToRelease.add(url);
  try{
   const img=await load(url);if(disposed||version!==uploadVersions[kind])return;assets[kind]=img;
   if(kind==='cover'){
    assets.referenceCover=false;
    const thumb=document.createElement('canvas');thumb.width=thumb.height=96;
    thumb.getContext('2d').drawImage(img,0,0,96,96);$('coverThumb').src=thumb.toDataURL();
   }else{
    state.photoVisible=true;state.photoZoom=100;state.photoX=state.photoY=.5;
    $('sampleBadge').hidden=true;$('photoUploadText').textContent='更换照片';
    $('nextMusic').hidden=false;$('photoCommands').classList.add('has-photo');
    cacheBackground();selectLayer('background');
   }
   paint();status(kind==='cover'?'封面已更新':'照片已更新');
  }
  catch(error){status(error.message);}finally{URL.revokeObjectURL(url);urlsToRelease.delete(url);e.target.value='';}
 };
 function position(e){
  const r=canvas.getBoundingClientRect();
  return {x:(e.clientX-r.left)*state.canvasWidth/r.width,y:(e.clientY-r.top)*state.canvasHeight/r.height};
 }
 function local(p){const b=bounds(state);return [(p.x-b.x)/b.scale,(p.y-b.y)/b.scale];}
 function inside(p){return p[0]>=0&&p[0]<=694&&p[1]>=0&&p[1]<=316;}
 function updateCursor(e){
  if(mode!=='erase'||panView){cursor.hidden=true;return;}
  const r=canvas.getBoundingClientRect(),size=brushSize*bounds(state).scale*r.width/state.canvasWidth;
  cursor.hidden=false;cursor.style.width=cursor.style.height=size/viewZoom+'px';cursor.style.left=(e.clientX-r.left)/viewZoom+'px';cursor.style.top=(e.clientY-r.top)/viewZoom+'px';
 }
 canvas.onpointerdown=e=>{
  if(!assets.background||pinch||gesture||e.button!==0||e.isPrimary===false)return;
  const p=position(e),point=local(p);updateCursor(e);
  if(mode==='erase'&&panView){
   e.preventDefault();canvas.setPointerCapture(e.pointerId);
   gesture={mode:'view',pointer:e.pointerId,startX:e.clientX,startY:e.clientY,x:viewX,y:viewY};
   canvas.style.cursor='grabbing';return;
  }
  if(mode==='pick'){
   const pixel=backgroundCanvas.getContext('2d').getImageData(clamp(Math.floor(p.x*backgroundCanvas.width/state.canvasWidth),0,backgroundCanvas.width-1),clamp(Math.floor(p.y*backgroundCanvas.height/state.canvasHeight),0,backgroundCanvas.height-1),1,1).data;
   const hex='#'+[...pixel].slice(0,3).map(n=>n.toString(16).padStart(2,'0')).join('');
   state[$('pickTarget').value+'Color']=hex;syncColors();paint();status('已取色 '+hex.toUpperCase());setMode('move');return;
  }
  if(mode==='move'&&selected!=='player'){
   const item=selectedCollage();
   if(inside(point)&&(!item||!hitCollage(item,state,p)))selectLayer('player');
  }
  if(mode==='move'&&selected==='player'&&!inside(point))selectLayer('background');
  if(mode==='move'&&selected!=='player'){
   if(selected==='background'&&!state.photoVisible)return;
   const item=selectedCollage();
   if(item&&!hitCollage(item,state,p))return;
   e.preventDefault();canvas.setPointerCapture(e.pointerId);
   gesture={mode:item?'collage':'photo',pointer:e.pointerId,start:p,item,x:item?item.x:state.photoX,y:item?item.y:state.photoY};
   canvas.style.cursor='grabbing';return;
  }
  // Eraser paths may enter the sticker from outside; only movement needs a hit.
  if(mode==='move'&&!inside(point))return;
  e.preventDefault();canvas.setPointerCapture(e.pointerId);
  if(mode==='move'){flashPlayerOutline();gesture={mode,pointer:e.pointerId,start:p,bounds:bounds(state)};canvas.style.cursor='grabbing';}
  else {const stroke={points:[point],size:brushSize,hardness};gesture={mode,pointer:e.pointerId,stroke,previousRedo:redo};redo=[];state.strokes.push(stroke);schedule();}
 };
 canvas.onpointermove=e=>{
  if(pinch)return;
  updateCursor(e);if(!gesture||e.pointerId!==gesture.pointer)return;
  if(e.cancelable)e.preventDefault();
  if(gesture.mode==='view'){
   viewX=gesture.x+e.clientX-gesture.startX;viewY=gesture.y+e.clientY-gesture.startY;applyView();return;
  }
  const p=position(e);
  if(gesture.mode==='photo'||gesture.mode==='collage'){
   const x=clamp(gesture.x+(p.x-gesture.start.x)/state.canvasWidth,0,1);
   const y=clamp(gesture.y+(p.y-gesture.start.y)/state.canvasHeight,0,1);
   if(gesture.item){gesture.item.x=x;gesture.item.y=y;state.collageRevision++;}
   else {state.photoX=x;state.photoY=y;photoDirty=true;}
  }else if(gesture.mode==='move'){
   hidePlayerOutline();
   const dx=state.canvasWidth-state.width,dy=state.canvasHeight-state.width*316/694;
   state.x=dx?clamp((gesture.bounds.x+p.x-gesture.start.x)/dx,0,1):.5;
   state.y=dy?clamp((gesture.bounds.y+p.y-gesture.start.y)/dy,0,1):0;
  }else{
   const samples=typeof e.getCoalescedEvents==='function'?e.getCoalescedEvents():[];
   for(const sample of samples.length?samples:[e])appendErasePoint(sample);
  }
  schedule();
 };
 function appendErasePoint(e){
  const point=local(position(e)),last=gesture.stroke.points[gesture.stroke.points.length-1];
  if(Math.hypot(point[0]-last[0],point[1]-last[1])>.5)gesture.stroke.points.push(point);
 }
 function finish(e,cancelled=false){
  if(!gesture||e.pointerId!==gesture.pointer)return;
  if(gesture.mode==='erase'&&!cancelled)appendErasePoint(e);
  if(cancelled){if(gesture.mode==='photo'){state.photoX=gesture.x;state.photoY=gesture.y;photoDirty=true;}
   else if(gesture.mode==='collage'){gesture.item.x=gesture.x;gesture.item.y=gesture.y;state.collageRevision++;}
   else if(gesture.mode==='view'){viewX=gesture.x;viewY=gesture.y;}
   else if(gesture.mode!=='erase'){
   const b=gesture.bounds;state.x=(state.canvasWidth-state.width)?b.x/(state.canvasWidth-state.width):.5;
   state.y=(state.canvasHeight-b.height)?b.y/(state.canvasHeight-b.height):0;
  }}
  gesture=null;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);
  cursor.hidden=true;
  canvas.style.cursor=mode==='move'||panView?'grab':'crosshair';paint();
 }
 canvas.onpointerup=e=>finish(e);canvas.onpointercancel=e=>finish(e,true);
 canvas.onlostpointercapture=e=>finish(e,true);
 canvas.onpointerleave=()=>{cursor.hidden=true;};
 // WebViews may still begin native pan gestures despite pointer capture.
 // Prevent scrolling only for touches that start on the editing canvas.
 const preventCanvasPan=e=>{if(e.cancelable)e.preventDefault();};
 function cancelGestureForPinch(){
  if(!gesture)return;
  if(gesture.mode==='erase'){
   const index=state.strokes.indexOf(gesture.stroke);
   if(index>=0)state.strokes.splice(index,1);
   redo=gesture.previousRedo;
  }else if(gesture.mode==='photo'){
   state.photoX=gesture.x;state.photoY=gesture.y;photoDirty=true;
  }else if(gesture.mode==='collage'){
   gesture.item.x=gesture.x;gesture.item.y=gesture.y;state.collageRevision++;
  }else if(gesture.mode==='move'){
   const b=gesture.bounds;
   state.x=(state.canvasWidth-state.width)?b.x/(state.canvasWidth-state.width):.5;
   state.y=(state.canvasHeight-b.height)?b.y/(state.canvasHeight-b.height):0;
  }else if(gesture.mode==='view'){
   viewX=gesture.x;viewY=gesture.y;
  }
  gesture=null;cursor.hidden=true;schedule();
 }
 const touchCenter=touches=>({
  x:(touches[0].clientX+touches[1].clientX)/2,
  y:(touches[0].clientY+touches[1].clientY)/2
 });
 const touchDistance=touches=>Math.hypot(
  touches[0].clientX-touches[1].clientX,
  touches[0].clientY-touches[1].clientY
 );
 const onCanvasTouchStart=e=>{
  preventCanvasPan(e);
  if(e.touches.length!==2)return;
  const photoPinch=mode==='move'&&selected==='background'&&state.photoVisible;
  if(mode!=='erase'&&!photoPinch)return;
  cancelGestureForPinch();
  const center=touchCenter(e.touches),stage=canvas.parentElement.parentElement.getBoundingClientRect();
  if(photoPinch){
   const r=canvas.getBoundingClientRect();
   pinch={
    kind:'photo',distance:Math.max(1,touchDistance(e.touches)),
    zoom:state.photoZoom,x:state.photoX,y:state.photoY,center,
    point:{x:(center.x-r.left)*state.canvasWidth/r.width,y:(center.y-r.top)*state.canvasHeight/r.height}
   };
   return;
  }
  pinch={
   kind:'view',
   distance:Math.max(1,touchDistance(e.touches)),
   zoom:viewZoom,x:viewX,y:viewY,center,
   baseX:stage.left+stage.width/2,baseY:stage.top+stage.height/2
  };
 };
 const onCanvasTouchMove=e=>{
  preventCanvasPan(e);
  if(!pinch||e.touches.length<2)return;
  const center=touchCenter(e.touches);
  if(pinch.kind==='photo'){
   const r=canvas.getBoundingClientRect();
   const point={x:(center.x-r.left)*state.canvasWidth/r.width,y:(center.y-r.top)*state.canvasHeight/r.height};
   const next=clamp(pinch.zoom*touchDistance(e.touches)/pinch.distance,20,300);
   const ratio=next/pinch.zoom;
   state.photoZoom=next;
   state.photoX=clamp((point.x-ratio*(pinch.point.x-pinch.x*state.canvasWidth))/state.canvasWidth,0,1);
   state.photoY=clamp((point.y-ratio*(pinch.point.y-pinch.y*state.canvasHeight))/state.canvasHeight,0,1);
   photoDirty=true;schedule();return;
  }
  const next=clamp(pinch.zoom*touchDistance(e.touches)/pinch.distance,1,4);
  const localX=(pinch.center.x-pinch.baseX-pinch.x)/pinch.zoom;
  const localY=(pinch.center.y-pinch.baseY-pinch.y)/pinch.zoom;
  viewZoom=next;
  viewX=center.x-pinch.baseX-next*localX;
  viewY=center.y-pinch.baseY-next*localY;
  applyView();
 };
 const onCanvasTouchEnd=e=>{
  if(!pinch)return;
  if(e.cancelable)e.preventDefault();
  if(e.touches.length<2){
   const kind=pinch.kind;pinch=null;cursor.hidden=true;
   if(kind==='view')applyView();else schedule();
  }
 };
 canvas.addEventListener('touchstart',onCanvasTouchStart,{passive:false});
 canvas.addEventListener('touchmove',onCanvasTouchMove,{passive:false});
 canvas.addEventListener('touchend',onCanvasTouchEnd,{passive:false});
 canvas.addEventListener('touchcancel',onCanvasTouchEnd,{passive:false});
 $('undo').onclick=()=>{if(state.strokes.length)redo.push(state.strokes.pop());paint();};
 $('redo').onclick=()=>{if(redo.length)state.strokes.push(redo.pop());paint();};
 $('restore').onclick=()=>{redo.push(...state.strokes.slice().reverse());state.strokes=[];paint();status('擦除已全部恢复');};
 const onKey=e=>{
  if(e.key==='Escape'){if(!$('result').hidden)closeResult();else setMode('move');return;}
  if(e.target.matches('input,textarea,select')||!$('result').hidden)return;
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'){e.preventDefault();$(e.shiftKey?'redo':'undo').click();}
 };
 root.addEventListener('keydown',onKey);
 const exportButtons=[$('export'),$('exportSecondary')];
 let exportTrigger=$('export');
 const exportImage=async event=>{
  if(exporting)return;
  exportTrigger=event?.currentTarget||$('export');
  hidePlayerOutline();
  exporting=true;
  const output=document.createElement('canvas'),base=document.createElement('canvas'),exportSurfaces={layer:document.createElement('canvas'),blur:document.createElement('canvas')};
  let exportAssets;
  try{
   paint();if(!assets.background||!assets.cover)throw Error('请先加载图片');
   exportButtons.forEach(button=>button.disabled=true);
   await new Promise(resolve=>requestAnimationFrame(resolve));
   paintBackground(base,assets.background,state,assets.canvasBackdrop);
   exportAssets={...assets,backgroundCanvas:base,backgroundVersion:(assets.backgroundVersion||0)+1,liquidMaterial:null,blurKey:'',displayWidth:Math.min(1080,state.canvasWidth)};
   try{render(output,state,exportAssets,exportSurfaces);}
   catch(error){
    if(state.material!=='liquid')throw error;
    exportAssets.liquidMaterial?.destroy();exportAssets.liquidMaterial=null;
    throw Error('当前设备无法导出液态玻璃，请切换毛玻璃后重试');
   }
   const blob=await new Promise(resolve=>output.toBlob(resolve,'image/png'));
   if(!blob)throw Error('导出失败');if(disposed)return;
   if(exportUrl)URL.revokeObjectURL(exportUrl);exportUrl=URL.createObjectURL(blob);
   $('exportPreview').src=exportUrl;$('exportInfo').textContent=`${output.width} × ${output.height} px`;
   $('saveAlbum')._blob=blob;$('saveStatus').textContent='';$('result').hidden=false;
   root.querySelector('.layout').setAttribute('aria-hidden','true');$('closeResult').focus();status('PNG 已生成');
  }catch(error){status(error.message);}finally{
   exporting=false;exportAssets?.liquidMaterial?.destroy();
   for(const c of [output,base,exportSurfaces.layer,exportSurfaces.blur])c.width=c.height=1;
   if(!disposed)exportButtons.forEach(button=>button.disabled=false);
  }
 };
 exportButtons.forEach(button=>button.onclick=exportImage);
 function closeResult(){
  if(saving)return;$('result').hidden=true;root.querySelector('.layout').removeAttribute('aria-hidden');
  $('exportPreview').removeAttribute('src');$('saveAlbum')._blob=null;
  if(exportUrl){URL.revokeObjectURL(exportUrl);exportUrl=null;}exportTrigger.focus();
 }
 $('closeResult').onclick=closeResult;
 $('result').onkeydown=e=>{
  if(e.key!=='Tab')return;
  const first=$('closeResult'),last=$('saveAlbum');
  if(saving){e.preventDefault();return;}
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
 };
 $('saveAlbum').onclick=async()=>{
  if(saving||!$('saveAlbum')._blob)return;
  saving=true;$('saveAlbum').disabled=true;$('closeResult').disabled=true;$('saveStatus').textContent='正在保存…';
  try{
   const data=await new Promise((resolve,reject)=>{
    const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('图片读取失败'));reader.readAsDataURL($('saveAlbum')._blob);
   });
   await saveToAlbum(data);$('saveStatus').textContent='已保存到相册';
  }catch(error){$('saveStatus').textContent=failureMessage(error);}
  finally{saving=false;$('saveAlbum').disabled=false;$('closeResult').disabled=false;}
 };
 setMode('move');brushLabels();syncCanvasFill();syncMaterial();$('undo').disabled=$('redo').disabled=$('restore').disabled=true;
 // Neutral drawing surfaces, not borrowed album artwork or stock photos.
 const blank=document.createElement('canvas');blank.width=blank.height=256;
 blank.naturalWidth=blank.width;blank.naturalHeight=blank.height;
 const cover=document.createElement('canvas');cover.width=cover.height=256;
 const coverCtx=cover.getContext('2d');coverCtx.fillStyle='#436d68';coverCtx.fillRect(0,0,256,256);
 coverCtx.save();coverCtx.translate(48,48);coverCtx.scale(160/24,160/24);
 coverCtx.strokeStyle='#ffffff';coverCtx.lineWidth=1.5;coverCtx.lineCap='round';coverCtx.lineJoin='round';
 const music=window.lucide&&window.lucide.icons.Music;
 for(const [tag,attributes] of (music?music[2]:[])){
  if(tag==='path')coverCtx.stroke(new Path2D(attributes.d));
  if(tag==='circle'){coverCtx.beginPath();coverCtx.arc(+attributes.cx,+attributes.cy,+attributes.r,0,Math.PI*2);coverCtx.stroke();}
 }
 coverCtx.restore();
 Promise.all([
  urls.background?load(urls.background,2160):Promise.resolve(blank),
  urls.cover?load(urls.cover,1024):Promise.resolve(cover),
  loadAirplay()
 ]).then(([background,defaultCover,airplay])=>{
  if(disposed)return;
  assets.background??=background;if(!assets.cover){assets.cover=defaultCover;assets.referenceCover=false;}assets.airplay=airplay;
  $('sampleBadge').hidden=false;
  cacheBackground();paint();
  status('已就绪');
 }).catch(error=>status(error.message));
 return ()=>{disposed=true;clearTimeout(outlineTimer);cancelAnimationFrame(frame);window.removeEventListener('resize',schedule);if(viewport)viewport.removeEventListener('resize',schedule);canvas.removeEventListener('touchstart',onCanvasTouchStart);canvas.removeEventListener('touchmove',onCanvasTouchMove);canvas.removeEventListener('touchend',onCanvasTouchEnd);canvas.removeEventListener('touchcancel',onCanvasTouchEnd);document.removeEventListener('visibilitychange',onVisibility);assets.liquidMaterial?.destroy();urlsToRelease.forEach(URL.revokeObjectURL);if(exportUrl)URL.revokeObjectURL(exportUrl);root.removeEventListener('keydown',onKey);root.innerHTML='';};
}
