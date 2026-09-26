(() => {
  const palettes={
    lavender:{accent:'#8888CC',soft:'#f0eff8',ink:'#34314d',muted:'#706a86',border:'#dcd8ea',surface:'#fbfaff',second:'#DDAACC'},
    rose:{accent:'#DDAACC',soft:'#fbf0f6',ink:'#4a3145',muted:'#81677a',border:'#e9d2e1',surface:'#fffafd',second:'#BB6688'},
    sand:{accent:'#CCAA88',soft:'#f8f2eb',ink:'#493c32',muted:'#7e7062',border:'#e7d9c9',surface:'#fffcf8',second:'#DDAACC'},
    berry:{accent:'#BB6688',soft:'#f7ebf1',ink:'#432b3b',muted:'#816576',border:'#e6ccd9',surface:'#fffafd',second:'#8888CC'}
  };
  const specs=[
    ['structure','hero','Aa','대문'],['structure','card','□','내용 구역'],['structure','fold','⌄','접기'],['structure','columns','▥','2열 카드'],
    ['text','heading','H','제목'],['text','paragraph','¶','본문'],['text','quote','“','인용'],['text','list','≡','목록'],
    ['content','image','▧','이미지'],['content','gallery','⊞','이미지 2×2'],['content','table','▤','정보 표'],['content','link','↗','링크 버튼'],
    ['detail','callout','!','안내 상자'],['detail','divider','―','구분선'],['detail','code','‹›','코드 문장'],['detail','meta','01','정보 띠']
  ];
  function make(type,palette='lavender') {
    const p=palettes[palette]||palettes.lavender;
    const base=`color:${p.ink};font-family:'Malgun Gothic',sans-serif;`;
    const t={
      hero:`<div style="padding:40px 30px;background:linear-gradient(135deg,${p.soft},${p.surface});border-bottom:1px solid ${p.border};${base}">\n  <p style="margin:0 0 12px;font-size:11px;letter-spacing:3px;color:${p.muted};">YOUR STORY · YOUR SPACE</p>\n  <h1 style="margin:0;font-size:34px;line-height:1.4;color:${p.ink};">이야기가 시작되는 곳</h1>\n  <p style="margin:14px 0 0;font-size:15px;line-height:1.8;color:${p.muted};">이곳에 소개 문장을 적어주세요.</p>\n</div>`,
      card:`<div style="margin:20px 24px;padding:24px;background:${p.surface};border:1px solid ${p.border};border-radius:10px;${base}">\n  <h2 style="margin:0 0 10px;font-size:21px;">새로운 이야기</h2>\n  <p style="margin:0;font-size:15px;line-height:1.8;">텍스트, 이미지, 표 등 필요한 요소를 자유롭게 담아보세요.</p>\n</div>`,
      fold:`<details style="margin:18px 24px;border:1px solid ${p.border};border-radius:8px;${base}">\n  <summary style="padding:16px 20px;background:linear-gradient(90deg,${p.soft},${p.surface});font-weight:700;font-size:16px;">펼쳐서 읽어보세요</summary>\n  <div style="padding:22px;font-size:15px;line-height:1.8;">접혀 있는 내용입니다. 이 구역 안에 다른 블록도 넣을 수 있어요.</div>\n</details>`,
      columns:`<table style="width:100%;border:0;border-collapse:separate;border-spacing:12px;${base}"><tbody><tr>\n  <td style="width:50%;padding:20px;border:1px solid ${p.border};vertical-align:top;background:${p.soft};"><h3 style="font-size:17px;margin:0 0 10px;">첫 번째 카드</h3><p style="font-size:14px;line-height:1.8;margin:0;">짧은 설명을 입력하세요.</p></td>\n  <td style="width:50%;padding:20px;border:1px solid ${p.border};vertical-align:top;background:${p.surface};"><h3 style="font-size:17px;margin:0 0 10px;">두 번째 카드</h3><p style="font-size:14px;line-height:1.8;margin:0;">짧은 설명을 입력하세요.</p></td>\n</tr></tbody></table>`,
      heading:`<h2 style="margin:26px 24px 12px;font-size:25px;line-height:1.5;${base}">새로운 제목</h2>`,
      paragraph:`<p style="margin:16px 24px;font-size:15px;line-height:1.9;${base}">전하고 싶은 이야기를 적어주세요. 미리보기에서 이 문장을 누르면 오른쪽에서 내용을 바꿀 수 있어요.</p>`,
      quote:`<blockquote style="margin:22px 24px;"><div style="padding:18px 24px;border-left:3px solid ${p.accent};background:${p.soft};${base}"><p style="margin:0;font-size:21px;line-height:1.7;">오래 기억하고 싶은 한 문장.</p><p style="margin:10px 0 0;font-size:12px;color:${p.muted};">— 이름 또는 출처</p></div></blockquote>`,
      list:`<ul style="margin:20px 24px;padding-left:24px;font-size:15px;line-height:2;${base}">\n  <li>첫 번째 내용</li>\n  <li>두 번째 내용</li>\n  <li>세 번째 내용</li>\n</ul>`,
      image:`<img alt="이미지 설명" style="max-width:100%;height:auto;border-radius:6px;">`,
      gallery:gallery(['','','',''],2,p),
      table:`<table style="width:100%;border:0;border-collapse:collapse;font-size:14px;${base}"><thead><tr><th style="padding:13px;border:1px solid ${p.border};background:${p.soft};text-align:left;">항목</th><th style="padding:13px;border:1px solid ${p.border};background:${p.soft};text-align:left;">설명</th></tr></thead><tbody><tr><td style="padding:13px;border:1px solid ${p.border};">첫 번째 항목</td><td style="padding:13px;border:1px solid ${p.border};">내용을 입력하세요</td></tr><tr><td style="padding:13px;border:1px solid ${p.border};">두 번째 항목</td><td style="padding:13px;border:1px solid ${p.border};">내용을 입력하세요</td></tr></tbody></table>`,
      link:`<div style="margin:24px;text-align:center;"><a href="#" style="text-decoration:none;"><span style="display:inline-block;padding:13px 30px;border-radius:7px;background:linear-gradient(135deg,${p.accent},${p.second});color:#272133;font-size:14px;font-weight:700;">링크 이름을 입력하세요 ↗</span></a></div>`,
      callout:`<div style="margin:20px 24px;padding:18px 22px;border:1px solid ${p.border};border-left:4px solid ${p.accent};background:${p.soft};${base}"><strong style="font-size:15px;">알아두면 좋아요</strong><p style="margin:8px 0 0;font-size:14px;line-height:1.8;">추가 설명이나 안내를 적어주세요.</p></div>`,
      divider:`<div style="margin:30px 24px;height:2px;background:linear-gradient(90deg,${p.accent},${p.second},${p.surface});font-size:0;">&nbsp;</div>`,
      code:`<pre style="margin:22px 24px;padding:22px;border:1px solid ${p.border};border-radius:8px;background:${p.soft};color:${p.ink};font-family:Consolas,monospace;font-size:14px;line-height:1.8;white-space:pre-wrap;">여기에 코드나 인용할 원문을 입력하세요.</pre>`,
      meta:`<table style="width:100%;border:0;border-collapse:collapse;${base}"><tbody><tr><td style="padding:12px;border:1px solid ${p.border};font-size:12px;text-align:center;"><strong>VERSION</strong><br>1.0</td><td style="padding:12px;border:1px solid ${p.border};font-size:12px;text-align:center;"><strong>TYPE</strong><br>기록</td><td style="padding:12px;border:1px solid ${p.border};font-size:12px;text-align:center;"><strong>STATUS</strong><br>작성 중</td></tr></tbody></table>`
    };
    return t[type]||t.paragraph;
  }
  function gallery(urls,columns=2,p=palettes.lavender,captions=[]){
    const e=window.ArcaCore.escape;let rows=[];
    for(let i=0;i<urls.length;i+=columns){let cells=[];for(let j=0;j<columns;j++){const n=i+j,caption=e(captions[n]||'이미지 '+(n+1));cells.push(`<td style="width:${100/columns}%;padding:6px;border:0;vertical-align:top;">${n<urls.length?`<img${urls[n]?` src="${e(urls[n])}"`:''} alt="${caption}" style="width:100%;height:auto;border-radius:5px;"><p style="margin:7px 0;font-size:12px;color:${p.muted};">${caption}</p>`:''}</td>`);}rows.push('  <tr>'+cells.join('')+'</tr>');}
    return `<table style="width:100%;border:0;border-collapse:separate;border-spacing:6px;"><tbody>\n${rows.join('\n')}\n</tbody></table>`;
  }
  function starter(){return `<div style="max-width:900px;margin:0 auto;padding:0 0 28px;background:#fbfaff;color:#34314d;font-family:'Malgun Gothic',sans-serif;">\n<div style="padding:40px 32px 32px;background:linear-gradient(120deg,#f0eff8,#fbf2f8);border-bottom:1px solid #dcd8ea;">\n  <p style="margin:0 0 14px;font-size:11px;letter-spacing:4px;color:#706a86;">A LITTLE SPACE FOR YOUR STORIES</p>\n  <h1 style="margin:0;font-size:36px;line-height:1.4;color:#34314d;">나의 작은 기록실</h1>\n  <p style="margin:14px 0 0;font-size:15px;line-height:1.8;color:#706a86;">좋아하는 장면과 오래 남기고 싶은 이야기들.</p>\n</div>\n<p style="margin:24px 32px;font-size:15px;line-height:1.9;color:#514b65;">이 문장을 눌러보세요. 오른쪽에서 내용을 바꾸거나 아래 코드를 직접 수정하면 미리보기에도 바로 반영돼요.</p>\n<div style="margin:24px 32px;padding:22px 24px;border:1px solid #dcd8ea;border-radius:10px;background:#ffffff;">\n  <p style="margin:0 0 8px;font-size:11px;letter-spacing:2px;color:#706a86;">01 / INTRODUCTION</p>\n  <h2 style="margin:0 0 10px;font-size:22px;color:#34314d;">접기 밖에도, 자유롭게</h2>\n  <p style="margin:0;font-size:14px;line-height:1.9;color:#514b65;">소개글, 안내문, 캐릭터 카드, 이미지 모음까지.<br>왼쪽의 ‘블록 추가’에서 필요한 구성을 골라보세요.</p>\n</div>\n<details open style="margin:22px 32px;border:1px solid #dcd8ea;border-radius:8px;">\n  <summary style="padding:15px 20px;background:linear-gradient(90deg,#f0eff8,#fbfaff);font-size:15px;font-weight:700;color:#34314d;">첫 번째 기록 — 펼쳐서 읽기</summary>\n  <div style="padding:22px;">\n    <p style="margin:0;font-size:15px;line-height:1.9;color:#514b65;">접기는 여러 구성 중 하나예요. 안쪽에는 본문과 표, 이미지도 넣을 수 있어요.</p>\n    <p style="margin:14px 0 0;font-size:12px;color:#706a86;">트리에서 요소를 끌면 위치를 바꿀 수 있어요.</p>\n  </div>\n</details>\n<div style="margin:30px 32px;height:2px;background:linear-gradient(90deg,#8888CC,#DDAACC,#fbfaff);font-size:0;">&nbsp;</div>\n<p style="margin:0 32px;font-size:12px;color:#706a86;">MADE OF LITTLE MOMENTS · 나만의 이야기로 채워주세요.</p>\n</div>`;}
  window.ArcaComponents={palettes,specs,make,gallery,starter};
})();
