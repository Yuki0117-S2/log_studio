(() => {
  const examples=[
    {file:'02-profile-soundtrack',title:'흰색 프로필 · SOUNDTRACK',desc:'원형 사진 두 장, 이름·설명, 밑줄과 재생 장식.',steps:['디자인 구역을 추가하고 원형 이미지 두 개를 넣어요.','사진 너비와 위쪽 위치를 같게 맞추고 이름·설명 텍스트 상자를 추가해요.','PROFILE·SOUNDTRACK 제목 아래에 선을 넣어요.','재생 버튼 장식을 넣어요. 실제 음원은 음악 · VIDEO를 따로 연결해요.']},
    {file:'03-black-header-fold',title:'검은 대문 · 전령 둘',desc:'검은 표지와 흰 접기. 번호·제목·설명을 따로 꾸며요.',steps:['대문을 추가해 검은 배경과 흰 제목을 설정해요.','번호·두 줄 접기를 추가해요.','접기 제목 꾸미기에서 번호·제목·설명·화살표를 각각 골라 색과 크기를 바꿔요.','안쪽 본문을 넣고, 같은 접기가 필요하면 접기 전체 복제를 눌러요.']},
    {file:'04-white-stars',title:'흰색 별 접기 · 부분 강조',desc:'넓은 여백, 별 세 개로 된 접기, 대사만 회색 강조.',steps:['디자인 구역에 위쪽 문구와 BOT·USER 이름을 배치해요.','접기 제목을 별 세 개로 바꾸고 가운데 정렬해요.','접기 본문 안에 문단과 글자 조각을 넣어요. 대사 조각만 굵게·회색 배경으로 바꿔요.','완성한 접기를 통째로 복제해 네 개로 늘려요.']},
    {file:'05-dark-profile-story',title:'어두운 프로필 · 본문 사진',desc:'어두운 배경, 금빛 글자, 원형 프로필과 가운데 본문 사진.',steps:['대문에 영문 명조 제목을 넣고 배경을 어둡게 바꿔요.','디자인 구역에 원형 이미지 두 개와 이름·설명을 배치해요.','STORY 문구와 번호·두 줄 접기를 추가해요.','접기 안쪽 문단 뒤에 이미지를 넣고 이미지 가운데를 눌러요.']},
    {file:'06-luka-cover',title:'Luka · 가운데 큰 사진',desc:'사진 → 제목·태그 → 프로필 → 접기 본문 순서.',steps:['내용 구역 배경을 갈색으로 바꾸고 이미지를 안쪽에 넣어요.','이미지 가운데를 누르고 사진 아래에 제목·설명·태그를 추가해요.','밝은 디자인 구역에 PROFILE·CHAR·USER·이름을 배치해요.','접기 본문에 명조 문단을 넣고 일부 글자 조각에만 배경색을 줘요.']},
    {file:'07-overlay-cover',title:'사진 위 글자 · 반투명 띠',desc:'배경 사진, 글자·이모지, 반투명 띠를 겹친 표지.',steps:['디자인 구역에 이미지를 넣고 가로 전체로 늘려요. 사진은 맨 뒤로 보내요.','텍스트 상자에 작성자와 이모지를 입력하고 위쪽에 배치해요.','아래쪽 텍스트 상자를 넓히고 배경을 검정·불투명도 65%로 바꿔요.','표지 아래 내용 구역에 테두리 태그와 접기를 추가해요. 제공되지 않은 본문은 안내 문장을 바꿔 넣어요.']}
  ];
  const list=document.getElementById('examples'),status=document.getElementById('status');
  for(const [index,item] of examples.entries()){
    const card=document.createElement('article');
    card.innerHTML=`<span class="number">EXAMPLE ${String(index+1).padStart(2,'0')}</span><h2>${item.title}</h2><p>${item.desc}</p><div class="actions"><a href="${item.file}.html" target="_blank" rel="noopener">완성 화면 보기 ↗</a><button type="button">편집 프로젝트 받기</button></div><details><summary>따라 만들기 · ${item.steps.length}단계</summary><ol>${item.steps.map(step=>`<li>${step}</li>`).join('')}</ol></details>`;
    const button=card.querySelector('button');
    button.addEventListener('click',async()=>{
      button.disabled=true;
      try{
        if(!/^https?:$/.test(location.protocol))throw Error('배포된 예제 페이지나 로컬 서버에서 프로젝트를 받아주세요.');
        const response=await fetch(`${item.file}.fragment.html`);if(!response.ok)throw Error('예제 파일을 읽지 못했어요. 예제 폴더가 함께 업로드됐는지 확인해 주세요.');
        const source=await response.text();
        const html=source.replace(/(\bsrc=")(assets\/[^"<>]+)(")/g,(_,prefix,path,suffix)=>prefix+new URL(path,location.href).href+suffix);
        const data={format:'arca-studio',version:2,name:item.title,guideVersion:'6.6',html,assets:[],savedAt:new Date().toISOString()};
        const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
        const link=document.createElement('a');link.href=url;link.download=item.file+'.arca.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
        status.textContent='프로젝트 다운로드를 시작했어요. 빌더의 프로젝트 열기에서 방금 받은 파일을 선택하세요.';
      }catch(error){status.textContent=error.message;}finally{button.disabled=false;}
    });
    list.append(card);
  }
})();
