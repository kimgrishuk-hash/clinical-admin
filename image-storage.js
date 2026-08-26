(()=>{
  if(window.__clinicImageStorage)return;window.__clinicImageStorage=true;
  const FILES='https://bhvkhxmexyhsjhwjsytp.supabase.co/functions/v1/clinic-files';
  let pendingFile=null;
  const imageCache=new Map();
  async function callFiles(body){const r=await fetch(FILES,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),cache:'no-store'});let j={};try{j=await r.json()}catch{}if(!r.ok)throw new Error(j.error||'שגיאה');return j}
  async function resolveImage(img){if(!img||img.dataset.loading==='1')return;const id=Number(img.dataset.clinicProductImage||0);if(!id)return;img.dataset.loading='1';try{let url=imageCache.get(id);if(!url){const j=await callFiles({action:'product_image',id});url=j.url||'';if(url)imageCache.set(id,url)}if(url){img.src=url;img.removeAttribute('data-clinic-product-image');img.style.display='block'}}catch(e){console.warn('product image',id,e)}finally{delete img.dataset.loading}}
  const observer='IntersectionObserver'in window?new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){observer.unobserve(e.target);resolveImage(e.target)}},{rootMargin:'250px'}):null;
  function scan(root=document){root.querySelectorAll?.('img[data-clinic-product-image]').forEach(img=>observer?observer.observe(img):resolveImage(img))}
  new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1)scan(n)}).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',()=>scan());

  const oldCard=window.productCard;
  if(typeof oldCard==='function')window.productCard=function(x,editable){
    let html=oldCard(x,editable);
    const ref=String(x?.image_url||'');
    if(ref&&(ref.startsWith('dbimg:')||ref.startsWith('storage:'))){
      const safe=ref.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      html=html.replace(new RegExp(`src="${safe}"`),`src="" data-clinic-product-image="${Number(x.id)||0}"`);
    }
    return html;
  };

  const oldOpen=window.openProduct;
  if(typeof oldOpen==='function')window.openProduct=function(id){pendingFile=null;const input=document.getElementById('prodImage');if(input)input.value='';return oldOpen(id)};
  window.readProductImage=function(e){pendingFile=e?.target?.files?.[0]||null;if(pendingFile&&!/^image\/(jpeg|png|webp)$/i.test(pendingFile.type)){alert('אפשר להעלות JPG, PNG או WEBP');pendingFile=null;if(e?.target)e.target.value=''}};

  async function uploadImage(file){
    const prep=await callFiles({action:'prepare_upload',mime_type:file.type,size_bytes:file.size,category:'other'});
    const up=await fetch(prep.signed_url,{method:'PUT',headers:{'content-type':file.type},body:file});
    if(!up.ok)throw new Error('העלאת התמונה נכשלה');
    return 'storage:'+prep.path;
  }

  window.saveProduct=async function(){
    const id=document.getElementById('prodId')?.value||'';
    let imageRef=typeof productImageData==='string'?productImageData:null;
    try{if(pendingFile)imageRef=await uploadImage(pendingFile)}catch(e){alert(e.message||'לא הצלחתי להעלות תמונה');return}
    const item={name:document.getElementById('prodName')?.value.trim()||'',category:document.getElementById('prodCat')?.value.trim()||'אחר',price_ils:document.getElementById('prodPrice')?.value??'',details:document.getElementById('prodDetails')?.value||'',image_url:imageRef||null,target_qty:document.getElementById('prodTarget')?.value??0,current_qty:document.getElementById('prodCurrent')?.value??0};
    if(!item.name)return alert('צריך שם מוצר');
    try{await api({action:id?'update':'create',id,item});pendingFile=null;closeProduct();await loadAll()}catch(e){alert('לא הצלחתי לשמור: '+e.message)}
  };
})();
