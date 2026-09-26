(() => {
  'use strict';
  const PREFIX='arca-local:', MAX=20*1024*1024, TOTAL=100*1024*1024;
  const validData=value=>typeof value==='string'&&/^data:image\/(png|jpeg|webp|gif|avif);base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
  const idOf=src=>String(src||'').startsWith(PREFIX)?String(src).slice(PREFIX.length):null;
  const used=html=>[...new Set(ArcaCore.parse(html).records.filter(r=>r.tag==='img').map(r=>idOf(r.el?.getAttribute('src'))).filter(Boolean))];
  let dbPromise;
  function database(){return dbPromise||(dbPromise=new Promise((resolve,reject)=>{const req=indexedDB.open('arca-studio-images',1);req.onupgradeneeded=()=>req.result.createObjectStore('images',{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);}));}
  async function load(){const db=await database();return new Promise((resolve,reject)=>{const req=db.transaction('images').objectStore('images').getAll();req.onsuccess=()=>resolve(new Map(req.result.map(x=>[x.id,x])));req.onerror=()=>reject(req.error);});}
  async function put(items){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('images','readwrite');for(const item of items)tx.objectStore('images').put(item);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('이미지 저장 실패'));});}
  function validate(items){
    if(!Array.isArray(items))throw new Error('프로젝트 이미지 목록을 확인해 주세요.');
    const seen=new Set();let size=0;
    for(const a of items){if(!a||typeof a.id!=='string'||!/^[a-zA-Z0-9-]{1,80}$/.test(a.id)||seen.has(a.id)||typeof a.name!=='string'||!validData(a.data)||a.data.length>MAX*1.38)throw new Error('지원하지 않거나 너무 큰 프로젝트 이미지예요.');seen.add(a.id);size+=a.data.length;}
    if(size>TOTAL*1.38)throw new Error('이미지 합계는 100MB까지 지원해요.');return items;
  }
  async function fromFiles(files){
    const list=[...files];if(list.reduce((n,f)=>n+f.size,0)>TOTAL)throw new Error('한 번에 100MB까지 넣을 수 있어요.');
    const items=[],addedAt=Date.now();
    for(const file of list){
      if(!/^image\/(png|jpeg|webp|gif|avif)$/.test(file.type)||file.size>MAX)throw new Error('PNG·JPG·WebP·GIF·AVIF, 한 장당 20MB까지 지원해요.');
      const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(file);});
      await new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=()=>reject(new Error(file.name+' 이미지를 읽지 못했어요.'));img.src=data;});
      items.push({id:crypto.randomUUID(),name:file.name,data,addedAt:addedAt+items.length});
    }
    return validate(items);
  }
  function pack(html,assets,name){return {format:'arca-studio',version:2,name,guideVersion:'6.6',html,assets:used(html).map(id=>assets.get(id)).filter(Boolean),savedAt:new Date().toISOString()};}
  function unpack(data){
    if(data?.format!=='arca-studio'||![1,2].includes(data.version)||typeof data.html!=='string')throw new Error('Arca Studio 프로젝트 파일이 아니에요.');
    const items=validate(data.assets||[]),ids=new Map(items.map(a=>[a.id,crypto.randomUUID()]));
    let html=data.html;const model=ArcaCore.parse(html);
    for(const r of [...model.records].reverse()){if(r.tag!=='img'||!r.el)continue;const id=idOf(r.el.getAttribute('src'));if(ids.has(id))html=ArcaCore.patch(html,r.start,r.openEnd,ArcaCore.openingWith(r,{src:PREFIX+ids.get(id)}));}
    return {html,name:data.name,assets:items.map(a=>({...a,id:ids.get(a.id)})),assetIdMap:ids};
  }
  window.ArcaAssets={PREFIX,validData,idOf,used,load,put,validate,fromFiles,pack,unpack};
})();
