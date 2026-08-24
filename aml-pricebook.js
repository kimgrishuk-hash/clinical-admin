(()=>{
'use strict';
if(window.__clinicAmlPricebookPatch)return;
window.__clinicAmlPricebookPatch=true;

const AML_PREFIX='10. AML — מחירון 2026 /';
const AML_LABEL='AML מעבדה חיצונית';
const collator=new Intl.Collator('he-IL',{numeric:true,sensitivity:'base'});
let amlMode=false,installed=false;

const e=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const isAml=x=>String(x?.category||'').startsWith(AML_PREFIX);
const sortNatural=(a,b)=>collator.compare(String(a),String(b));
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
const money=v=>num(v).toLocaleString('he-IL',{maximumFractionDigits:2})+' ₪';
const memberMoney=v=>Math.ceil(num(v)).toLocaleString('he-IL')+' ₪';
const regularRange=x=>{if(num(x.regular_price_min)===0)return 'לפי הערה';const a=num(x.regular_price_min),b=x.regular_price_max==null?null:num(x.regular_price_max);return b!=null&&b!==a?money(a)+'–'+money(b):money(a)};
const memberRange=x=>{if(num(x.regular_price_min)===0)return '—';const d=(100-num(x.discount_percent??20))/100;const a=num(x.regular_price_min),b=x.regular_price_max==null?null:num(x.regular_price_max);return b!=null&&b!==a?memberMoney(a*d)+'–'+memberMoney(b*d):memberMoney(a*d)};
function allPrices(){try{return Array.isArray(prices)?prices:[]}catch{return []}}
function editing(){try{return !!settingsMode}catch{return false}}

function filterOptions(amlOnly){
 const raw=[...new Set((amlOnly?allPrices().filter(isAml):allPrices()).map(x=>x.category).filter(Boolean))].sort(sortNatural);
 return raw.map(c=>({value:c,label:amlOnly?c.replace(AML_PREFIX,''):c}));
}
function syncCategoryFilter(amlOnly,reset=false){
 const select=document.getElementById('priceCategory');if(!select)return;
 const opts=filterOptions(amlOnly),sig=(amlOnly?'aml|':'all|')+opts.map(o=>o.value).join('\u0001');
 if(!reset&&select.dataset.amlCategorySig===sig)return;
 const prev=reset?'':select.value;
 select.innerHTML='<option value="">כל הקטגוריות</option>'+opts.map(o=>`<option value="${e(o.value)}">${e(o.label)}</option>`).join('');
 if(prev&&opts.some(o=>o.value===prev))select.value=prev;
 select.dataset.amlCategorySig=sig;
}
function renderPriceRows(){
 const search=document.getElementById('priceSearch'),select=document.getElementById('priceCategory'),list=document.getElementById('procedurePriceList');if(!search||!select||!list)return;
 syncCategoryFilter(amlMode,false);
 const q=String(search.value||'').trim().toLowerCase(),cat=select.value||'';let arr=allPrices();if(amlMode)arr=arr.filter(isAml);
 arr=arr.filter(x=>(!cat||x.category===cat)&&(!q||(String(x.name||'')+' '+String(x.category||'')+' '+String(x.note||'')).toLowerCase().includes(q)));
 const groups={};arr.forEach(x=>(groups[x.category]??=[]).push(x));const canEdit=editing();
 list.innerHTML=Object.keys(groups).sort(sortNatural).map(c=>{const heading=amlMode?c.replace(AML_PREFIX,''):c;return `<div class="card pricegroup"><h3>${e(heading)}</h3>${groups[c].map(x=>`<div class="price-row"><div class="name"><b>${e(x.name)}</b>${x.note?`<div class="muted">${e(x.note)}</div>`:''}</div><div><span class="muted">רגיל:</span> <b>${regularRange(x)}</b></div><div class="member">מנוי זהב: ${memberRange(x)}</div>${canEdit?`<button class="btn" onclick="openPrice(${x.id})">עריכה</button>`:''}</div>`).join('')}</div>`}).join('')||'<p class="muted">אין תוצאות</p>';
}
function install(){
 if(installed)return true;if(typeof window.showInventoryMode!=='function'||typeof window.showPriceMode!=='function'||typeof window.renderPrices!=='function')return false;
 const panel=document.getElementById('prices'),tabs=panel?.querySelector('.tabs');if(!panel||!tabs)return false;installed=true;
 let amlBtn=document.getElementById('amlBtn');if(!amlBtn){amlBtn=document.createElement('button');amlBtn.id='amlBtn';amlBtn.type='button';amlBtn.className='subtab';amlBtn.textContent=AML_LABEL;amlBtn.addEventListener('click',()=>window.showPriceMode('aml'));tabs.appendChild(amlBtn)}
 const originalShow=window.showPriceMode;
 window.showPriceMode=function(mode){const nextAml=mode==='aml';amlMode=nextAml;const title=panel.querySelector('.sectionbar h2'),search=document.getElementById('priceSearch');if(nextAml){originalShow.call(this,'procedures');document.getElementById('procBtn')?.classList.remove('active');document.getElementById('productsBtn')?.classList.remove('active');amlBtn.classList.add('active');if(title)title.textContent=AML_LABEL;if(search){search.value='';search.placeholder='חיפוש ב-AML...'}syncCategoryFilter(true,true);renderPriceRows();return}amlBtn.classList.remove('active');if(title)title.textContent='מחירון';if(search)search.placeholder='חיפוש בפרוצדורות...';const r=originalShow.apply(this,arguments);syncCategoryFilter(false,true);if(mode==='procedures')renderPriceRows();return r};
 window.renderPrices=renderPriceRows;syncCategoryFilter(false,true);renderPriceRows();return true;
}
const timer=setInterval(()=>{if(install())clearInterval(timer)},200);if(document.readyState!=='loading')install();
})();
