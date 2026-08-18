(()=>{
  const toneForCategory=(category)=>{
    const s=String(category||'אחר').trim().toLowerCase();
    let h=2166136261;
    for(let i=0;i<s.length;i++){
      h^=s.charCodeAt(i);
      h=Math.imul(h,16777619);
    }
    return Math.abs(h)%10;
  };

  function applyCategoryColors(){
    document.querySelectorAll('#inventoryGrid .product').forEach(card=>{
      const cat=card.querySelector('.cat')?.textContent?.trim()||'אחר';
      card.dataset.categoryTone=String(toneForCategory(cat));
      card.dataset.categoryName=cat;
    });
  }

  function boot(){
    const grid=document.getElementById('inventoryGrid');
    if(!grid)return false;
    applyCategoryColors();
    if(!grid.__categoryColorObserver){
      const obs=new MutationObserver(()=>applyCategoryColors());
      obs.observe(grid,{childList:true,subtree:true,characterData:true});
      grid.__categoryColorObserver=obs;
    }
    return true;
  }

  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    if(boot()||tries>40)clearInterval(timer);
  },200);
  if(document.readyState!=='loading')boot();
})();
