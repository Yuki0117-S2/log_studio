/* Small UI helpers. Source changes and undo are owned by app.js. */
(() => {
  const C=window.ArcaCore,V=window.ArcaVisual,e=C.escape;
  const parts={number:'번호',title:'제목',subtitle:'설명',arrow:'화살표'};
  function styleOf(record,live){
    if(live)return getComputedStyle(live);
    const probe=record.el.style;
    return {getPropertyValue(prop){for(let el=record.el;el;el=el.parentElement){const value=el.style?.getPropertyValue(prop);if(value)return value;}return probe.getPropertyValue(prop);}};
  }
  function textPanel(record,live){
    if(['img','video','iframe','hr','br'].includes(record.tag)||!record.el.textContent.trim())return '';
    const st=styleOf(record,live),value=p=>st.getPropertyValue(p),name=V.firstFont(value('font-family'));
    const font=V.fonts.find(([, ,stack])=>V.firstFont(stack).toLowerCase()===name.toLowerCase());
    const numeric=(label,prop,unit,min)=>{const n=parseFloat(value(prop));return `<label class="field">${label}<input type="number" step="any" ${min===undefined?'':`min="${min}"`} data-easy-style="${prop}" data-unit="${unit}" value="${Number.isFinite(n)?Math.round(n*100)/100:''}" placeholder="기본값"></label>`;};
    const rgb=/^rgba?\(\s*(\d+)[, ]+\s*(\d+)[, ]+\s*(\d+)/.exec(value('color'));
    const opaque=!/rgba\([^)]*,\s*(?:0?\.\d+|0)\s*\)/.test(value('color'));
    const color=rgb&&opaque?'#'+rgb.slice(1,4).map(n=>Number(n).toString(16).padStart(2,'0')).join(''):value('color')||'#000000';
    return `<details open class="inspector-section easy-text"><summary>글자 빠른 꾸미기</summary><label class="field">글씨체 바로 적용<select data-easy-font><option value="">${e(font?'선택…':name||'기본 글씨체')}</option>${V.fonts.map(([id,label])=>`<option value="${id}" ${font?.[0]===id?'selected':''}>${label}</option>`).join('')}</select></label><div class="field-row">${numeric('크기 (px)','font-size','px',1)}<label class="field">굵기<select data-easy-style="font-weight">${[['100','아주 얇게'],['200','얇게'],['300','조금 얇게'],['400','보통'],['500','중간'],['600','조금 굵게'],['700','굵게'],['800','아주 굵게'],['900','가장 굵게']].map(([n,label])=>`<option value="${n}" ${value('font-weight')===n?'selected':''}>${label} · ${n}</option>`).join('')}</select></label></div><label class="field">글씨 색<span class="color-input"><input type="color" data-easy-style="color" value="${/^#[0-9a-f]{6}$/i.test(color)?color:'#000000'}" aria-label="빠른 글씨 색 선택"><input data-easy-style="color" value="${e(color)}" aria-label="빠른 글씨 색 코드"></span></label><div class="field-row">${numeric('자간 (px)','letter-spacing','px')}<label class="field">정렬<select data-easy-style="text-align">${[['left','왼쪽'],['center','가운데'],['right','오른쪽'],['justify','양쪽']].map(([v,label])=>`<option value="${v}" ${value('text-align')===v?'selected':''}>${label}</option>`).join('')}</select></label></div><p class="field-help">선택한 글자에 바로 적용해요. 안쪽 글자에 별도 설정이 있으면 해당 문장을 선택하세요.</p></details>`;
  }
  function summary(record){const fold=record?.el?.closest('details');return fold&&Array.from(fold.children).find(el=>el.localName==='summary');}
  function foldPanel(record,model){
    const root=summary(record);if(!root)return '';
    const rich=root.hasAttribute('data-arca-fold-title');
    const buttons=rich?Object.entries(parts).map(([part,label])=>{const el=root.querySelector(`[data-arca-fold-part="${part}"]`);return el?`<button type="button" data-space-target="${el.getAttribute(model.attr)}" ${el===record.el?'aria-current="true"':''}>${label}</button>`:'';}).join(''):'';
    return `<details open class="inspector-section"><summary>접기 제목 꾸미기</summary>${rich?`<nav class="space-ancestors" aria-label="접기 제목 부분 선택">${buttons}<button type="button" data-space-target="${root.getAttribute(model.attr)}">제목줄 전체</button></nav><p class="field-help">번호·제목·설명을 따로 눌러 크기와 색을 바꾸세요.</p>`:'<p class="field-help">큰 번호 옆에 제목과 설명을 두 줄로 배치해요. 접기 안쪽 내용은 유지돼요.</p><button type="button" data-build-fold class="wide">번호·두 줄 제목으로 꾸미기</button>'}</details>`;
  }
  function foldContent({number='1',title='제목',subtitle='설명',arrow='⌵'}={}){
    return `<span style="display:table;width:100%;border-collapse:collapse;text-align:left;"><span style="display:table-cell;width:1%;padding-right:24px;vertical-align:middle;white-space:nowrap;"><span data-arca-fold-part="number" style="font-size:40px;font-weight:700;line-height:1;">${e(number)}</span></span><span style="display:table-cell;vertical-align:middle;"><span data-arca-fold-part="title" style="display:block;font-size:15px;font-weight:700;line-height:1.3;margin-bottom:4px;">${e(title)}</span><span data-arca-fold-part="subtitle" style="display:block;font-size:12px;font-weight:400;line-height:1.4;">${e(subtitle)}</span></span><span style="display:table-cell;width:40px;vertical-align:middle;text-align:right;"><span data-arca-fold-part="arrow" style="font-size:20px;font-weight:400;line-height:1;">${e(arrow)}</span></span></span>`;
  }
  function foldBlock(){return `<details style="margin:16px 0;background:#ffffff;color:#000000;font-family:${e(V.fonts[0][2])};"><summary data-arca-fold-title="true" style="display:block;list-style:none;padding:20px 40px;font-weight:400;">${foldContent()}</summary><div style="padding:20px;"><p style="margin:0;">내용</p></div></details>`;}
  window.ArcaEasy={textPanel,foldPanel,summary,foldContent,foldBlock,parts};
})();
