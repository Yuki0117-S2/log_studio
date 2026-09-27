/* Editor controls never enter the document or its exported HTML. */
(() => {
  const e=window.ArcaCore.escape;
  function kind(el){
    if(!el||el.children.length||el.matches('[data-arca-board],[data-arca-group],[data-arca-anchor]'))return null;
    if(/^[▶◀▲▼]{1,2}$/.test(el.textContent.trim()))return 'symbol';
    if(el.getAttribute('data-arca-shape')==='line'||(!el.textContent.trim()&&parseFloat(el.style.fontSize)===0&&(el.style.backgroundColor||el.style.background)))return 'line';
    return null;
  }
  function resizeStyles(record,live,styles){
    if(kind(record.el)!=='symbol'||!live)return styles;
    const st=getComputedStyle(live),w=parseFloat(st.width),h=parseFloat(st.height),font=parseFloat(st.fontSize);
    const factor=styles.width?.endsWith('px')&&w?parseFloat(styles.width)/w:styles.height?.endsWith('px')&&h?parseFloat(styles.height)/h:null;
    if(factor===null||!Number.isFinite(factor)||factor<=0)return styles;
    return {...styles,width:(w*factor)+'px',height:(h*factor)+'px','font-size':(font*factor)+'px'};
  }
  function duplicateEnd(source,record){
    if(record.tag!=='details'||!record.implicit)return record.end;
    // Imported HTML can contain stray ancestor closing tags inside a fold.
    // Find its explicit close so the new fold cannot become its own child.
    const tokens=/<!--[\s\S]*?(?:-->|$)|<\/?([a-z][\w:-]*)\b(?:"[^"]*"|'[^']*'|[^'">])*>/gi;
    tokens.lastIndex=record.openEnd;let depth=1,match;
    while((match=tokens.exec(source))){
      const tag=match[1]?.toLowerCase();if(!tag)continue;
      const closing=match[0].startsWith('</');
      if(!closing&&/^(script|style|textarea|title|xmp|iframe|noembed|noframes)$/.test(tag)){
        const end=new RegExp('</\\s*'+tag+'\\s*>','ig');end.lastIndex=tokens.lastIndex;const found=end.exec(source);if(!found)return null;tokens.lastIndex=end.lastIndex;continue;
      }
      if(tag==='details'){depth+=closing?-1:1;if(depth===0)return tokens.lastIndex;}
    }
    return null;
  }
  function angle(el){
    const value=el.style.transform;
    if(!value||value==='none')return 0;
    const match=/^rotate\(\s*(-?[\d.]+)deg\s*\)$/.exec(value);
    return match?Number(match[1]):null;
  }
  function canRotate(record,live){
    return angle(record.el)!==null&&(!live||!/^table-(row|cell|column)/.test(getComputedStyle(live).display));
  }
  function panel(record,live){
    const st=live?getComputedStyle(live):record.el.style;
    const shape=kind(record.el),fill=shape==='symbol'?st.color:st.backgroundColor;
    const fillRgb=/^rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\)/.exec(fill||'');
    const fillHex=fillRgb?'#'+fillRgb.slice(1).map(n=>Number(n).toString(16).padStart(2,'0')).join(''):'#000000';
    const rgb=/^rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\)/.exec(st.borderTopColor||'');
    const borderColor=rgb?'#'+rgb.slice(1).map(n=>Number(n).toString(16).padStart(2,'0')).join(''):'#000000';
    const number=(label,prop,value)=>`<label class="field">${label}<input type="number" min="0" step="any" data-design-prop="${prop}" value="${e(Math.round((parseFloat(value)||0)*10)/10)}" aria-label="${label}"></label>`;
    const rotate=canRotate(record,live);
    return `<details open class="inspector-section design-panel"><summary>${shape==='symbol'?'삼각형 크기 · 색':shape==='line'?'선 길이 · 두께 · 색':'모양 · 테두리 · 회전'}</summary>
      ${shape?`<label class="field">도형 색<input type="color" data-shape-color value="${fillHex}" aria-label="도형 색"></label><div class="design-buttons">${['#8888CC','#DDAACC','#CCAA88','#BB6688'].map(c=>`<button type="button" data-shape-swatch="${c}" style="border-bottom:4px solid ${c}">${c}</button>`).join('')}</div>${shape==='symbol'?`<div class="design-buttons">${['◀','▲','▼','▶'].map(c=>`<button type="button" data-symbol="${c.repeat(record.el.textContent.trim().length)}">${c}</button>`).join('')}</div><p class="field-help">크기 손잡이나 너비·높이를 바꾸면 삼각형도 같은 비율로 커져요.</p>`:'<p class="field-help">손잡이는 길이만 조절해요. 두께는 아래 숫자로 따로 바꿔요.</p>'}`:''}
      ${!shape?`
      <div class="design-buttons"><button type="button" data-shape="rectangle">□ 네모</button><button type="button" data-shape="rounded">▢ 둥글게</button><button type="button" data-shape="circle">○ 원형</button></div>
      `:''}
      ${record.tag==='img'?'<button type="button" class="wide" data-shape="original">이미지 원래 비율</button>':''}
      <div class="field-row">${number(shape==='line'?'길이 (px)':'너비 (px)','width',st.width)}${number(shape==='line'?'두께 (px)':'높이 (px)','height',st.height)}</div>
      <div class="field-row">${number('테두리 두께 (px)','border-width',st.borderTopWidth)}<label class="field">테두리 선<select data-design-border><option value="none">없음</option>${['solid','dashed','dotted','double'].map((v,i)=>`<option value="${v}" ${st.borderTopStyle===v?'selected':''}>${['실선','파선','점선','이중선'][i]}</option>`).join('')}</select></label></div>
      <div class="design-buttons" aria-label="테두리 추천 색상">${['#8888CC','#DDAACC','#CCAA88','#BB6688'].map(c=>`<button type="button" data-border-color="${c}" style="border-bottom:4px solid ${c}" aria-label="테두리 ${c}">${c}</button>`).join('')}</div>
      <label class="field">직접 고른 테두리 색<input type="color" data-design-color value="${borderColor}"></label>
      ${rotate?`<label class="field">회전 각도 (°)<input type="number" step="1" data-design-angle value="${angle(record.el)}" aria-label="회전 각도"></label><button type="button" class="wide" data-reset-angle>회전 초기화</button><p class="field-help">미리보기의 ↻ 손잡이를 끌어 회전해요. Shift를 누르면 15°씩 맞춰요.</p>`:'<p class="field-help">복합 변형이나 표의 행·셀은 회전 손잡이를 지원하지 않아요. 코드에서 조절해 주세요.</p>'}
      <p class="field-help design-warning"><b>회전은 원본 HTML·프로젝트에 저장돼요.</b> 아카라이브 게시 예상·게시용 내보내기에서는 회전이 제거돼요.</p>
      <p class="field-help">↘ 손잡이로 크기 조절 · 구성 트리에서 끌어 순서 이동</p>
    </details>`;
  }
  function rotationStyles(record,live,degrees){
    const styles={transform:degrees?`rotate(${degrees}deg)`:'', 'transform-origin':degrees?'center center':''};
    if(degrees&&live&&getComputedStyle(live).display==='inline'&&record.tag!=='img')styles.display='inline-block';
    return styles;
  }
  function shapeStyles(kind,record,live){
    const st=live?getComputedStyle(live):record.el.style;
    if(kind==='rounded')return {'border-radius':'16px'};
    if(kind==='original')return {'border-radius':'0','aspect-ratio':'auto',height:'auto','object-fit':'contain'};
    if(kind==='rectangle')return {'border-radius':'0'};
    const size=Math.max(1,Math.round(parseFloat(st.width)||160));
    return {width:size+'px',height:'auto','min-height':'0','aspect-ratio':'1','box-sizing':'border-box','border-radius':'50%',...(record.tag==='img'?{'object-fit':'cover'}:{}),...(st.display==='inline'?{display:'inline-block'}:{})};
  }
  function attach({container,frame,getState,apply}){
    const overlay=document.createElement('div');overlay.className='design-handles';overlay.hidden=true;
    overlay.innerHTML='<button type="button" class="design-rotate" aria-label="회전 손잡이" title="끌어서 회전 · Shift 15°">↻</button><button type="button" class="design-resize" aria-label="크기 조절 손잡이" title="끌어서 크기 조절">↘</button>';
    container.append(overlay);
    let gesture=null;
    function update(){
      if(gesture)return;
      const state=getState();overlay.hidden=!state;
      if(!state)return;
      const {record,live,scale}=state,rect=live.getBoundingClientRect();
      if(!rect.width||!rect.height){overlay.hidden=true;return;}
      const rotate=overlay.querySelector('.design-rotate'),resize=overlay.querySelector('.design-resize');
      resize.title=kind(record.el)==='line'?'끌어서 길이 조절 · 두께 유지':'끌어서 크기 조절';
      rotate.hidden=!canRotate(record,live);resize.hidden=angle(record.el)!==0||/^table-(row|cell|column)/.test(getComputedStyle(live).display);
      rotate.style.left=(rect.left+rect.width/2)*scale+'px';rotate.style.top=Math.max(15,rect.top*scale-24)+'px';
      resize.style.left=Math.max(15,rect.right*scale-5)+'px';resize.style.top=Math.max(15,rect.bottom*scale-5)+'px';
    }
    function finish(cancel=false){
      if(!gesture)return;
      const g=gesture;gesture=null;
      overlay.querySelector('.design-rotate').textContent='↻';
      if(g.before===null)g.live.removeAttribute('style');else g.live.setAttribute('style',g.before);
      if(g.button.hasPointerCapture(g.pointer))g.button.releasePointerCapture(g.pointer);
      if(!cancel&&g.styles)apply(g.record,g.styles,g.rotate?'회전 변경':'크기 변경');
      update();
    }
    overlay.addEventListener('pointerdown',ev=>{
      const button=ev.target.closest('button'),state=getState();if(!button||!state||ev.button!==0)return;
      ev.preventDefault();const {record,live,scale}=state,rect=live.getBoundingClientRect(),fr=frame.getBoundingClientRect(),st=getComputedStyle(live);
      const cx=fr.left+(rect.left+rect.width/2)*scale,cy=fr.top+(rect.top+rect.height/2)*scale;
      gesture={record,live,scale,button,pointer:ev.pointerId,rotate:button.classList.contains('design-rotate'),before:live.getAttribute('style'),x:ev.clientX,y:ev.clientY,cx,cy,start:Math.atan2(ev.clientY-cy,ev.clientX-cx),angle:angle(record.el)||0,width:parseFloat(st.width)||rect.width,height:parseFloat(st.height)||rect.height};
      button.setPointerCapture(ev.pointerId);
    });
    overlay.addEventListener('pointermove',ev=>{
      const g=gesture;if(!g||ev.pointerId!==g.pointer)return;
      if(g.rotate){
        let delta=(Math.atan2(ev.clientY-g.cy,ev.clientX-g.cx)-g.start)*180/Math.PI;
        delta=((delta+540)%360)-180;
        const step=ev.shiftKey?15:1,degrees=Math.round((g.angle+delta)/step)*step;
        g.styles=rotationStyles(g.record,g.live,degrees);
        g.button.textContent=degrees+'°';
      }else{
        const shape=kind(g.record.el),dx=(ev.clientX-g.x)/g.scale,dy=(ev.clientY-g.y)/g.scale;
        let w=Math.max(16,Math.round(g.width+dx)),h=Math.max(16,Math.round(g.height+dy));
        if(shape==='symbol'){
          const change=Math.abs(dx/g.width)>=Math.abs(dy/g.height)?dx/g.width:dy/g.height;
          const factor=Math.max(.1,1+change);w=g.width*factor;h=g.height*factor;
        }
        if(ev.shiftKey)h=Math.round(w*g.height/g.width);
        const circle=/^1(?:\s*\/\s*1)?$/.test(g.record.el.style.aspectRatio)&&g.record.el.style.borderRadius==='50%';
        g.styles=shape==='line'?{width:w+'px'}:{width:w+'px',height:circle?'auto':h+'px','aspect-ratio':circle?'1':'auto'};
        if(shape==='symbol')g.styles['font-size']=(parseFloat(g.record.el.style.fontSize)||48)*(w/g.width)+'px';
        if(getComputedStyle(g.live).display==='inline'&&g.record.tag!=='img')g.styles.display='inline-block';
      }
      for(const [key,value] of Object.entries(g.styles))g.live.style.setProperty(key,value,'important');
    });
    overlay.addEventListener('pointerup',()=>{finish();overlay.querySelector('.design-rotate').textContent='↻';});
    overlay.addEventListener('pointercancel',()=>finish(true));
    overlay.addEventListener('lostpointercapture',()=>finish(true));
    document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&gesture){ev.preventDefault();finish(true);}});
    overlay.addEventListener('click',ev=>ev.stopPropagation());
    return {update,hide(){finish(true);overlay.hidden=true;}};
  }
  window.ArcaDesign={panel,angle,rotationStyles,resizeStyles,kind,shapeStyles,attach,duplicateEnd};
})();
