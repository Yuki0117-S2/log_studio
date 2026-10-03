/* Mirrors Arca article.js color thresholds; protection remains experimental. */
(() => {
  const GUARD='rgba(0,0,0,0.004)', PAGES=[[34,34,34,1],[0,0,0,1]];
  function color(value){
    const m=/^rgba?\((.*)\)$/i.exec(value||'');if(!m)return null;
    const parts=m[1].replace(/\s*\/\s*/,',').split(/[ ,]+/).filter(Boolean);
    if(parts.length<3)return null;
    const rgb=parts.slice(0,3).map(v=>parseFloat(v)*(v.endsWith('%')?2.55:1));
    const alpha=parts[3]===undefined?1:parseFloat(parts[3])/(parts[3].endsWith('%')?100:1);
    return [...rgb,alpha].every(Number.isFinite)?[...rgb,alpha]:null;
  }
  function contrast(a,b){
    const lum=c=>c.slice(0,3).map(x=>{x/=255;return x<=.03928?x/12.92:((x+.055)/1.055)**2.4;}).reduce((sum,x,i)=>sum+x*[.2126,.7152,.0722][i],0);
    const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
  }
  const transparent=c=>c&&c.every(x=>x===0);
  const bright=c=>c&&PAGES.some(bg=>contrast(c,bg)>6);
  const darkInk=c=>c&&PAGES.some(bg=>contrast(c,bg)<3);
  const elements=doc=>[...doc.body.querySelectorAll('*')].filter(el=>!el.hasAttribute('data-editor-empty-image'));
  function inspect(doc){
    const issues=[];
    for(const el of elements(doc)){
      const st=doc.defaultView.getComputedStyle(el),bg=color(st.backgroundColor),ink=color(st.color);
      if(!bg||!ink)continue;
      if(bright(bg))issues.push({el,message:'밝은 단색 배경이 아카 다크모드에서 사라질 수 있어요. 색상 보호(시험)로 비교해 보세요.'});
      if(el.style.color&&darkInk(ink)&&(transparent(bg)||bright(bg)))issues.push({el,message:'아카 다크모드에서 이 글자색이 바뀔 수 있어요. 색상 보호(시험)로 비교해 보세요.'});
    }
    return issues;
  }
  function protect(doc){
    let surfaces=0,colors=0;
    // Snapshot before mutation: inherited colors and currentColor are read consistently.
    const states=elements(doc).map(el=>{const st=doc.defaultView.getComputedStyle(el);return {el,bg:color(st.backgroundColor),ink:color(st.color),background:st.backgroundColor,image:st.backgroundImage};});
    for(const {el,bg,ink,background,image} of states){
      if(!bg||!ink)continue;
      if(bright(bg)){
        const gradient=`linear-gradient(${background},${background})`;
        el.style.setProperty('background-image',image==='none'?gradient:image+','+gradient,el.style.getPropertyPriority('background-image'));
        el.style.setProperty('background-color',GUARD,el.style.getPropertyPriority('background-color'));
        surfaces++;
      }else if(el.style.color&&darkInk(ink)&&transparent(bg)){
        el.style.setProperty('background-color',GUARD,el.style.getPropertyPriority('background-color'));
        colors++;
      }
    }
    return {surfaces,colors};
  }
  function simulate(doc,black=false){
    const page=PAGES[black?1:0];let backgrounds=0,colors=0;
    // Arca processes in document order, so descendants see their parent's updated color.
    for(const el of elements(doc)){
      const st=doc.defaultView.getComputedStyle(el),ink=color(st.color),bg=color(st.backgroundColor);
      if(!ink||!bg)continue;
      let candidate=transparent(bg);
      if(!candidate&&contrast(bg,page)>6){el.style.setProperty('background-color','initial');candidate=true;backgrounds++;}
      if(candidate&&contrast(ink,page)<3){el.style.removeProperty('color');colors++;}
    }
    return {backgrounds,colors};
  }
  function exportProtected(html){
    // Parse only sanitized publishing HTML, in a scriptless/networkless sandbox.
    return new Promise((resolve,reject)=>{
      const frame=document.createElement('iframe');frame.setAttribute('sandbox','allow-same-origin');frame.setAttribute('aria-hidden','true');
      frame.style.cssText='position:fixed;left:-10000px;width:900px;height:1px;visibility:hidden;';
      const timer=setTimeout(()=>{frame.remove();reject(new Error('색상 보호 계산 시간이 초과됐어요.'));},8000);
      frame.onload=()=>{try{const doc=frame.contentDocument;if(!doc?.body)throw new Error('색상 보호 계산을 열지 못했어요.');const counts=protect(doc);resolve({html:doc.body.innerHTML,...counts});}catch(error){reject(error);}finally{clearTimeout(timer);frame.remove();}};
      frame.srcdoc='<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src &#39;none&#39;; style-src &#39;unsafe-inline&#39;;"><style>body{margin:0;color:#eee;background:#222}</style></head><body>'+html+'</body></html>';
      document.body.append(frame);
    });
  }
  window.ArcaDark={inspect,protect,simulate,exportProtected,contrast,color};
})();
