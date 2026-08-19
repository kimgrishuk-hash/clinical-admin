(()=>{
const SECTIONS=[
  {title:'פרמינה – Team Breeder',note:'לפי דף ההזמנה – משלימים לכמות הרשומה',rows:[
    {id:190,expected:'8',min:8},
    {id:185,expected:'5–6',min:5},
    {id:175,expected:'1',min:1},
    {id:182,expected:'1',min:1},
    {id:166,expected:'1',min:1}
  ]},
  {title:'פרמינה – Vet Life',rows:[
    {id:168,expected:'5',min:5},
    {id:186,expected:'1',min:1},
    {id:138,expected:'4',min:4},
    {id:170,expected:'2',min:2},
    {id:143,expected:'3',min:3},
    {id:151,expected:'2',min:2},
    {id:163,expected:'1',min:1},
    {id:194,expected:'1',min:1},
    {id:180,expected:'1',min:1},
    {id:154,expected:'1',min:1}
  ]},
  {title:'N&D',note:'הסדר נשמר לפי הדף: אושן → כבש → עוף ורימון',subsections:[
    {title:'גור מיני – שק אחד מכל משקל',rows:[
      {id:135,expected:'1',min:1},{id:148,expected:'1',min:1},
      {id:172,expected:'1',min:1},{id:165,expected:'1',min:1},
      {id:141,expected:'1',min:1},{id:134,expected:'1',min:1}
    ]},
    {title:'בוגר מיני – שק אחד מכל משקל',rows:[
      {id:192,expected:'1',min:1},{id:187,expected:'1',min:1},
      {id:167,expected:'1',min:1},{id:193,expected:'1',min:1},
      {id:155,expected:'1',min:1},{id:176,expected:'1',min:1}
    ]},
    {title:'בוגר מיני – קינואה הרינג',rows:[
      {id:159,expected:'1',min:1},{id:158,expected:'1',min:1}
    ]},
    {title:'בוגר מיני – כלב לבן',rows:[
      {id:178,expected:'1',min:1,paper:'בדף רשום שק קטן 2.5 ק״ג; במלאי הקיים הפריט הוא 2 ק״ג'},
      {id:160,expected:'1',min:1}
    ]}
  ]},
  {title:'Cibau',rows:[
    {id:133,expected:'2',min:2},
    {id:137,expected:'2',min:2},
    {id:183,expected:'1',min:1}
  ]},
  {title:'Virbac – לא דרך פרמינה',note:'בדף לא צוינה כמות קבועה – בודקים חוסר ומזמינים לפי הצורך',rows:[
    {id:149,expected:'לפי צורך',min:null},
    {id:152,expected:'לפי צורך',min:null},
    {id:189,expected:'לפי צורך',min:null}
  ]}
];
const escFood=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const allRows=()=>SECTIONS.flatMap(s=>s.rows||s.subsections?.flatMap(x=>x.rows)||[]);
const productList=()=>{try{return typeof products!=='undefined'&&Array.isArray(products)?products:[]}catch{return[]}};
const productById=id=>productList().find(x=>Number(x.id)===Number(id));
function addAssets(){if(!document.querySelector('link[data-foodbags-list]')){const l=document.createElement('link');l.rel='stylesheet';l.href='foodbags-list.css?v=1';l.dataset.foodbagsList='1';document.head.appendChild(l)}}
function addSideNav(){const nav=document.querySelector('#clinicSidebar nav');if(!nav||nav.querySelector('[data-view="foodbags"]'))return false;const b=document.createElement('button');b.className='clinic-nav-btn';b.dataset.view='foodbags';b.setAttribute('onclick',"clinicNavigate('foodbags')");b.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h10l2 5v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8l2-5Z"/><path d="M5 8h14M9 12h6"/></svg><span>שקי אוכל</span>';const inv=nav.querySelector('[data-view="inventory"]');inv?.insertAdjacentElement('afterend',b)||nav.appendChild(b);return true}
function setupPanel(){const p=document.getElementById('foodbags');if(!p)return false;if(p.dataset.dedicatedFoodbags==='1')return true;p.dataset.dedicatedFoodbags='1';p.classList.add('foodbags-dedicated');p.innerHTML=`<div class="foodbag-page-head"><div><h2>שקי אוכל</h2><p>מעקב שקי המזון לפי סדר דף ההזמנות של המרפאה</p></div><button id="newFoodProductBtn" class="btn primary hidden" onclick="openFoodProduct()">+ שק חדש</button></div><div class="foodbag-instructions"><section class="foodbag-note"><h3>הוראות הזמנת אוכל</h3><ul><li>מזמינים ביום א׳, רצוי עד 14:00. אם צריך, לפעמים אפשר להוסיף דברים עד יום ב׳ בבוקר.</li><li>מכינים רשימה ושולחים לקבוצת הוואטסאפ של הזמנות פרמינה.</li><li>משלימים את המלאי לפי הכמויות שמופיעות ליד כל שק ברשימה.</li></ul></section><section class="foodbag-note virbac"><h3>Virbac – שקים שלא דרך פרמינה</h3><ul><li>Dermatology / Dermatosis – 3 ק״ג ו־12 ק״ג.</li><li>W2 – בעיקר לסימה וידמן, לפי ההערה בדף.</li><li>השקים נמכרים במבצע 3+1.</li></ul><a class="foodbag-phone" href="tel:0547864645">מתן – סוכן Virbac: 054-786-4645</a></section></div><div class="foodbag-search-wrap"><input id="foodSearch" class="search" placeholder="חיפוש שק בעברית או באנגלית..." oninput="renderFoodBags()"></div><div id="foodGrid" class="foodbag-list"></div>`;return true}
function rowHtml(row,query=''){const x=productById(row.id);if(!x)return `<div class="foodbag-row"><div class="foodbag-image"><span class="fallback">📦</span></div><div class="foodbag-name"><b>פריט חסר במלאי</b><small>ID ${row.id}</small></div><div class="foodbag-target"><span class="foodbag-label">אמור להיות</span><strong>${escFood(row.expected)}</strong></div><div class="foodbag-current"><span class="foodbag-label">יש כרגע</span><div class="foodbag-status">צריך להשלים את פרטי הפריט</div></div></div>`;const hay=(x.name+' '+(x.details||'')).toLowerCase();if(query&&!hay.includes(query))return '';const cur=Number(x.current_qty||0);const low=row.min!=null&&cur<Number(row.min);const img=x.image_url?`<img src="${escFood(x.image_url)}" alt="${escFood(x.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span class="fallback" style="display:none">📦</span>`:'<span class="fallback">📦</span>';return `<div class="foodbag-row ${low?'is-low':''}" data-foodbag-id="${x.id}"><div class="foodbag-image">${img}</div><div class="foodbag-name"><b>${escFood(x.name)}</b>${x.details?`<small>${escFood(x.details)}</small>`:''}${row.paper?`<div class="foodbag-paper-note">${escFood(row.paper)}</div>`:''}</div><div class="foodbag-target"><span class="foodbag-label">אמור להיות</span><strong>${escFood(row.expected)}</strong></div><div class="foodbag-current"><span class="foodbag-label">יש כרגע</span><div class="foodbag-current-line"><button class="foodbag-stock-btn" onclick="foodBagAdjust(${x.id},-1)" aria-label="הורד שק">−</button><span class="foodbag-current-num">${cur}</span><button class="foodbag-stock-btn" onclick="foodBagAdjust(${x.id},1)" aria-label="הוסף שק">+</button></div><div class="foodbag-status">${row.min==null?'בדיקה לפי צורך':low?'חסר לעומת הכמות הרצויה':'כמות תקינה'}</div></div></div>`}
function sectionHtml(section,q){let body='';if(section.rows){body=section.rows.map(r=>rowHtml(r,q)).join('')}else{body=(section.subsections||[]).map(sub=>{const rows=sub.rows.map(r=>rowHtml(r,q)).join('');return rows?`<div class="foodbag-subtitle">${escFood(sub.title)}</div>${rows}`:''}).join('')}if(!body)return '';return `<section class="foodbag-group"><div class="foodbag-group-title"><b>${escFood(section.title)}</b>${section.note?`<span>${escFood(section.note)}</span>`:''}</div>${body}</section>`}
function renderDedicatedFoodBags(){if(!setupPanel())return;const q=(document.getElementById('foodSearch')?.value||'').trim().toLowerCase();const box=document.getElementById('foodGrid');if(!box)return;const h=SECTIONS.map(s=>sectionHtml(s,q)).join('');box.innerHTML=h||'<div class="foodbag-empty">לא נמצאו שקים שמתאימים לחיפוש.</div>'}
window.foodBagAdjust=async(id,delta)=>{try{if(typeof adjustQty!=='function')throw new Error('עדכון מלאי לא זמין');await adjustQty(id,delta);renderDedicatedFoodBags()}catch(e){alert('לא הצלחתי לעדכן את כמות השקים: '+e.message)}};
window.renderFoodBags=renderDedicatedFoodBags;
function boot(){addAssets();const ready=setupPanel();addSideNav();if(ready)renderDedicatedFoodBags();return ready&&!!document.querySelector('#clinicSidebar nav [data-view="foodbags"]')}
let tries=0;const timer=setInterval(()=>{tries++;if(boot()||tries>60)clearInterval(timer)},200);if(document.readyState!=='loading')boot();else document.addEventListener('DOMContentLoaded',boot);
})();