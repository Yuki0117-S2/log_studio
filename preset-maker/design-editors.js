/* Curated editors. Stored alongside each design snapshot, never imposed on old logs. */
window.PMEditors = (() => {
  const schemas={
    cheki:{unit:'체키',titleLabel:'체키 기록 제목',subtitleLabel:'촬영 장소·상황',repeat:true,
      labels:{'0.0.1.0':['기념일 스티커 문구','스티커'],'0.0.1.1':['장식 스티커 문구','스티커'],
        '0.0.2.0':['사진 아래 대사','프레임 안 글씨'],'0.0.2.1.0':['서명','프레임 안 글씨'],'0.0.2.1.1':['사진 날짜','프레임 안 글씨'],
        '0.3.0':['모델·봇 안내','마무리'],'0.3.1':['작가의 말','마무리']},
      images:{'0.0.1':'체키 사진'},multiline:['0.0.2.0'],
      controls:[{key:'frame',label:'프레임 색',group:'프레임',type:'color',default:'#ffffff',control:'frame'},
        {key:'tilt',label:'기울기',group:'프레임',type:'select',default:'-2',options:['-4','-2','0','2','4'],control:'tilt'},
        {key:'tape',label:'테이프 표시',group:'프레임',type:'checkbox',default:true,control:'tape'},
        {key:'sticker',label:'스티커 표시',group:'스티커',type:'checkbox',default:true,control:'sticker'}]
    },
    polaroid:{unit:'폴라로이드',titleLabel:'앨범 제목',subtitleLabel:'앨범 소개',repeat:true,sharedTitle:true,
      config:{remove:['0.2','0.3','0.4.0'],frame:'0.1.0',tape:'0.1.0.0',stickers:[]},
      labels:{'0.0.0':['앨범 분류·시기','앨범 정보'],'0.1.0.2':['사진 아래 대사','사진 문구'],'0.1.1.0':['촬영 날짜·장소','사진 문구'],'0.4.1':['작가의 말','마무리']},
      images:{'0.1.0.1':'폴라로이드 사진'},multiline:['0.1.0.2'],
      controls:[{key:'frame',label:'프레임 색',group:'프레임',type:'color',default:'#fffdf8',control:'frame'},
        {key:'tilt',label:'기울기',group:'프레임',type:'select',default:'-2',options:['-4','-2','0','2','4'],control:'tilt'},
        {key:'tape',label:'테이프 표시',group:'프레임',type:'checkbox',default:true,control:'tape'}]
    },
    photocard:{unit:'카드',titleLabel:'카드 인물 이름',subtitleLabel:'카드 부제',repeat:true,
      labels:{'0.0.1':['카드 번호','카드 문구'],'0.0.2.1':['카드 대사','카드 문구'],'0.0.2.2.1':['카드 로고 문구','카드 문구'],
        '0.1.0.0':['뒷면 머리말','프로필'],'0.1.2.1':['나이','프로필'],'0.1.2.3':['직업','프로필'],'0.1.2.5':['좋아하는 것','프로필'],
        '0.1.5.0':['모델 정보','출처'],'0.1.5.1':['프롬프트 정보','출처']},
      images:{'0.0':'카드 앞면 사진'},multiline:['0.0.2.1'],
      controls:[{key:'showBack',label:'뒷면 표시',group:'카드 모양',type:'checkbox',default:true},
        {key:'cardFrame',label:'테두리 색',group:'카드 모양',type:'color',default:'#ffffff'},
        {key:'cardRadius',label:'모서리 둥글기 (px)',group:'카드 모양',type:'number',default:18,min:0,max:60},
        {key:'cardBorder',label:'테두리 두께 (px)',group:'카드 모양',type:'number',default:5,min:0,max:20}]
    },
    museum:{unit:'전시 항목',titleLabel:'전시품 제목',subtitleLabel:'전시품 부제',repeat:true,
      labels:{'0.0.0':['전시 이름','전시 정보'],'0.0.1':['전시실','전시 정보'],'0.1.0':['도판 번호','전시 정보'],
        '0.3.0':['유물 명칭','유물 정보'],'0.3.1':['연대','유물 정보'],'0.3.2':['재질','유물 정보'],
        '0.5.0.1.0':['관련 인물 1 역할','관련 인물 1'],'0.5.0.1.2':['관련 인물 1 이름','관련 인물 1'],'0.5.0.1':['관련 인물 1 소개','관련 인물 1'],
        '0.5.1.1.0':['관련 인물 2 역할','관련 인물 2'],'0.5.1.1.2':['관련 인물 2 이름','관련 인물 2'],'0.5.1.1':['관련 인물 2 소개','관련 인물 2'],
        '0.6.1':['대표 인용문','인용 패널'],'0.6.2':['인용 출처','인용 패널'],
        '0.7.0':['가이드 번호','오디오 안내'],'0.7.1':['가이드 링크 이름','오디오 안내'],'0.7.2':['큐레이터의 말','마무리']},
      images:{'0.2':'유물 도판','0.5.0.0':'관련 인물 1 사진','0.5.1.0':'관련 인물 2 사진'},
      controls:[{key:'museumColumns',label:'설명 단 수',group:'본문 배치',type:'select',default:'2',options:['1','2']},
        {key:'showQuote',label:'대표 인용 패널 표시',group:'인용 패널',type:'checkbox',default:true,control:'visible',path:'0.6'},
        {key:'guideURL',label:'오디오 안내 주소',group:'오디오 안내',type:'url',default:'',attribute:'href',path:'0.7.1'}]
    },
    diary:{unit:'일기',titleLabel:'일기 제목',subtitleLabel:'짧은 부제',repeat:true,
      labels:{'0.1.0.0':['날짜 표기','날짜·날씨'],'0.1.3.0.1.0':['함께한 사람','등장인물'],'0.1.3.0.1':['함께한 사람 소개','등장인물'],
        '0.1.3.1.1.0':['일기 주인 이름','등장인물'],'0.1.3.1.1':['일기 주인 소개','등장인물'],'0.1.8':['마무리 메모','마무리'],'0.1.8.1':['노래 링크 이름','마무리']},
      images:{'0.1.4.1.0':'오늘의 사진'},
      controls:[{key:'weather',label:'날씨',group:'날짜·날씨',type:'select',default:'맑음',options:['맑음','흐림','비','눈','바람']},
        {key:'musicURL',label:'노래 링크 주소',group:'마무리',type:'url',default:'',attribute:'href',path:'0.1.8.1'}]
    },
    script:{unit:'막·장면',titleLabel:'작품 제목',subtitleLabel:'막·회차 부제',repeat:true,
      labels:{'0.0.0.0':['프로그램 머리말','작품 정보'],'0.1.0.1':['주요 인물 이름','주요 인물'],'0.1.0.2':['주요 인물 역할','주요 인물'],
        '0.1.1.1':['상대 인물 이름','상대 인물'],'0.1.1.2':['상대 인물 역할','상대 인물'],
        '0.1.2.0':['모델 정보','출처'],'0.1.2.1':['프롬프트 정보','출처'],'0.3.0':['장면 번호·장소·시간','무대'],
        '0.3.14.0':['연출의 말','마무리'],'0.3.14.1':['영상 링크 이름','마무리']},
      images:{'0.1.0.0':'주요 인물 프로필','0.1.1.0':'상대 인물 프로필','0.3.2':'무대 사진'},
      controls:[{key:'castList',label:'배역',group:'배역 목록',type:'list',default:['한서린 … 주연 배우','문태경 … 무대감독','차유나 … 대역'],control:'cast',path:'0.0.1'},
        {key:'videoURL',label:'영상 링크 주소',group:'마무리',type:'url',default:'',attribute:'href',path:'0.3.14.1'}]
    },
    terminal:{unit:'접속 기록',titleLabel:'접속 기록 제목',subtitleLabel:'시스템 부제',repeat:true,
      labels:{'0.0':['시스템·접속 시각','시스템'],'0.3':['프로필 조회 문구','시스템'],
        '0.4.0.1.0':['접속자 이름','접속자'],'0.4.0.1':['접속자 권한·상태','접속자'],
        '0.4.1.1.0':['사용자 이름','사용자'],'0.4.1.1':['사용자 권한·모델','사용자'],
        '0.6.0':['첨부 파일 이름 표기','첨부 이미지'],'0.7.6':['경고 문구','상태 표시'],'0.8.0':['마무리 명령문','마무리'],'0.8.1':['음악 링크 이름','마무리']},
      images:{'0.4.0.0':'접속자 프로필','0.4.1.0':'사용자 프로필','0.6.1':'첨부 이미지'},
      controls:[{key:'connectionProgress',label:'연결 진행률',group:'상태 표시',type:'range',default:68},
        {key:'showProgress',label:'진행률 표시',group:'상태 표시',type:'checkbox',default:true},
        {key:'showWarning',label:'경고 표시',group:'상태 표시',type:'checkbox',default:true,control:'visible',path:'0.7.6'},
        {key:'musicURL',label:'음악 링크 주소',group:'마무리',type:'url',default:'',attribute:'href',path:'0.8.1'}]
    },
    broadcast:{unit:'방송 장면',titleLabel:'방송 제목',repeat:true,
      labels:{'0.0.1':['회차 표기','방송 정보'],'0.1.1':['채널 이름','방송 정보'],'0.1.2':['작은 효과 자막','화면 자막'],'0.1.3.0':['큰 효과 자막','화면 자막'],
        '0.2.0.0.1.0':['출연자 1 역할','출연자 1'],'0.2.0.0.1.1':['출연자 1 이름','출연자 1'],'0.2.0.0.1.2':['출연자 1 소개','출연자 1'],
        '0.2.0.1.1.0':['출연자 2 역할','출연자 2'],'0.2.0.1.1.1':['출연자 2 이름','출연자 2'],'0.2.0.1.1.2':['출연자 2 소개','출연자 2'],
        '0.2.6.0':['다음 회차·제작진 안내','마무리'],'0.2.6.1':['영상 링크 이름','마무리']},
      images:{'0.1':'방송 화면','0.2.0.0.0':'출연자 1 사진','0.2.0.1.0':'출연자 2 사진'},
      controls:[{key:'live',label:'LIVE 표시',group:'방송 정보',type:'checkbox',default:true,control:'visible',path:'0.0.2'},
        {key:'captionSize',label:'큰 자막 크기 (px)',group:'화면 자막',type:'number',min:12,max:64,default:32,control:'fontSize',path:'0.1.3.0'},
        {key:'videoURL',label:'영상 링크 주소',group:'마무리',type:'url',default:'',attribute:'href',path:'0.2.6.1'}]
    },
    quest:{unit:'퀘스트 기록',titleLabel:'퀘스트 이름',subtitleLabel:'의뢰인·지역',repeat:true,
      labels:{'0.0':['퀘스트 종류·레벨','퀘스트 정보'],'0.3.0.1.0':['동료 이름','동료'],'0.3.0.1.0.0':['동료 직업·레벨','동료'],
        '0.3.1.1.0':['플레이어 이름','플레이어'],'0.3.1.1.0.0':['플레이어 직업·레벨','플레이어'],
        '0.11.1':['경험치·금전 보상','보상'],'0.11.2':['아이템 보상','보상'],'0.11.3':['작가의 말','마무리']},
      images:{'0.3.0.0':'동료 프로필','0.3.1.0':'플레이어 프로필','0.5':'지역 일러스트','0.7.0':'동료 대화 초상','0.8.0':'플레이어 대화 초상'},
      controls:[{key:'questGoals',label:'목표',group:'목표',type:'checklist',default:[{text:'늪 입구의 표식 찾기',done:true},{text:'꺼진 등불 3개 밝히기',done:false},{text:'숨겨진 목표',done:false}],control:'goals',path:'0.4'},
        {key:'allyHP',label:'동료 체력',group:'동료',type:'range',default:70,control:'progress',path:'0.3.0.1.1.0'},
        {key:'allyMP',label:'동료 마력',group:'동료',type:'range',default:50,control:'progress',path:'0.3.0.1.2.0'},
        {key:'playerHP',label:'플레이어 체력',group:'플레이어',type:'range',default:90,control:'progress',path:'0.3.1.1.1.0'},
        {key:'playerMP',label:'플레이어 마력',group:'플레이어',type:'range',default:40,control:'progress',path:'0.3.1.1.2.0'}]
    },
    case:{unit:'기록',titleLabel:'사건 제목',subtitleLabel:'담당·분류 안내',repeat:true,
      config:{speechPrefix:'문. ',userSpeechPrefix:'답. '},
      labels:{'0.0':['사건 번호','사건 정보'],'0.1.0.0':['보안 등급 표기','사건 정보'],'0.1.0.1':['기관·부서','사건 정보'],
        '0.1.0.4.0.1.0':['목격자 이름','목격자'],'0.1.0.4.0.1':['목격자 소개','목격자'],'0.1.0.4.0.1.3':['진술 참고 사항','목격자'],
        '0.1.0.4.1.1.0':['담당자 이름','담당자'],'0.1.0.4.1.1':['담당자 소개·출처','담당자'],
        '0.1.0.5.1':['사건 일시','일시·장소'],'0.1.0.5.3':['사건 장소','일시·장소'],
        '0.1.0.6.2':['증거사진 설명','증거사진'],'0.1.0.10.0':['작성자 메모','마무리'],'0.1.0.10.1':['문서 페이지 표기','마무리']},
      images:{'0.1.0.4.0.0':'목격자 사진','0.1.0.4.1.0':'담당자 사진','0.1.0.6.1':'증거사진'},controls:[]
    },
    contact:{unit:'필름 묶음',titleLabel:'사진 기록 제목',subtitleLabel:'사진 기록 부제',repeat:true,
      labels:{'0.0.0':['필름·롤 번호','필름 정보'],'0.0.1':['장소·촬영 시기','필름 정보'],
        '0.3.0.1.0':['사진 속 인물 이름','등장인물'],'0.3.0.1.2':['사진 속 인물 소개','등장인물'],
        '0.3.1.1.0':['촬영자 이름','촬영자'],'0.3.1.1.2':['촬영자 소개·출처','촬영자'],'0.8.1':['작가의 말','마무리']},
      images:{'0.3.0.0':'인물 프로필','0.3.1.0':'촬영자 프로필','0.5':'확대 인화 사진'},
      collection:{path:'0.4',captions:['트램 28','골목 계단','전망대 · 해 질 녘']},controls:[]
    },
    news:{unit:'기사',titleLabel:'기사 제목',subtitleLabel:'기사 부제',repeat:true,
      labels:{'0.0':['신문 이름','발행 정보'],'0.1.0':['발행일 표기','발행 정보'],'0.1.1':['호수','발행 정보'],'0.1.2':['가격 표기','발행 정보'],
        '0.4.0.1.0':['취재원 역할','취재원'],'0.4.0.1.1':['취재원 이름','취재원'],'0.4.0.1.2':['취재원 소개','취재원'],
        '0.4.1.1.0':['기자 소속','기자'],'0.4.1.1.1':['기자 이름','기자'],'0.4.1.1.2':['기자 소개','기자'],
        '0.5.0.1':['사진 설명','보도사진'],'0.6.0':['속보·다음 기사 안내','마무리'],'0.6.1':['기자 후기·출처','마무리']},
      images:{'0.4.0.0':'취재원 사진','0.4.1.0':'기자 사진','0.5.0.0':'보도사진'},
      controls:[{key:'newsColumns',label:'기사 단 수',group:'기사 배치',type:'select',default:'1',options:['1','2']},
        {key:'newsPhotoPosition',label:'사진 배치',group:'기사 배치',type:'select',default:'나란히',options:['나란히','위쪽']}]
    },
    sns:{unit:'게시물 묶음',titleLabel:'태그·피드 제목',subtitleLabel:'피드 안내',repeat:true,
      config:{userSpeech:'0.4',userSpeechName:'2.0.0',userSpeechText:'2.2',userSpeechRemove:['2.3']},
      labels:{'0.1.0.2':['인물 계정 이름','계정 1'],'0.1.0.3':['인물 아이디·팔로워','계정 1'],'0.1.0.4':['인물 소개','계정 1'],
        '0.1.1.2':['화자 계정 이름','계정 2'],'0.1.1.3':['화자 아이디·소개','계정 2'],'0.1.1.4':['화자 한 줄 소개','계정 2'],
        '0.3.1.0.1':['게시물 아이디·시간','게시물 표시'],'0.3.1.3.0':['답글 수 표기','게시물 표시'],'0.3.1.3.1':['재게시 수 표기','게시물 표시'],'0.3.1.3.2':['좋아요 수 표기','게시물 표시'],
        '0.4.2.0.1':['답글 아이디·시간','답글 표시'],'0.4.2.1':['답글 대상','답글 표시'],
        '0.7.0':['작가의 말·출처','마무리'],'0.7.1':['프로필 링크 이름','마무리']},
      images:{'0.1.0.1':'계정 1 프로필','0.1.1.1':'계정 2 프로필','0.3.1.2':'게시물 첨부 사진'},
      controls:[{key:'profileURL',label:'프로필 링크 주소',group:'마무리',type:'url',default:'',attribute:'href',path:'0.7.1'}]
    },
    vn:{unit:'장면',titleLabel:'장면 제목',repeat:true,
      labels:{'0.0.0.0':['루트 이름','루트'],
        '0.1.0.1.0':['인물 역할','등장인물'],'0.1.0.1.1':['인물 이름','등장인물'],'0.1.0.1.2':['인물 소개','등장인물'],
        '0.1.1.1.0':['플레이어 역할','플레이어'],'0.1.1.1.1':['플레이어 이름','플레이어'],'0.1.1.1.2':['플레이어 소개','플레이어'],
        '0.1.2.0':['모델 정보','출처'],'0.1.2.1':['프롬프트 정보','출처'],'0.1.2.2':['배경음악 안내','출처'],
        '0.2.1.0':['대표 대사 화자','배경 위 대사'],'0.2.1.1':['대표 대사','배경 위 대사'],'0.3.6':['마무리 문구','마무리']},
      images:{'0.1.0.0':'등장인물 프로필','0.1.1.0':'플레이어 프로필','0.2':'배경 CG'},
      controls:[{key:'affinity',label:'호감도',group:'루트',type:'range',default:60,control:'affinity'},
        {key:'choiceList',label:'선택지',group:'선택지',type:'list',default:['좋아한다고 말한다','사실 아무것도 아니라고 한다'],control:'choices',path:'0.3.4'},
        {key:'choiceSelected',label:'강조할 선택지 번호 (0 = 없음)',group:'선택지',type:'number',default:1}]
    },
    book:{unit:'장',titleLabel:'장 제목',subtitleLabel:'장 부제',repeat:true,
      labels:{'0.0.0':['책 이름','책·장 표시'],'0.0.1':['상단 장 안내','책·장 표시'],'0.1.0':['장 번호 표기','책·장 표시'],
        '0.2.0.1':['인물 역할','등장인물'],'0.2.0.2':['인물 이름','등장인물'],'0.2.0.3':['인물 소개','등장인물'],
        '0.2.1.1':['화자 역할','화자'],'0.2.1.2':['화자 이름','화자'],'0.2.1.3':['화자 소개','화자'],
        '0.3':['모델·프롬프트·출처','출처'],'0.3.0':['봇 링크 이름','출처'],'0.5':['삽화 설명','삽화'],
        '0.15':['작가의 말','마무리'],'0.15.0':['음악 링크 이름','마무리']},
      images:{'0.2.0.0':'등장인물 프로필','0.2.1.0':'화자 프로필','0.4':'장 삽화'},
      controls:[{key:'bookProgress',label:'읽기 진행률',group:'페이지',type:'range',default:37,control:'progress',path:'0.13.0.0'},
        {key:'bookMinutes',label:'남은 읽기 시간 (분)',group:'페이지',type:'number',default:4},
        {key:'bookPage',label:'페이지 번호',group:'페이지',type:'number',default:48},
        {key:'botURL',label:'봇 링크 주소',group:'출처',type:'url',default:'',path:'0.3.0',attribute:'href'},
        {key:'musicURL',label:'음악 링크 주소',group:'마무리',type:'url',default:'',path:'0.15.0',attribute:'href'}]
    }
  };
  const clone=x=>JSON.parse(JSON.stringify(x));
  function prepare(d){
    const schema=schemas[d.config.kind];if(!schema)return d;
    d.editor=clone(schema);d.version=2;
    d.fields=d.fields.filter(f=>schema.labels[f.path]).map(f=>({...f,label:schema.labels[f.path][0],group:schema.labels[f.path][1]}));
    const source=new DOMParser().parseFromString(d.html,'text/html');
    if(schema.config){d.config={...d.config,...schema.config};for(const key of ['narration','speech','userSpeech','thought','separateName']){const node=source.querySelector('[data-pm-ref="'+d.config[key]+'"]');if(node)d.templates[key]=node.outerHTML;}}
    for(const [path,[label,group]] of Object.entries(schema.labels)){
      if(d.fields.some(f=>f.path===path))continue;
      const node=source.querySelector('[data-pm-ref="'+path+'"]');
      if(!node)throw Error(d.config.kind+' 입력칸 경로: '+path);
      [...node.childNodes].forEach((text,textIndex)=>{if(text.nodeType===3&&text.textContent.trim())d.fields.push({key:'edit_'+path.replaceAll('.','_')+'_'+textIndex,path,textIndex,label,group,type:'text',default:text.textContent});});
    }
    d.fields.push(...clone(schema.controls||[]));
    d.fields.forEach(f=>{if(schema.multiline?.includes(f.path))f.type='textarea';});
    for(const path of new Set(d.fields.map(f=>f.path))){const duplicates=d.fields.filter(f=>f.path===path&&f.type==='text');if(duplicates.length>1)duplicates.forEach((f,i)=>f.label+=' '+(i+1));}
    d.images.forEach(i=>{i.label=schema.images[i.path]||i.label;});
    d.images=d.images.filter(i=>!(d.config.remove||[]).some(path=>i.path===path||i.path.startsWith(path+'.')));
    if(schema.collection)d.images=d.images.filter(i=>!i.path.startsWith(schema.collection.path+'.'));
    return d;
  }
  function sceneData(log,scene){
    if(scene.id===(log.primarySceneId||log.scenes[0].id))return {image:log.image,designImages:log.designImages,values:log.values,collections:log.collections||={}};
    const states=scene.designStates||={};
    return states[log.preset.id]||=( {image:{src:'',ratio:log.image.ratio,width:100,x:50,y:50},designImages:clone(log.designImages||{}),values:clone(log.values),collections:{}} );
  }
  function collection(log,data=log){
    if(!log.preset.design?.editor?.collection)return [];
    data.collections||={};return data.collections[log.preset.id]||=(log.preset.design.editor.collection.captions.map((caption,i)=>({id:'film'+i,caption,hidden:false,image:{src:'',ratio:'3/2',width:100,x:50,y:50}})));
  }
  function finalize(doc,log,nodes){
    const d=log.preset.design;if(!d.editor)return;
    for(const f of d.fields){const n=nodes[f.path],v=log.values[f.key]??f.default;if(!n)continue;
      if(f.attribute==='href'){const url=window.PM.url(v);if(url)n.setAttribute('href',url);else n.removeAttribute('href');n.dataset.pmFocus='value';n.dataset.field=f.key;}
      if(f.control==='progress')n.style.width=Math.max(0,Math.min(100,Number(v)||0))+'%';
      if(f.control==='visible'&&!v)n.remove();
      if(f.control==='fontSize')n.style.fontSize=Math.max(f.min||9,Math.min(f.max||64,Number(v)||f.default))+'px';
    }
    if(d.config.kind==='book'){
      nodes['0.13.1.0'].textContent=`${log.values.bookProgress??37}% · 이 장에서 남은 시간 ${log.values.bookMinutes??4}분`;
      nodes['0.13.1.1'].textContent=`— ${log.values.bookPage??48} —`;
    }
    if(d.config.kind==='vn'){
      const list=nodes['0.3.4'],row=list.firstElementChild.cloneNode(true);list.replaceChildren();
      (log.values.choiceList||[]).forEach((text,i)=>{const n=row.cloneNode(true),selected=Number(log.values.choiceSelected)===i+1;
        n.textContent=(selected?'▶ ':'▷ ')+text;n.style.background=selected?'#f3dce9':'transparent';n.style.fontWeight=selected?'700':'400';list.append(n);});
    }
    if(d.config.kind==='news'){
      nodes['0.5'].style.gridTemplateColumns=log.values.newsPhotoPosition==='위쪽'?'minmax(0,1fr)':'repeat(auto-fit,minmax(min(100%,220px),1fr))';
      nodes['0.5.1'].style.columns=log.values.newsColumns==='2'?'220px 2':'auto 1';nodes['0.5.1'].style.columnGap='20px';
    }
    if(d.config.kind==='quest'){
      const box=nodes['0.4'],goals=log.values.questGoals||[];box.replaceChildren();
      goals.forEach(goal=>{const row=doc.createElement('div');row.textContent=(goal.done?'☑ ':'☐ ')+goal.text;if(goal.done){row.style.textDecoration='line-through';row.style.opacity='.65';}box.append(row);});
      const count=doc.createElement('small');count.textContent=goals.filter(g=>g.done).length+' / '+goals.length+' 완료';box.append(count);
    }
    if(d.config.kind==='script'){
      const list=nodes['0.0.1'],row=list.firstElementChild.cloneNode(true);list.replaceChildren();
      (log.values.castList||[]).forEach(text=>{const n=row.cloneNode(true);n.textContent=text;list.append(n);});
    }
    if(d.config.kind==='diary'){nodes['0.1.0.2'].textContent=log.values.weather||'맑음';nodes['0.1.0.3'].remove();}
    if(d.config.kind==='museum')nodes['0.4'].style.columns=log.values.museumColumns==='1'?'auto 1':'220px 2';
    if(d.config.kind==='photocard'){
      nodes['0.1.1'].textContent=log.title;nodes['0.1.0.1'].textContent=nodes['0.0.1'].textContent;
      nodes['0.0'].dataset.pmCard='main';nodes['0.1'].dataset.pmCard='back';
      nodes['0'].style.gridTemplateColumns='repeat(auto-fit,minmax(min(100%,230px),1fr))';
      nodes['0.0'].style.display='flex';nodes['0.0'].style.flexDirection='column';nodes['0.0'].style.justifyContent='flex-end';
      nodes['0.0.2'].style.position='relative';nodes['0.0.2'].style.marginTop='40px';
      nodes['0.0.2.2.1'].style.whiteSpace='nowrap';nodes['0.0.2.2.1'].style.flexShrink='0';
      for(const path of ['0.0','0.1']){const n=nodes[path];n.style.borderColor=log.values.cardFrame||'#ffffff';n.style.borderWidth=Math.max(0,Math.min(20,Number(log.values.cardBorder)||0))+'px';n.style.borderRadius=Math.max(0,Math.min(60,Number(log.values.cardRadius)||0))+'px';}
      if(log.values.showBack===false)nodes['0.1'].remove();
    }
    if(d.config.kind==='polaroid'){
      nodes['0.1'].style.gridTemplateColumns='repeat(auto-fit,minmax(min(100%,210px),1fr))';
      if(log._unitIndex>0)nodes['0.0'].remove();
      if(log._unitIndex<log._unitCount-1)nodes['0.4'].remove();
    }
    if(d.config.kind==='terminal'&&log.values.showProgress!==false){
      const p=doc.createElement('div'),progress=Math.max(0,Math.min(100,Number(log.values.connectionProgress)||0)),blocks=Math.round(progress/10);
      p.textContent='[CONNECT] '+ '█'.repeat(blocks)+'░'.repeat(10-blocks)+' '+progress+'%';p.style.cssText='font:12px/1.7 monospace;margin:12px 0;color:#7dff9a';nodes['0.8'].before(p);
    }
    if(d.editor.collection){
      const container=nodes[d.editor.collection.path];container.replaceChildren();container.style.display='grid';container.style.gridTemplateColumns='repeat(auto-fit,minmax(min(100%,130px),1fr))';container.style.gap='10px';
      collection(log).filter(p=>!p.hidden&&window.PM.url(p.image.src,true)).forEach((photo,i)=>{
        const item=doc.createElement('figure');item.style.cssText='margin:0;min-width:0';
        item.innerHTML=window.PM.imageHTML(photo.image)+`<figcaption style="font:11px/1.5 monospace;color:#c7a24a">${i+1} · ${window.PM.esc(photo.caption)}</figcaption>`;
        item.querySelector('[data-pm-focus]').dataset.field='film:'+photo.id;container.append(item);
      });
      if(!container.children.length)container.remove();
    }
    // Fixed photo widths and flex/grid minimums must fit a narrow post, too.
    for(const n of doc.body.querySelectorAll('*')){
      n.style.boxSizing='border-box';
      if(n.style.display==='flex')n.style.flexWrap='wrap';
      if(n.style.display==='grid'&&!n.style.gridTemplateColumns.includes('minmax('))n.style.gridTemplateColumns=n.style.gridTemplateColumns.replace(/(?<![\w.])1fr/g,'minmax(0,1fr)');
      n.style.minWidth='0';
      if(n.style.width&&n.style.width.endsWith('px'))n.style.maxWidth='100%';
    }
  }
  return {schemas,prepare,sceneData,collection,finalize};
})();
