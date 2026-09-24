(() => {
  'use strict';
  const encode=text=>new TextEncoder().encode(text);
  const crcTable=Uint32Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
  function crc32(bytes){let crc=0xffffffff;for(const byte of bytes)crc=crcTable[(crc^byte)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
  // Stored ZIP entries keep the original image bytes; UTF-8 filenames, standard ZIP32.
  function zip(entries){
    if(entries.length>65535)throw new Error('파일 수가 너무 많아요.');
    const chunks=[],directory=[];let offset=0,directorySize=0;
    for(const entry of entries){
      if(!entry.name||entry.name.includes('..')||entry.name.startsWith('/')||entry.name.includes('\\'))throw new Error('복사본 파일명을 확인해 주세요.');
      const name=encode(entry.name),bytes=entry.bytes,crc=crc32(bytes);
      if(name.length>65535||bytes.length+offset>0xffffffff)throw new Error('ZIP 크기 제한을 넘었어요.');
      const header=new Uint8Array(30+name.length),h=new DataView(header.buffer);
      h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint16(12,33,true);h.setUint32(14,crc,true);h.setUint32(18,bytes.length,true);h.setUint32(22,bytes.length,true);h.setUint16(26,name.length,true);header.set(name,30);
      const central=new Uint8Array(46+name.length),c=new DataView(central.buffer);
      c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);c.setUint16(14,33,true);c.setUint32(16,crc,true);c.setUint32(20,bytes.length,true);c.setUint32(24,bytes.length,true);c.setUint16(28,name.length,true);c.setUint32(42,offset,true);central.set(name,46);
      chunks.push(header,bytes);directory.push(central);offset+=header.length+bytes.length;directorySize+=central.length;
    }
    const footer=new Uint8Array(22),f=new DataView(footer.buffer);f.setUint32(0,0x06054b50,true);f.setUint16(8,entries.length,true);f.setUint16(10,entries.length,true);f.setUint32(12,directorySize,true);f.setUint32(16,offset,true);
    return new Blob([...chunks,...directory,footer],{type:'application/zip'});
  }
  function readBatch(value){
    if(!value||value.format!=='arca-upload-batch'||value.version!==1||typeof value.id!=='string'||!Array.isArray(value.ids)||!Array.isArray(value.names)||!value.ids.length||value.ids.length!==value.names.length||new Set(value.ids).size!==value.ids.length)return null;
    if(!value.ids.every(id=>typeof id==='string'&&/^[a-zA-Z0-9-]{1,80}$/.test(id))||!value.names.every(n=>/^\d{3,}\.(png|jpg|webp|gif|avif)$/.test(n)))return null;
    return {format:value.format,version:1,id:value.id,ids:[...value.ids],names:[...value.names],createdAt:typeof value.createdAt==='string'?value.createdAt:''};
  }
  function remapBatch(value,idMap){const batch=readBatch(value);if(!batch||batch.ids.some(id=>!idMap.has(id)))return null;return {...batch,ids:batch.ids.map(id=>idMap.get(id))};}
  function match(batch,ids,candidates){
    batch=readBatch(batch);
    if(!batch)return {ok:false,reason:'먼저 사용한 이미지 ZIP을 저장해 주세요.'};
    if(batch.ids.length!==ids.length||ids.some(id=>!batch.ids.includes(id)))return {ok:false,reason:'ZIP 저장 후 사용 이미지가 바뀌었어요. 새 ZIP을 만들어 업로드해 주세요.'};
    if(candidates.length!==batch.ids.length)return {ok:false,reason:`ZIP 이미지 ${batch.ids.length}장과 가져온 주소 ${candidates.length}개의 수가 달라 자동 연결하지 않았어요.`};
    if(candidates.some(x=>!x.valid||!x.url))return {ok:false,reason:'지원하지 않는 이미지 주소가 있어 자동 연결하지 않았어요.'};
    return {ok:true,urls:new Map(batch.ids.map((id,i)=>[id,candidates[i].url]))};
  }
  function bundle(html,assets){
    const A=window.ArcaAssets,C=window.ArcaCore;
    const ids=A.used(html).sort((a,b)=>(assets.get(a)?.addedAt||0)-(assets.get(b)?.addedAt||0));
    if(!ids.length)throw new Error('문서에 넣은 원본 이미지가 없어요.');
    if(ids.some(id=>!assets.has(id)))throw new Error('저장된 원본을 찾지 못한 이미지가 있어요. 원본 포함 프로젝트로 다시 열어주세요.');
    A.validate(ids.map(id=>assets.get(id)));
    const names=[],entries=[],labels=[],records=C.parse(html).records;
    ids.forEach((id,i)=>{const asset=assets.get(id),mime=asset.data.slice(11,asset.data.indexOf(';')),ext=mime==='jpeg'?'jpg':mime,name=String(i+1).padStart(3,'0')+'.'+ext;
      const raw=atob(asset.data.slice(asset.data.indexOf(',')+1)),bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
      names.push(name);entries.push({name:'images/'+name,bytes});labels.push({file:name,originalName:asset.name,label:records.find(r=>r.tag==='img'&&A.idOf(r.el?.getAttribute('src'))===id)?.el.getAttribute('alt')||'이미지 '+(i+1)});
    });
    const batch={format:'arca-upload-batch',version:1,id:crypto.randomUUID(),ids,names,createdAt:new Date().toISOString()};
    entries.push({name:'연결정보.json',bytes:encode(JSON.stringify({...batch,images:labels},null,2))});
    entries.push({name:'사용방법.txt',bytes:encode('원본 파일은 변경하지 않았습니다. images 폴더에 현재 문서에서 사용한 원본의 복사본만 담았습니다.\r\n1. ZIP을 풀고 images 폴더를 파일 이름 오름차순으로 정렬하세요.\r\n2. 001부터 번호순으로 아카라이브에 업로드하세요. 다른 이미지는 섞지 마세요.\r\n3. 업로드된 이미지의 HTML을 STUDIO의 주소 연결 창에 붙여넣고 주소 목록 읽기를 누르세요.\r\n4. 번호순 업로드 확인을 체크하면 ZIP 순서대로 연결안을 채웁니다. 확인 후 주소 연결 적용을 누르세요.\r\n업로드 중 순서가 달라지면 잘못 연결될 수 있으니 확인이 필요합니다. 파일명을 지운 URL만으로 이미지 내용을 판별하지는 않습니다.\r\nSTUDIO 프로젝트도 저장하면 ZIP 대응 정보를 함께 보관합니다.')});
    entries.push({name:'이미지목록.html',bytes:encode('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>업로드 이미지 목록</title><style>body{font:15px/1.6 sans-serif;padding:24px;background:#fbfaff;color:#34314d}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px}figure{margin:0;padding:12px;border:1px solid #8888CC;border-radius:8px}img{width:100%;height:180px;object-fit:contain}small{display:block;overflow-wrap:anywhere;color:#706a86}</style><h1>업로드 이미지 '+ids.length+'장</h1><p>images 폴더에서 001부터 번호순으로 업로드하세요. 원본 파일은 그대로입니다.</p><main>'+labels.map(x=>'<figure><img src="images/'+C.escape(x.file)+'" alt="'+C.escape(x.label)+'"><figcaption><strong>'+C.escape(x.file)+'</strong> · '+C.escape(x.label)+'<small>'+C.escape(x.originalName)+'</small></figcaption></figure>').join('')+'</main>')});
    return {blob:zip(entries),batch};
  }
  window.ArcaUpload={crc32,zip,readBatch,remapBatch,match,bundle};
})();
