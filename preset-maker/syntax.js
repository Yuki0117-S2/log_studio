/* Input compatibility: log_studio@7e13a41, mosaic-log and modified log-diary.
 * Rendering never rewrites the stored manuscript. Unknown syntax stays literal. */
window.PMSyntax = (() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const quote = '"(?:\\\\[^\\r\\n]|[^"\\\\\\r\\n])*"|“[^”\\r\\n]*”|「[^」\\r\\n]*」|『[^』\\r\\n]*』';
  const color = value => /^#[\da-f]{6}$/i.test(value) || /^#[\da-f]{3}$/i.test(value) ? value : '#8888CC';
  function basic(text, accent, depth=0) {
    if(depth>12)return esc(text);
    // Match source tokens once; generated HTML is never fed back into the parser.
    const tokens = /\\[\\*`\[\]<>]|`+[^`\n]*`+|!?\[[^\]\n]*\]\([^\)\n]*\)|\[FN:([^\]]+)\]([^\[]*)\[\/FN\]|\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|\*([^*]+)\*|"(?:\\.|[^"\\])*"|“[^”]*”|「[^」]*」|『[^』]*』|'[^'\n]+'|‘[^’]*’/g;
    let result='',end=0;
    for(const m of text.matchAll(tokens)){
      result+=esc(text.slice(end,m.index));const token=m[0];end=m.index+token.length;
      if(token.startsWith('\\'))result+=esc(token.slice(1));
      else if(token.startsWith('`'))result+='<code>'+esc(token)+'</code>';
      else if(/^!?\[.*\]\(/.test(token))result+=esc(token);
      else if(m[1]!==undefined)result+=basic(m[1],accent,depth+1)+`<sup style="color:${accent}" title="${esc(m[2].trim())}">※</sup><small style="color:${accent}"> (${esc(m[2].trim())})</small>`;
      else if(m[3]!==undefined)result+=`<strong><em style="color:${accent}">${esc(m[3])}</em></strong>`;
      else if(m[4]!==undefined)result+='<strong>'+esc(m[4])+'</strong>';
      else if(m[5]!==undefined)result+=`<em style="color:${accent}">${esc(m[5])}</em>`;
      else if(m.index>0&&/\d/.test(text[m.index-1]))result+=esc(token); // feet/inches
      else if(/^[‘']/.test(token))result+=`<span style="color:${accent}">${esc(token)}</span>`;
      else result+=`<span style="background:${accent.length===7?accent+'18':'#8888CC18'};border-radius:4px;padding:1px 3px">${basic(token.slice(1,-1),accent,depth+1).replace(/^/,esc(token[0]))}${esc(token.at(-1))}</span>`;
    }
    return result+esc(text.slice(end));
  }
  function inline(text,accent='#8888CC',speakerColors=true){
    accent=color(accent);
    const render=s=>basic(s,accent);
    if(!speakerColors)return render(globalThis.LogSpeakerColors?.replaceAngles(String(text),(name,gap,speech)=>name+gap+speech)||String(text));
    return globalThis.LogSpeakerColors?.format(String(text),render,render)||render(String(text));
  }
  function speechLine(text){
    const shared=globalThis.LogSpeakerColors?.parseLine(text);
    if(shared)return {name:shared.name||(shared.role==='char'?'캐릭터':'유저'),speech:shared.speech};
    const m=new RegExp('^(?:\\*\\*([^*]{1,80})\\*\\*|\\[([^\\]\\n]{1,24})\\])\\s*[:：]?\\s*('+quote+')$').exec(text);
    if(m)return {name:m[1]||m[2],speech:m[3]};
    return new RegExp('^(?:'+quote+')$').test(text)?{name:'',speech:text}:null;
  }
  function parseBody(text,kind='book',accent='#8888CC',sceneId='',options={}){
    accent=color(accent);let folds=0,fence=null;
    const lines=String(text||'').replace(/\r\n?/g,'\n').split('\n');
    const out=lines.map((source,i)=>{
      const ref=`data-pm-focus="body" data-scene="${esc(sceneId)}" data-line="${i}"`;
      const fenceMatch=source.match(/^\s*(`{3,}|~{3,})/);
      if(fence||fenceMatch){if(!fence)fence=fenceMatch[1];else if(fenceMatch&&fenceMatch[1][0]===fence[0]&&fenceMatch[1].length>=fence.length)fence=null;return `<pre ${ref} style="white-space:pre-wrap;margin:0">${esc(source)||' '}</pre>`;}
      let line=source.trim(),align='',ink=accent;
      for(let n=0;n<3;n++){
        const c=line.match(/^\{(#[\da-f]{3}(?:[\da-f]{3})?)\}\s*/i);
        const a=line.match(/^(\[C\]|\[\|\]|\[<\]|\[>\])\s*/);
        if(c){ink=c[1];line=line.slice(c[0].length);}else if(a){align={'[C]':'center','[|]':'center','[<]':'left','[>]':'right'}[a[1]];line=line.slice(a[0].length);}else break;
      }
      const style=`${align?'text-align:'+align+';':''}${ink!==accent?'color:'+ink+';':''}`;
      const fmt=s=>inline(s,ink,!options.themeOnly);
      if(!line)return `<div ${ref} style="height:.7em"></div>`;
      if(/^(\[HR\]|---)$/.test(line))return `<hr ${ref} style="border:0;border-top:1px solid ${ink};opacity:.45;margin:22px 0">`;
      if(/^\[HR[23]\]$/.test(line))return `<div ${ref} style="text-align:center;color:${ink};margin:22px 0">${line==='[HR2]'?'✦ ✦ ✦':'· · ·'}</div>`;
      if(line==='[GAP]')return `<div ${ref} style="height:3em"></div>`;
      const fold=line.match(/^\[접기\s*([^\]]*)\]$/);
      if(fold){folds++;const h=fold[1].match(/^(#{1,4})\s+(.+)$/);return `<details ${ref} style="padding:12px 15px;border:1px solid ${ink};border-radius:5px;margin:12px 0;${style}"><summary style="cursor:pointer;${h?'font-size:'+(26-h[1].length*2)+'px;':''}">${fmt(h?h[2]:fold[1]||'펼쳐 보기')}</summary>`;}
      if(line==='[/접기]'&&folds){folds--;return '</details>';}
      const img=line.match(/^\[IMG(?:\s+|:)(.+)\]$/i);
      if(img){let src=img[1],caption='',width=100;const cap=src.indexOf('|');if(cap>=0){caption=src.slice(cap+1).trim();src=src.slice(0,cap).trim();}const w=src.match(/(?:\s+@|:)(\d{1,3})$/);if(w){width=Math.min(100,Math.max(1,Number(w[1])));src=src.slice(0,-w[0].length);}if(/^(https?:\/\/|\/\/)/i.test(src)||/^data:image\/(png|jpeg|gif|webp);base64,/i.test(src))return `<figure ${ref} style="margin:18px 0;${style}"><img src="${esc(src)}" style="max-width:100%;width:${width}%;height:auto" alt="${esc(caption)}">${caption?`<figcaption>${fmt(caption)}</figcaption>`:''}</figure>`;}
      const heading=line.match(/^(#{1,4})\s+(.+)$/);
      if(heading){let title=heading[2];const a=title.match(/^(\[<\]|\[\|\]|\[>\])\s*/);if(a){align={'[<]':'left','[|]':'center','[>]':'right'}[a[1]];title=title.slice(a[0].length);}return `<h3 ${ref} style="font-size:${26-heading[1].length*2}px;margin:22px 0 12px;${style}${align?'text-align:'+align+';':''}">${fmt(title)}</h3>`;}
      if(/^>\s/.test(line))return `<blockquote ${ref} style="border-left:3px solid ${ink};padding:8px 16px;margin:16px 0;${style}">${fmt(line.slice(2))}</blockquote>`;
      if(/^\[\s+.+\s+\]$/.test(line)&&line.includes('|'))return `<div ${ref} style="padding:14px;background:${options.themeOnly&&ink.length===7?ink+'18':'#8888CC18'};${style}">${fmt(line.slice(1,-1).trim())}</div>`;
      const speech=speechLine(line);
      if(speech){const name=speech.name, c=options.themeOnly?ink:ink!==accent?ink:name?(globalThis.LogSpeakerColors?.colors(name).base||ink):ink;const n=name?`<b style="font-size:12px;color:${c}">${esc(name)}</b>`:'';const spoken=inline(speech.speech,c);
        if(kind==='vn')return `<div ${ref} style="margin:17px 0;${style}">${name?`<div style="display:inline-block;margin-left:14px;background:${c};color:white;padding:3px 18px;border-radius:10px 10px 0 0;font-size:13px">${esc(name)}</div>`:''}<div style="background:#ffffffdd;border:2px solid ${c};border-radius:14px;padding:14px 18px">${spoken}</div></div>`;
        if(kind==='sns')return `<div ${ref} style="border-bottom:1px solid #ddd;padding:18px 0;${style}">${n}<div>${spoken}</div></div>`;
        if(kind==='script')return `<div ${ref} style="margin:23px 30px;${style}"><div style="text-align:center">${n}</div>${spoken}</div>`;
        if(kind==='terminal')return `<p ${ref} style="margin:12px 0;${style}">&lt;${esc(name||'LOG')}&gt; ${spoken}</p>`;
        return `<div ${ref} style="margin:16px 0;${style}">${n?n+'<br>':''}${spoken}</div>`;
      }
      return `<p ${ref} style="margin:0 0 .65em;overflow-wrap:anywhere;${style}">${fmt(source.trim()===line?source:line)}</p>`;
    }).join('');
    return out+'</details>'.repeat(folds);
  }
  return {inline,parseBody,speechLine};
})();
