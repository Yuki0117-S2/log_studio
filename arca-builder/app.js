(async () => {
  'use strict';
  const C=window.ArcaCore,B=window.ArcaComponents,$=id=>document.getElementById(id),e=C.escape;
  const KEY='arca-studio-v1',BACKUPS=KEY+'-backups';
  const THEME_KEY=KEY+'-editor-theme';
  let editorTheme='dark';
  try{if(localStorage.getItem(THEME_KEY)==='light')editorTheme='light';}catch(_){}
  let source=B.starter(),model,analysis,selected=null,mode='edit',width=900,dark=false,scale=1;
  let undo=[],redo=[],historyTime=0,lastEditKind='',collapsed=new Set(),allCollapsed=false,dragged=null;
  let syncTimer=null,saveTimer=null,toastTimer=null,frameObserver=null,frameHeight=500,frameVersion=0;
  let frameScrollRestore=null,search='',filename='나의 기록',saved=false;
  let renderedModel=null,frameReady=false,previewView=null,pendingPreviewScroll=false;
  const code=$('code'),frame=$('preview'),A=window.ArcaAssets,U=window.ArcaUpload;
  let assets=new Map(),assetStorageOk=true,uploadBatch=null;
  try{assets=await A.load();}catch(_){assetStorageOk=false;$('saveStatus').textContent='원본 이미지 저장소를 열지 못했어요 · 프로젝트 파일로 저장하세요';}
  const localData=src=>assets.get(A.idOf(src))?.data||null;
  const project=()=>({...A.pack(source,assets,filename),uploadBatch});
  try {const data=JSON.parse(localStorage.getItem(KEY)||'null');if(data&&typeof data.html==='string'){source=data.html;filename=data.name||filename;uploadBatch=U.readBatch(data.uploadBatch);saved=true;}}catch(_){/* A fresh document remains available when storage is unavailable. */}
  function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),3500);}
  function showModal(title,html){$('modalTitle').textContent=title;$('modalBody').innerHTML=html;if(!$('modal').open)$('modal').showModal();}
  function closeModal(){$('modal').close();}
  function backup(reason){
    try {const items=JSON.parse(localStorage.getItem(BACKUPS)||'[]');if(items[0]?.html!==source){items.unshift({html:source,name:filename,uploadBatch,at:new Date().toISOString(),reason});while(items.length>8||JSON.stringify(items).length>1800000&&items.length>1)items.pop();localStorage.setItem(BACKUPS,JSON.stringify(items));}return true;}
    catch(_){toast('브라우저 백업 공간이 부족해 현재 원본을 파일로 백업했어요.');download(JSON.stringify(project()),'application/json',filename+'-자동백업.arca.json');return false;}
  }
  function scheduleSave(){clearTimeout(saveTimer);$('saveStatus').textContent='저장 중…';saveTimer=setTimeout(()=>{try{localStorage.setItem(KEY,JSON.stringify({version:1,html:source,name:filename,uploadBatch,updatedAt:new Date().toISOString()}));$('saveStatus').innerHTML=assetStorageOk?'<span class="dot"></span>이 브라우저에 자동 저장됨':'HTML 저장됨 · 원본 이미지 보존은 프로젝트로 저장하세요';}catch(_){$('saveStatus').textContent='자동 저장 공간 부족 · 프로젝트를 파일로 저장하세요';}},650);}
  function commit(next,message='수정 내용 반영',kind='command',offset=null,delay=0){
    if(next===source)return;
    const now=Date.now();
    if(kind==='command'||kind!==lastEditKind||now-historyTime>800){undo.push({html:source,offset:selected?.start??0});while(undo.length>60||undo.reduce((n,x)=>n+x.html.length,0)>12000000&&undo.length>1)undo.shift();}
    historyTime=now;lastEditKind=kind;redo=[];source=next;
    $('changeSummary').textContent=message;
    clearTimeout(syncTimer);const anchor=offset??selected?.start??0;
    if(delay)syncTimer=setTimeout(()=>{syncTimer=null;sync(anchor);},delay);else sync(anchor);
    scheduleSave();
  }
  function flush(){if(syncTimer){clearTimeout(syncTimer);syncTimer=null;sync(code===document.activeElement?code.selectionStart:selected?.start??0);}}
  function sync(anchor=null){
    const previous=selected;model=C.parse(source);analysis=C.analyze(model);
    selected=anchor!==null?C.atOffset(model,Math.min(anchor,Math.max(source.length-1,0))):null;
    if(!previous&&anchor===null)selected=null;
    if(code.value!==source)code.value=source;
    $('lineNumbers').textContent=Array.from({length:model.lines.length},(_,i)=>i+1).join('\n');
    $('codeStats').textContent=`${model.lines.length.toLocaleString()}줄 · ${(new Blob([source]).size/1024).toFixed(1)} KB`;
    $('undo').disabled=!undo.length;$('redo').disabled=!redo.length;
    renderTree();renderIssues();renderFrame();selectionUi(false);
  }
  function visibleRecords(){return model.records.filter(r=>r.el&&model.doc.body.contains(r.el)&&!['body','script','style','template','noscript'].includes(r.tag));}
  function renderTree(){
    const records=visibleRecords(),set=new Set(records.map(x=>x.id));$('elementCount').textContent=`${records.length.toLocaleString()}개 요소`;
    const filtered=search?new Set(records.filter(r=>(r.tag+' '+C.label(r)).toLowerCase().includes(search)).map(r=>r.id)):null;
    if(filtered)for(const r of records.filter(r=>filtered.has(r.id))){let p=r.parentId;while(p){filtered.add(p);p=model.byId.get(p)?.parentId;}}
    const children=new Map();for(const r of records){const p=set.has(r.parentId)?r.parentId:null;if(!children.has(p))children.set(p,[]);children.get(p).push(r);}
    let out='';
    function draw(id,depth){for(const r of children.get(id)||[]){if(filtered&&!filtered.has(r.id))continue;
      const has=children.has(r.id),closed=collapsed.has(r.id)&&!filtered;
      out+=`<div class="tree-row${selected?.id===r.id?' selected':''}" data-id="${r.id}" style="padding-left:${Math.min(depth,14)*12+4}px" draggable="true" tabindex="0" aria-label="${e(r.tag+' '+C.label(r))}"><button class="chevron" data-collapse="${r.id}" aria-label="${closed?'펼치기':'접기'}" ${has?'':'disabled'}>${has?(closed?'▸':'▾'):'·'}</button><span class="tag-chip">${e(r.tag.toUpperCase())}</span><span class="tree-label">${e(C.label(r))}</span></div>`;
      if(has&&!closed)draw(r.id,depth+1);
    }}draw(null,0);$('tree').innerHTML=out||'<p class="muted">표시할 요소가 없어요.<br>블록을 추가하거나 HTML을 불러오세요.</p>';
  }
  function select(rec,{focusCode=false,scrollPreview=false}={}){
    selected=rec||null;
    if(rec){let p=rec.parentId;while(p){collapsed.delete(p);p=model.byId.get(p)?.parentId;}}
    renderTree();selectionUi(focusCode);highlight(scrollPreview);
  }
  function selectionUi(focusCode){
    $('noSelection').hidden=!!selected;$('inspector').hidden=!selected;
    $('mobileImageActions').hidden=!(selected?.tag==='img'&&selected.el?.getAttribute('src'));
    if(!selected){$('selectionPath').textContent='미리보기에서 고칠 부분을 선택하세요';$('selectionLine').textContent='';return;}
    const path=[];let r=selected;while(r){path.unshift(r.tag);r=model.byId.get(r.parentId);}
    $('selectionPath').textContent=path.join(' › ');$('selectionLine').textContent=`${model.lineAt(selected.start)}–${model.lineAt(selected.end)}줄 선택`;
    const inFields=$('inspector').contains(document.activeElement)&&/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if(!inFields)renderInspector();else if(selected.tag==='img')refreshImageInspector();
    if(document.activeElement!==code){code.setSelectionRange(selected.start,selected.end);code.scrollTop=Math.max(0,(model.lineAt(selected.start)-3)*21);$('lineNumbers').scrollTop=code.scrollTop;}
    if(focusCode){code.focus({preventScroll:true});code.setSelectionRange(selected.start,selected.end);code.scrollTop=Math.max(0,(model.lineAt(selected.start)-3)*21);$('lineNumbers').scrollTop=code.scrollTop;}
  }
  function renderFrame(){
    if(frameReady&&renderedModel&&frame.contentDocument)previewView={model:renderedModel,details:C.captureDetails(renderedModel,frame.contentDocument)};
    const details=C.restoreDetails(previewView?.model,model,previewView?.details);
    frameReady=false;
    const version=++frameVersion;frameScrollRestore={top:$('canvasArea').scrollTop,left:$('canvasArea').scrollLeft};
    frame.onload=()=>{if(version!==frameVersion)return;bindFrame(details);};
    frame.srcdoc=C.previewHtml(model,analysis,mode,dark,localData);
    $('previewCaption').textContent=(mode==='edit'?'편집 미리보기':'게시 후 예상 · 근사치')+` · ${width}px`;
    $('previewHint').textContent=mode==='edit'?'파일 놓기 = 이미지 넣기 · 이미지 끌기 = 칸 이동':'가이드 기준 정리 결과 · 실제 게시 후 확인';
    layoutFrame();
  }
  function bindFrame(details){
    const doc=frame.contentDocument;if(!doc)return;
    for(const state of details){const el=doc.querySelector(`[${model.attr}="${state.id}"]`);if(el?.localName==='details')el.open=state.open;}
    renderedModel=model;frameReady=true;
    const style=doc.createElement('style');style.textContent=`[data-editor-selected]{outline:2px solid #f0b64a!important;outline-offset:2px!important}[data-editor-drop]{outline:2px dashed #f0b64a!important;outline-offset:3px!important}`;doc.head.appendChild(style);
    if(mode==='edit')for(const el of doc.querySelectorAll(`[${model.attr}]`)){if(!['html','head','body','br'].includes(el.localName))el.draggable=true;}
    doc.addEventListener('click',ev=>{
      $('imageMenu').hidden=true;
      if(ev.target.closest('a,button,input,form'))ev.preventDefault();
      if(mode!=='edit')return;
      const el=ev.target.closest(`[${model.attr}]`);if(!el)return;
      const id=el.getAttribute(model.attr);select(model.byId.get(id),{focusCode:true});setRight('properties');
    });
    doc.addEventListener('submit',ev=>ev.preventDefault());
    doc.addEventListener('contextmenu',ev=>{
      if(mode!=='edit')return;
      const el=ev.target.closest(`[${model.attr}]`),r=el&&C.imageTarget(model,model.byId.get(el.getAttribute(model.attr)));
      if(r?.tag!=='img'||!r.el.getAttribute('src'))return;
      ev.preventDefault();select(r);setRight('properties');
      const rect=frame.getBoundingClientRect(),menu=$('imageMenu');menu.hidden=false;
      menu.style.left=Math.max(8,Math.min(innerWidth-190,rect.left+ev.clientX*scale))+'px';
      menu.style.top=Math.max(8,Math.min(innerHeight-70,rect.top+ev.clientY*scale))+'px';$('contextDeleteImage').focus({preventScroll:true});
    });
    doc.addEventListener('dragstart',ev=>{if(mode!=='edit'){ev.preventDefault();return;}const el=ev.target.closest(`[${model.attr}]`);if(el){dragged=el.getAttribute(model.attr);ev.dataTransfer.setData('text/plain',dragged);ev.dataTransfer.effectAllowed='move';}});
    doc.addEventListener('dragover',ev=>{const files=!dragged&&hasFiles(ev);if(!dragged&&!files)return;ev.preventDefault();for(const x of doc.querySelectorAll('[data-editor-drop]'))x.removeAttribute('data-editor-drop');const el=ev.target.closest(`[${model.attr}]`);if(files){const r=el&&C.imageTarget(model,model.byId.get(el.getAttribute(model.attr)));ev.dataTransfer.dropEffect=mode==='edit'&&r?'copy':'none';if(mode==='edit'&&r)doc.querySelector(`[${model.attr}="${r.id}"]`)?.setAttribute('data-editor-drop','');}else if(el)el.setAttribute('data-editor-drop','');});
    doc.addEventListener('drop',ev=>{ev.preventDefault();for(const x of doc.querySelectorAll('[data-editor-drop]'))x.removeAttribute('data-editor-drop');const el=ev.target.closest(`[${model.attr}]`);if(!dragged&&hasFiles(ev)){dropImageFiles([...ev.dataTransfer.files],el?.getAttribute(model.attr));}else if(el&&dragged)performMove(dragged,el.getAttribute(model.attr),$('insertPosition').value,true);dragged=null;});
    doc.addEventListener('dragleave',ev=>{if(!ev.relatedTarget)for(const x of doc.querySelectorAll('[data-editor-drop]'))x.removeAttribute('data-editor-drop');});
    doc.addEventListener('dragend',()=>{dragged=null;for(const x of doc.querySelectorAll('[data-editor-drop]'))x.removeAttribute('data-editor-drop');});
    frameObserver?.disconnect();frameObserver=new ResizeObserver(()=>measureFrame());frameObserver.observe(doc.body);
    doc.addEventListener('load',measureFrame,true);doc.addEventListener('toggle',measureFrame,true);
    measureFrame();highlight(false);
    if(frameScrollRestore){$('canvasArea').scrollTop=frameScrollRestore.top;$('canvasArea').scrollLeft=frameScrollRestore.left;frameScrollRestore=null;}
    if(pendingPreviewScroll){pendingPreviewScroll=false;highlight(true);}
  }
  const hasFiles=ev=>Array.from(ev.dataTransfer?.types||[]).includes('Files')||!!ev.dataTransfer?.files?.length;
  let droppingImage=false;
  async function dropImageFiles(files,targetId){
    if(mode!=='edit'){toast('편집 모드에서 이미지 파일을 놓아주세요.');return;}
    if(droppingImage){toast('앞서 놓은 이미지를 처리 중이에요. 잠시 후 다시 놓아주세요.');return;}
    if(files.length!==1){toast('한 칸에 이미지 한 장씩 놓아주세요. 여러 장 추가는 원본 이미지 창에서 가능해요.');return;}
    if(syncTimer){toast('코드 반영 중이에요. 잠시 후 다시 놓아주세요.');return;}
    const target=C.imageTarget(model,model.byId.get(targetId));
    if(!target){toast('이미지 칸이나 빈 표 셀에 놓아주세요.');return;}
    const before=source;droppingImage=true;
    try{
      const items=await A.fromFiles(files),item=items[0];A.validate([...A.used(source).map(id=>assets.get(id)).filter(Boolean),item]);
      if(source!==before){toast('작업 내용이 바뀌었어요. 원하는 칸에 다시 놓아주세요.');return;}
      try{await A.put(items);}catch(_){assetStorageOk=false;}
      if(source!==before){toast('작업 내용이 바뀌었어요. 원하는 칸에 다시 놓아주세요.');return;}
      backup('이미지 칸 교체 전');assets.set(item.id,item);
      const oldAlt=target.el.getAttribute('alt'),alt=oldAlt&&oldAlt!=='이미지'?oldAlt:'이미지 '+(A.used(source).length+1);
      const change=C.placeImage(model,target,{src:A.PREFIX+item.id,alt,'data-arca-publish':null});
      commit(change.source,'이미지 칸에 원본 넣기','command',change.offset);setRight('properties');highlight(true);
      toast(assetStorageOk?'칸에 원본을 넣었어요. 게시용 주소는 나중에 연결하세요.':'원본을 넣었어요. 이미지 보존을 위해 프로젝트로 저장하세요.');
    }catch(err){toast(err.message);}finally{droppingImage=false;}
  }
  function measureFrame(){const doc=frame.contentDocument;if(!doc)return;frameHeight=Math.max(180,Math.ceil(doc.body.getBoundingClientRect().height),doc.body.scrollHeight);frame.style.height=frameHeight+'px';layoutFrame();}
  function deleteSelectedImage(){
    $('imageMenu').hidden=true;flush();if(selected?.tag!=='img'||!selected.el.getAttribute('src'))return;
    backup('칸의 이미지 삭제 전');const change=C.clearImage(model,selected);
    commit(change.source,'이미지 삭제 · 칸 유지 · Ctrl Z로 되돌리기','command',change.offset);toast('이미지만 삭제했어요. 칸은 그대로예요.');
  }
  function layoutFrame(){
    const area=$('canvasArea'),padding=getComputedStyle(area),available=area.clientWidth-parseFloat(padding.paddingLeft)-parseFloat(padding.paddingRight);scale=$('zoom').value==='fit'?Math.min(1,Math.max(.2,available/width)):Number($('zoom').value);
    frame.style.width=width+'px';frame.style.transform=`scale(${scale})`;$('frameSizer').style.width=width*scale+'px';$('frameSizer').style.height=frameHeight*scale+'px';
  }
  function highlight(scroll){
    if(!frameReady){pendingPreviewScroll=pendingPreviewScroll||scroll;return;}
    const doc=frame.contentDocument;if(!doc)return;for(const el of doc.querySelectorAll('[data-editor-selected]'))el.removeAttribute('data-editor-selected');
    if(!selected||mode!=='edit')return;const el=doc.querySelector(`[${model.attr}="${selected.id}"]`);if(!el)return;
    el.setAttribute('data-editor-selected','');
    if(scroll){for(let p=el.parentElement;p;p=p.parentElement)if(p.localName==='details')p.open=true;measureFrame();const top=el.getBoundingClientRect().top*scale;const area=$('canvasArea');if(top<area.scrollTop||top+el.getBoundingClientRect().height*scale>area.scrollTop+area.clientHeight)area.scrollTop=Math.max(0,top-40);}
  }
  function field(label,attr,value,type='text',help=''){return `<label class="field">${label}<input type="${type}" data-attr="${attr}" value="${e(value||'')}" ${type==='url'?'placeholder="https://…"':''}>${help?`<span class="field-help">${help}</span>`:''}</label>`;}
  function styleField(label,prop,value,placeholder=''){return `<label class="field">${label}<input data-style="${prop}" value="${e(value||'')}" placeholder="${placeholder}"></label>`;}
  function colorField(label,prop,value){const rgb=/^rgba?\(\s*(\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/i.exec(value||'');const color=/^#[\da-f]{6}$/i.test(value||'')?value:rgb?'#'+rgb.slice(1,4).map(n=>Number(n).toString(16).padStart(2,'0')).join(''):'#8888CC';return `<label class="field">${label}<span class="color-input"><input type="color" data-style="${prop}" value="${color}" aria-label="${label} 선택"><input type="text" data-style="${prop}" value="${e(value||'')}" placeholder="#8888CC / transparent"></span></label>`;}
  function renderInspector(){
    if(!selected?.el)return;const el=selected.el,st=el.style,tag=selected.tag;
    $('selectedTag').textContent='<'+tag+'>';$('selectedLabel').textContent=C.label(selected);
    let html='';
    if(!C.VOID.has(tag)&&el.children.length===0)html+=`<label class="field">내용<textarea id="textValue" data-text="true" rows="3">${e(el.textContent)}</textarea><span class="field-help">입력하면 코드와 미리보기에 바로 반영돼요.</span></label>`;
    else if(!C.VOID.has(tag))html+='<p class="muted">안쪽 글자를 바꾸려면 해당 문장을 선택하세요.<br>이 요소 전체는 아래 ‘내부 HTML’에서 편집해요.</p>';
    if(tag==='img')html+=`<div class="inspector-image"><img id="selectedImageThumb" alt="선택 이미지 미리보기"><span id="selectedImageState" class="muted">주소를 확인하는 중…</span><button id="enlargeSelectedImage" class="wide">이미지 크게 보기</button></div>`+(A.idOf(el.getAttribute('src'))?field('게시용 주소','data-arca-publish',el.getAttribute('data-arca-publish'),'text','원본으로 미리봐요. 이 주소는 게시용 HTML에 들어가요.'):field('이미지 주소','src',el.getAttribute('src'),'text','https:// 또는 //로 시작하는 이미지 주소를 넣어주세요.'))+field('이미지 설명','alt',el.getAttribute('alt'));
    if(tag==='a')html+=field('링크 주소','href',el.getAttribute('href'),'text')+`<label class="check-row"><input type="checkbox" data-check="target" ${el.target==='_blank'?'checked':''}>새 탭에서 열기</label>`;
    if(tag==='video'||tag==='iframe')html+=field('미디어 주소','src',el.getAttribute('src'),'url');
    if(tag==='details')html+=`<label class="check-row"><input type="checkbox" data-check="open" ${el.hasAttribute('open')?'checked':''}>처음부터 펼쳐 놓기</label>`;
    html+=`<details open class="inspector-section"><summary>글자 · 색상</summary><div class="field-row">${styleField('글자 크기','font-size',st.fontSize,'15px')}${styleField('줄 간격','line-height',st.lineHeight,'1.8')}</div><div class="field-row"><label class="field">정렬<select data-style="text-align"><option value="">상속</option>${['left','center','right','justify'].map((x,i)=>`<option value="${x}" ${st.textAlign===x?'selected':''}>${['왼쪽','가운데','오른쪽','양쪽'][i]}</option>`).join('')}</select></label>${styleField('글자 두께','font-weight',st.fontWeight,'400 / 700')}</div>${colorField('글자색','color',st.color)}${colorField('배경색','background-color',st.backgroundColor)}${styleField('배경 · 그라데이션','background',st.background,'linear-gradient(…)')}<div class="swatches" aria-label="추천 배경색">${['#8888CC','#DDAACC','#CCAA88','#BB6688'].map(c=>`<button style="background:${c}" data-swatch="${c}" title="배경색 ${c}" aria-label="배경색 ${c}"></button>`).join('')}</div></details>`;
    html+=`<details open class="inspector-section"><summary>크기 · 여백</summary><div class="field-row">${styleField('너비','width',st.width,'100%')}${styleField('최대 너비','max-width',st.maxWidth,'900px')}${styleField('높이','height',st.height,'auto')}${styleField('둥근 모서리','border-radius',st.borderRadius,'8px')}</div>${styleField('안쪽 여백','padding',st.padding,'20px / 20px 24px')}${styleField('바깥 여백','margin',st.margin,'20px 24px')}${styleField('테두리','border',st.border,'1px solid #DDAACC')}${styleField('그림자','box-shadow',st.boxShadow,'0 4px 16px rgba(0,0,0,0.1)')}</details>`;
    if(['td','th'].includes(tag))html+=`<div class="field-row">${field('가로 칸 수','colspan',el.getAttribute('colspan'),'number')}${field('세로 칸 수','rowspan',el.getAttribute('rowspan'),'number')}</div>`;
    $('inspectorFields').innerHTML=html;$('innerHtml').value=source.slice(selected.openEnd,selected.closeStart);$('innerHtml').disabled=C.VOID.has(tag);$('applyInner').disabled=C.VOID.has(tag);
    if(tag==='img')refreshImageInspector();
  }
  function refreshImageInspector(){
      if(!selected?.el||!$('selectedImageThumb'))return;
      const el=selected.el,url=localData(el.getAttribute('src'))||C.normalizeUrl(el.getAttribute('src')||''),thumb=$('selectedImageThumb'),status=$('selectedImageState'),expiry=C.expiryInfo(url);
      if(thumb.dataset.loadedUrl===url)return;thumb.dataset.loadedUrl=url;thumb.hidden=false;status.textContent='불러오는 중…';
      thumb.onload=()=>{status.textContent=`${thumb.naturalWidth} × ${thumb.naturalHeight}px`+(expiry?.expired?' · 주소의 만료 시각 지남':'');};
      thumb.onerror=()=>{thumb.hidden=true;status.textContent='불러오지 못했어요 · 만료/접근 제한/주소 확인';};
      thumb.referrerPolicy='no-referrer';
      if(url&&(C.safeUrl(url,'media')||A.validData(url)))thumb.src=url;else{thumb.hidden=true;status.textContent='이미지 주소를 넣어주세요.';}
      $('enlargeSelectedImage').onclick=()=>imageViewer(url,el.getAttribute('alt')||'이미지');
  }
  function updateProperty(input){
    flush();if(!selected)return;const r=selected;let attrs={},next;
    if(input.dataset.text){next=C.patch(source,r.openEnd,r.closeStart,e(input.value));commit(next,`${r.tag} 내용 변경`,'text:'+r.start,r.start,120);return;}
    if(input.dataset.attr)attrs[input.dataset.attr]=input.value;
    if(input.dataset.check){const a=input.dataset.check;attrs[a]=input.checked?(a==='target'?'_blank':'open'):null;}
    if(input.dataset.style){const prop=input.dataset.style,el=r.el.cloneNode(false);if(input.value.trim()){el.style.setProperty(prop,input.value.trim());if(!el.style.getPropertyValue(prop)){toast('CSS 값을 확인해 주세요. 크기에는 px 또는 %가 필요해요.');return;}}else el.style.removeProperty(prop);attrs.style=el.getAttribute('style')||null;}
    next=C.patch(source,r.start,r.openEnd,C.openingWith(r,attrs));commit(next,`${r.tag} · ${input.dataset.style||input.dataset.attr||input.dataset.check} 변경`,'property:'+r.start,r.start,100);
  }
  function renderIssues(){
    $('issueCount').textContent=analysis.issues.length;
    $('issues').innerHTML=analysis.issues.length?analysis.issues.map((x,i)=>`<button class="issue ${x.level}" data-issue="${i}"><span class="issue-badge">${x.level==='error'?'차단':'주의'}</span><span>${e(x.message)}<small>${x.line}줄 · 누르면 원본 위치로 이동</small></span></button>`).join(''):'<div class="success-message">✓ 차단 항목을 찾지 못했어요.<br><span class="muted">실제 게시 결과는 복사 후 확인하세요.</span></div>';
  }
  function setLeft(which){document.querySelectorAll('[data-left]').forEach(x=>{const on=x.dataset.left===which;x.classList.toggle('active',on);x.setAttribute('aria-selected',on);});$('treePanel').hidden=which!=='tree';$('libraryPanel').hidden=which!=='library';}
  function setRight(which){document.querySelectorAll('[data-right]').forEach(x=>{const on=x.dataset.right===which;x.classList.toggle('active',on);x.setAttribute('aria-selected',on);});$('propertiesPanel').hidden=which!=='properties';$('issuesPanel').hidden=which!=='issues';}
  function addHtml(html){flush();const mini=C.parse(html),root=mini.records.find(r=>r.el&&r.el.parentElement===mini.doc.body);if(root&&!C.canPlace(model,{tag:root.tag,start:-2,end:-1},selected,$('insertPosition').value)){toast('표·목록 구조에 맞는 위치를 선택해 주세요. 상위 구역을 선택하면 넣을 수 있어요.');return;}
    const point=C.insertionPoint(model,selected,$('insertPosition').value),block='\n'+html+'\n';commit(C.patch(source,point,point,block),'블록 추가','command',point+1);setLeft('tree');setRight('properties');highlight(true);}
  function performMove(from,to,position,drop=false){flush();const moving=model.byId.get(from),target=model.byId.get(to);if(!moving||!target||from===to)return;try{const slots=drop&&moving.tag==='img'&&moving.el.getAttribute('src')&&C.imageTarget(model,target);const change=slots?C.swapImages(model,moving,target):C.move(model,moving,target,position);commit(change.source,slots?'이미지 칸 이동 · 채워진 칸끼리는 교환':`${moving.tag} 위치 이동`,'command',change.offset);highlight(true);}catch(err){toast(err.message);}}
  function operation(type){flush();if(!selected)return;const r=selected;
    if(type==='parent'){select(model.byId.get(r.parentId),{focusCode:true,scrollPreview:true});return;}
    if(type==='delete'){backup('요소 삭제 전');commit(C.patch(source,r.start,r.end,''),'요소 삭제 · Ctrl Z로 되돌릴 수 있어요','command',Math.max(0,r.start-1));return;}
    if(type==='duplicate'){commit(C.patch(source,r.end,r.end,'\n'+source.slice(r.start,r.end)),'요소 복제','command',r.end+1);return;}
    const siblings=model.records.filter(x=>x.el&&x.parentId===r.parentId&&!['head'].includes(x.tag));const i=siblings.indexOf(r),target=type==='up'?siblings[i-1]:siblings[i+1];if(target)performMove(r.id,target.id,type==='up'?'before':'after');else toast('더 이동할 수 없는 위치예요.');
  }
  function history(direction){flush();const from=direction==='undo'?undo:redo,to=direction==='undo'?redo:undo;if(!from.length)return;to.push({html:source,offset:selected?.start??0});const entry=from.pop();source=entry.html;lastEditKind='';sync(entry.offset);scheduleSave();$('changeSummary').textContent=direction==='undo'?'이전 상태로 되돌렸어요':'다시 적용했어요';}
  function download(text,type,name){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name.replace(/[<>:"/\\|?*]/g,'_');a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
  async function copy(text){try{await navigator.clipboard.writeText(text);toast('복사했어요.');}catch(_){const t=document.createElement('textarea');t.value=text;t.style.cssText='position:fixed;left:-10000px';($('modal').open?$('modal'):document.body).append(t);t.select();const ok=document.execCommand('copy');t.remove();toast(ok?'복사했어요.':'복사가 차단됐어요. 코드 입력칸에서 직접 복사해 주세요.');}}
  function replaceDocument(html,name,reason,batch=null){flush();backup(reason);uploadBatch=U.readBatch(batch);filename=name||filename;selected=null;collapsed.clear();previewView=null;renderedModel=null;frameReady=false;pendingPreviewScroll=false;const unchanged=html===source;commit(html,reason,'command',null);if(unchanged)renderFrame();selected=null;selectionUi(false);renderTree();closeModal();scheduleSave();}
  function readFile(accept,callback,maxMB=8){const input=$('fileInput');input.accept=accept;input.value='';input.onchange=async()=>{const file=input.files[0];if(!file)return;if(file.size>maxMB*1024*1024){toast(maxMB+'MB 이하 파일을 열어주세요.');return;}try{await callback(await file.text(),file.name);}catch(err){toast('파일을 읽지 못했어요: '+err.message);}};input.click();}
  function importDialog(){
    let importName=null;
    showModal('HTML 불러오기','<p>기존 HTML을 그대로 붙여넣으세요. 현재 문서는 교체 전에 백업돼요.</p><button id="chooseHtml" class="drop-file">＋ HTML 파일 선택</button><textarea id="importValue" class="modal-code" aria-label="불러올 HTML" spellcheck="false" placeholder="&lt;div style=…&gt;…&lt;/div&gt;"></textarea><div class="modal-actions"><button id="importAppend">선택 위치에 추가</button><button id="importReplace" class="primary">문서로 불러오기</button></div>');
    $('chooseHtml').onclick=()=>readFile('.html,.htm,.txt',(text,name)=>{$('importValue').value=text;importName=name.replace(/\.[^.]+$/,'');});
    $('importReplace').onclick=()=>{const val=$('importValue').value;if(!val.trim()){toast('HTML을 먼저 넣어주세요.');return;}replaceDocument(val,importName,'HTML 불러오기 전');};
    $('importAppend').onclick=()=>{const val=$('importValue').value;if(!val.trim())return;closeModal();addHtml(val);};
  }
  function exportDialog(){flush();
    const missing=model.records.filter(r=>r.tag==='img'&&A.idOf(r.el?.getAttribute('src'))&&(!C.normalizeUrl(r.el.getAttribute('data-arca-publish'))||!C.safeUrl(r.el.getAttribute('data-arca-publish'),'media')));
    if(missing.length){showModal('게시용 주소 연결이 필요해요',`<p><strong>${missing.length}개 이미지</strong>에 게시용 주소가 없거나 올바르지 않아요. 배치는 보존돼 있어요.</p><div class="modal-actions"><button id="connectBeforeExport" class="primary">원본 이미지 · 주소 연결</button></div>`);$('connectBeforeExport').onclick=localImagesDialog;return;}
    const changes=analysis.issues.filter(x=>x.level==='error'||/제외|출력|남겨/.test(x.message));
    showModal('게시용 HTML 내보내기',`<p><strong>편집 중인 원본은 유지해요.</strong> 아래 결과만 아카라이브에 붙여넣으세요.</p><div class="export-summary">차단 ${analysis.errors}건 · 주의 ${analysis.warnings}건${changes.length?'<ul>'+changes.slice(0,30).map(x=>'<li>'+e(x.message)+'</li>').join('')+'</ul>':'<br>가이드 기준 차단 요소를 찾지 못했어요.'}</div><textarea id="exportValue" class="modal-code output" readonly aria-label="게시용 HTML"></textarea><p class="muted" style="margin-top:12px">게시 후 실제 모양을 확인해 주세요. ‘프로젝트 저장’은 나중에 이어서 편집할 원본을 보관해요.</p><div class="modal-actions"><button id="exportDownload">HTML 파일 저장</button><button id="exportCopy" class="primary">게시용 HTML 복사</button></div>`);
    $('exportValue').value=analysis.html;$('exportCopy').onclick=()=>copy(analysis.html);$('exportDownload').onclick=()=>download(analysis.html,'text/html',filename+'-게시용.html');
  }
  function imageViewer(url,alt){
    if(!url||!(C.safeUrl(url,'media')||A.validData(url))){toast('이미지 주소를 먼저 확인해 주세요.');return;}
    showModal('이미지 미리보기',`<div class="image-large"><img id="largeImage" alt="${e(alt)}"></div><p id="largeImageState" class="muted">불러오는 중…</p>`);
    const img=$('largeImage'),status=$('largeImageState');img.referrerPolicy='no-referrer';img.onload=()=>status.textContent=`${img.naturalWidth} × ${img.naturalHeight}px`;img.onerror=()=>status.textContent='불러오지 못했어요. 만료·접근 제한·주소를 확인해 주세요.';img.src=url;
  }
  function localImagesDialog(){
    flush();
    const records=model.records.filter(r=>r.tag==='img'&&A.idOf(r.el?.getAttribute('src')));
    const ids=[...new Set(records.map(r=>A.idOf(r.el.getAttribute('src'))))].sort((a,b)=>(assets.get(a)?.addedAt||0)-(assets.get(b)?.addedAt||0));
    let candidates=[];
    showModal('원본 이미지 · 게시용 주소 연결',`<p><strong>원본으로 배치 → 사용한 이미지 ZIP 저장 → 업로드 → 주소 연결</strong><br>긴 파일명 대신 썸네일과 번호를 보고 골라주세요.</p><label class="drop-file local-file-label">＋ PC 원본 이미지 추가<input id="localImageFiles" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" multiple></label><p id="localImageNotice" class="muted">원본은 프로젝트 저장에 포함돼요. 한 장 20MB · 프로젝트 이미지 합계 100MB.</p>${ids.length?`<section class="upload-bundle-box"><button id="saveUploadBundle" class="primary">↓ 사용한 원본 ${ids.length}장 ZIP 저장</button><p id="uploadBundleState" class="muted"></p><label class="check-row"><input id="confirmUploadOrder" type="checkbox">ZIP의 images 폴더를 001부터 번호순으로 업로드했어요</label></section><label class="field">아카라이브 이미지 HTML 또는 주소 목록<textarea id="publishImageInput" rows="3" placeholder="&lt;img src=&quot;…&quot;&gt; 여러 개를 한 번에 붙여넣으세요."></textarea></label><div class="image-review-toolbar"><button id="extractPublishImages">주소 목록 읽기</button><button id="matchPublishOrder" disabled>같은 업로드 순서로 연결</button></div><p id="publishCandidatesState" class="muted">원본을 추가한 순서로 표시해요. 파일명으로 추측하지 않으니, 아카라이브에도 같은 순서로 올렸을 때만 순서 연결을 사용하세요.</p><div class="local-asset-grid">${ids.map((id,i)=>{const a=assets.get(id),rec=records.find(r=>A.idOf(r.el.getAttribute('src'))===id);return `<article class="image-review-card"><strong>${e(rec.el.getAttribute('alt')||'이미지 '+(i+1))}</strong><button class="image-thumb" data-local-enlarge="${i}" aria-label="원본 이미지 ${i+1} 크게 보기"><img ${a?`src="${e(a.data)}"`:''} alt="이미지 ${i+1} 원본"><span>크게 보기</span></button><strong class="upload-copy-name" data-copy-name="${i}"></strong><small class="asset-filename" title="${e(a?.name||'원본 파일 없음')}">${e(a?.name||'원본이 없어 프로젝트 파일로 다시 열어주세요.')}</small><label class="field">게시용 주소<input data-publish-url="${i}" value="${e(rec.el.getAttribute('data-arca-publish')||'')}" placeholder="https://… 또는 //…"></label><label class="field">붙여넣은 주소에서 선택<select data-publish-pick="${i}"><option value="">주소 목록을 먼저 읽어주세요</option></select></label><small data-publish-status="${i}" class="muted"></small></article>`;}).join('')}</div><div class="modal-actions"><button id="applyPublishUrls" class="primary">주소 연결 적용</button></div>`:'<p>이미지를 넣으면 이곳에 썸네일과 게시용 주소 입력칸이 나타나요.</p>'}`);
    $('localImageFiles').onchange=async ev=>{
      const input=ev.target;if(!input.files.length)return;input.disabled=true;$('localImageNotice').textContent='원본 이미지를 읽고 저장하는 중…';
      try{
        const items=await A.fromFiles(input.files);
        A.validate([...A.used(source).map(id=>assets.get(id)).filter(Boolean),...items]);
        let durable=true;try{await A.put(items);}catch(_){durable=false;assetStorageOk=false;}
        for(const item of items)assets.set(item.id,item);
        const start=ids.length;
        const html=items.map((a,i)=>`<p style="margin:16px 0;"><img src="${A.PREFIX+a.id}" alt="이미지 ${start+i+1}" style="max-width:100%;height:auto;"></p>`).join('\n');
        closeModal();addHtml(html);
        if(!durable)toast('자동 보관 공간이 부족해요. 원본 보존을 위해 프로젝트를 저장하세요.');else toast('원본 이미지를 넣었어요. 배치 후 이 창에서 게시용 주소를 연결하세요.');
      }catch(err){$('localImageNotice').textContent=err.message;input.disabled=false;}
    };
    if(!ids.length)return;
    const inputAt=i=>$('modalBody').querySelector(`[data-publish-url="${i}"]`);
    function refreshBundleInfo(){
      const batch=U.readBatch(uploadBatch),ready=batch&&batch.ids.length===ids.length&&ids.every(id=>batch.ids.includes(id));
      $('uploadBundleState').textContent=ready?'ZIP을 풀어 images 폴더의 파일만 번호순으로 업로드하세요. 대응 정보는 프로젝트 저장에도 포함돼요.':'원본 파일은 그대로 두고, 사용한 원본의 복사본만 001·002… 이름으로 저장해요.';
      $('confirmUploadOrder').disabled=!ready;
      ids.forEach((id,i)=>{$('modalBody').querySelector('[data-copy-name="'+i+'"]').textContent=ready?'업로드 복사본 · '+batch.names[batch.ids.indexOf(id)]:'';});
    }
    function autoMatchBundle(){
      if(!$('confirmUploadOrder').checked)return;
      const result=U.match(uploadBatch,ids,candidates);
      if(!result.ok){$('publishCandidatesState').textContent=result.reason;return;}
      ids.forEach((id,i)=>{inputAt(i).value=result.urls.get(id);describe(i);});
      $('publishCandidatesState').textContent='ZIP 번호순으로 자동 연결안을 채웠어요. 업로드 순서와 이미지를 확인한 뒤 적용하세요.';
    }
    refreshBundleInfo();
    $('confirmUploadOrder').onchange=()=>{if(candidates.length)autoMatchBundle();};
    $('saveUploadBundle').onclick=async()=>{
      const button=$('saveUploadBundle');button.disabled=true;button.textContent='복사본 ZIP 만드는 중…';
      try{await new Promise(resolve=>requestAnimationFrame(resolve));const result=U.bundle(source,assets);uploadBatch=result.batch;scheduleSave();download(result.blob,'application/zip',filename+'-업로드이미지-'+uploadBatch.id.slice(0,8)+'.zip');$('confirmUploadOrder').checked=false;refreshBundleInfo();toast('복사본 ZIP을 저장했어요. 원본 파일과 배치는 그대로예요.');}
      catch(err){toast(err.message);}finally{button.disabled=false;button.textContent='↓ 사용한 원본 '+ids.length+'장 ZIP 저장';}
    };
    function describe(i){const url=C.normalizeUrl(inputAt(i).value),status=$('modalBody').querySelector(`[data-publish-status="${i}"]`),expiry=C.expiryInfo(url);status.textContent=!url?'미연결 · 편집 가능 / 게시 전 연결 필요':!C.safeUrl(url,'media')?'HTTP(S) 이미지 주소를 확인해 주세요.':expiry?(expiry.expired?'주소의 만료 시각 지남':'만료 시각 있음')+' · '+new Date(expiry.at).toLocaleString('ko-KR'):'연결 준비됨 · 게시 후 이미지 표시 확인';}
    ids.forEach((_,i)=>{describe(i);inputAt(i).oninput=()=>describe(i);});
    document.querySelectorAll('[data-local-enlarge]').forEach(b=>b.onclick=()=>{const img=b.querySelector('img');if(!img.getAttribute('src')){toast('이 원본은 프로젝트 파일에서 다시 불러와 주세요.');return;}const large=b.classList.toggle('local-expanded');b.style.height=large?'360px':'145px';b.querySelector('span').textContent=large?'작게 보기':'크게 보기';});
    $('publishImageInput').oninput=()=>{candidates=[];$('applyPublishUrls').disabled=!!$('publishImageInput').value.trim();$('matchPublishOrder').disabled=true;document.querySelectorAll('[data-publish-pick]').forEach(sel=>sel.innerHTML='<option value="">주소 목록 읽기를 다시 눌러주세요</option>');};
    $('extractPublishImages').onclick=()=>{
      const found=C.extractImages($('publishImageInput').value);candidates=found.images;
      $('publishCandidatesState').textContent=`주소 ${candidates.length}개 · 원본 ${ids.length}개. 목록 번호는 붙여넣은 순서예요. 원본과 같은 이미지인지 확인해 주세요.`;
      document.querySelectorAll('[data-publish-pick]').forEach(sel=>{sel.innerHTML='<option value="">연결할 주소 선택</option>'+candidates.map((x,j)=>`<option value="${j}" ${x.valid?'':'disabled'}>주소 ${j+1} · ${e(x.alt)}${x.valid?'':' · 지원 안 됨'}</option>`).join('');sel.onchange=()=>{if(sel.value==='')return;const i=Number(sel.dataset.publishPick);inputAt(i).value=candidates[Number(sel.value)].url;describe(i);};});
      $('matchPublishOrder').disabled=candidates.length!==ids.length||candidates.some(x=>!x.valid);$('applyPublishUrls').disabled=false;autoMatchBundle();
    };
    $('matchPublishOrder').onclick=()=>{ids.forEach((_,i)=>{inputAt(i).value=candidates[i].url;describe(i);});$('publishCandidatesState').textContent='업로드 순서대로 채웠어요. 아래 연결을 확인한 뒤 적용하세요.';};
    $('applyPublishUrls').onclick=()=>{
      const urls=ids.map((_,i)=>C.normalizeUrl(inputAt(i).value));
      if(urls.some(url=>url&&!C.safeUrl(url,'media'))){toast('지원하지 않는 주소가 있어요. HTTP(S) 주소로 바꿔주세요.');return;}
      backup('이미지 주소 연결 전');let next=source;
      for(const r of [...records].reverse()){const i=ids.indexOf(A.idOf(r.el.getAttribute('src')));next=C.patch(next,r.start,r.openEnd,C.openingWith(r,{'data-arca-publish':urls[i]||null}));}
      commit(next,'원본 이미지의 게시용 주소 연결','command',selected?.start??0);closeModal();toast('주소를 연결했어요. 이미지 배치는 그대로예요.');
    };
  }

  function imagesDialog(){
    let candidates=[];
    showModal('여러 이미지 넣기','<p>아카라이브 HTML이나 이미지 주소를 붙여넣고 <strong>이미지 확인</strong>을 눌러주세요.<br><code>//ac.arca.live/…</code>도 읽어요. 주소의 key·expires는 보존해요.</p><textarea id="imageValues" class="modal-code" style="height:110px" placeholder="&lt;img src=&quot;//ac.arca.live/…&quot;&gt; 또는 이미지 주소 목록" aria-label="이미지 주소 또는 HTML"></textarea><div class="image-review-toolbar"><button id="reviewImages" class="wide">이미지 확인</button><span id="imageReviewCount" role="status"></span></div><div id="imageImportNotices" class="muted"></div><div id="imageReviewGrid" class="image-review-grid"></div><section id="imageLargePreview" hidden><div class="image-review-toolbar"><strong id="imageLargeLabel"></strong><button id="closeImageLarge">크게 보기 닫기</button></div><div class="image-large"><img id="importLargeImage" alt="이미지 크게 보기"></div><p id="importLargeState" class="muted"></p></section><div class="field-row"><label class="field">배치<select id="imageColumns"><option value="2">2열</option><option value="1">1열</option><option value="3">3열 · 짧은 이미지용</option></select></label><label class="field">묶기<select id="imageGrouping"><option value="0">접기 없이 추가</option><option value="4">4장씩 접기로 묶기</option><option value="8">8장씩 접기로 묶기</option></select></label></div><div class="modal-actions"><button id="selectAllImages" disabled>전체 선택</button><button id="insertImages" class="primary" disabled>선택한 이미지 추가</button></div>');
    const updateCount=()=>{const chosen=candidates.filter(x=>x.checked).length;$('imageReviewCount').textContent=`${candidates.length}개 발견 · ${chosen}개 선택`;$('insertImages').disabled=!chosen;};
    $('imageValues').oninput=()=>{candidates=[];$('imageReviewGrid').replaceChildren();$('imageImportNotices').textContent='입력이 바뀌었어요. 이미지 확인을 다시 눌러주세요.';$('imageReviewCount').textContent='';$('imageLargePreview').hidden=true;$('insertImages').disabled=true;$('selectAllImages').disabled=true;};
    $('reviewImages').onclick=()=>{
      const result=C.extractImages($('imageValues').value);candidates=result.images.map(x=>({...x,checked:x.valid}));
      $('imageImportNotices').textContent=result.notices.join(' ')+ (candidates.some(x=>x.expiry?.expired)?' 주소의 만료 시각이 지난 이미지가 있어요. 실제 로딩 결과를 확인하세요.':'');
      $('imageReviewGrid').innerHTML=candidates.map((x,i)=>`<article class="image-review-card"><label class="image-choice"><input type="checkbox" data-image-check="${i}" ${x.checked?'checked':''} ${x.valid?'':'disabled'}>이미지 ${i+1}</label><button class="image-thumb" data-image-enlarge="${i}" ${x.valid?'':'disabled'} aria-label="이미지 ${i+1} 크게 보기"><img data-image-thumb="${i}" alt="${e(x.alt)}"><span>크게 보기</span></button><div class="image-load-state" data-image-state="${i}">${x.valid?'불러오는 중…':'지원하지 않는 이미지 주소'}</div>${x.expiry?`<small class="image-expiry">${x.expiry.expired?'만료 시각 지남':'만료 예정'} · ${e(new Date(x.expiry.at).toLocaleString('ko-KR'))}</small>`:''}</article>`).join('');
      for(const thumb of $('imageReviewGrid').querySelectorAll('[data-image-thumb]')){
        const i=Number(thumb.dataset.imageThumb),item=candidates[i],state=$('imageReviewGrid').querySelector(`[data-image-state="${i}"]`);thumb.referrerPolicy='no-referrer';
        thumb.onload=()=>{state.textContent=`불러옴 · ${thumb.naturalWidth} × ${thumb.naturalHeight}px`;state.dataset.state='loaded';};
        thumb.onerror=()=>{thumb.hidden=true;state.textContent='불러오지 못함 · 주소/만료/접근 확인';state.dataset.state='failed';};
        if(item.valid)thumb.src=item.url;else thumb.hidden=true;
      }
      $('imageLargePreview').hidden=true;$('selectAllImages').disabled=!candidates.some(x=>x.valid);updateCount();
      if(!candidates.length)$('imageImportNotices').textContent='이미지 주소를 찾지 못했어요. img 태그 또는 src 주소를 붙여넣어 주세요.';
    };
    $('imageReviewGrid').onchange=ev=>{if(ev.target.matches('[data-image-check]')){candidates[Number(ev.target.dataset.imageCheck)].checked=ev.target.checked;updateCount();}};
    $('imageReviewGrid').onclick=ev=>{const button=ev.target.closest('[data-image-enlarge]');if(!button)return;const i=Number(button.dataset.imageEnlarge),item=candidates[i];if(!item.valid)return;const img=$('importLargeImage'),status=$('importLargeState');$('imageLargePreview').hidden=false;$('imageLargeLabel').textContent=`이미지 ${i+1}`;status.textContent='불러오는 중…';img.referrerPolicy='no-referrer';img.onload=()=>status.textContent=`${img.naturalWidth} × ${img.naturalHeight}px`;img.onerror=()=>status.textContent='불러오지 못했어요. 만료·접근 제한·주소를 확인해 주세요.';img.src=item.url;$('imageLargePreview').scrollIntoView({block:'nearest'});};
    $('closeImageLarge').onclick=()=>$('imageLargePreview').hidden=true;
    $('selectAllImages').onclick=()=>{const all=candidates.filter(x=>x.valid).every(x=>x.checked);for(const x of candidates)x.checked=x.valid&&!all;for(const box of $('imageReviewGrid').querySelectorAll('[data-image-check]'))box.checked=candidates[Number(box.dataset.imageCheck)].checked;updateCount();};
    $('insertImages').onclick=()=>{
      const chosen=candidates.filter(x=>x.checked&&x.valid);if(!chosen.length)return;
      const columns=Number($('imageColumns').value),group=Number($('imageGrouping').value),p=B.palettes[$('palette').value];let html='';
      if(group){for(let i=0;i<chosen.length;i+=group){const batch=chosen.slice(i,i+group);html+=`<details style="margin:18px 0;border:1px solid ${p.border};border-radius:8px;"><summary style="padding:14px;background:${p.soft};color:${p.ink};font-weight:700;">${i/group+1}일차</summary>${B.gallery(batch.map(x=>x.url),columns,p,batch.map(x=>x.alt))}</details>\n`;}}
      else html=B.gallery(chosen.map(x=>x.url),columns,p,chosen.map(x=>x.alt));closeModal();addHtml(html);
    };
  }
  function backupsDialog(){let items=[];try{items=JSON.parse(localStorage.getItem(BACKUPS)||'[]');}catch(_){}
    showModal('이전 문서 백업',`<p>불러오기·새 문서·삭제 전의 원본을 최대 8개 보관해요.<br>중요한 작업은 프로젝트 파일로도 저장해 주세요.</p>${items.length?items.map((x,i)=>`<div class="backup-row"><span>${e(new Date(x.at).toLocaleString('ko-KR'))}<br><small class="muted">${e(x.reason)} · ${(x.html.length/1024).toFixed(1)} KB</small></span><button data-restore="${i}">복원</button></div>`).join(''):'<p>아직 이전 백업이 없어요.</p>'}<div class="modal-actions"><button id="backupNow">현재 문서 백업</button></div>`);
    $('backupNow').onclick=()=>{backup('직접 보관');backupsDialog();};document.querySelectorAll('[data-restore]').forEach(button=>button.onclick=()=>{const item=items[Number(button.dataset.restore)];replaceDocument(item.html,item.name,'백업 복원 전',item.uploadBatch);toast('백업을 복원했어요.');});
  }
  function helpDialog(){showModal('보고, 고치고, 바로 확인하기','<div class="help-steps"><strong>1</strong><div>미리보기에서 고칠 부분을 클릭하세요.<small>해당 HTML이 선택되고 오른쪽 속성이 열려요. 닫힌 접기는 구성 트리에서 안쪽 요소를 고르면 펼쳐져요.</small></div><strong>2</strong><div>내용·색상·여백을 바꾸세요.<small>코드도 함께 바뀌어요. 아래 HTML을 직접 수정해도 미리보기가 갱신돼요. 코드에서 커서를 놓으면 해당 요소가 표시돼요.</small></div><strong>3</strong><div>왼쪽에서 블록을 추가하거나 끌어 옮기세요.<small>오른쪽 아래에서 앞·뒤·안쪽 위치를 선택할 수 있어요. 표의 행·셀은 구조에 맞게 이동해요.</small></div><strong>4</strong><div>게시 예상 확인 → 게시용 HTML 내보내기.<small>실제 게시 결과와는 차이가 있을 수 있어요. 원본은 프로젝트 파일로 저장해 두세요.</small></div></div><p style="margin-top:22px">Ctrl S 저장 · Ctrl Z 되돌리기 · Ctrl Shift Z 다시 실행<br>미리보기 안에서 접기를 펼쳐보는 동작은 원본의 기본 펼침 상태를 바꾸지 않아요. ‘처음부터 펼쳐 놓기’ 속성으로 설정하세요.</p>');}
  // UI bindings
  $('contextDeleteImage').onclick=deleteSelectedImage;$('mobileDeleteImage').onclick=deleteSelectedImage;
  document.addEventListener('pointerdown',ev=>{if(!$('imageMenu').contains(ev.target))$('imageMenu').hidden=true;});
  document.addEventListener('keydown',ev=>{if(ev.key==='Escape')$('imageMenu').hidden=true;});
  $('canvasArea').addEventListener('scroll',()=>$('imageMenu').hidden=true);
  document.addEventListener('dragover',ev=>{if(hasFiles(ev)){ev.preventDefault();ev.dataTransfer.dropEffect='none';}});
  document.addEventListener('drop',ev=>{if(hasFiles(ev)){ev.preventDefault();toast('가운데 미리보기의 이미지 칸에 파일을 놓아주세요.');}});
  function applyEditorTheme(){
    const light=editorTheme==='light';
    document.documentElement.dataset.editorTheme=editorTheme;
    $('editorThemeToggle').textContent=light?'☼ 편집기 · 라이트':'☾ 편집기 · 다크';
    $('editorThemeToggle').setAttribute('aria-pressed',String(light));
    $('editorThemeToggle').title=light?'편집기 다크 테마로 전환':'편집기 라이트 테마로 전환';
  }
  applyEditorTheme();
  $('editorThemeToggle').onclick=()=>{
    editorTheme=editorTheme==='light'?'dark':'light';applyEditorTheme();
    try{localStorage.setItem(THEME_KEY,editorTheme);}catch(_){toast('테마는 바뀌었지만 브라우저 설정 때문에 기억하지 못했어요.');}
  };
  document.querySelectorAll('[data-left]').forEach(x=>x.onclick=()=>setLeft(x.dataset.left));
  document.querySelectorAll('[data-right]').forEach(x=>x.onclick=()=>setRight(x.dataset.right));
  document.querySelectorAll('[data-mode]').forEach(x=>x.onclick=()=>{flush();mode=x.dataset.mode;document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b===x));renderFrame();});
  document.querySelectorAll('[data-width]').forEach(x=>x.onclick=()=>{width=Number(x.dataset.width);document.querySelectorAll('[data-width]').forEach(b=>b.classList.toggle('active',b===x));renderFrame();});
  $('themeToggle').onclick=()=>{dark=!dark;$('themeToggle').textContent=dark?'☾ 다크':'☼ 라이트';renderFrame();};$('zoom').onchange=layoutFrame;
  $('treeSearch').oninput=ev=>{search=ev.target.value.toLowerCase();renderTree();};
  $('collapseTree').onclick=()=>{allCollapsed=!allCollapsed;collapsed=allCollapsed?new Set(model.records.map(r=>r.id)):new Set();$('collapseTree').textContent=allCollapsed?'모두 펼치기':'모두 접기';renderTree();};
  $('tree').onclick=ev=>{flush();const collapse=ev.target.closest('[data-collapse]');if(collapse){const id=collapse.dataset.collapse;if(collapsed.has(id))collapsed.delete(id);else collapsed.add(id);renderTree();return;}const row=ev.target.closest('[data-id]');if(row){select(model.byId.get(row.dataset.id),{focusCode:true,scrollPreview:true});setRight('properties');}};
  $('tree').onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){const row=ev.target.closest('[data-id]');if(row){ev.preventDefault();select(model.byId.get(row.dataset.id),{focusCode:true,scrollPreview:true});}}};
  $('tree').ondragstart=ev=>{flush();const row=ev.target.closest('[data-id]');if(row){dragged=row.dataset.id;ev.dataTransfer.setData('text/plain',dragged);ev.dataTransfer.effectAllowed='move';}};
  $('tree').ondragover=ev=>{if(!dragged)return;ev.preventDefault();document.querySelectorAll('.drag-over').forEach(x=>x.classList.remove('drag-over'));ev.target.closest('[data-id]')?.classList.add('drag-over');};
  $('tree').ondrop=ev=>{ev.preventDefault();const row=ev.target.closest('[data-id]');if(row&&dragged)performMove(dragged,row.dataset.id,$('insertPosition').value,true);dragged=null;document.querySelectorAll('.drag-over').forEach(x=>x.classList.remove('drag-over'));};
  $('tree').ondragend=()=>{dragged=null;document.querySelectorAll('.drag-over').forEach(x=>x.classList.remove('drag-over'));};
  code.oninput=()=>commit(code.value,'코드 수정 → 미리보기 갱신','code',code.selectionStart,260);
  code.onscroll=()=>$('lineNumbers').scrollTop=code.scrollTop;
  const codeSelect=()=>{if(syncTimer)return;const rec=C.atOffset(model,code.selectionStart);if(rec?.id!==selected?.id){selected=rec;renderTree();selectionUi(false);highlight(true);}};
  code.onclick=codeSelect;code.onkeyup=ev=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(ev.key))codeSelect();};
  code.onkeydown=ev=>{if(ev.key==='Tab'){ev.preventDefault();const start=code.selectionStart,end=code.selectionEnd;code.setRangeText('  ',start,end,'end');code.dispatchEvent(new Event('input'));}};
  $('inspectorFields').addEventListener('input',ev=>{if(ev.target.matches('[data-text],[data-style],[data-attr]')&&ev.target.type!=='checkbox')updateProperty(ev.target);});
  $('inspectorFields').addEventListener('change',ev=>{if(ev.target.matches('[data-check],select[data-style]'))updateProperty(ev.target);});
  $('inspectorFields').addEventListener('click',ev=>{const b=ev.target.closest('[data-swatch]');if(b)updateProperty({dataset:{style:'background-color'},value:b.dataset.swatch});});
  document.querySelectorAll('[data-operation]').forEach(x=>x.onclick=()=>operation(x.dataset.operation));
  $('applyInner').onclick=()=>{const val=$('innerHtml').value;flush();if(selected&&!C.VOID.has(selected.tag)){backup('내부 HTML 교체 전');commit(C.patch(source,selected.openEnd,selected.closeStart,val),'내부 HTML 변경','command',selected.start);}};
  $('issues').onclick=ev=>{const b=ev.target.closest('[data-issue]');if(b){const issue=analysis.issues[Number(b.dataset.issue)];const rec=model.byId.get(issue.id)||C.atOffset(model,issue.offset);select(rec,{focusCode:true,scrollPreview:true});}};
  const groups={structure:'STRUCTURE · 구성',text:'TEXT · 글',content:'CONTENT · 콘텐츠',detail:'DETAIL · 디테일'};
  $('library').innerHTML=Object.entries(groups).map(([key,label])=>`<h3 class="library-group">${label}</h3><div class="component-grid">${B.specs.filter(s=>s[0]===key).map(s=>`<button class="component-button" data-component="${s[1]}"><span>${e(s[2])}</span>${s[3]}</button>`).join('')}</div>`).join('');
  $('library').onclick=ev=>{const b=ev.target.closest('[data-component]');if(b)addHtml(B.make(b.dataset.component,$('palette').value));};
  document.querySelectorAll('[data-quick]').forEach(b=>b.onclick=()=>addHtml(B.make(b.dataset.quick,$('palette').value)));
  $('quickLocalImages').onclick=localImagesDialog;
  $('localImages').onclick=localImagesDialog;
  $('images').onclick=imagesDialog;$('help').onclick=helpDialog;$('importHtml').onclick=importDialog;$('exportHtml').onclick=exportDialog;$('backups').onclick=backupsDialog;
  $('newDoc').onclick=()=>{showModal('새 문서 시작하기','<p>지금 작업은 교체 전에 백업돼요.</p><div class="new-options"><button id="newBlank"><b>빈 문서</b><small>처음부터 자유롭게 구성하기</small></button><button id="newSample"><b>예시 문서</b><small>나의 작은 기록실에서 시작하기</small></button></div>');$('newBlank').onclick=()=>replaceDocument('<div style="max-width:900px;margin:0 auto;padding:24px;color:#34314d;background:#fbfaff;"></div>','새 문서','새 문서 시작 전');$('newSample').onclick=()=>replaceDocument(B.starter(),'나의 기록','예시 문서 시작 전');};
  $('openProject').onclick=()=>readFile('.json',async(text,name)=>{const raw=JSON.parse(text),data=A.unpack(raw);try{await A.put(data.assets);}catch(_){assetStorageOk=false;toast('이미지는 이번 작업에서 사용할 수 있지만 자동 보관은 실패했어요. 프로젝트로 저장하세요.');}for(const item of data.assets)assets.set(item.id,item);replaceDocument(data.html,data.name||name.replace(/\.json$/,''),'프로젝트 열기 전',U.remapBatch(raw.uploadBatch,data.assetIdMap));},150);
  $('saveProject').onclick=()=>{flush();backup('프로젝트 저장');download(JSON.stringify(project()),'application/json',filename+'.arca.json');toast('원본 이미지를 포함해 프로젝트를 저장했어요.');};
  $('copySource').onclick=()=>{flush();copy(source);};$('downloadSource').onclick=()=>{flush();download(source,'text/html',filename+'-원본.html');};
  $('undo').onclick=()=>history('undo');$('redo').onclick=()=>history('redo');
  $('findCode').onclick=()=>{showModal('코드에서 찾기','<label class="field">찾을 내용<input id="findValue" placeholder="문장, 태그, 이미지 주소…"></label><div class="modal-actions"><button id="findNext" class="primary">찾기</button></div>');$('findNext').onclick=()=>{const q=$('findValue').value;if(!q)return;let i=source.indexOf(q,code.selectionEnd);if(i<0)i=source.indexOf(q);if(i<0){toast('일치하는 내용을 찾지 못했어요.');return;}closeModal();select(C.atOffset(model,i),{scrollPreview:true});code.focus();code.setSelectionRange(i,i+q.length);code.scrollTop=Math.max(0,(model.lineAt(i)-3)*21);};$('findValue').focus();};
  document.addEventListener('keydown',ev=>{if(!(ev.ctrlKey||ev.metaKey))return;const key=ev.key.toLowerCase();if(key==='s'){ev.preventDefault();$('saveProject').click();}if(key==='z'&&!$('modal').open&&(document.activeElement===code||!/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName))){ev.preventDefault();history(ev.shiftKey?'redo':'undo');}if(key==='y'&&document.activeElement===code){ev.preventDefault();history('redo');}});
  let resizeStart=null;$('codeResizer').onpointerdown=ev=>{resizeStart={y:ev.clientY,height:document.querySelector('.code-panel').getBoundingClientRect().height};ev.target.setPointerCapture(ev.pointerId);};$('codeResizer').onpointermove=ev=>{if(resizeStart)document.documentElement.style.setProperty('--code-height',Math.max(110,Math.min(innerHeight*.6,resizeStart.height+resizeStart.y-ev.clientY))+'px');};$('codeResizer').onpointerup=()=>resizeStart=null;$('codeResizer').onkeydown=ev=>{if(ev.key==='ArrowUp'||ev.key==='ArrowDown'){ev.preventDefault();const current=document.querySelector('.code-panel').getBoundingClientRect().height;document.documentElement.style.setProperty('--code-height',Math.max(110,Math.min(innerHeight*.6,current+(ev.key==='ArrowUp'?25:-25)))+'px');}};
  new ResizeObserver(layoutFrame).observe($('canvasArea'));
  window.addEventListener('beforeunload',()=>{try{localStorage.setItem(KEY,JSON.stringify({version:1,html:source,name:filename,uploadBatch}));}catch(_){}});
  sync();if(saved)$('changeSummary').textContent='이전에 편집하던 문서를 복원했어요';
})();
