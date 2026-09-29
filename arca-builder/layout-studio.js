/* Zero-height inline anchors preserve free placement without position/z-index. */
(() => {
  const C=window.ArcaCore,e=C.escape;
  const areaStyle="width:100%;height:300px;margin:16px 0;padding:0;font-size:0;line-height:0;text-align:left;white-space:normal;background:#ffffff;";
  const anchorStyle='display:inline-block;width:100%;height:0;vertical-align:top;font-size:0;line-height:0;';
  const round=n=>Math.round(n*100)/100,clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  function board(){return `<div data-arca-board="true" style="${areaStyle}">&nbsp;</div>`;}
  function isItem(el){return el?.hasAttribute('data-arca-item');}
  function parentArea(el){return el?.parentElement?.parentElement;}
  function area(el){return el?.closest('[data-arca-group],[data-arca-board]');}
  function item(el){return el?.closest('[data-arca-item]');}
  function pick(target,model,selected,toggle=false){
    if(!toggle&&selected?.el?.hasAttribute('data-arca-group')){const group=target.closest(`[${model.attr}="${selected.id}"]`);if(group)return group;}
    return item(target);
  }
  function anchor(html){return `<div data-arca-anchor="true" style="${anchorStyle}">${html}</div>`;}
  function geometry(el){return {x:parseFloat(el.style.marginLeft)||0,y:parseFloat(el.style.marginTop)||0,w:parseFloat(el.style.width)||20,h:parseFloat(el.style.height)||60};}
  function setGeometry(el,g){const circle=el.style.borderRadius==='50%'&&/^1(?:\s*\/\s*1)?$/.test(el.style.aspectRatio);el.style.margin='0';el.style.marginLeft=round(g.x)+'%';el.style.marginTop=round(g.y)+'px';el.style.width=round(g.w)+'%';el.style.height=circle?'auto':round(g.h)+'px';el.style.boxSizing='border-box';el.style.display='block';}
  function cleanClone(el,marker){const clone=el.cloneNode(true);for(const node of [clone,...clone.querySelectorAll('*')])node.removeAttribute(marker);return clone;}
  function block(html,{x=5,y=20,w=30,h=70}={}){
    const d=new DOMParser().parseFromString(html,'text/html'),el=d.body.firstElementChild;
    if(!el)return '';
    el.setAttribute('data-arca-item','true');setGeometry(el,{x,y,w,h});
    el.style.fontSize=el.style.fontSize||'16px';el.style.lineHeight=el.style.lineHeight||'1.5';
    el.style.fontFamily=el.style.fontFamily||'Pretendard, sans-serif';
    if(el.localName==='img')el.style.objectFit='cover';
    if(!el.childNodes.length&&!C.VOID.has(el.localName))el.innerHTML='&nbsp;';
    return anchor(el.outerHTML);
  }
  function triangle(direction='right',color='#000000'){
    return `<div style="font-size:48px;line-height:1;color:${color};text-align:center;">${{right:'▶',left:'◀',up:'▲',down:'▼'}[direction]}</div>`;
  }
  function decoration(color='#000000',lineColor='#000000'){
    const items=[['◀◀',25,24],['▶',45,36],['▶▶',65,24]].map(([symbol,x,size])=>block(`<div style="font-size:${size}px;line-height:1;color:${color};text-align:center;">${symbol}</div>`,{x,y:20,w:10,h:40})).join('');
    return `<div data-arca-board="true" style="${areaStyle.replace('300px','100px')}">${items}${block(`<div style="background:${lineColor};font-size:0;line-height:0;">&nbsp;</div>`,{x:25,y:80,w:50,h:2})}</div>`;
  }
  function music(url,title,loop,compact){
    return `<div style="padding:20px;text-align:center;background:#ffffff;font-family:Pretendard,sans-serif;"><video controls playsinline preload="none"${loop?' loop':''} src="${e(url)}" style="display:block;width:100%;max-width:480px;height:${compact?'54px':'240px'};margin:0 auto;">이 브라우저에서 영상을 재생할 수 없습니다.</video><p style="margin:16px 0 0;font-size:16px;color:#000000;">${e(title)}</p></div>`;
  }
  function create(api){
    let cancelDrag=()=>{};
    const ctx=()=>api.context();
    function liveGeometry(el){
      const {model,doc}=ctx(),live=doc?.querySelector(`[${model.attr}="${el.getAttribute(model.attr)}"]`),g=geometry(el);
      if(live){const s=getComputedStyle(live),width=parentArea(live)?.getBoundingClientRect().width;if(width&&el.style.width.endsWith('px'))g.w=parseFloat(s.width)/width*100;if(el.style.height==='auto')g.h=parseFloat(s.height)||g.h;}
      return g;
    }
    function adaptStyles(record,styles){
      const {model,doc}=ctx(),live=doc?.querySelector(`[${model.attr}="${record.id}"]`);
      styles=window.ArcaDesign.resizeStyles(record,live,styles);
      if(!isItem(record.el)||!styles.width?.endsWith('px'))return styles;
      const width=live&&parentArea(live).getBoundingClientRect().width;
      if(!width)return styles;
      const desired=parseFloat(styles.width),percent=round(clamp(desired/width*100,1,100-geometry(record.el).x));
      if(window.ArcaDesign.kind(record.el)==='symbol'&&desired){const factor=percent/100*width/desired;styles={...styles,'font-size':parseFloat(styles['font-size'])*factor+'px',height:parseFloat(styles.height)*factor+'px'};}
      return {...styles,width:percent+'%'};
    }
    function selectedItems(){const {records}=ctx();return records.map(r=>r.el).filter(isItem);}
    function sameArea(elements){return elements.length&&elements.every(el=>parentArea(el)===parentArea(elements[0]));}
    function panel(){
      const {selected,records}=ctx(),el=selected?.el;if(!el)return '';
      const elements=selectedItems(),single=records.length===1,isArea=el.matches('[data-arca-board],[data-arca-group]');
      const relevant=area(el)||isItem(el);if(!relevant)return '';
      const g=isItem(el)?liveGeometry(el):null;
      const n=(label,key,value)=>`<label class="field">${label}<input type="number" step="any" data-layout-value="${key}" value="${round(value)}"></label>`;
      return `<details open class="inspector-section layout-panel"><summary>배치 · 정렬 · 그룹</summary><p class="field-help">구역 안의 도형을 끌어 옮겨요. Ctrl+클릭으로 여러 개 선택 · Shift는 10px 간격 맞춤</p>
        ${single&&g?`<div class="field-row">${n('가로 위치 (%)','x',g.x)}${n('위쪽 위치 (px)','y',g.y)}${n(window.ArcaDesign.kind(el)==='line'?'길이 (%)':'너비 (%)','w',g.w)}${n(window.ArcaDesign.kind(el)==='line'?'두께 (px)':'높이 (px)','h',g.h)}</div>`:''}
        ${single&&isArea?n('구역 높이 (px)','areaHeight',parseFloat(el.style.height)||300):''}
        <div class="design-buttons">${[['left','왼쪽'],['center','가운데'],['right','오른쪽'],['top','위'],['middle','세로 중앙'],['bottom','아래']].map(([k,v])=>`<button type="button" data-layout-action="${k}">${v}</button>`).join('')}</div>
        ${elements.length>1&&sameArea(elements)?'<div class="design-buttons"><button type="button" data-layout-action="distribute">가로 간격 같게</button><button type="button" data-layout-action="group">그룹 묶기</button></div>':''}
        ${single&&isItem(el)?'<div class="design-buttons"><button type="button" data-layout-action="front">맨 앞으로</button><button type="button" data-layout-action="back">맨 뒤로</button><button type="button" data-layout-action="parent">상위 구역 선택</button></div>':''}
        ${single&&el.hasAttribute('data-arca-group')?'<button type="button" class="wide" data-layout-action="ungroup">그룹 풀기</button>':''}
        <button type="button" class="wide" data-layout-action="save">이 구성을 내 블록으로 저장</button><p class="field-help">가로 위치와 너비는 화면에 맞춰 줄어들어요. 모바일 버튼으로 글자와 겹침을 확인하세요. 회전은 게시용 출력에서 제외돼요.</p></details>`;
    }
    function patchGeometry(changes,message){
      const {model,source}=ctx();let next=source;
      const edits=changes.map(([el,g])=>{const r=model.byId.get(el.getAttribute(model.attr)),clone=el.cloneNode(false),old=liveGeometry(el);
        if(window.ArcaDesign.kind(el)==='symbol'&&(g.w!==old.w||g.h!==old.h)){
          let factor=g.w!==old.w?g.w/old.w:g.h/old.h;factor=Math.min(factor,(100-g.x)/old.w);
          g={...g,w:old.w*factor,h:old.h*factor};clone.style.fontSize=((parseFloat(el.style.fontSize)||48)*factor)+'px';
        }
        setGeometry(clone,g);return {r,html:C.openingWith(r,{style:clone.getAttribute('style')})};});
      for(const {r,html} of edits.sort((a,b)=>b.r.start-a.r.start))next=C.patch(next,r.start,r.openEnd,html);
      api.apply(next,message,null,true);
    }
    function numeric(input){
      const {selected,model,source}=ctx();const el=selected?.el,key=input.dataset.layoutValue,n=Number(input.value);
      if(!el||input.value.trim()===''||!Number.isFinite(n))return;
      if(key==='areaHeight'){
        if(n<20)return;const clone=el.cloneNode(false);clone.style.height=n+'px';api.apply(C.patch(source,selected.start,selected.openEnd,C.openingWith(selected,{style:clone.getAttribute('style')})),'구역 높이 변경',null,true);return;
      }
      const g=liveGeometry(el);if(key==='x')g.x=clamp(n,0,100-g.w);if(key==='y')g.y=Math.max(0,n);if(key==='w')g.w=clamp(n,1,100-g.x);if(key==='h'){g.h=Math.max(1,n);if(el.style.height==='auto'&&el.style.borderRadius==='50%'){const live=ctx().doc?.querySelector(`[${model.attr}="${selected.id}"]`),width=live&&parentArea(live).getBoundingClientRect().width;if(width)g.w=clamp(n/width*100,1,100-g.x);}}
      patchGeometry([[el,g]],'배치 변경');
    }
    function action(kind){
      const {selected,model,source,records,doc}=ctx();const elements=selectedItems();
      if(kind==='save'){api.saveBlock(selected);return;}
      if(kind==='parent'){const p=parentArea(selected.el);api.select(model.byId.get(p.getAttribute(model.attr)));return;}
      if(kind==='group'){group(elements);return;}
      if(kind==='ungroup'){ungroup(selected.el);return;}
      if(!elements.length||elements.length!==records.length||!sameArea(elements)){api.toast('같은 디자인 구역 안의 도형을 선택해 주세요.');return;}
      if(kind==='front'||kind==='back'){
        const r=model.byId.get(elements[0].parentElement.getAttribute(model.attr)),p=model.byId.get(parentArea(elements[0]).getAttribute(model.attr));
        let next=C.patch(source,r.start,r.end,'');const point=kind==='front'?p.closeStart-(r.end-r.start):p.openEnd;
        const chunk=source.slice(r.start,r.end);next=C.patch(next,point,point,chunk);api.apply(next,'앞뒤 순서 변경',point+chunk.indexOf('data-arca-item')-5);return;
      }
      const gs=elements.map(liveGeometry),bounds={x:Math.min(...gs.map(g=>g.x)),y:Math.min(...gs.map(g=>g.y)),right:Math.max(...gs.map(g=>g.x+g.w)),bottom:Math.max(...gs.map(g=>g.y+g.h))};
      if(elements.length===1){bounds.x=0;bounds.y=0;bounds.right=100;bounds.bottom=parseFloat(parentArea(elements[0]).style.height)||300;}
      if(kind==='distribute'){
        if(elements.length<3){api.toast('간격을 맞출 도형을 3개 이상 선택하세요.');return;}
        const sorted=elements.map((el,i)=>({el,g:gs[i]})).sort((a,b)=>a.g.x-b.g.x),gap=(bounds.right-bounds.x-gs.reduce((n,g)=>n+g.w,0))/(gs.length-1);let x=bounds.x;
        patchGeometry(sorted.map(({el,g})=>{const result=[el,{...g,x}];x+=g.w+gap;return result;}),'가로 간격 맞춤');return;
      }
      patchGeometry(elements.map((el,i)=>{const g={...gs[i]};if(kind==='left')g.x=bounds.x;if(kind==='center')g.x=(bounds.x+bounds.right-g.w)/2;if(kind==='right')g.x=bounds.right-g.w;if(kind==='top')g.y=bounds.y;if(kind==='middle')g.y=(bounds.y+bounds.bottom-g.h)/2;if(kind==='bottom')g.y=bounds.bottom-g.h;return [el,g];}),'정렬 변경');
    }
    function group(elements){
      const {model,source,records}=ctx();if(elements.length<2||elements.length!==records.length||!sameArea(elements)){api.toast('같은 구역의 도형을 두 개 이상 선택하세요.');return;}
      const parent=parentArea(elements[0]),ordered=[...parent.children].filter(a=>elements.includes(a.firstElementChild));
      const gs=ordered.map(a=>liveGeometry(a.firstElementChild)),x=Math.min(...gs.map(g=>g.x)),y=Math.min(...gs.map(g=>g.y)),w=Math.max(...gs.map(g=>g.x+g.w))-x,h=Math.max(...gs.map(g=>g.y+g.h))-y;
      const wrapper=document.createElement('div');wrapper.setAttribute('data-arca-item','true');wrapper.setAttribute('data-arca-group','true');wrapper.style.cssText='font-size:0;line-height:0;white-space:normal;text-align:left;';setGeometry(wrapper,{x,y,w,h});
      wrapper.innerHTML=ordered.map((a,i)=>{const el=cleanClone(a.firstElementChild,model.attr);setGeometry(el,{x:(gs[i].x-x)/w*100,y:gs[i].y-y,w:gs[i].w/w*100,h:gs[i].h});return anchor(el.outerHTML);}).join('');
      const rs=ordered.map(a=>model.byId.get(a.getAttribute(model.attr)));let next=source;
      for(const r of [...rs].sort((a,b)=>b.start-a.start))next=C.patch(next,r.start,r.end,r===rs[0]?anchor(wrapper.outerHTML):'');
      api.apply(next,'그룹 묶기',rs[0].start+anchor('').indexOf('</div>'));
    }
    function ungroup(el){
      const {model,source}=ctx();if(!el?.hasAttribute('data-arca-group'))return;
      if(el.style.transform&&el.style.transform!=='none'){api.toast('그룹의 회전을 초기화한 뒤 풀어주세요.');return;}
      const g=geometry(el),r=model.byId.get(el.parentElement.getAttribute(model.attr));
      const html=[...el.children].map(a=>{const child=cleanClone(a.firstElementChild,model.attr),cg=geometry(child);setGeometry(child,{x:g.x+cg.x*g.w/100,y:g.y+cg.y,w:cg.w*g.w/100,h:cg.h});return anchor(child.outerHTML);}).join('');
      api.apply(C.patch(source,r.start,r.end,html),'그룹 풀기',r.start);
    }
    function insert(html){
      const {model,selected,source,position}=ctx(),target=isItem(selected?.el)&&!(selected.el.hasAttribute('data-arca-group')&&position==='inside')?parentArea(selected.el):area(selected?.el);if(!target)return false;
      const r=model.byId.get(target.getAttribute(model.attr)),count=target.children.length;
      const incoming=new DOMParser().parseFromString(html,'text/html').body.firstElementChild;
      const height=parseFloat(incoming?.style.height)|| (incoming?.querySelector('video')?140:70);
      const htmlBlock=block(html,{x:5+(count%5)*5,y:20+(count%5)*20,w:incoming?.querySelector('video')?80:30,h:height});
      api.apply(C.patch(source,r.closeStart,r.closeStart,htmlBlock),'디자인 구역에 추가',r.closeStart+anchor('').indexOf('</div>'));return true;
    }
    function bind(doc){
      cancelDrag();let drag=null;
      const restore=()=>{if(!drag)return;const done=drag;drag=null;done.node.setAttribute('style',done.style);if(done.node.hasPointerCapture(done.pointer))done.node.releasePointerCapture(done.pointer);};
      cancelDrag=restore;
      doc.addEventListener('pointerdown',ev=>{
        if(!api.editing()||ev.button!==0||ev.ctrlKey||ev.metaKey||ev.target.closest('video,a,input,textarea'))return;
        const node=pick(ev.target,ctx().model,ctx().selected);if(!node||ev.target.isContentEditable)return;
        const {model}=ctx(),r=model.byId.get(node.getAttribute(model.attr)),p=parentArea(node);
        if(getComputedStyle(p).transform!=='none'){api.toast('회전한 그룹 안에서는 그룹 전체를 선택해 옮겨주세요.');return;}
        ev.preventDefault();api.select(r);const g=liveGeometry(r.el),width=p.getBoundingClientRect().width;
        drag={node,r,g,width,x:ev.clientX,y:ev.clientY,style:node.getAttribute('style'),pointer:ev.pointerId,moved:false};node.setPointerCapture(ev.pointerId);
      });
      doc.addEventListener('pointermove',ev=>{
        if(!drag)return;const dx=ev.clientX-drag.x,dy=ev.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)<3&&!drag.moved)return;
        drag.moved=true;const step=ev.shiftKey?10:1,x=Math.round((drag.g.x/100*drag.width+dx)/step)*step,y=Math.round((drag.g.y+dy)/step)*step;
        drag.next={...drag.g,x:clamp(x/drag.width*100,0,100-drag.g.w),y:Math.max(0,y)};setGeometry(drag.node,drag.next);
      });
      doc.addEventListener('pointerup',()=>{if(!drag)return;const done=drag;restore();if(done.moved)patchGeometry([[done.r.el,done.next]],'도형 이동');});
      doc.addEventListener('pointercancel',restore);doc.addEventListener('lostpointercapture',()=>{if(drag)restore();});
      doc.addEventListener('keydown',ev=>{if(ev.key==='Escape')restore();});
    }
    document.addEventListener('keydown',ev=>{if(ev.key==='Escape')cancelDrag();});
    return {panel,numeric,action,insert,bind,adaptStyles,cancel:()=>cancelDrag()};
  }
  window.ArcaLayout={create,board,block,anchor,item,pick,area,isItem,geometry,setGeometry,triangle,decoration,music};
})();
