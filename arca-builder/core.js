/* Source-aware editing. This file never rewrites the source during inspection. */
(() => {
  'use strict';
  const VOID = new Set('area base br col embed hr img input link meta param source track wbr'.split(' '));
  const ALLOWED = new Set('strong em u s del ins sub sup pre a img video iframe span div br hr p h1 h2 h3 h4 h5 h6 blockquote details summary ul ol li table thead tbody tfoot tr th td ruby rt time'.split(' '));
  const DROP = new Set('script style link meta base object embed template noscript input select textarea button audio source picture svg math'.split(' '));
  const BLOCK_PROP = /^(position|z-index|overflow(?:-.*)?|gap|row-gap|column-gap|grid(?:-.*)?|transform(?:-.*)?|animation(?:-.*)?|transition(?:-.*)?|opacity|filter|backdrop-filter|clip-path|mask(?:-.*)?|-webkit-.*|cursor|pointer-events|user-select|resize|writing-mode|content|mix-blend-mode|isolation|outline(?:-.*)?|flex(?:-.*)?|justify-content|align-items|align-content|place-.*)$/i;
  const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function tagEnd(source, start) {
    let quote = null;
    for (let i = start; i < source.length; i++) {
      const c = source[i];
      if (quote) { if (c === quote) quote = null; }
      else if (c === '"' || c === "'") quote = c;
      else if (c === '>') return i + 1;
    }
    return source.length;
  }
  function parse(source) {
    let attr = 'data-arca-studio-node';
    while (source.includes(attr)) attr += 'x';
    const records = [], stack = [], inserts = [], diagnostics = [];
    let i = 0;
    const closeImplicit = (tags, stopTags, at) => {
      for (let k = stack.length - 1; k >= 0; k--) {
        if (stopTags.includes(stack[k].tag)) return;
        if (tags.includes(stack[k].tag)) {
          while (stack.length > k) { const r = stack.pop(); r.closeStart = r.end = at; r.implicit = true; }
          return;
        }
      }
    };
    while (i < source.length) {
      const start = source.indexOf('<', i); if (start < 0) break;
      if (source.startsWith('<!--', start)) { const end = source.indexOf('-->', start + 4); i = end < 0 ? source.length : end + 3; continue; }
      const match = /^<\s*(\/?)\s*([a-zA-Z][\w:-]*)\b/.exec(source.slice(start));
      if (!match) { i = start + 1; continue; }
      const end = tagEnd(source, start + match[0].length), tag = match[2].toLowerCase();
      if (match[1]) {
        const k = stack.map(r => r.tag).lastIndexOf(tag);
        if (k >= 0) {
          while (stack.length - 1 > k) { const r = stack.pop(); r.closeStart = r.end = start; r.implicit = true; }
          const r = stack.pop(); r.closeStart = start; r.end = end;
        }
        i = end; continue;
      }
      if (/^(div|p|h[1-6]|table|ul|ol|blockquote|details|pre|hr)$/.test(tag)) closeImplicit(['p'], ['td','th','div','body'], start);
      if (tag === 'li') closeImplicit(['li'], ['ul','ol'], start);
      if (tag === 'tr') closeImplicit(['tr'], ['table','tbody','thead','tfoot'], start);
      if (tag === 'td' || tag === 'th') closeImplicit(['td','th'], ['tr'], start);
      const rec = { id:'n' + records.length, marker:attr, tag, start, openEnd:end, closeStart:end, end, implicit:false };
      records.push(rec);
      let point = end - 1; if (source[point - 1] === '/') point--;
      inserts.push({point, text:` ${attr}="${rec.id}"`});
      i = end;
      if (VOID.has(tag)) continue;
      if (/^(script|style|textarea|title|xmp|iframe|noembed|noframes)$/.test(tag)) {
        const re = new RegExp('</\\s*' + tag + '\\s*>','ig'); re.lastIndex = end;
        const close = re.exec(source);
        rec.closeStart = close ? close.index : source.length; rec.end = close ? re.lastIndex : source.length; i = rec.end; continue;
      }
      stack.push(rec);
    }
    while (stack.length) { const r = stack.pop(); r.closeStart = r.end = source.length; r.implicit = true; }
    let annotated = '', last = 0;
    for (const insert of inserts) { annotated += source.slice(last,insert.point) + insert.text; last = insert.point; }
    annotated += source.slice(last);
    const doc = new DOMParser().parseFromString(annotated,'text/html');
    const byId = new Map(records.map(r => [r.id,r]));
    for (const el of doc.querySelectorAll(`[${attr}]`)) {
      const rec = byId.get(el.getAttribute(attr)); if (!rec) continue;
      rec.el = el;
      const parent = el.parentElement?.closest(`[${attr}]`);
      rec.parentId = parent?.getAttribute(attr) || null;
    }
    const lines = [0]; for (let p = 0; p < source.length; p++) if (source[p] === '\n') lines.push(p+1);
    function lineAt(offset) { let lo=0,hi=lines.length; while(lo+1<hi){const mid=(lo+hi)>>1;if(lines[mid]<=offset)lo=mid;else hi=mid;}return lo+1; }
    return {source,attr,records,byId,doc,lines,lineAt,diagnostics};
  }
  function label(rec) {
    if (!rec.el) return rec.tag;
    if (rec.tag === 'img') return rec.el.getAttribute('alt') || '이미지';
    const text = rec.el.textContent.trim().replace(/\s+/g,' ');
    return text.slice(0,45) || ({hr:'구분선',br:'줄바꿈',td:'빈 셀',div:'빈 구역',iframe:'임베드',video:'동영상'}[rec.tag] || rec.tag);
  }
  function atOffset(model, offset) {
    let found = null;
    for (const r of model.records) if (r.el && r.start <= offset && offset < r.end && (!found || r.end-r.start <= found.end-found.start)) found = r;
    return found;
  }
  function patch(source, start, end, replacement) { return source.slice(0,start) + replacement + source.slice(end); }
  function openingWith(rec, attrs) {
    const el = rec.el.cloneNode(false);
    for (const key of Object.keys(attrs)) { if (attrs[key] === null || attrs[key] === '') el.removeAttribute(key); else el.setAttribute(key,attrs[key]); }
    el.removeAttribute(rec.marker);
    const html = el.outerHTML; return html.slice(0,tagEnd(html,1));
  }
  function canPlace(model, moving, target, position) {
    if (!target) return !/^(html|head|body|summary|tr|td|th|thead|tbody|tfoot|li|rt)$/.test(moving.tag);
    if (moving.start <= target.start && target.start < moving.end) return false;
    if (/^(html|head|body)$/.test(moving.tag)) return false;
    const parent = position === 'inside' ? target.el : target.el.parentElement;
    if (!parent || VOID.has(parent.localName)) return false;
    const pt = parent.localName, tag = moving.tag;
    if (pt === 'table') return /^(thead|tbody|tfoot|tr)$/.test(tag);
    if (/^(thead|tbody|tfoot)$/.test(pt)) return tag === 'tr';
    if (pt === 'tr') return tag === 'td' || tag === 'th';
    if (pt === 'ul' || pt === 'ol') return tag === 'li';
    if (/^(td|th|tr|thead|tbody|tfoot|li|summary|rt)$/.test(tag)) return tag === 'summary' && pt === 'details' && !parent.querySelector(':scope > summary') || tag === 'rt' && pt === 'ruby';
    if (/^(img|br|hr|summary|p|h[1-6]|span|strong|em|a|pre)$/.test(pt) && /^(div|p|table|ul|ol|details|h[1-6]|blockquote|pre)$/.test(tag)) return false;
    return true;
  }
  function insertionPoint(model, target, position) {
    if (!target) { const body = model.records.find(r=>r.tag==='body'); return body ? body.closeStart : model.source.length; }
    return position === 'before' ? target.start : position === 'inside' ? target.closeStart : target.end;
  }
  function move(model, moving, target, position) {
    if (!canPlace(model,moving,target,position)) throw new Error('이 위치에는 옮길 수 없어요. 표·목록 구조 또는 하위 요소를 확인해 주세요.');
    let point = insertionPoint(model,target,position);
    const chunk = model.source.slice(moving.start,moving.end);
    let source = patch(model.source,moving.start,moving.end,'');
    if (point >= moving.end) point -= moving.end-moving.start;
    source = patch(source,point,point,chunk);
    return {source,offset:point};
  }
  function imageTarget(model,record){
    if(!record?.el)return null;
    if(record.tag==='img')return record;
    if(!['td','th'].includes(record.tag))return null;
    const imgs=record.el.querySelectorAll('img');
    if(imgs.length===1)return model.byId.get(imgs[0].getAttribute(model.attr))||null;
    if(!imgs.length&&!record.el.textContent.trim()&&[...record.el.children].every(el=>el.localName==='br'))return record;
    return null;
  }
  function placeImage(model,record,attrs){
    const target=imageTarget(model,record);if(!target)throw new Error('이미지 칸이나 빈 표 셀에 놓아주세요.');
    if(target.tag==='img')return {source:patch(model.source,target.start,target.openEnd,openingWith(target,{...attrs,srcset:null})),offset:target.start};
    const html='<img '+Object.entries(attrs).filter(([,v])=>v!==null).map(([k,v])=>k+'="'+escape(v)+'"').join(' ')+' style="width:100%;height:auto;border-radius:5px;">';
    return {source:patch(model.source,target.openEnd,target.closeStart,html),offset:target.openEnd};
  }
  function swapImages(model,from,to){
    const target=imageTarget(model,to);
    if(from?.tag!=='img'||!from.el?.getAttribute('src')||!target)throw new Error('옮길 이미지와 대상 이미지 칸을 확인해 주세요.');
    if(from.id===target.id)return {source:model.source,offset:from.start};
    const keys=['src','srcset','alt','title','data-arca-publish'];
    const read=el=>Object.fromEntries(keys.map(k=>[k,el?.getAttribute(k)??null]));
    const incoming=read(from.el),outgoing=target.tag==='img'?read(target.el):{src:null,srcset:null,alt:'이미지',title:null,'data-arca-publish':null};
    const edits=[{start:from.start,end:from.openEnd,html:openingWith(from,outgoing)}];
    if(target.tag==='img')edits.push({start:target.start,end:target.openEnd,html:openingWith(target,incoming)});
    else edits.push({start:target.openEnd,end:target.closeStart,html:'<img '+Object.entries(incoming).filter(([,v])=>v!==null).map(([k,v])=>k+'="'+escape(v)+'"').join(' ')+' style="width:100%;height:auto;">'});
    let source=model.source,offset=target.tag==='img'?target.start:target.openEnd;
    for(const edit of [...edits].sort((a,b)=>b.start-a.start))source=patch(source,edit.start,edit.end,edit.html);
    for(const edit of edits)if(edit.start<offset)offset+=edit.html.length-(edit.end-edit.start);
    return {source,offset};
  }
  function clearImage(model,record){
    const target=imageTarget(model,record);if(target?.tag!=='img')throw new Error('삭제할 이미지를 선택해 주세요.');
    return {source:patch(model.source,target.start,target.openEnd,openingWith(target,{src:null,srcset:null,'data-arca-publish':null,title:null,alt:'이미지'})),offset:target.start};
  }
  function normalizeUrl(value){const v=String(value||'').trim();return v.startsWith('//')?'https:'+v:v;}
  function expiryInfo(value,now=Date.now()){
    try{const raw=new URL(normalizeUrl(value)).searchParams.get('expires');if(!raw||!/^\d+$/.test(raw))return null;const at=Number(raw)*1000;if(!Number.isFinite(at)||at>8640000000000000)return null;return {at,expired:at<=now};}catch(_){return null;}
  }
  function extractImages(input){
    const notices=[];
    let text=String(input).trim();
    const unescaped=text.replace(/\\([<>/_])/g,'$1');
    if(unescaped!==text){notices.push('복사 과정의 \\<, \\/, \\_ 이스케이프를 정리했어요.');text=unescaped;}
    if(!/<img\b/i.test(text)&&/&lt;\s*img\b/i.test(text)){const decoder=document.createElement('textarea');decoder.innerHTML=text;text=decoder.value;notices.push('텍스트로 표시된 HTML을 읽었어요.');}
    const items=[];
    const leading=/^src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(text);
    if(leading){const decoder=document.createElement('textarea');decoder.innerHTML=leading[1]??leading[2]??leading[3];items.push({raw:decoder.value,alt:''});notices.push('첫 부분의 <img가 잘려 있어 첫 src 주소도 함께 복구했어요.');}
    if(/<img\b/i.test(text)){
      const doc=new DOMParser().parseFromString(text,'text/html');
      for(const img of doc.querySelectorAll('img'))items.push({raw:img.getAttribute('src')||'',alt:img.getAttribute('alt')||''});
    }else if(!leading){for(const line of text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean)){const decoder=document.createElement('textarea');decoder.innerHTML=line;items.push({raw:decoder.value,alt:''});}}
    const images=items.map((item,i)=>{const url=normalizeUrl(item.raw);return {url,alt:item.alt||'이미지 '+(i+1),valid:!!url&&safeUrl(url,'media'),expiry:expiryInfo(url)};});
    const relative=items.filter(x=>x.raw.trim().startsWith('//')).length;
    if(relative)notices.push(`//로 시작한 주소 ${relative}개에 https:를 붙였어요. key·expires 값은 유지해요.`);
    return {images,notices};
  }
  function safeUrl(value, kind='link') {
    const v = normalizeUrl(value).replace(/[\u0000-\u0020\u007f]+/g,'');
    if (!v) return true;
    if (/^(https?:\/\/)/i.test(v)) {try{const parsed=new URL(v);return !!parsed.hostname&&!parsed.username&&!parsed.password&&!v.includes('\\');}catch(_){return false;}}
    if (kind === 'link' && /^(#|mailto:|tel:)/i.test(v)) return true;
    return false;
  }
  function analyze(model) {
    const issues = [];
    const add = (r,level,message) => issues.push({id:r?.id,offset:r?.start||0,level,message,line:model.lineAt(r?.start||0)});
    const clean = model.doc.cloneNode(true);
    const comments = clean.createTreeWalker(clean,128), remove = []; while(comments.nextNode())remove.push(comments.currentNode);
    for(const comment of remove){add(null,'error','HTML 주석은 게시용 출력에서 제거돼요.');comment.remove();}
    const normalize = {b:'strong',i:'em',strike:'s'};
    for (let el of [...clean.querySelectorAll('*')]) {
      if (!el.isConnected) continue;
      const id = el.getAttribute(model.attr), rec = model.byId.get(id);
      let tag = el.localName;
      if (!rec) continue;
      if (['html','head'].includes(tag)) continue;
      if (tag==='body') tag='div';
      if (!ALLOWED.has(tag)) {
        if (normalize[tag]) {
          add(rec,'warn',`<${tag}>를 <${normalize[tag]}>로 바꿔 출력해요.`);
          const next = clean.createElement(normalize[tag]); for(const a of [...el.attributes]) next.setAttribute(a.name,a.value);
          next.append(...el.childNodes); el.replaceWith(next); el=next;tag=next.localName;
        } else {
          add(rec,'error',`<${tag}>는 가이드의 허용 태그가 아니에요.${DROP.has(tag)?' 게시용 출력에서 제거돼요.':' 태그를 풀고 내용만 남겨요.'}`);
          if(DROP.has(tag)) el.remove(); else el.replaceWith(...el.childNodes);
          continue;
        }
      }
      if(tag==='img'&&el.getAttribute('src')?.startsWith('arca-local:')){
        const url=normalizeUrl(el.getAttribute('data-arca-publish')||'');
        if(url&&safeUrl(url,'media'))el.setAttribute('src',url);
        else {el.removeAttribute('src');add(rec,'warn','원본 이미지에 게시용 주소를 연결해 주세요.');}
      }
      el.removeAttribute('data-arca-publish');
      for(const a of [...el.attributes]) {
        const name=a.name.toLowerCase(),value=a.value;
        if(name===model.attr)continue;
        if(name.startsWith('on') || ['srcdoc','formaction','action','srcset','ping','background'].includes(name)) {add(rec,'error',`${name} 속성을 게시용 출력에서 제거해요.`);el.removeAttribute(name);}
        if(['href','src','poster'].includes(name)&&!safeUrl(value,name==='href'?'link':'media')){add(rec,'error',`${name}: 공개 HTTP(S) 주소가 필요해요. 임시 파일·data 주소와 실행 주소는 내보내지 않아요.`);el.removeAttribute(name);}
        else if(['href','src','poster'].includes(name)&&value.trim().startsWith('//'))el.setAttribute(name,normalizeUrl(value));
        else if(['src','href'].includes(name)&&/^http:/i.test(value))add(rec,'warn','외부 주소에는 HTTPS 사용을 권장해요.');
        if(name==='class') {const classes=value.split(/\s+/).filter(c=>/^fr-/.test(c));if(classes.join(' ')!==value.trim())add(rec,'warn','사용자 class 스타일은 유지되지 않을 수 있어요. 인라인 style로 지정하세요.');if(classes.length)el.className=classes.join(' ');else el.removeAttribute('class');}
      }
      if(tag==='img') {
        if(!el.getAttribute('src'))add(rec,'warn','이미지 주소가 비어 있어요.');
        if(!el.getAttribute('alt'))add(rec,'warn','이미지 대체 텍스트를 넣어주세요.');
        const expiry=expiryInfo(el.getAttribute('src')||'');
        if(expiry?.expired)add(rec,'warn','주소의 만료 시각이 지났어요. 원본 글에서 현재 이미지 주소를 다시 가져와 주세요. 실제 로딩 결과도 확인하세요.');
        else if(/[?&](expires|expire|token|signature)=/i.test(el.getAttribute('src')||''))add(rec,'warn','만료될 수 있는 이미지 주소예요. 게시 후 실제 주소를 확인하세요.');
      }
      if(tag==='iframe'||tag==='video')add(rec,'warn','임베드·동영상은 신뢰하는 HTTPS 출처와 실제 게시 결과를 확인하세요. 편집 미리보기에서는 실행하지 않아요.');
      if(tag==='a'&&el.target==='_blank')el.setAttribute('rel','noopener noreferrer');
      const style=el.style;
      for(const prop of [...style]) {
        const value=style.getPropertyValue(prop);
        // Chromium exposes authored border-spacing as two internal WebKit longhands.
        // Inspect the authored declaration rather than flagging browser internals.
        if(/^(-webkit-border-horizontal-spacing|-webkit-border-vertical-spacing)$/.test(prop)&&!new RegExp('(?:^|;)\\s*'+prop+'\\s*:','i').test(rec.el.getAttribute('style')||''))continue;
        if(BLOCK_PROP.test(prop)||(prop==='display'&&/^(flex|grid|inline-grid)$/i.test(value.trim()))||/url\s*\(|conic-gradient\s*\(/i.test(value)) {add(rec,'error',`${prop}: ${value} — 게시용 출력에서 제외돼요.`);style.removeProperty(prop);continue;}
        if(tag==='a'&&prop!=='text-decoration'){add(rec,'warn',`링크의 ${prop} 스타일을 제외해요. 모양은 링크 안쪽 span에 넣으세요.`);style.removeProperty(prop);continue;}
        if(/var\s*\(|calc\s*\(|clamp\s*\(/i.test(value))add(rec,'warn',`${prop}의 함수 값은 실제 게시 환경에서 확인이 필요해요.`);
        if(prop==='float'&&!el.closest('summary'))add(rec,'warn','float 배치는 summary 밖에서 보장되지 않아요.');
        if(tag==='td'&&prop==='min-height')add(rec,'warn','빈 이미지 셀은 min-height보다 height를 사용하세요.');
      }
      if(tag==='blockquote'&&el.hasAttribute('style')){add(rec,'warn','blockquote 스타일은 안쪽 div로 옮겨주세요. 게시용 출력에서 제외해요.');el.removeAttribute('style');}
      if(style.borderImageSource&&!/^(none|initial|inherit|unset)$/i.test(style.borderImageSource)&&style.borderRadius)add(rec,'warn','border-image와 border-radius의 조합을 확인하세요.');
      if(['table','td','th'].includes(tag)&&!style.border)add(rec,'warn','표·셀의 기본 테두리가 나타날 수 있어요. border를 직접 지정하세요.');
      if(['span','div'].includes(tag)&&!el.children.length&&el.textContent==='')add(rec,'warn','빈 장식 요소는 지워질 수 있어요. 공백(&nbsp;)을 넣어주세요.');
      if(/\{[A-Z][A-Z0-9_]*\}/.test(el.getAttribute('style')||''))add(rec,'warn','치환되지 않은 디자인 토큰이 있어요.');
      if(!el.getAttribute('style'))el.removeAttribute('style');
    }
    const body=clean.body;
    let output=body.innerHTML;
    if(body.hasAttribute('style')){const wrapper=clean.createElement('div');wrapper.setAttribute('style',body.getAttribute('style'));wrapper.innerHTML=output;output=wrapper.outerHTML;}
    return {issues,clean,html:stripMarks(output,model.attr),errors:issues.filter(x=>x.level==='error').length,warnings:issues.filter(x=>x.level==='warn').length};
  }
  function stripMarks(html,attr){return html.replace(new RegExp(' '+attr+'="[^"]*"','g'),'');}
  function captureDetails(model,doc){
    return model.records.filter(r=>r.tag==='details'&&r.el).map(r=>({start:r.start,title:r.el.querySelector(':scope > summary')?.textContent.trim()||'',authorId:r.el.getAttribute('id')||'',sourceOpen:r.el.hasAttribute('open'),open:doc.querySelector(`[${model.attr}="${r.id}"]`)?.open??r.el.hasAttribute('open')}));
  }
  function restoreDetails(previous,next,states){
    if(!previous||!states?.length)return [];
    let prefix=0;const before=previous.source,after=next.source;while(prefix<before.length&&prefix<after.length&&before[prefix]===after[prefix])prefix++;
    let oldEnd=before.length,newEnd=after.length;while(oldEnd>prefix&&newEnd>prefix&&before[oldEnd-1]===after[newEnd-1]){oldEnd--;newEnd--;}
    const shift=after.length-before.length,details=next.records.filter(r=>r.tag==='details'&&r.el),used=new Set(),restored=[];
    for(let i=0;i<details.length;i++){
      const r=details[i],title=r.el.querySelector(':scope > summary')?.textContent.trim()||'',authorId=r.el.getAttribute('id')||'';
      const available=states.filter(s=>!used.has(s));let match;
      if(authorId){const candidates=available.filter(s=>s.authorId===authorId);if(candidates.length===1)match=candidates[0];}
      if(!match&&title){const candidates=available.filter(s=>s.title===title);if(candidates.length===1&&details.filter(x=>x.el.querySelector(':scope > summary')?.textContent.trim()===title).length===1)match=candidates[0];}
      if(!match)match=available.find(s=>s.start<=prefix?s.start===r.start:s.start>=oldEnd?s.start+shift===r.start:false);
      if(!match&&states.length===details.length&&!used.has(states[i]))match=states[i];
      if(match){used.add(match);restored.push({id:r.id,open:match.sourceOpen===r.el.hasAttribute('open')?match.open:r.el.hasAttribute('open')});}
    }
    return restored;
  }
  function previewHtml(model, result, mode, dark, localImage=()=>null) {
    const doc=(mode==='final'?result.clean:model.doc).cloneNode(true);
    for(const el of [...doc.querySelectorAll('script,link,meta,base,object,embed,template,noscript')])el.remove();
    for(const el of [...doc.querySelectorAll('iframe,video,audio')]) {const div=doc.createElement('div');div.setAttribute(model.attr,el.getAttribute(model.attr)||'');div.style.cssText='padding:24px;border:1px dashed #8888CC;color:#8888CC;text-align:center';div.textContent='미디어 미리보기 · '+(el.getAttribute('src')||'주소 없음');el.replaceWith(div);}
    for(const el of doc.querySelectorAll('*')) {
      for(const a of [...el.attributes])if(a.name.startsWith('on')||['action','formaction','srcdoc','srcset','ping'].includes(a.name))el.removeAttribute(a.name);
      if(['input','button','select','textarea'].includes(el.localName))el.setAttribute('disabled','');
      if(el.hasAttribute('src')){if(!safeUrl(el.getAttribute('src'),'media'))el.removeAttribute('src');else el.setAttribute('src',normalizeUrl(el.getAttribute('src')));}
      if(el.localName==='img'){const rec=model.byId.get(el.getAttribute(model.attr));const data=localImage(rec?.el?.getAttribute('src')||'');if(typeof data==='string'&&/^data:image\/(png|jpeg|webp|gif|avif);base64,[A-Za-z0-9+/]+={0,2}$/.test(data))el.setAttribute('src',data);}
      el.removeAttribute('data-arca-publish');
      el.removeAttribute('autofocus');el.removeAttribute('contenteditable');el.removeAttribute('draggable');
      if(el.localName==='img'){
        el.setAttribute('loading','lazy');el.setAttribute('referrerpolicy','no-referrer');
        if(!el.getAttribute('src')?.trim()){
          const label=mode==='edit'?'이미지를 여기에 놓으세요':'빈 이미지 칸';
          const svg='<svg xmlns="http://www.w3.org/2000/svg" width="600" height="120" viewBox="0 0 600 120"><text x="300" y="66" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#8888CC">'+label+'</text></svg>';
          el.setAttribute('src','data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg));el.setAttribute('data-editor-empty-image','');el.setAttribute('alt',label);el.setAttribute('title',label);
        }
      }
    }
    // The iframe has no script capability, navigation capability, or network APIs.
    const csp="default-src 'none'; img-src https: http: data:; style-src 'unsafe-inline'; font-src 'none'; frame-src 'none'; media-src 'none'; connect-src 'none'; form-action 'none'; base-uri 'none'";
    const headStyles=mode==='edit'?[...doc.head.querySelectorAll('style')].map(x=>x.outerHTML).join(''):'';
    const bodyAttrs=[...doc.body.attributes].map(a=>' '+a.name+'="'+escape(a.value)+'"').join('');
    return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><style>html{min-height:100%;background:${dark?'#202027':'#fff'}}body{margin:0;padding:0;color:${dark?'#eee':'#24212d'};font-family:Arial,'Malgun Gothic',sans-serif;font-size:15px;line-height:1.7;overflow-wrap:anywhere}img{max-width:100%;height:auto}img[data-editor-empty-image]{display:inline-block;min-width:80px;min-height:70px;background:#8888CC12;border:1px dashed #8888CC;color:#686890;object-fit:contain;box-sizing:border-box}body{min-height:120px}</style>${headStyles}</head><body${bodyAttrs}>${doc.body.innerHTML}</body></html>`;
  }
  window.ArcaCore={VOID,escape,parse,label,atOffset,patch,openingWith,canPlace,insertionPoint,move,imageTarget,placeImage,swapImages,clearImage,normalizeUrl,expiryInfo,extractImages,safeUrl,analyze,captureDetails,restoreDetails,previewHtml};
})();
