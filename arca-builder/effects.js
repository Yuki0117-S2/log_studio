/* Inline effects for the selected element; no editor controls enter exported HTML. */
(() => {
  const choices=[['neon','네온 글자'],['soft','겹그림자'],['inset','안쪽 그림자'],['ring','링 테두리'],['clear','그림자 지우기']];
  function styles(name,color='#8888CC'){
    if(!/^#[0-9a-f]{6}$/i.test(color))color='#8888CC';
    const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)).join(',');
    const recipes={
      neon:{'text-shadow':`0 0 8px ${color},0 0 20px ${color},0 0 40px ${color}`,color:'#ffffff',background:'#202027'},
      soft:{'box-shadow':'0 2px 8px rgba(0,0,0,0.18),0 8px 24px rgba(0,0,0,0.12)'},
      inset:{'box-shadow':`inset 0 2px 8px rgba(${rgb},0.45),inset 0 -1px 4px rgba(255,255,255,0.3)`},
      ring:{'box-shadow':`0 0 0 2px #ffffff,0 0 0 4px ${color},0 0 20px rgba(${rgb},0.4)`},
      clear:{'box-shadow':'none','text-shadow':'none'}
    };
    return recipes[name]||null;
  }
  function panel(record){
    if(record.tag==='a')return '<p class="field-help">링크 효과는 안쪽 글자 상자를 선택해 적용하세요.</p>';
    if(['br','hr','img','video','iframe','table','thead','tbody','tfoot','tr','col'].includes(record.tag))return '';
    return `<details class="inspector-section"><summary>효과 프리셋</summary><label class="field">효과 색<select id="effectColor">${['#8888CC','#DDAACC','#CCAA88','#BB6688'].map(c=>`<option value="${c}">${c}</option>`).join('')}</select></label><div class="design-buttons">${choices.map(([id,label])=>`<button type="button" data-effect="${id}">${label}</button>`).join('')}</div><p class="field-help">선택한 요소에 적용해요. 네온은 흰 글자·어두운 배경도 함께 적용해요. 되돌리기로 복원할 수 있어요.</p></details>`;
  }
  window.ArcaEffects={styles,panel};
})();
