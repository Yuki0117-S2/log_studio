window.PMPhoto = (() => {
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function cropRect(width,height,ratio,x=50,y=50){
    const parts=String(ratio).split('/').map(Number),r=parts[0]/parts[1];
    if(!Number.isFinite(r)||r<=0)return {sx:0,sy:0,sw:width,sh:height};
    const sw=Math.min(width,height*r),sh=sw/r;
    return {sx:(width-sw)*clamp(Number(x)||0,0,100)/100,sy:(height-sh)*clamp(Number(y)||0,0,100)/100,sw,sh};
  }
  async function png(image){
    if(!image?.src)throw new Error('먼저 사진을 넣어 주세요.');
    const img=new Image();img.crossOrigin='anonymous';
    await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('이미지를 읽는 시간이 길어지고 있어요. 파일로 넣어 다시 시도해 주세요.')),15000);img.onload=()=>{clearTimeout(timer);resolve();};img.onerror=()=>{clearTimeout(timer);reject(new Error('이 주소는 사진 저장을 허용하지 않아요. 이미지 파일을 넣어 주세요.'));};img.src=image.src;});
    const {sx,sy,sw,sh}=cropRect(img.naturalWidth,img.naturalHeight,image.ratio,image.x,image.y);
    const scale=Math.min(1,4096/Math.max(sw,sh)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(sw*scale));canvas.height=Math.max(1,Math.round(sh*scale));
    canvas.getContext('2d').drawImage(img,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
    return new Promise((resolve,reject)=>{try{canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('사진을 저장하지 못했어요.')),'image/png');}catch{reject(new Error('이 주소는 사진 저장을 허용하지 않아요. 이미지 파일을 넣어 주세요.'));}});
  }
  const dataURL=blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});
  const fontFiles=new Map();
  async function cardFonts(node){
    const doc=node.ownerDocument,view=doc.defaultView,used=new Map(),family=s=>s.replace(/["']/g,'').trim().toLowerCase();
    for(const n of [node,...node.querySelectorAll('*')]){const s=view.getComputedStyle(n),name=family(s.fontFamily.split(',')[0]);if(!used.has(name))used.set(name,new Set());used.get(name).add(Number(s.fontWeight)||400);}
    const faces=[];
    for(const sheet of [...doc.styleSheets]){
      let rules;
      try{rules=[...sheet.cssRules];}catch{if(!sheet.href)continue;const response=await fetch(sheet.href);if(!response.ok)throw new Error('글꼴을 불러오지 못했어요. 잠시 후 다시 저장해 주세요.');const parsed=new CSSStyleSheet();parsed.replaceSync(await response.text());rules=[...parsed.cssRules];}
      for(const rule of rules){if(rule.type!==5)continue;const s=rule.style,weights=used.get(family(s.getPropertyValue('font-family')));if(!weights)continue;
        const range=s.getPropertyValue('font-weight').match(/\d+/g)?.map(Number)||[400];if(![...weights].some(w=>w>=range[0]&&w<=range.at(-1)))continue;
        const urls=[...s.getPropertyValue('src').matchAll(/url\(["']?([^"')]+)["']?\)\s*(?:format\(["']?([^"')]+)["']?\))?/g)],source=urls.find(m=>m[2]==='woff2')||urls[0];if(!source)continue;
        const url=new URL(source[1],sheet.href||doc.baseURI).href;
        if(!fontFiles.has(url))fontFiles.set(url,fetch(url).then(r=>{if(!r.ok)throw new Error('글꼴 파일을 읽지 못했어요.');return r.blob();}).then(dataURL).catch(error=>{fontFiles.delete(url);throw error;}));
        faces.push({css:rule.cssText,src:s.getPropertyValue('src'),file:fontFiles.get(url)});
      }
    }
    return (await Promise.all(faces.map(async face=>face.css.replace(face.src,'url("'+await face.file+'")')))).join('\n');
  }
  // Capture the rendered frame so its text, crop, decorations and font match the preview.
  async function cardPNG(log,imageId='main',sceneId=''){
    if(!window.htmlToImage)throw new Error('이미지 저장 도구를 불러오지 못했어요. 새로고침 후 다시 시도해 주세요.');
    const frame=document.createElement('iframe');frame.setAttribute('aria-hidden','true');frame.setAttribute('sandbox','allow-same-origin');
    frame.style.cssText='position:fixed;left:-10000px;top:0;width:640px;height:1200px;border:0;pointer-events:none';
    const timeout=(promise,message)=>{let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(message)),20000);})]).finally(()=>clearTimeout(timer));};
    try{
      const loaded=new Promise(resolve=>frame.onload=resolve);
      frame.srcdoc=window.PM.documentHTML(window.PM.render(log));document.body.append(frame);
      await timeout(loaded,'체키를 준비하는 시간이 길어지고 있어요. 다시 시도해 주세요.');
      const doc=frame.contentDocument,card=[...doc.querySelectorAll('[data-pm-card]')].find(n=>n.dataset.pmCard===imageId&&(!sceneId||n.closest('[data-pm-unit]')?.dataset.pmUnit===sceneId));
      if(!card)throw new Error('저장할 사진을 먼저 넣어 주세요.');
      // A saved cheki is a straight physical print. Only the export copy changes.
      const cleanPrint=log.preset.kind==='cheki';
      if(cleanPrint){card.style.transform='none';card.style.boxShadow='none';card.querySelectorAll('i').forEach(n=>n.remove());}
      await timeout(doc.fonts.ready,'글꼴을 불러오지 못했어요. 다시 시도해 주세요.');
      for(const img of card.querySelectorAll('img')){
        try{
          const response=await timeout(fetch(img.src,{mode:'cors'}),'사진을 불러오는 시간이 길어지고 있어요.');
          if(!response.ok)throw new Error('image response');
          const blob=await response.blob();
          img.src=await dataURL(blob);
          await timeout(img.decode(),'사진을 읽지 못했어요.');
        }catch{throw new Error('이 주소의 사진은 저장할 수 없어요. 이미지 파일을 넣어 다시 저장해 주세요.');}
      }
      const computed=frame.contentWindow.getComputedStyle(card),width=card.offsetWidth,height=card.offsetHeight;
      const stage=doc.createElement('div');
      const padding=cleanPrint?0:40,outputWidth=width+padding*2,outputHeight=height+padding*2;
      stage.style.cssText='position:relative;display:block;box-sizing:border-box;padding:'+padding+'px;background:transparent;width:'+outputWidth+'px;height:'+outputHeight+'px';
      for(const key of ['fontFamily','fontSize','fontWeight','lineHeight','color','letterSpacing','textAlign'])stage.style[key]=computed[key];
      card.style.width=width+'px';card.style.maxWidth='none';card.style.margin='0';
      stage.append(card);doc.body.replaceChildren(stage);
      const fontEmbedCSS=await timeout(cardFonts(stage),'글꼴을 준비하는 시간이 길어지고 있어요. 다시 시도해 주세요.');
      const blob=await timeout(window.htmlToImage.toBlob(stage,{width:outputWidth,height:outputHeight,pixelRatio:2,fontEmbedCSS,cacheBust:false}),'이미지 저장 시간이 길어지고 있어요. 다시 시도해 주세요.');
      if(!blob)throw new Error('체키 이미지를 저장하지 못했어요.');return blob;
    }finally{frame.remove();}
  }
  return {cropRect,png,cardPNG};
})();
