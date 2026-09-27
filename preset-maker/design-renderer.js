/* The supplied HTML is the template, not a thumbnail for a different renderer.
 * Paths refer to element children in the unmodified reference-designs.js source.
 * Every log embeds its compiled template so later catalog updates are isolated. */
window.PMDesign = (() => {
  const configs = [
    {kind:'book',title:'0.1.1',subtitle:'0.1.3',body:['0.6','0.7','0.8','0.9','0.10','0.11','0.12'],narration:'0.8',speech:'0.7',thought:'0.10',remove:['0.14'],image:'0.4',hideWithImage:['0.5'],accent:'#a8793f'},
    {kind:'vn',title:'0.0.0.1',subtitle:null,body:['0.3.0','0.3.1','0.3.2','0.3.3'],narration:'0.3.0',speech:'0.3.3',speechName:'0',speechText:'1',userSpeech:'0.3.2',thought:'0.3.1',thoughtText:'@text',remove:['0.3.5'],image:'0.2',imageLabel:'0.2.0',overlay:true,accent:'#e98bb9',affinity:'0.0.1.0'},
    {kind:'sns',title:'0.0.0',subtitle:'0.0.1',body:['0.2','0.3','0.4','0.5'],narration:'0.2',speech:'0.3',speechName:'1.0.0',speechText:'1.1',speechRemove:['1.2'],thought:'0.5',thoughtText:'1',remove:['0.0.2','0.6'],image:'0.3.1.2',accent:'#1d9bf0'},
    {kind:'news',title:'0.2',subtitle:'0.3',body:['0.5.1.0','0.5.1.1','0.5.1.2','0.5.1.3'],narration:'0.5.1.0',speech:'0.5.1.1',speechName:'0',speechText:'@text',thought:'0.5.1.3',thoughtText:'@text',image:'0.5.0.0',hideWithImage:['0.5.0'],accent:'#1f1b14'},
    {kind:'contact',title:'0.1',subtitle:'0.2',body:['0.6','0.7'],narration:'0.6',speech:'0.7',speechText:'@text',speechRemove:['1','0'],thought:'0.7.1',remove:['0.8.0'],image:'0.5',accent:'#c7a24a'},
    {kind:'case',title:'0.1.0.2',subtitle:'0.1.0.3',body:['0.1.0.7','0.1.0.8','0.1.0.9'],narration:'0.1.0.7',speech:'0.1.0.8.0',speechName:'0',speechText:'1',userSpeech:'0.1.0.8.1',thought:'0.1.0.9',image:'0.1.0.6.1',hideWithImage:['0.1.0.6'],surface:'0.1.0',accent:'#b3261e'},
    {kind:'quest',title:'0.1',subtitle:'0.2',body:['0.6','0.7','0.8','0.9'],narration:'0.6',speech:'0.7',speechName:'1.0',speechText:'1.1',userSpeech:'0.8',thought:'0.9',remove:['0.10'],image:'0.5',accent:'#d9b45a'},
    {kind:'broadcast',title:'0.0.0',subtitle:null,body:['0.2.1','0.2.2','0.2.3','0.2.4','0.2.5'],narration:'0.2.1',speech:'0.2.2',speechName:'0',speechText:'1',userSpeech:'0.2.3',thought:'0.2.4',thoughtText:'0',image:'0.1',imageLabel:'0.1.0',overlay:true,accent:'#ffd23f'},
    {kind:'terminal',title:'0.1',subtitle:'0.2',body:['0.7.0','0.7.1','0.7.2','0.7.3','0.7.4','0.7.5'],narration:'0.7.0',narrationText:'@text',speech:'0.7.2',speechName:'0',speechText:'@text',userSpeech:'0.7.3',thought:'0.7.4',remove:['0.5'],image:'0.6.1',hideWithImage:['0.6'],accent:'#7dff9a'},
    {kind:'script',title:'0.0.0.1',subtitle:'0.0.0.2',body:['0.3.1','0.3.3','0.3.4','0.3.5','0.3.6','0.3.7','0.3.8','0.3.9','0.3.10','0.3.11','0.3.12','0.3.13'],narration:'0.3.1',speech:'0.3.5',separateName:'0.3.3',thought:'0.3.9',remove:['0.2'],image:'0.3.2',surface:'0.3',accent:'#7a1420'},
    {kind:'diary',title:'0.1.1',subtitle:'0.1.2',body:['0.1.5','0.1.6','0.1.7'],narration:'0.1.5',speech:'0.1.7',speechText:'0',image:'0.1.4.1.0',hideWithImage:['0.1.4'],surface:'0.1',accent:'#9bb7d4'},
    {kind:'museum',title:'0.1.1.0',subtitle:'0.1.1.1',body:['0.4.0','0.4.1'],narration:'0.4.0',speech:'0.6',speechName:'2',speechText:'1',image:'0.2',accent:'#b0302a'},
    {kind:'photocard',title:'0.0.2.0',subtitle:'0.0.2.2.0',body:['0.1.4'],narration:'0.1.4',speech:'0.1.4',image:'0.0',imageLabel:'0.0.0',overlay:true,remove:['1'],surface:'0.1',accent:'#e8e9ec',paper:'#12141a'},
    {kind:'polaroid',title:'0.0.1',subtitle:'0.0.2',body:['0.1.1.1'],narration:'0.1.1.1',speech:'0.1.0.2',remove:['0.3','0.4.0'],image:'0.1.0.1',hideWithImage:['0.1.0'],accent:'#8a8175'},
    {kind:'cheki',title:'0.1.1',subtitle:'0.1.0',body:['0.1.2','0.1.3'],narration:'0.1.2',speech:'0.0.2.0',thought:'0.1.3',image:'0.0.1',imageLabel:'@text',hideWithImage:['0.0'],overlay:true,remove:['0.2'],accent:'#c2417e',frame:'0.0',tape:'0.0.0',stickers:['0.0.1.0','0.0.1.1']}
  ];
  const byPath=(root,path)=>path===''?root:String(path).split('.').reduce((n,i)=>n?.children[Number(i)],root);
  const esc=value=>window.PM.esc(value);
  const textOf=n=>n?.textContent.trim()||'';
  const ownText=n=>[...n.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
  const cache=new Map();
  const hex=value=>value?.startsWith('rgb(')?'#'+value.match(/\d+/g).slice(0,3).map(n=>Number(n).toString(16).padStart(2,'0')).join(''):value;
  function compile(index){
    if(cache.has(index))return cache.get(index);
    const config=configs[index],source=window.REFERENCE_DESIGNS[index].html;
    const doc=new DOMParser().parseFromString(source,'text/html'),map={};
    function annotate(root,path){map[path]=root;root.dataset.pmRef=path;[...root.children].forEach((n,i)=>annotate(n,path+'.'+i));}
    [...doc.body.children].forEach((n,i)=>annotate(n,String(i)));
    const bodyNodes=config.body.map(p=>map[p]);
    for(const p of [...config.body,config.title,config.narration,config.speech,config.image,...(config.remove||[])].filter(Boolean))if(!map[p])throw new Error(config.kind+' 디자인 연결 오류: '+p);
    const hidden=(config.remove||[]).map(p=>map[p]);
    const fields=[],images=[];
    const surface=map[config.surface||'0'];
    let counter=0;
    const known={};known[config.title]='로그 제목';if(config.subtitle)known[config.subtitle]='부제';
    for(const [path,node] of Object.entries(map)){
      if(hidden.some(n=>n===node||n.contains(node)))continue;
      const isImage=path===config.image||(node.style.aspectRatio&&node.style.backgroundImage.includes('gradient'))||(['CHAR','USER','초상'].includes(textOf(node))&&node.style.width);
      if(isImage){const main=path===config.image;images.push({id:main?'main':'photo'+images.length,path,label:main?'대표 이미지':textOf(node).slice(0,30)||'프로필 사진',ratio:node.style.aspectRatio||'1/1',overlay:main&&config.overlay,hide:main?(config.hideWithImage||[]):[],labelPath:main?config.imageLabel:null});}
      if(path===config.title||path===config.subtitle||path===config.imageLabel||bodyNodes.some(n=>n===node||n.contains(node)))continue;
      [...node.childNodes].forEach((text,index)=>{
        if(text.nodeType!==3||!text.textContent.trim()||isImage)return;
        const value=text.textContent.trim();if(['▼','♡','▶','▷','▸','CHAR','USER','초상'].includes(value))return;
        const id='d'+counter++;fields.push({key:id,path,textIndex:index,label:value.length>23?value.slice(0,23)+'…':value,type:'text',default:text.textContent,group:'문구'});
      });
    }
    // Explicit numeric/options control decorative UI without inventing game state.
    if(config.affinity)fields.push({key:'affinity',label:'호감도 (%)',type:'range',default:60,control:'affinity'});
    if(config.frame){fields.push({key:'frame',label:'프레임 색',type:'color',default:'#ffffff',control:'frame'},{key:'tape',label:'테이프 표시',type:'checkbox',default:true,control:'tape'},{key:'sticker',label:'스티커 표시',type:'checkbox',default:true,control:'sticker'},{key:'tilt',label:'기울기',type:'select',default:'-2',options:['-4','-2','0','2','4'],control:'tilt'});}
    const title=textOf(map[config.title]),subtitle=textOf(map[config.subtitle]);
    const quote=value=>/^["“「『]/.test(value)?value:'"'+value+'"';
    function manuscript(node){
      if(node===map[config.speech]||node===map[config.userSpeech]){
        const spoken=config.speechText==='@text'?ownText(node):config.speechText?textOf(byPath(node,config.speechText)):textOf(node);
        const speaker=config.speechName?textOf(byPath(node,config.speechName)).replace(/^[<〈]|[>〉]$/g,''):config.separateName?textOf(map[config.separateName]):'';
        return (speaker?'<<'+speaker+'>> ':'')+quote(spoken);
      }
      if(node.contains(map[config.speech])||config.userSpeech&&node.contains(map[config.userSpeech]))return [...node.children].map(manuscript).join('\n\n');
      const raw=textOf(node),terminal=raw.match(/^<([^>]+)>\s*(.+)$/);
      return terminal?'<<'+terminal[1]+'>> '+quote(terminal[2]):raw;
    }
    const body=bodyNodes.map(manuscript).join('\n\n');
    const result={version:1,config,html:doc.body.innerHTML,fields,images,title,subtitle,body,
      style:{paper:config.paper||surface.style.backgroundColor||doc.body.firstElementChild.style.backgroundColor||'#ffffff',ink:surface.style.color||'#222222',accent:config.accent,font:surface.style.fontFamily||'Pretendard,sans-serif',size:parseFloat(map[config.narration].style.fontSize)||15,line:parseFloat(map[config.narration].style.lineHeight)||1.8,padding:parseFloat(surface.style.padding)||0},
      templates:Object.fromEntries(['narration','speech','thought','userSpeech','separateName'].filter(k=>config[k]).map(k=>[k,map[config[k]].outerHTML]))};
    result.style.paper=hex(result.style.paper);result.style.ink=hex(result.style.ink);
    window.PMEditors?.prepare(result);cache.set(index,result);return result;
  }
  function enrich(preset,index){const design=compile(index);return {...preset,version:design.editor?4:3,design:JSON.parse(JSON.stringify(design)),special:design.fields.map(f=>({...f})),font:design.style.font,paper:design.style.paper,ink:design.style.ink,accent:design.style.accent};}
  function initialize(log){const d=log.preset.design;if(!d)return log;if(d.editor){log.primarySceneId=log.scenes[0].id;log.scenes[0].subtitle=d.subtitle;}log.title=d.title;log.subtitle=d.subtitle;log.scenes[0].title=d.title;log.scenes[0].body=d.body;log.style={...log.style,...d.style,...(log.preset.savedStyle||{})};log.image.ratio=d.images.find(i=>i.id==='main')?.ratio||'auto';log.designImages={};d.images.filter(i=>i.id!=='main').forEach(i=>log.designImages[i.id]={src:'',width:100,ratio:i.ratio,x:50,y:50});return log;}
  function setOwn(node,html){const texts=[...node.childNodes].filter(n=>n.nodeType===3);const first=texts[0];texts.slice(1).forEach(n=>n.remove());const span=node.ownerDocument.createElement('span');span.innerHTML=' '+html;if(first)first.replaceWith(span);else node.append(span);}
  function plainInline(text,accent){const d=new DOMParser().parseFromString(window.PMSyntax.inline(text,accent,false),'text/html');d.querySelectorAll('span').forEach(n=>{if(n.style.background||n.style.backgroundColor)n.replaceWith(...n.childNodes);});return d.body.innerHTML;}
  function styledBody(scene,design,accent){
    const cfg=design.config,parsed=new DOMParser().parseFromString(window.PMSyntax.parseBody(scene.body,'book',accent,scene.id,{themeOnly:true}),'text/html');
    const lines=scene.body.replace(/\r\n?/g,'\n').split('\n');
    const prototypes=Object.fromEntries(Object.entries(design.templates).map(([key,html])=>[key,new DOMParser().parseFromString(html,'text/html').body.firstElementChild]));
    const make=key=>(prototypes[key]||prototypes.narration)?.cloneNode(true);
    for(const generated of [...parsed.body.querySelectorAll('[data-line]')]){
      const line=(lines[Number(generated.dataset.line)]||'').replace(/^(?:(?:\{#[\da-f]{3,6}\}|\[C\]|\[\|\]|\[<\]|\[>\])\s*){1,3}/i,'');
      if(!line.trim()||!['P','DIV'].includes(generated.tagName)||/^\[(HR[23]?|GAP|IMG|접기)/.test(line.trim()))continue;
      const speech=window.PMSyntax.speechLine(line.trim()),thought=/^['‘]/.test(line.trim());
      const user=speech&&['나','유저','USER'].includes(speech.name);
      const key=speech?(user&&design.templates.userSpeech?'userSpeech':'speech'):thought&&design.templates.thought?'thought':'narration';
      const n=make(key);if(!n)continue;
      let targetPath=speech?(key==='userSpeech'?cfg.userSpeechText||cfg.speechText:cfg.speechText):thought?cfg.thoughtText:cfg.narrationText;
      const name=speech?.name||'';
      const namePath=key==='userSpeech'?cfg.userSpeechName||cfg.speechName:cfg.speechName;const label=namePath&&speech?byPath(n,namePath):null;
      const content=speech?speech.speech:cfg.kind==='terminal'&&key==='narration'?line.replace(/^\[SYS\]\s*/,''):line;
      const html=plainInline(content,accent);
      const removals=key==='userSpeech'?cfg.userSpeechRemove:cfg.kind!=='sns'?cfg.speechRemove:null;
      if(speech&&removals)removals.map(p=>byPath(n,p)).filter(Boolean).forEach(n=>n.remove());
      if(targetPath==='@text')setOwn(n,html);else if(targetPath){const target=byPath(n,targetPath);if(target)target.innerHTML=html;}else n.innerHTML=html;
      if(label){const prefix=key==='userSpeech'?cfg.userSpeechPrefix:cfg.speechPrefix;label.textContent=prefix?prefix+name:cfg.kind==='terminal'&&name?'<'+name+'>':name;if(!name&&!prefix)label.style.display='none';}
      if(speech&&cfg.separateName&&name){const label=make('separateName');label.textContent=name;n.prepend(label);}
      if(generated.style.textAlign)n.style.textAlign=generated.style.textAlign;
      if(/^\{#[\da-f]+\}/i.test(line))n.style.color=generated.style.color;
      n.dataset.pmFocus='body';n.dataset.scene=scene.id;n.dataset.line=generated.dataset.line;
      n.querySelectorAll('[data-pm-ref]').forEach(n=>{if(!design.images.some(i=>i.path===n.dataset.pmRef))n.removeAttribute('data-pm-ref');});n.removeAttribute('data-pm-ref');
      generated.replaceWith(n);
    }
    return parsed.body.innerHTML;
  }
  function render(log,{placeholders=false,single=false}={}){
    if(log.preset.design.editor?.repeat&&!single){
      const visible=log.scenes.filter(s=>!s.hidden);return visible.map((scene,unitIndex)=>{
        const data=window.PMEditors.sceneData(log,scene),copy={...log,...data,scenes:[scene],title:log.scenes.length>1&&!log.preset.design.editor.sharedTitle?scene.title:log.title,subtitle:scene.id===log.primarySceneId?log.subtitle:scene.subtitle??log.subtitle,_sceneTitle:log.scenes.length>1&&!log.preset.design.editor.sharedTitle?scene.id:'',_unitIndex:unitIndex,_unitCount:visible.length};
        const html=render(copy,{placeholders,single:true});
        return '<section data-pm-unit="'+esc(scene.id)+'" style="margin-bottom:24px">'+html+'</section>';
      }).join('');
    }
    const d=log.preset.design,c=d.config,doc=new DOMParser().parseFromString(d.html,'text/html');
    const nodes=Object.fromEntries([...doc.querySelectorAll('[data-pm-ref]')].map(n=>[n.dataset.pmRef,n]));
    const title=nodes[c.title],subtitle=nodes[c.subtitle];title.textContent=log.title;title.dataset.pmFocus=log._sceneTitle?'scene-title':'title';if(log._sceneTitle)title.dataset.scene=log._sceneTitle;if(subtitle){subtitle.textContent=log.subtitle;subtitle.dataset.pmFocus='subtitle';}
    for(const f of d.fields){if(f.attribute||f.control)continue;const value=log.values[f.key]??f.default,n=nodes[f.path];if(n){const text=n.childNodes[f.textIndex];if(text?.nodeType===3)text.textContent=String(value);n.dataset.pmFocus='value';n.dataset.field=f.key;}}
    if(c.affinity){[...nodes[c.affinity].children].forEach((n,i)=>n.style.background=i<Math.round((Number(log.values.affinity)||0)/20)?'#e98bb9':'#f2dcea');}
    if(c.frame){const n=nodes[c.frame];n.style.backgroundColor=log.values.frame||'#ffffff';n.style.transform='rotate('+(Number(log.values.tilt)||0)+'deg)';if(log.values.tape===false)nodes[c.tape]?.remove();if(log.values.sticker===false)c.stickers.forEach(p=>nodes[p]?.remove());}
    (c.remove||[]).forEach(p=>nodes[p]?.remove());
    // Save the styled original scene for unchanged source; replace its content only on edit.
    const bodyDesign=d.editor?{...d,templates:Object.fromEntries(Object.keys(d.templates).map(key=>[key,nodes[c[key]]?.outerHTML||d.templates[key]]))}:d;
    const scenes=log.scenes.filter(s=>!s.hidden),originalNodes=c.body.map(p=>nodes[p]).filter(Boolean);
    if(scenes.length===1&&scenes[0].body===d.body){let line=0;originalNodes.forEach(n=>{n.dataset.pmFocus='body';n.dataset.scene=scenes[0].id;n.dataset.line=String(line);line+=textOf(n).split('\n').length+1;});}
    else if(originalNodes.length){const slot=doc.createElement('div');slot.style.minWidth='0';originalNodes[0].before(slot);originalNodes.forEach(n=>n.remove());for(const scene of scenes){const block=doc.createElement('section');if(scenes.length>1){const h=doc.createElement('h3');h.textContent=scene.title;h.style.cssText='font-size:15px;margin:20px 0 12px;color:'+d.style.accent;h.dataset.pmFocus='scene-title';h.dataset.scene=scene.id;block.append(h);}const content=doc.createElement('div');content.innerHTML=styledBody(scene,bodyDesign,log.style.accent);if(scene.style){content.style.fontSize=scene.style.size+'px';content.style.color=scene.style.ink;}block.append(content);slot.append(block);}}
    for(const image of d.images){const candidates=[...doc.querySelectorAll('[data-pm-ref]')].filter(n=>n.dataset.pmRef===image.path);const duplicates=candidates.slice(1);if(image.id==='main')duplicates.forEach(n=>n.remove());let n=candidates[0];const value=image.id==='main'?log.image:log.designImages?.[image.id],src=window.PM.url(value?.src,true);if(!n?.isConnected&&src&&scenes.length&&nodes[image.path]){n=nodes[image.path].cloneNode(true);const target=doc.querySelector('[data-pm-focus="body"]');if(target)target.before(n);else nodes[c.surface||'0'].append(n);}if(!n?.isConnected)continue;n.dataset.pmFocus='image';n.dataset.field=image.id;
      if(!src&&placeholders)continue;
      if(image.labelPath&&image.labelPath!=='@text')nodes[image.labelPath]?.remove();
      if(!src){duplicates.forEach(n=>n.remove());if(image.hide.length){image.hide.forEach(p=>nodes[p]?.remove());n.remove();}else if(image.overlay){n.style.backgroundImage='none';n.style.aspectRatio='auto';n.style.minHeight='0';[...n.children].forEach(child=>{if(child.style.position==='absolute')child.style.position='relative';});}else n.remove();continue;}
      if(['cheki','polaroid'].includes(c.kind))n.parentElement.dataset.pmCard=image.id;
      n.style.position='relative';n.style.overflow='hidden';n.style.backgroundImage='none';
      if(Number(value.width)!==100)n.style.width=Math.max(10,Math.min(100,Number(value.width)||100))+'%';
      n.style.aspectRatio=value.ratio==='auto'?image.ratio:value.ratio;
      if(!image.overlay)n.replaceChildren();else [...n.childNodes].filter(x=>x.nodeType===3).forEach(x=>x.remove());
      const img=doc.createElement('img');img.src=src;img.alt=image.label;img.style.cssText='position:absolute;inset:0;display:block;width:100%;height:100%;object-fit:cover;object-position:'+Number(value.x)+'% '+Number(value.y)+'%';
      n.prepend(img);if(image.overlay)[...n.children].filter(x=>x!==img).forEach(x=>{if(!x.style.position)x.style.position='relative';x.style.zIndex='1';});if(image.id!=='main')duplicates.forEach(extra=>extra.replaceWith(n.cloneNode(true)));
    }
    if(!placeholders)for(const n of doc.body.querySelectorAll('[style]')){if(n.style.display==='grid'&&n.children.length===1)n.style.gridTemplateColumns='minmax(0,1fr)';}
    const overrides=log.styleOverrides||{},surface=nodes[c.surface||'0'];
    if(overrides.paper&&surface)surface.style.backgroundColor=log.style.paper;
    if(overrides.padding&&surface)surface.style.padding=log.style.padding+'px';
    for(const n of doc.body.querySelectorAll('*')){
      if(overrides.font)n.style.fontFamily=log.style.font;
      if(overrides.ink&&n.closest('[data-pm-focus="body"]'))n.style.color=log.style.ink;
      if(overrides.size&&n.closest('[data-pm-focus="body"]'))n.style.fontSize=log.style.size+'px';
      if(overrides.line&&n.closest('[data-pm-focus="body"]'))n.style.lineHeight=log.style.line;
      if(overrides.accent){const css=n.getAttribute('style'),rgb='rgb('+c.accent.slice(1).match(/../g).map(x=>parseInt(x,16)).join(', ')+')';if(css)n.setAttribute('style',css.replace(new RegExp(c.accent,'gi'),log.style.accent).split(rgb).join(log.style.accent));}
      const sceneStyle=scenes.find(s=>s.id===n.closest('[data-pm-focus="body"]')?.dataset.scene)?.style;
      if(sceneStyle){n.style.fontSize=sceneStyle.size+'px';n.style.color=sceneStyle.ink;}
    }
    if(log.note){const p=doc.createElement('p');p.textContent=log.note;p.dataset.pmFocus='note';p.style.cssText='font-size:12px;margin:18px 0 0';surface?.append(p);}
    if(log.link&&window.PM.url(log.link)){const a=doc.createElement('a');a.href=window.PM.url(log.link);a.textContent='참고 링크 ↗';a.style.color=log.style.accent;surface?.append(a);}
    window.PMEditors?.finalize(doc,log,nodes);
    return '<div style="font-family:Pretendard,sans-serif;overflow-wrap:anywhere">'+doc.body.innerHTML+'</div>';
  }
  return {configs,compile,enrich,initialize,render};
})();
