(()=>{
const PLANS=[
  {
    id:'puppy',
    title:'מנוי גורים / Puppy Plan',
    subtitle:'בתוקף ל־4 חודשים / Valid for 4 months',
    listTotal:'1,720–1,940 ₪',
    clinicPrice:'890 ₪',
    clinicNote:'',
    goldPrice:null,
    goldNote:'',
    items:[
      ['בדיקה רפואית','Medical examination','1','200 ₪'],
      ['חיסון משושה','6-in-1 vaccine','3','600 ₪ = 3 × 200'],
      ['תילוע','Deworming','1','100 ₪'],
      ['שבב','Microchip','1','150 ₪'],
      ['כלבת לא כולל אגרה','Rabies vaccine — fee not included','2','320 ₪ = 2 × 160'],
      ['תולעת הפארק','Spirocerca prevention','1','120 ₪'],
      ['קיצוץ / גזירת ציפורניים','Nail trim','—','80–100 ₪'],
      ['ריקון / ניקוי שקים אנאליים','Anal gland expression','—','150 ₪']
    ]
  },
  {
    id:'adult-under-20',
    title:'מנוי בוגר / Adult Plan',
    subtitle:'עד 20 ק״ג / Up to 20 kg',
    listTotal:'1,370–1,390 ₪',
    clinicPrice:'750 ₪',
    clinicNote:'ללא בדיקה רפואית / Medical examination not included',
    goldPrice:'900 ₪',
    goldNote:'20% הנחה על כל הפרוצדורות, בדיקות דם, ניקוי שיניים וכו׳ / 20% off procedures, blood tests, dental cleaning, etc.',
    items:[
      ['בדיקה רפואית','Medical examination','1','200 ₪'],
      ['חיסון משושה','6-in-1 vaccine','1','190 ₪'],
      ['תילוע','Deworming','2','120 ₪ = 2 × 60'],
      ['תולעת הפארק','Spirocerca prevention','4','480 ₪ = 4 × 120'],
      ['כלבת לא כולל אגרה','Rabies vaccine — fee not included','1','150 ₪'],
      ['קיצוץ / גזירת ציפורניים','Nail trim','—','80–100 ₪'],
      ['ריקון / ניקוי שקים אנאליים','Anal gland expression','—','150 ₪']
    ]
  },
  {
    id:'adult-20-30',
    title:'מנוי בוגר / Adult Plan',
    subtitle:'20–30 ק״ג / 20–30 kg',
    listTotal:'1,520–1,540 ₪',
    clinicPrice:'850 ₪',
    clinicNote:'ללא בדיקה רפואית / Medical examination not included',
    goldPrice:'1,000 ₪',
    goldNote:'20% הנחה על כל הפרוצדורות, בדיקות דם, ניקוי שיניים וכו׳ / 20% off procedures, blood tests, dental cleaning, etc.',
    items:[
      ['בדיקה רפואית','Medical examination','1','200 ₪'],
      ['חיסון משושה','6-in-1 vaccine','1','190 ₪'],
      ['תילוע','Deworming','2','180 ₪ = 2 × 90'],
      ['תולעת הפארק','Spirocerca prevention','4','560 ₪ = 4 × 140'],
      ['כלבת לא כולל אגרה','Rabies vaccine — fee not included','1','160 ₪'],
      ['קיצוץ / גזירת ציפורניים','Nail trim','—','80–100 ₪'],
      ['ריקון / ניקוי שקים אנאליים','Anal gland expression','—','150 ₪']
    ]
  },
  {
    id:'adult-30-40',
    title:'מנוי בוגר / Adult Plan',
    subtitle:'30–40 ק״ג / 30–40 kg',
    listTotal:'1,700–1,720 ₪',
    clinicPrice:'950 ₪',
    clinicNote:'ללא בדיקה רפואית / Medical examination not included',
    goldPrice:'1,100 ₪',
    goldNote:'20% הנחה על כל הפרוצדורות, בדיקות דם, ניקוי שיניים וכו׳ / 20% off procedures, blood tests, dental cleaning, etc.',
    items:[
      ['בדיקה רפואית','Medical examination','1','200 ₪'],
      ['חיסון משושה','6-in-1 vaccine','1','190 ₪'],
      ['תילוע','Deworming','2','280 ₪ = 2 × 140'],
      ['תולעת הפארק','Spirocerca prevention','4','640 ₪ = 4 × 160'],
      ['כלבת לא כולל אגרה','Rabies vaccine — fee not included','1','160 ₪'],
      ['קיצוץ / גזירת ציפורניים','Nail trim','—','80–100 ₪'],
      ['ריקון / ניקוי שקים אנאליים','Anal gland expression','—','150 ₪']
    ]
  },
  {
    id:'adult-over-40',
    title:'מנוי בוגר / Adult Plan',
    subtitle:'מעל 40 ק״ג / Over 40 kg',
    listTotal:'1,800–1,820 ₪',
    clinicPrice:'1,050 ₪',
    clinicNote:'ללא בדיקה רפואית / Medical examination not included',
    goldPrice:'1,200 ₪',
    goldNote:'20% הנחה על כל הפרוצדורות, בדיקות דם, ניקוי שיניים וכו׳ / 20% off procedures, blood tests, dental cleaning, etc.',
    items:[
      ['בדיקה רפואית','Medical examination','1','200 ₪'],
      ['חיסון משושה','6-in-1 vaccine','1','190 ₪'],
      ['תילוע','Deworming','2','300 ₪ = 2 × 150'],
      ['תולעת הפארק','Spirocerca prevention','4','720 ₪ = 4 × 180'],
      ['כלבת לא כולל אגרה','Rabies vaccine — fee not included','1','160 ₪'],
      ['קיצוץ / גזירת ציפורניים','Nail trim','—','80–100 ₪'],
      ['ריקון / ניקוי שקים אנאליים','Anal gland expression','—','150 ₪']
    ]
  }
];
const escP=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function addStyles(){if(document.getElementById('subscriptionStyles'))return;const s=document.createElement('style');s.id='subscriptionStyles';s.textContent=`
#subscriptions{padding-bottom:20px}.subscription-search-row{margin-bottom:12px}.subscription-list{display:grid;gap:14px}.subscription-card{overflow:hidden}.subscription-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;padding:17px 18px;background:linear-gradient(110deg,#fff 0%,#f8fbfd 100%);border-bottom:1px solid #e1e9ef}.subscription-title{margin:0;color:#173a5f;font-size:21px}.subscription-subtitle{color:#687e91;font-size:13px;margin-top:4px}.subscription-prices{display:grid;grid-template-columns:repeat(3,minmax(145px,1fr));gap:8px;padding:12px 16px;background:#fbfcfd;border-bottom:1px solid #e8eef2}.subscription-price{background:#fff;border:1px solid #dbe5ec;border-radius:10px;padding:10px}.subscription-price span{display:block;color:#73879a;font-size:11px;font-weight:700}.subscription-price b{display:block;color:#1e4c72;font-size:19px;margin-top:3px}.subscription-price.gold{background:#fffaf0;border-color:#ead9ab}.subscription-price.gold b{color:#8a6414}.subscription-note{font-size:10px;color:#6f8293;line-height:1.35;margin-top:5px}.subscription-table{width:100%;border-collapse:collapse}.subscription-table th,.subscription-table td{padding:10px 14px;text-align:right;border-top:1px solid #edf1f4;vertical-align:top}.subscription-table th{background:#f6f9fb;color:#4c6982;font-size:11px}.subscription-table td{font-size:12px}.subscription-service-he{font-weight:800;color:#28455f}.subscription-service-en{color:#7a8d9e;font-size:10px;margin-top:2px;direction:ltr;text-align:right}.subscription-qty{font-weight:800;white-space:nowrap}.subscription-line-price{font-weight:800;color:#2d6d9f;white-space:nowrap}.subscription-empty{padding:18px;color:#75899d}.subscription-source-note{padding:9px 16px 14px;color:#8091a0;font-size:10px}.subscription-tab-badge{display:inline-block;margin-right:5px;font-size:10px;opacity:.72}
@media(max-width:760px){.subscription-head{padding:14px}.subscription-title{font-size:18px}.subscription-prices{grid-template-columns:1fr;padding:9px}.subscription-table th,.subscription-table td{padding:9px 7px;font-size:11px}.subscription-table th:nth-child(2),.subscription-table td:nth-child(2){width:48px;text-align:center}.subscription-service-en{font-size:9px}.subscription-line-price{white-space:normal}.subscription-card{overflow-x:auto}.subscription-table{min-width:560px}}
`;document.head.appendChild(s)}
function planMatches(p,q){if(!q)return true;const hay=[p.title,p.subtitle,p.listTotal,p.clinicPrice,p.goldPrice,p.clinicNote,p.goldNote,...p.items.flat()].join(' ').toLowerCase();return hay.includes(q)}
function planCard(p){return `<article class="card subscription-card" data-subscription-id="${escP(p.id)}"><div class="subscription-head"><div><h3 class="subscription-title">${escP(p.title)}</h3><div class="subscription-subtitle">${escP(p.subtitle)}</div></div></div><div class="subscription-prices"><div class="subscription-price"><span>מחיר מחירון / List price</span><b>${escP(p.listTotal)}</b></div><div class="subscription-price"><span>מחיר מנוי מרפאה / Clinic plan</span><b>${escP(p.clinicPrice)}</b>${p.clinicNote?`<div class="subscription-note">${escP(p.clinicNote)}</div>`:''}</div>${p.goldPrice?`<div class="subscription-price gold"><span>מחיר מנוי זהב / Gold plan</span><b>${escP(p.goldPrice)}</b>${p.goldNote?`<div class="subscription-note">${escP(p.goldNote)}</div>`:''}</div>`:''}</div><table class="subscription-table"><thead><tr><th>מה כלול / Included</th><th>כמות / Qty</th><th>מחיר מחירון / List price</th></tr></thead><tbody>${p.items.map(i=>`<tr><td><div class="subscription-service-he">${escP(i[0])}</div><div class="subscription-service-en">${escP(i[1])}</div></td><td class="subscription-qty">${escP(i[2])}</td><td class="subscription-line-price">${escP(i[3])}</td></tr>`).join('')}</tbody></table></article>`}
window.renderSubscriptions=function(){const box=document.getElementById('subscriptionList');if(!box)return;const q=String(document.getElementById('subscriptionSearch')?.value||'').trim().toLowerCase();const arr=PLANS.filter(p=>planMatches(p,q));box.innerHTML=arr.length?arr.map(planCard).join(''):'<div class="card subscription-empty">לא נמצאו מנויים / No plans found</div>'};
window.jumpSubscription=function(id){const btn=document.querySelector('[data-tab="subscriptions"]');if(btn&&typeof window.showTab==='function')window.showTab('subscriptions',btn);const input=document.getElementById('subscriptionSearch');if(input){input.value='';renderSubscriptions()}requestAnimationFrame(()=>document.querySelector(`[data-subscription-id="${CSS.escape(String(id))}"]`)?.scrollIntoView({behavior:'smooth',block:'start'}));const g=document.getElementById('globalSearch');if(g)g.value='';document.getElementById('globalResults')?.classList.add('hidden')};
function inject(){if(document.getElementById('subscriptions'))return;addStyles();const pricesTab=document.querySelector('[data-tab="prices"]'),tabs=pricesTab?.parentElement,pricesPanel=document.getElementById('prices');if(!tabs||!pricesPanel)return;const btn=document.createElement('button');btn.className='tab';btn.dataset.tab='subscriptions';btn.setAttribute('onclick',"showTab('subscriptions',this)");btn.innerHTML='מנויים <span class="subscription-tab-badge">Plans</span>';tabs.appendChild(btn);const sec=document.createElement('section');sec.id='subscriptions';sec.className='panel hidden';sec.innerHTML='<div class="sectionbar"><h2>מנויים / Plans</h2></div><div class="row subscription-search-row"><input id="subscriptionSearch" class="search" style="flex:1" placeholder="חיפוש במנויים בעברית או באנגלית... / Search plans..." oninput="renderSubscriptions()"></div><div id="subscriptionList" class="subscription-list"></div>';pricesPanel.insertAdjacentElement('afterend',sec);renderSubscriptions();
const original=window.renderGlobal;if(typeof original==='function'&&!window.__subscriptionsGlobalSearch){window.__subscriptionsGlobalSearch=true;window.renderGlobal=function(){original.apply(this,arguments);const input=document.getElementById('globalSearch'),box=document.getElementById('globalResults'),q=String(input?.value||'').trim().toLowerCase();if(!q||!box)return;const matches=PLANS.filter(p=>planMatches(p,q)).slice(0,5);if(matches.length){const html=matches.map(p=>`<div class="result" onclick="jumpSubscription('${escP(p.id)}')"><b>מנוי / Plan:</b> ${escP(p.title)} — ${escP(p.subtitle)}</div>`).join('');const emptyOnly=box.children.length===1&&box.firstElementChild?.classList.contains('muted')&&box.textContent.includes('לא נמצאו');if(emptyOnly)box.innerHTML=html;else box.insertAdjacentHTML('beforeend',html);box.classList.remove('hidden')}}}
}
function boot(){inject()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();