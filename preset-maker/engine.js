/* Preset Maker: independent data model, rendering and HTML field mapping. */
window.PM = (() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clone = value => JSON.parse(JSON.stringify(value));
  const uid = () => crypto.randomUUID ? crypto.randomUUID() : 'pm-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  const palette=['#8888CC','#DDAACC','#CCAA88','#BB6688'];
  const fontURL='https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Noto+Serif+KR:wght@400;600;700;900&family=Nanum+Pen+Script&family=Gaegu:wght@400;700&family=Jua&family=Nanum+Gothic+Coding:wght@400;700&family=Black+Han+Sans&family=JetBrains+Mono:wght@400;500&display=swap';
  const sample='바람이 멎은 자리에 서리가 내려앉았다. 탑의 문은 반쯤 열린 채였다.\n\n<<세린>> "문은 열려 있었어. 누군가 먼저 다녀간 거야."\n<<카엘>> "아니면, 우리를 기다리고 있었거나."\n\n세린은 대답 대신 검집에 손을 얹었다. 계단 위쪽 어딘가에서 얼음이 갈라지는 소리가 났다.\n\n*아직, 이야기는 끝나지 않았다.*';
  const field=(key,label,type,value,options)=>({key,label,type,default:value,options});
  const specs=[
    ['book','한 장 넘김','이북 · 소설','문서',"'Gowun Batang',serif",'#f7f3ea','#38332d','#CCAA88',[field('chapter','장 제목','text','CHAPTER 03'),field('header','머리말','text','여름의 끝에서'),field('page','페이지','number',48)]],
    ['vn','방과 후 선택지','미연시 · 대화창','대화',"'Gowun Batang',serif",'#f5edf4','#433547','#BB6688',[field('route','루트 이름','text','서하 ROUTE'),field('affinity','호감도','range',65),field('choices','선택지','list',['좋아한다고 말한다','조금 더 기다린다']),field('selected','선택한 항목','number',1)]],
    ['sns','타임라인','SNS · 피드','대화',"Pretendard,system-ui,sans-serif",'#fff','#332f38','#8888CC',[field('handle','계정 아이디','text','@our_story'),field('time','시간 표시','text','2분 전'),field('likes','좋아요','number',128),field('reposts','재게시','number',24),field('replyTo','답글 대상','text','')]],
    ['news','호외','신문 · 기사','문서',"'Noto Serif KR',serif",'#f4f0e6','#24221f','#BB6688',[field('masthead','신문 이름','text','京城夜報'),field('date','발행일','date','2026-09-27'),field('issue','호수','text','號外 · 第三百十二號'),field('columns','기사 단 수','select','2',['1','2'])]],
    ['contact','밀착 인화지','필름 · 장면 기록','기록',"'Nanum Pen Script',cursive",'#faf5e8','#49463d','#BB6688',[field('to','받는 사람','text','사랑하는 당신에게'),field('from','보내는 사람','text','세린 올림'),field('date','날짜','date','2026-09-27'),field('ps','추신','text','이 편지가 닿을 때쯤, 다시 만나자.')]],
    ['case','사건 기록 제7호','수사 파일 · 문답','문서',"'JetBrains Mono','Malgun Gothic',monospace",'#ede4cf','#35322b','#BB6688',[field('caseNo','사건 번호','text','CASE 2026-0917'),field('classification','분류','text','대외비'),field('location','장소','text','북쪽 탑'),field('date','기록일','date','2026-09-27')]],
    ['quest','퀘스트 로그','RPG · 목표와 보상','장르',"'Gowun Batang',serif",'#262936','#e7dccc','#CCAA88',[field('level','권장 레벨','number',14),field('client','의뢰인','text','마을 촌장 베르나'),field('goals','목표','checklist',[{text:'늪 입구의 표식 찾기',done:true},{text:'꺼진 등불 3개 밝히기',done:false}]),field('reward','보상','text','경험치 1,200 · 등불지기의 망토')]],
    ['broadcast','본방 사수','방송 · 효과 자막','장르',"Pretendard,system-ui,sans-serif",'#fff','#31313c','#BB6688',[field('episode','회차','text','EP.07'),field('channel','채널명','text','ch.LOG'),field('caption','효과 자막','text','지금, 이 순간'),field('captionSize','자막 크기','number',32),field('live','LIVE 표시','checkbox',true)]],
    ['terminal','접속 기록','터미널 · 시스템 로그','장르',"'JetBrains Mono','Malgun Gothic',monospace",'#20212d','#c2c2e6','#8888CC',[field('system','시스템 이름','text','NEON-OS v2.87'),field('timestamp','접속 시각','text','2089-11-02 03:12:44'),field('progress','진행률','range',68),field('warning','경고 문구','text','추적 신호 감지')]],
    ['script','막이 오르기 전','각본 · 무대','대화',"'Noto Serif KR',serif",'#faf8f2','#332e2e','#BB6688',[field('cast','등장인물','list',['세린 — 주연 배우','카엘 — 무대감독']),field('scene','장면 번호','text','S#12'),field('location','장소·시간','text','분장실 — 공연 20분 전')]],
    ['diary','오늘의 칸','일기 · 사진','기록',"'Gaegu','Gowun Batang',serif",'#fffdf4','#484034','#CCAA88',[field('date','날짜','date','2026-09-27'),field('weather','날씨','select','맑음',['맑음','흐림','비','눈']),field('memo','메모','text','오래 기억하고 싶은 하루.')]],
    ['museum','강호 유물전','전시 도록 · 해설','기록',"'Noto Serif KR',serif",'#f8f6ef','#37342f','#BB6688',[field('room','전시실','text','ROOM 03'),field('number','도판 번호','text','03'),field('period','연대','text','무림력 312년'),field('material','재질','text','청강, 옥, 비단 술'),field('guide','오디오 가이드 주소','url','')]]
    ,['photocard','한 장의 대사','포토카드 · 캐릭터','기록',"'Gowun Batang',serif",'#f8f6fb','#38333c','#8888CC',[field('caption','사진 아래 대사','text','오래 기억할게.'),field('signature','이름','text','세린'),field('frame','프레임 색','color','#ffffff')]]
    ,['polaroid','우리의 앨범','폴라로이드 · 사진과 글','기록',"'Nanum Pen Script',cursive",'#faf5ed','#484034','#CCAA88',[field('caption','사진 아래 대사','text','같이 있어서 좋았어.'),field('signature','날짜 · 서명','text','2026.09.27'),field('frame','프레임 색','color','#ffffff'),field('tilt','기울기','select','-2',['-4','-2','0','2','4']),field('tape','테이프','checkbox',true)]]
    ,['cheki','체키 한 장','체키 · 기념 사진','기록',"'Gowun Batang',serif",'#f7f1f3','#3d3238','#BB6688',[field('caption','사진 아래 대사','text','오늘은 내가 먼저 찍자고 했다?'),field('signature','사인','text','유진 × 나'),field('date','날짜','text','26.09.27'),field('frame','프레임 색','color','#ffffff'),field('tilt','기울기','select','-2',['-4','-2','0','2','4']),field('tape','테이프','checkbox',true),field('sticker','하트 스티커','checkbox',true)]]
  ];
  function seeds(){return specs.map((s,i)=>({id:'builtin-'+s[0],kind:s[0],name:s[1],description:s[2],category:s[3],font:s[4],paper:s[5],ink:s[6],accent:s[7],special:s[8],favorite:i===0||i===1||i===10,version:2,reference:window.REFERENCE_DESIGNS?.[i]?.html||'',createdAt:Date.now()})).map((p,i)=>window.PMDesign?window.PMDesign.enrich(p,i):p).concat(window.PMOriginal?[window.PMOriginal.preset()]:[]);}
  function createLog(preset){
    const initial={id:uid(),title:'은빛 서리의 밤',subtitle:'제3화 · 북쪽 탑의 문지기',preset:clone(preset),scenes:[{id:uid(),title:'탑의 입구',body:sample,hidden:false}],values:Object.fromEntries((preset.special||[]).map(f=>[f.key,clone(f.default)])),custom:Object.fromEntries((preset.fields||[]).map(f=>[f.id,f.default||''])),style:{font:preset.font||"'Gowun Batang',serif",size:15,line:1.9,gap:16,padding:36,paper:preset.paper||'#ffffff',ink:preset.ink||'#38333c',accent:preset.accent||'#8888CC'},image:{src:'',width:100,ratio:'16/9',x:50,y:50},note:'',link:'',createdAt:Date.now(),updatedAt:Date.now(),history:[]};
    if(preset.savedStyle)initial.style={...initial.style,...clone(preset.savedStyle)};
    if(preset.savedStyleOverrides)initial.styleOverrides=clone(preset.savedStyleOverrides);
    if(preset.kind==='custom'){
      initial.title='새 로그';initial.subtitle='';initial.scenes[0].title='장면 1';initial.scenes[0].subtitle='';initial.scenes[0].body='';
      for(const f of preset.fields||[]){if(f.role==='title')initial.title=f.default||'새 로그';if(f.role==='subtitle')initial.subtitle=f.default||'';if(f.role==='scene-title')initial.scenes[0].title=f.default||'장면 1';if(f.role==='scene-subtitle')initial.scenes[0].subtitle=f.default||'';if(f.role==='body')initial.scenes[0].body=f.default||'';if(f.role==='image')initial.image.src=f.default||'';if(f.role==='link')initial.link=f.default||'';}
      initial.image.ratio='auto';initial.scenes[0].image=clone(initial.image);
    }
    if(['photocard','polaroid','cheki'].includes(preset.kind))initial.image.ratio=preset.kind==='cheki'?'46/62':preset.kind==='polaroid'?'1/1':'3/4';
    return window.PMDesign?window.PMDesign.initialize(initial):initial;
  }
  const url=(v,image=false)=>{v=String(v||'').trim();return /^(https?:\/\/|\/\/)/i.test(v)||(image&&/^data:image\/(png|jpeg|gif|webp);base64,/i.test(v))?v:'';};
  const inline=(...args)=>window.PMSyntax.inline(...args);
  const parseBody=(...args)=>window.PMSyntax.parseBody(...args);
  function imageHTML(image,caption=''){const src=url(image?.src,true);if(!src)return '';return `<figure data-pm-focus="image" style="margin:20px auto;width:${Math.min(100,Math.max(10,Number(image.width)||100))}%"><img alt="${esc(caption)}" src="${esc(src)}" style="display:block;width:100%;${image.ratio!=='auto'?`aspect-ratio:${esc(image.ratio||'16/9')};object-fit:cover;`:''}object-position:${Number(image.x)||0}% ${Number(image.y)||0}%;border-radius:2px">${caption?`<figcaption style="font-size:11px;opacity:.6;margin-top:8px">${esc(caption)}</figcaption>`:''}</figure>`;}
  function render(log){if(log.preset.design&&window.PMDesign)return window.PMDesign.render(log);if(log.preset.kind==='custom')return renderCustom(log);if(['photocard','polaroid','cheki'].includes(log.preset.kind))return renderPhoto(log);const p=log.preset,s=log.style,v=log.values||{},k=p.kind;const accent=s.accent;let before='',after='';
    const tiny=(t,extra='')=>`<div style="font:11px/1.5 'JetBrains Mono',monospace;letter-spacing:1.5px;${extra}">${esc(t)}</div>`;
    const list=(items,check=false)=>Array.isArray(items)?items.map(x=>`<div style="padding:7px 0;border-bottom:1px solid ${esc(accent)}33">${check?(x.done?'☑ ':'☐ ')+esc(x.text):esc(x)}</div>`).join(''):'';
    if(k==='book'){before=tiny(v.header,'text-align:center;border-bottom:1px solid #ccc;padding-bottom:14px;margin-bottom:30px')+tiny(v.chapter,`color:${accent}`);after=tiny('— '+v.page+' —','text-align:center;margin-top:35px');}
    if(k==='vn'){before=tiny(v.route)+`<div style="margin:13px 0 22px;font-size:11px">호감도 <span style="display:inline-block;width:100px;height:5px;background:#fff;vertical-align:middle"><span style="display:block;height:100%;width:${Number(v.affinity)||0}%;background:${esc(accent)}"></span></span> ${esc(v.affinity)}%</div>`;after=`<div style="margin:24px 0">${(v.choices||[]).map((x,i)=>`<div style="padding:9px 15px;border:1px solid ${esc(accent)}66;margin:7px 0;border-radius:5px;background:${i+1===Number(v.selected)?accent+'33':'#ffffff88'}">${i+1===Number(v.selected)?'▶':'▷'} ${esc(x)}</div>`).join('')}</div>`;}
    if(k==='sns'){before=`<div style="border-bottom:1px solid #ddd;padding-bottom:15px;margin-bottom:18px;font-size:12px">${esc(v.handle)} <span style="opacity:.5">· ${esc(v.time)}</span></div>`+(v.replyTo?`<p style="font-size:12px;color:${esc(accent)}">${esc(v.replyTo)} 님에게 보내는 답글</p>`:'');after=`<div style="font-size:12px;margin:22px 0;color:${esc(accent)}">↻ ${esc(v.reposts)}　♡ ${esc(v.likes)}</div>`;}
    if(k==='news')before=`<div style="border-top:5px solid currentColor;border-bottom:2px solid currentColor;padding:12px 0 8px;margin-bottom:24px;text-align:center"><div style="font-size:42px;font-weight:900;letter-spacing:8px">${esc(v.masthead)}</div>${tiny(v.date+'　'+v.issue)}</div>`;
    if(k==='letter'){before=tiny('PAR AVION · 항공','text-align:right')+`<p style="margin:30px 0 20px;font-size:24px">${esc(v.to)}</p>`;after=`<p style="text-align:right;font-size:23px;margin:25px 0">— ${esc(v.from)}</p><p>${esc(v.ps)}</p>`;}
    if(k==='contact'){before=tiny('CONTACT SHEET · '+(v.date||''),'border-bottom:1px solid;padding-bottom:14px')+`<p>${esc(v.to||'')}</p>`;after=tiny(v.from||'');}
    if(k==='case')before=`<div style="display:flex;justify-content:space-between;margin-bottom:25px">${tiny(v.caseNo)}<b style="color:${esc(accent)};border:2px solid;padding:3px 13px;transform:rotate(-5deg)">${esc(v.classification)}</b></div><div style="font-size:12px;margin:20px 0">일시　${esc(v.date)}<br>장소　${esc(v.location)}</div>`;
    if(k==='quest'){before=tiny('◆ MAIN QUEST · LV.'+v.level)+`<p style="font-size:12px;opacity:.6;margin:14px 0">의뢰인 · ${esc(v.client)}</p><div style="background:#ffffff08;border:2px solid #ffffff22;padding:12px 16px;margin:18px 0">${list(v.goals,true)}<div style="font-size:11px;opacity:.7;margin-top:8px">${(v.goals||[]).filter(g=>g.done).length} / ${(v.goals||[]).length} 완료</div></div>`;after=`<div style="border-top:1px solid ${esc(accent)};padding-top:16px;margin-top:28px">${tiny('REWARD')}<p style="margin-top:8px">${esc(v.reward)}</p></div>`;}
    if(k==='broadcast'){before=`<div style="display:flex;justify-content:space-between;margin-bottom:20px">${tiny(v.episode)}<b style="color:${esc(accent)}">${v.live?'● LIVE　':''}${esc(v.channel)}</b></div>`;after=`<div style="font-size:${Math.min(72,Number(v.captionSize)||32)}px;font-weight:900;text-align:center;letter-spacing:-1px;color:${esc(accent)};margin:20px 0">${esc(v.caption)}</div>`;}
    if(k==='terminal'){before=tiny(v.system+' · '+v.timestamp,'border-bottom:1px dashed;padding-bottom:15px;margin-bottom:20px')+tiny('> CONNECTION '+v.progress+'%');after=`<p style="margin-top:24px;color:${esc(accent)}">[WARN] ${esc(v.warning)}</p>`;}
    if(k==='script')before=tiny('THEATER · PROGRAM')+`<div style="margin:22px 0;font-size:12px">${list(v.cast)}</div><b>${esc(v.scene)}. ${esc(v.location)}</b>`;
    if(k==='diary'){before=`<div style="border-bottom:1px dashed ${esc(accent)};padding-bottom:13px;margin-bottom:22px">${esc(v.date)}　　날씨 ${esc(v.weather)}</div>`;after=`<div style="padding:20px;background:#CCAA8830;transform:rotate(-1deg);margin-top:30px">✎ ${esc(v.memo)}</div>`;}
    if(k==='museum'){before=tiny(v.room)+`<div style="font-size:66px;font-weight:900;color:${esc(accent)};line-height:1.2;margin:18px 0">${esc(v.number)}</div><div style="border-top:1px solid #bbb;border-bottom:1px solid #bbb;padding:10px 0;margin:18px 0;font-size:12px">연대　${esc(v.period)}<br>재질　${esc(v.material)}</div>`;after=url(v.guide)?`<a href="${esc(url(v.guide))}" style="display:block;margin-top:22px;color:inherit">◉ 오디오 가이드 듣기 ↗</a>`:'';}
    let decor=k==='letter'?`border:8px solid transparent;border-image:repeating-linear-gradient(135deg,#BB6688 0 12px,#faf5e8 12px 24px,#8888CC 24px 36px,#faf5e8 36px 48px) 8;`:k==='quest'?`border:4px double ${esc(accent)};`:k==='diary'?'background-image:linear-gradient(#CCAA881a 1px,transparent 1px),linear-gradient(90deg,#CCAA881a 1px,transparent 1px);background-size:22px 22px;':'';
    const content=log.scenes.filter(x=>!x.hidden).map((scene,i)=>`<section style="margin-top:${i?32:20}px;${scene.style?`color:${esc(scene.style.ink||s.ink)};font-size:${Number(scene.style.size)||s.size}px;`:''}">${log.scenes.length>1?`<h3 data-pm-focus="scene-title" data-scene="${esc(scene.id)}" style="font-size:14px;margin:20px 0">${esc(scene.title)}</h3>`:''}<div style="${k==='news'?`column-count:${v.columns==='2'?2:1};column-gap:24px;`:''}">${parseBody(scene.body,k,accent,scene.id)}</div></section>`).join('');
    return `<article style="box-sizing:border-box;background-color:${esc(s.paper)};color:${esc(s.ink)};font-family:${esc(s.font)};font-size:${Number(s.size)}px;line-height:${Number(s.line)};padding:${Number(s.padding)}px;overflow-wrap:anywhere;${decor}">${before}<h1 data-pm-focus="title" style="font-size:${k==='news'?32:29}px;line-height:1.4;letter-spacing:-.5px;margin:17px 0 9px;font-weight:700">${esc(log.title)}</h1><p data-pm-focus="subtitle" style="font-size:12px;opacity:.65;margin:0 0 20px">${esc(log.subtitle)}</p>${imageHTML(log.image)}${content}${after}${log.link&&url(log.link)?`<p><a href="${esc(url(log.link))}" style="color:${esc(accent)};font-size:12px">♪ 함께 듣는 음악 ↗</a></p>`:''}${log.note?`<div data-pm-focus="note" style="border-top:1px solid ${esc(accent)}55;margin-top:30px;padding-top:16px;font-size:12px;opacity:.75">— 작가의 말<br>${inline(log.note)}</div>`:''}</article>`;
  }
  function renderPhoto(log){
    const s=log.style,v=log.values,k=log.preset.kind,src=url(log.image.src,true),rot=Math.max(-5,Math.min(5,Number(v.tilt)||0));
    const photo=src?'<img data-pm-focus="image" alt="사진" src="'+esc(src)+'" style="display:block;width:100%;aspect-ratio:'+esc(log.image.ratio==='auto'?'auto':log.image.ratio)+';object-fit:cover;object-position:'+Number(log.image.x)+'% '+Number(log.image.y)+'%">':'';
    const card=src?'<div data-pm-card="main" style="position:relative;width:'+Math.min(100,Math.max(10,Number(log.image.width)||100))+'%;max-width:'+(k==='cheki'?300:360)+'px;margin:24px auto 36px;background:'+esc(v.frame||'#ffffff')+';padding:16px 16px 0;box-shadow:0 12px 28px #BB66882e;transform:rotate('+rot+'deg)">'+(v.tape?'<i style="position:absolute;z-index:1;top:-12px;left:50%;margin-left:-44px;width:88px;height:24px;background:repeating-linear-gradient(90deg,#DDAACCbb 0 8px,#DDAACC88 8px 16px);transform:rotate(-4deg)"></i>':'')+'<div style="position:relative">'+photo+(v.sticker?'<span style="position:absolute;right:12px;bottom:6px;color:#fff;font-size:32px">♡</span>':'')+'</div><div style="padding:14px 6px 22px;font-family:&#39;Nanum Pen Script&#39;,cursive;color:'+esc(s.accent)+'"><div style="font-size:24px;line-height:1.25">'+esc(v.caption||'')+'</div><div style="display:flex;justify-content:space-between;font-size:19px;margin-top:6px"><span>'+esc(v.signature||'')+'</span><span>'+esc(v.date||'')+'</span></div></div></div>':'';
    return '<article style="background:'+esc(s.paper)+';color:'+esc(s.ink)+';font-family:'+esc(s.font)+';font-size:'+Number(s.size)+'px;line-height:'+Number(s.line)+';padding:'+Number(s.padding)+'px">'+card+'<div style="max-width:520px;margin:auto"><p data-pm-focus="subtitle" style="font-size:11px;letter-spacing:.12em;color:'+esc(s.accent)+';text-align:center">'+esc(log.subtitle)+'</p><h1 data-pm-focus="title" style="font-size:24px;text-align:center">'+esc(log.title)+'</h1>'+log.scenes.filter(x=>!x.hidden).map(scene=>'<section>'+parseBody(scene.body,'book',s.accent,scene.id)+'</section>').join('')+(log.note?'<p>'+inline(log.note)+'</p>':'')+'</div></article>';
  }
  function sanitize(source){const doc=new DOMParser().parseFromString(source,'text/html');doc.querySelectorAll('script,iframe,object,embed,base,meta,form,input,button,textarea,select,link').forEach(n=>n.remove());doc.querySelectorAll('*').forEach(n=>{[...n.attributes].forEach(a=>{if(/^on/i.test(a.name)||['srcdoc','formaction'].includes(a.name)||(/^(href|src|xlink:href)$/i.test(a.name)&&a.value&&!url(a.value,a.name==='src')))n.removeAttribute(a.name);});});let i=0;doc.body.querySelectorAll('*').forEach(n=>{if(n.tagName!=='STYLE')n.setAttribute('data-pm-node','n'+i++);});return {html:doc.head.innerHTML+doc.body.innerHTML,doc};}
  const fieldRoles=['title','subtitle','scene-title','scene-subtitle','scene-number','body','image','link','text','repeat','fixed'];
  const fieldNames={title:'로그 제목',subtitle:'부제','scene-title':'장면 제목','scene-subtitle':'장면 부제','scene-number':'장면 번호',body:'전체 로그 본문',image:'이미지',link:'링크',text:'별도 입력칸',repeat:'반복 장면',fixed:'고정 장식'};
  function bodyText(node){
    const copy=node.cloneNode(true);copy.querySelectorAll('br').forEach(n=>n.replaceWith('\n'));
    return [...copy.childNodes].map(n=>n.textContent.trim()).filter(Boolean).join('\n\n');
  }
  function describeField(html,id,role){
    const {doc}=sanitize(html),node=doc.querySelector(`[data-pm-node="${id}"]`);if(!node)return null;
    const repeat=node.closest('details,[data-role="repeat"]');
    const f={id,role,name:fieldNames[role]||'입력칸',default:node.tagName==='IMG'?(node.getAttribute('src')||''):node.tagName==='A'?(node.getAttribute('href')||''):role==='body'?bodyText(node):node.textContent.trim(),confirmed:false};
    if(repeat&&repeat!==node)f.repeatId=repeat.dataset.pmNode;
    if(role==='body'){
      const paragraphs=[...node.querySelectorAll('p')].filter(n=>n.textContent.trim());if(node.tagName==='P')paragraphs.unshift(node);
      const speech=paragraphs.find(n=>/^["“「『]/.test(n.textContent.trim()));
      const narration=paragraphs.find(n=>!/^["“「『]/.test(n.textContent.trim()))||paragraphs[0];
      f.appearance={paragraph:narration?.getAttribute('style')||'',speechParagraph:speech?.getAttribute('style')||'',speechSpan:speech?.querySelector('span')?.getAttribute('style')||'',thoughtSpan:narration?.querySelector('span')?.getAttribute('style')||''};
      f.defaultHTML=node.tagName==='P'?node.outerHTML:node.innerHTML;
      f.paragraphCount=paragraphs.length;
    }
    return f;
  }
  function analyze(source){
    const {html,doc}=sanitize(source),candidates=[],covered=new Set();
    const add=(node,role,name)=>{if(!node||covered.has(node.dataset.pmNode)||!node.textContent.trim()&&!['image','repeat'].includes(role))return;const f=describeField(html,node.dataset.pmNode,role);if(f){if(name)f.name=name;candidates.push(f);covered.add(f.id);}};
    const title=doc.body.querySelector('h1');add(title,'title');
    if(title?.previousElementSibling&&title.previousElementSibling.children.length===0&&title.previousElementSibling.textContent.trim().length<100)add(title.previousElementSibling,'text','작품명 · 머리말');
    const groups=[...doc.body.querySelectorAll('div,section,article,td')].filter(n=>[...n.children].filter(c=>c.tagName==='P'&&c.textContent.trim()).length>=2&&!n.closest('summary'));
    const bodyGroups=groups.filter(n=>!groups.some(other=>other!==n&&n.contains(other)));
    // A single foldable scene can safely become one repeat template. Multiple
    // independent sections remain separate until the user chooses a repeat area.
    const details=[...doc.body.querySelectorAll('details')].filter(n=>n.querySelector('p'));
    if(details.length===1){const detail=details[0];add(detail,'repeat');const summary=detail.querySelector('summary');const leaves=summary?[...summary.querySelectorAll('*')].filter(n=>n.children.length===0&&n.textContent.trim()):[];const number=leaves.find(n=>/^\d+$/.test(n.textContent.trim()));add(number,'scene-number');const titles=leaves.filter(n=>n!==number&&/[\p{L}]/u.test(n.textContent.trim()));add(titles[0],'scene-title');add(titles[1],'scene-subtitle');}
    bodyGroups.forEach((node,i)=>add(node,i===0?'body':'text',i===0?'전체 로그 본문':'추가 본문 '+(i+1)));
    doc.body.querySelectorAll('h1,h2,h3,p,img,a,[data-role]').forEach(n=>{
      if(candidates.length>=100||covered.has(n.dataset.pmNode)||bodyGroups.some(g=>g.contains(n)))return;
      let role=n.dataset.role||({H1:'title',H2:'text',H3:'text',P:candidates.some(f=>f.role==='body')?'text':'body',IMG:'image',A:'link'}[n.tagName])||'text';
      if(!fieldRoles.includes(role))role='text';add(n,role);
    });
    const suggestedName=title?.textContent.trim()||'나의 HTML 프리셋';
    return {original:source,html,fields:candidates,suggestedName,bodyGroups:bodyGroups.length};
  }
  function mappedBody(text,field,sceneId,accent){
    if(text===field.default&&field.defaultHTML){const d=new DOMParser().parseFromString(field.defaultHTML,'text/html');let line=0;[...d.body.children].forEach(n=>{if(!n.textContent.trim())return;n.dataset.pmFocus='body';n.dataset.scene=sceneId;n.dataset.line=String(line);line+=n.textContent.trim().split('\n').length+1;});return d.body.innerHTML;}
    const syntax=window.PMSyntax;
    const parsed=syntax?syntax.parseBody(text,'book',accent,sceneId,{themeOnly:true}):parseBody(text,'book',accent,sceneId);
    const d=new DOMParser().parseFromString(parsed,'text/html'),appearance=field.appearance||{},lines=String(text).replace(/\r\n?/g,'\n').split('\n');
    d.body.querySelectorAll('[data-line]').forEach(n=>{
      const line=lines[Number(n.dataset.line)]||'',content=line.trim().replace(/^(?:(?:\{#[\da-f]{3,6}\}|\[C\]|\[\|\]|\[<\]|\[>\])\s*){1,3}/i,'');
      const speech=syntax?.speechLine(content);
      if(!['P','DIV'].includes(n.tagName))return;
      if(!content){if(appearance.paragraph&&lines[Number(n.dataset.line)-1]?.trim())n.style.height='0';return;}
      if(n.tagName==='DIV'&&!speech)return;
      const alignment=n.style.textAlign,ink=n.style.color;
      const style=speech?(appearance.speechParagraph||appearance.paragraph):appearance.paragraph;
      if(style)n.setAttribute('style',style);
      if(alignment)n.style.textAlign=alignment;if(ink)n.style.setProperty('color',ink,'important');
      if(speech&&appearance.speechSpan){
        const spoken=new DOMParser().parseFromString(syntax.inline(speech.speech,accent,false),'text/html');
        spoken.querySelectorAll('span').forEach(span=>{if(span.style.background||span.style.backgroundColor)span.replaceWith(...span.childNodes);});
        n.innerHTML=(speech.name?'<b style="font-size:12px;color:'+esc(accent)+'">'+esc(speech.name)+'</b><br>':'')+'<span style="'+esc(appearance.speechSpan)+'">'+spoken.body.innerHTML+'</span>';
      }
      if(!speech&&appearance.speechSpan)n.querySelectorAll('span').forEach(span=>{if(span.style.background||span.style.backgroundColor)span.setAttribute('style',appearance.speechSpan);});
      if(!speech&&appearance.thoughtSpan){const style=esc(appearance.thoughtSpan);n.innerHTML=n.innerHTML.replace(/&#39;([^<]*?)&#39;/g,`<span style="${style}">&#39;$1&#39;</span>`);}
    });return d.body.innerHTML;
  }
  function renderCustom(log){const {doc}=sanitize(log.preset.html);const fields=log.preset.fields||[];const repeatNodes=fields.filter(f=>f.role==='repeat').map(f=>doc.querySelector(`[data-pm-node="${f.id}"]`)).filter(Boolean);
    function apply(root,field,scene){const node=root.matches?.(`[data-pm-node="${field.id}"]`)?root:root.querySelector(`[data-pm-node="${field.id}"]`);if(!node||field.role==='fixed'||field.role==='repeat')return;node.dataset.pmFocus=field.role;node.dataset.field=field.id;if(scene)node.dataset.scene=scene.id;
      if(field.role==='body'){const content=scene?mappedBody(scene.body,field,scene.id,log.style.accent):log.scenes.filter(x=>!x.hidden).map(s=>mappedBody(s.body,field,s.id,log.style.accent)).join('');if(node.tagName==='P'){const replacement=doc.createElement('div');[...node.attributes].forEach(a=>replacement.setAttribute(a.name,a.value));replacement.innerHTML=content;node.replaceWith(replacement);}else node.innerHTML=content;}
      else if(field.role==='image'){const src=url(fields.filter(f=>f.role==='image').length===1?log.image.src:(log.custom[field.id]||log.image.src),true);if(src){if(node.tagName==='IMG'){node.src=src;node.style.width=log.image.width+'%';node.style.objectFit='cover';node.style.objectPosition=log.image.x+'% '+log.image.y+'%';if(log.image.ratio!=='auto')node.style.aspectRatio=log.image.ratio;}else node.innerHTML=imageHTML({...log.image,src});}else node.style.display='none';}
      else if(field.role==='link'){const val=url(log.custom[field.id]||log.link);if(node.tagName==='A')node.setAttribute('href',val);else node.textContent=val;}
      else node.textContent=field.role==='title'?log.title:field.role==='subtitle'?log.subtitle:field.role==='scene-title'?(scene||log.scenes[0]).title:field.role==='scene-subtitle'?((scene||log.scenes[0]).subtitle||''):field.role==='scene-number'?String(log.scenes.filter(s=>!s.hidden).indexOf(scene||log.scenes[0])+1):(log.custom[field.id]??field.default??'');
    }
    for(const field of fields){const node=doc.querySelector(`[data-pm-node="${field.id}"]`);if(node&&!repeatNodes.some(r=>r.contains(node)))apply(doc.body,field);}
    for(const original of repeatNodes){const fragment=doc.createDocumentFragment();for(const scene of log.scenes.filter(s=>!s.hidden)){const node=original.cloneNode(true);fields.forEach(f=>apply(node,f,scene));fragment.append(node);}original.replaceWith(fragment);}
    const overrides=log.styleOverrides||{};for(const node of doc.body.querySelectorAll('*')){if(overrides.font)node.style.fontFamily=log.style.font;if(overrides.size)node.style.fontSize=Number(log.style.size)+'px';if(overrides.line)node.style.lineHeight=Number(log.style.line);if(overrides.ink)node.style.color=log.style.ink;}if(doc.body.firstElementChild){if(overrides.paper)doc.body.firstElementChild.style.backgroundColor=log.style.paper;if(overrides.padding)doc.body.firstElementChild.style.padding=Number(log.style.padding)+'px';}
    return `<div style="font-family:${esc(log.style.font)};font-size:${Number(log.style.size)}px;line-height:${Number(log.style.line)};color:${esc(log.style.ink)};background:${esc(log.style.paper)}">${doc.head.innerHTML+doc.body.innerHTML}</div>`;
  }
  function documentHTML(body,{interactive=false,mapping=false,fields=[]}={}){const script=interactive?`<script>document.addEventListener('click',e=>{if(${!mapping}&&e.target.closest('summary'))return;if(${mapping}||e.target.closest('a'))e.preventDefault();const n=e.target.closest('${mapping?'[data-pm-node]':'[data-pm-focus]'}');if(!n)return;parent.postMessage({type:'pm-pick',node:n.dataset.pmNode,focus:n.dataset.pmFocus,scene:n.dataset.scene||n.closest('[data-pm-unit]')?.dataset.pmUnit,line:n.dataset.line,field:n.dataset.field,tag:n.tagName,text:n.textContent.slice(0,250)},'*')});new ResizeObserver(()=>parent.postMessage({type:'pm-height',height:document.body.scrollHeight},'*')).observe(document.body);<\/script>`:'';
    const mapStyle=mapping?`[data-pm-node]:hover{outline:2px solid #8888CC;cursor:crosshair}${fields.map(f=>`[data-pm-node="${f.id}"]{outline:1px dashed ${f.confirmed?'#8888CC':'#CCAA88'};outline-offset:2px}`).join('')}`:'';
    return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${fontURL}"><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"><style>*{box-sizing:border-box}body{margin:0;overflow-wrap:anywhere}img{max-width:100%}article{min-height:100vh}${mapStyle}</style></head><body>${mapping?body.replace(/<details(\s|>)/gi,'<details open$1'):body}${script}</body></html>`;
  }
  const sampleHTML='<article style="background:#1b2030;color:#ddd5c4;padding:36px;font-family:Georgia,serif;line-height:1.9;border:1px solid #CCAA88"><div style="font-size:11px;letter-spacing:3px;color:#CCAA88">RECORD · NO.03</div><h1 style="font-size:30px;color:#e8cf98">은빛 서리의 밤</h1><p data-role="subtitle" style="font-size:13px;opacity:.7">제3화 · 북쪽 탑의 문지기</p><section data-role="repeat"><h2 style="font-size:13px;color:#CCAA88">탑의 입구</h2><p>바람이 멎은 자리에 서리가 내려앉았다. 탑의 문은 반쯤 열린 채였다.</p></section><div style="margin-top:28px;border-top:1px solid #CCAA88;padding-top:12px;font-size:11px">✧ 이 밤을 오래 기억하기로 했다 ✧</div></article>';
  async function openStore(){return new Promise((resolve,reject)=>{const request=indexedDB.open('log-studio-preset-maker',1);request.onupgradeneeded=()=>request.result.createObjectStore('workspace');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
  async function readStore(){const db=await openStore();return new Promise((resolve,reject)=>{const tx=db.transaction('workspace','readonly'),r=tx.objectStore('workspace').get('state');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);tx.oncomplete=()=>db.close();});}
  async function writeStore(state){const db=await openStore();return new Promise((resolve,reject)=>{const tx=db.transaction('workspace','readwrite');tx.objectStore('workspace').put(clone(state),'state');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};tx.onabort=()=>reject(tx.error||new Error('저장이 중단되었습니다.'));});}
  return {esc,clone,uid,palette,seeds,createLog,render,parseBody,imageHTML,documentHTML,sanitize,analyze,describeField,fieldRoles,fieldNames,sampleHTML,url,readStore,writeStore,fontURL};
})();
