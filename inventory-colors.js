(()=>{
  if(!document.querySelector('script[data-assistant-center]')){
    const s=document.createElement('script');
    s.src='assistant-center.js?v=1';
    s.dataset.assistantCenter='1';
    document.body.appendChild(s);
  }
  if(!document.querySelector('script[data-foodbags-list]')){
    const s=document.createElement('script');
    s.src='foodbags-list.js?v=1';
    s.dataset.foodbagsList='1';
    document.body.appendChild(s);
  }
  if(!document.querySelector('script[data-supplier-orders]')){
    const s=document.createElement('script');
    s.src='supplier-orders.js?v=1';
    s.dataset.supplierOrders='1';
    document.body.appendChild(s);
  }

  const backgrounds=[
    'linear-gradient(145deg,#e9f5ff,#dff0ff)',
    'linear-gradient(145deg,#eefaf1,#dff5e6)',
    'linear-gradient(145deg,#fff0f5,#ffe2ec)',
    'linear-gradient(145deg,#fff7e8,#ffedc9)',
    'linear-gradient(145deg,#f5f0ff,#e9e0ff)',
    'linear-gradient(145deg,#ebfbfa,#daf4f1)',
    'linear-gradient(145deg,#fff1eb,#ffe1d5)',
    'linear-gradient(145deg,#eef3ff,#dfe8ff)',
    'linear-gradient(145deg,#f4f9ea,#e6f2cf)',
    'linear-gradient(145deg,#fff4fc,#f5e2f3)',
    'linear-gradient(145deg,#eaf7ff,#dcefff)'
  ];
  const badges=['#e6f3fe','#e8f6ec','#ffebf2','#fff0d7','#eee7ff','#e1f6f3','#ffe9df','#e7edff','#ebf4d9','#f8e9f6'];

  const toneForCategory=(category)=>{
    const s=String(category||'אחר').trim().toLowerCase();
    let h=2166136261;
    for(let i=0;i<s.length;i++){
      h^=s.charCodeAt(i);
      h=Math.imul(h,16777619);
    }
    return Math.abs(h)%backgrounds.length;
  };

  function applyCategoryColors(){
    document.querySelectorAll('#inventoryGrid .product').forEach(card=>{
      const cat=card.querySelector('.cat')?.textContent?.trim()||'אחר';
      const tone=toneForCategory(cat);
      card.dataset.categoryTone=String(tone);
      card.dataset.categoryName=cat;
      card.style.setProperty('--badge-tint',badges[tone%badges.length]);
      const pic=card.querySelector('.pic');
      if(pic)pic.style.setProperty('background',backgrounds[tone],'important');
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
