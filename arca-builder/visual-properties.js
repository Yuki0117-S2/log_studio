/* Visual controls only; source edits and history remain owned by app.js. */
(() => {
  const e=window.ArcaCore.escape;
  const fonts=[
    ['pretendard','프리텐다드',"'Pretendard Variable', Pretendard, 'Noto Sans KR', 'Malgun Gothic', sans-serif"],
    ['notoSans','Noto Sans KR · 고딕',"'Noto Sans KR', 'Malgun Gothic', sans-serif"],
    ['notoSerif','Noto Serif KR · 명조',"'Noto Serif KR', 'Nanum Myeongjo', Batang, serif"],
    ['system','기본 고딕',"'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif"]
  ];
  const fontLinks='<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;600;700;800&amp;family=Noto+Serif+KR:wght@400;600;700;800&amp;display=swap"><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">';
  const round=n=>Math.round(n*10)/10;
  function firstFont(stack=''){
    const match=/^\s*(?:"((?:\\.|[^"])*)"|'((?:\\.|[^'])*)'|([^,]+))/.exec(stack);
    return match?(match[1]??match[2]??match[3]).replace(/\\(.)/g,'$1').trim():'';
  }
  function fontChoice(key,name=''){
    if(key!=='custom')return fonts.find(([id])=>id===key)||null;
    name=name.trim();
    if(!name||name.length>200||/[\u0000-\u001f\u007f]/.test(name))return null;
    const quoted='"'+name.replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'"';
    return ['custom',name,quoted+', sans-serif'];
  }
  function slider(label,prop,value,max,step=1,unit='px') {
    const n=parseFloat(value),valid=Number.isFinite(n),v=valid?round(n):0;
    return `<div class="space-control"><label for="quick-${prop}">${label}</label><div><input id="quick-${prop}" type="range" data-quick-style="${prop}" min="${Math.min(0,v)}" max="${Math.max(max,v)}" step="${step}" value="${v}" aria-label="${label}"><input type="number" data-quick-style="${prop}" min="${prop.startsWith('margin')?'-10000':'0'}" step="${step}" value="${valid?v:''}" aria-label="${label} 숫자" placeholder="자동"><span>${unit}</span></div></div>`;
  }
  function spacing(record,model,live) {
    const st=live?getComputedStyle(live):null;
    const chain=[];let r=record;
    while(r){chain.unshift(r);r=model.byId.get(r.parentId);}
    const crumbs=chain.map((item,i)=>`<button type="button" data-space-target="${item.id}" ${item===record?'aria-current="true"':''} title="${e(window.ArcaCore.label(item))}">${i===0?'전체 상자':item.tag==='summary'?'접기 제목':item.tag==='p'?'문단':item.tag==='h1'?'제목':'상자 '+i} <small>${e(item.tag)}</small></button>`).join('<span>›</span>');
    const controls=[['위쪽 바깥 간격','margin-top'],['위쪽 안쪽 여백','padding-top'],['아래쪽 안쪽 여백','padding-bottom'],['아래쪽 바깥 간격','margin-bottom']].map(([label,prop])=>slider(label,prop,st?.getPropertyValue(prop),120)).join('');
    const lh=st&&parseFloat(st.lineHeight)/parseFloat(st.fontSize);
    const hint=st?.display==='inline'?'글자 조각은 위아래 여백이 잘 드러나지 않아요. 위에서 문단이나 상자를 선택하세요.':/^table-(cell|row|row-group)$/.test(st?.display||'')?'표의 칸에는 바깥 간격이 적용되지 않아요. 안쪽 여백이나 상위 상자를 조절하세요.':'';
    return `<details open class="inspector-section quick-spacing"><summary>↕ 세로 간격 쉽게 조절</summary><p class="field-help">글자 주변이 넓으면 <b>안쪽 여백</b>, 구역 사이가 멀면 <b>바깥 간격</b>을 줄여요.</p><nav class="space-ancestors" aria-label="간격을 조절할 상자">${crumbs}</nav><p class="field-help">${hint||'변화가 없으면 위의 상위 상자를 눌러 보세요. 선택한 범위에 테두리가 생겨요.'}</p>${controls}${slider('글줄 사이 간격','line-height',lh,3,0.05,'배')}<p class="field-help space-metrics">현재 높이 <b>${live?round(live.getBoundingClientRect().height)+'px':'계산 중'}</b> · 지정 높이 ${e(record.el.style.height||'자동')} · 최소 높이 ${e(record.el.style.minHeight||'자동')}</p><button type="button" data-auto-height class="wide">고정·최소 높이 풀기</button><p class="field-help">슬라이더는 현재 화면 기준 px로 바꿔요. 원래 clamp·% 값은 되돌리기로 복원할 수 있어요.</p></details>`;
  }
  function fontPanel(record,live,multi=false){
    const current=live?getComputedStyle(live).fontFamily:record.el.style.fontFamily;
    const name=firstFont(current),preset=fonts.find(([, ,stack])=>name.toLowerCase()===firstFont(stack).toLowerCase());
    const key=preset?.[0]||(name&&!/^(inherit|initial|unset|serif|sans-serif|monospace|system-ui)$/i.test(name)?'custom':'');
    return `<details open class="inspector-section quick-font"><summary>글씨체 미리보기</summary><p class="field-help">현재: ${e(current||'상위 글씨체 상속')}</p><label class="field">글씨체<select id="quickFont"><option value="">글씨체 선택…</option>${fonts.map(([id,label])=>`<option value="${id}" ${key===id?'selected':''}>${label}</option>`).join('')}<option value="custom" ${key==='custom'?'selected':''}>내 컴퓨터 폰트 · 이름 직접 입력</option></select></label><label id="customFontField" class="field" ${key==='custom'?'':'hidden'}>설치된 글꼴 이름<input id="customFontName" value="${e(key==='custom'?name:'')}" maxlength="200" placeholder="예: Aa 오디너리" autocomplete="off" spellcheck="false"><span class="field-help">파일명이 아닌 글꼴 이름을 그대로 입력하세요. 이 컴퓨터에 설치되어 있으면 업로드 없이 사용해요. 이름이 다르거나 미설치 상태면 대체 글꼴로 보여요.</span></label><div id="fontSample" class="font-sample" style="font-family:${e(current||'inherit')}">이야기가 머무는 자리<br>가나다 Aa 0123</div><label class="check-row"><input id="fontDescendants" type="checkbox" checked>선택 구역 안의 글자까지 함께 변경</label><button type="button" data-apply-font class="wide">${multi?'선택한 구역들':'선택 구역'}에 글씨체 적용</button><p class="field-help">입력하면 위 예문을 미리 봐요. 적용 버튼을 누르면 본문도 바뀝니다. 같은 컴퓨터에서 이미지로 저장하면 표시된 글씨체가 이미지에 남아요.</p></details>`;
  }
  window.ArcaVisual={fonts,fontLinks,spacing,fontPanel,firstFont,fontChoice};
})();
