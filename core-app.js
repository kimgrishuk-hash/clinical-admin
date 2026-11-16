(()=>{
  const EDGE='https://bhvkhxmexyhsjhwjsytp.supabase.co/functions/v1/';
  const AUTH=EDGE+'clinic-auth';
  const MAP=new Map([
    [EDGE+'clinic-api','/api/clinic'],
    [EDGE+'clinic-tasks','/api/tasks'],
    [EDGE+'clinic-ops','/api/ops'],
    [EDGE+'clinic-assistant','/api/assistant'],
    [EDGE+'clinic-files','/api/files']
  ]);
  const nativeFetch=window.fetch.bind(window);
  window.fetch=async function(input,init={}){
    const url=typeof input==='string'?input:String(input?.url||'');
    if(url===AUTH){
      // All authentication actions go through the same-origin HttpOnly cookie proxy.
      // Never send session tokens to client-side JavaScript or localStorage.
      const h=new Headers(init.headers||(typeof input!=='string'?input.headers:undefined)||{});
      h.delete('authorization');h.delete('apikey');h.delete('x-clinic-pin');
      return nativeFetch('/api/session',{...init,headers:h,credentials:'same-origin'});
    }
    const mapped=MAP.get(url);
    if(!mapped)return nativeFetch(input,init);
    const h=new Headers(init.headers||(typeof input!=='string'?input.headers:undefined)||{});
    h.delete('authorization');h.delete('apikey');h.delete('x-clinic-pin');
    return nativeFetch(mapped,{...init,headers:h,credentials:'same-origin'});
  };

  const SAFE_EXACT=new Set([
    'login','logout','toggleSettings','renderGlobal','showTab','readProductImage','saveProduct','closeProduct','deleteProduct','openProduct','renderInventory','renderFoodBags','openFoodProduct','showPriceMode','renderPrices','renderSubscriptions','openPrice','savePrice','closePrice','deletePrice','adjustQty','jumpProduct','jumpPrice','showInventoryMode',
    'openDailyBoard','closeDailyBoard','setDailyMode','saveDailyTask','clearDailyForm','toggleDaily','editDaily','deleteDaily','reopenOnce','completeOnce',
    'openStaffTasks','closeStaffTasks','createStaffTask','setTaskView','deleteStaffTask','reopenStaffTask','addTaskComment','closeStaffTask','openClinicMessages','closeClinicMessagePicker',
    'renderSubscriptions','jumpSubscription','openProtocolEditor','addProtocolField','removeProtocolField','addTemplateCharge','removeTemplateCharge','showTemplateCatalog','pickTemplateCatalog','addTemplateClaim','removeTemplateClaim','closeProtocolEditor','saveProtocol','deleteProtocol','editProtocol','startProtocolRun','closeProtocolRun','addRunLine','removeRunLine','updateRunLine','showRunCatalog','pickRunCatalog','setRunPlan','setRunOverride','addInjectionQuick'
  ]);
  const SAFE_PREFIX=/^(clinic|ops|assistant|supplier|foodBag|simulation)/;
  const isSafeName=n=>SAFE_EXACT.has(n)||SAFE_PREFIX.test(n);
  function splitArgs(s){const out=[];let cur='',q='',esc=false;for(const ch of s){if(esc){cur+=ch;esc=false;continue}if(ch==='\\'){cur+=ch;esc=true;continue}if(q){cur+=ch;if(ch===q)q='';continue}if(ch==='\''||ch==='"'){q=ch;cur+=ch;continue}if(ch===','){out.push(cur.trim());cur='';continue}cur+=ch}if(cur.trim()||s.trim()==='')out.push(cur.trim());return out.filter((x,i)=>x!==''||i===0&&s.trim()!=='')}
  function argValue(raw,el,ev){const s=raw.trim();if(s==='this')return el;if(s==='event')return ev;if(s==='this.value')return el.value;if(s==='this.checked')return !!el.checked;if(s==='true')return true;if(s==='false')return false;if(s==='null')return null;if(s==='undefined')return undefined;if(/^-?\d+(?:\.\d+)?$/.test(s))return Number(s);if((s.startsWith("'")&&s.endsWith("'"))||(s.startsWith('"')&&s.endsWith('"'))){const body=s.slice(1,-1);return body.replace(/\\'/g,"'").replace(/\\"/g,'"').replace(/\\\\/g,'\\')}throw new Error('unsupported argument')}
  function runCall(code,el,ev){const m=String(code||'').trim().match(/^([A-Za-z_$][\w$]*)\((.*)\)$/s);if(!m||!isSafeName(m[1]))return false;const fn=window[m[1]];if(typeof fn!=='function')return false;const args=m[2].trim()?splitArgs(m[2]).map(a=>argValue(a,el,ev)):[];fn(...args);return true}
  function runSafeHandler(code,el,ev){const c=String(code||'').trim();let m=c.match(/^_protocolDraft\.fields\[(\d+)\]\.(label|value)=this\.value$/);if(m&&window._protocolDraft?.fields?.[+m[1]]){window._protocolDraft.fields[+m[1]][m[2]]=el.value;return true}m=c.match(/^_protocolDraft\.charges\[(\d+)\]\.(name|price)=this\.value(?:;showTemplateCatalog\((\d+),this\.value\))?$/);if(m&&window._protocolDraft?.charges?.[+m[1]]){window._protocolDraft.charges[+m[1]][m[2]]=el.value;if(m[3]!=null&&typeof window.showTemplateCatalog==='function')window.showTemplateCatalog(+m[3],el.value);return true}m=c.match(/^_protocolDraft\.marpetClaims\[(\d+)\]\.(name|percent|instructions)=this\.value$/);if(m&&window._protocolDraft?.marpetClaims?.[+m[1]]){window._protocolDraft.marpetClaims[+m[1]][m[2]]=el.value;return true}m=c.match(/^activeRun\.lines\[(\d+)\]\.marpetEligible=this\.checked;renderRunTotals\(\)$/);if(m&&window.activeRun?.lines?.[+m[1]]){window.activeRun.lines[+m[1]].marpetEligible=!!el.checked;if(typeof window.renderRunTotals==='function')window.renderRunTotals();return true}return runCall(c,el,ev)}
  document.addEventListener('click',ev=>{const el=ev.target?.closest?.('[onclick]');if(!el)return;try{if(runSafeHandler(el.getAttribute('onclick'),el,ev)){ev.preventDefault();ev.stopPropagation()}}catch(e){console.warn('blocked inline action',e)}},true);
  document.addEventListener('input',ev=>{const el=ev.target;if(!(el instanceof Element)||!el.hasAttribute('oninput'))return;try{runSafeHandler(el.getAttribute('oninput'),el,ev)}catch(e){console.warn('blocked inline input',e)}},true);
  document.addEventListener('change',ev=>{const el=ev.target;if(!(el instanceof Element)||!el.hasAttribute('onchange'))return;try{runSafeHandler(el.getAttribute('onchange'),el,ev)}catch(e){console.warn('blocked inline change',e)}},true);
  document.addEventListener('error',ev=>{const el=ev.target;if(el instanceof HTMLImageElement&&el.hasAttribute('onerror')){el.style.display='none';const n=el.nextElementSibling;if(n)n.style.display='block'}},true);
})();
/* Shared forgiving product search: punctuation, Hebrew/English aliases, word order and light typos. */
window.ClinicSearch=(()=>{
 const aliases=[
  ['n&d','nd','n and d','n d','אן אנד די','אנד די','אנדי','פארמינה','פרמינה','farmina'],
  ['bravecto','ברבקטו','בראקטו','ברווקטו','בראווקטו'],
  ['simparica','סימפריקה','סימפאריקה'],
  ['royal canin','רויאל קנין','רויאל קנין','רויאל קאנין'],
  ['renal','רנל','רינל','כליות'],
  ['virbac','וירבק','וירבאק'],
  ['cibau','סיבאו','ציבאו'],
  ['hypoallergenic','היפואלרגני','היפו אלרגני'],
  ['ocean','אושן','אוקיינוס'],
  ['lamb','כבש'],
  ['chicken','עוף'],
  ['puppy','גור','גורים'],
  ['adult','בוגר','בוגרים'],
  ['mini','מיני'],
  ['cat','חתול','חתולים'],
  ['dog','כלב','כלבים']
 ];
 const clean=v=>String(v??'').toLowerCase().normalize('NFKC').replace(/[\u0591-\u05c7]/g,'').replace(/&/g,' and ').replace(/[\u2019\u0027\u05f3\u05f4]/g,'').replace(/[^a-z0-9\u0590-\u05ff]+/g,' ').replace(/\s+/g,' ').trim();
 const compact=v=>clean(v).replace(/\s/g,'');
 const variants=aliases.map((group,i)=>({key:'alias'+i,forms:group.map(clean),flat:group.map(compact)}));
 const canonical=term=>{const v=clean(term),c=compact(term);const a=variants.find(g=>g.forms.includes(v)||g.flat.includes(c));return a?a.key:v};
 function tokens(value){const raw=clean(value).split(' ').filter(Boolean);const out=[];for(let i=0;i<raw.length;i++){let match=null;for(const g of variants){for(const form of g.forms){const words=form.split(' ');if(words.length>1&&raw.slice(i,i+words.length).join(' ')===form&&(!match||words.length>match.len))match={key:g.key,len:words.length}}}if(match){out.push(match.key);i+=match.len-1}else out.push(canonical(raw[i]))}return out}
 function distance(a,b){if(Math.abs(a.length-b.length)>2)return 3;let prev=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){const row=[i];for(let j=1;j<=b.length;j++)row[j]=Math.min(row[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=row}return prev[b.length]}
 function score(query,...fields){const q=clean(query);if(!q)return 1;const hay=fields.filter(Boolean).join(' '),h=clean(hay);if(h.includes(q))return 100;const qt=tokens(query),ht=tokens(hay);const hf=new Set(ht);let total=0;for(const term of qt){if(hf.has(term)){total+=20;continue}if(ht.some(t=>t.startsWith(term)&&term.length>=2)){total+=12;continue}if(term.length>=4&&ht.some(t=>t.length>=4&&distance(term,t)<=1)){total+=6;continue}return 0}return total}
 return {clean,score,matches:(query,...fields)=>score(query,...fields)>0};
})();

document.write('<script src="clinic-data.js?v=5"><'+'/script>');
document.write('<script src="core-app-legacy.js?v=10"><'+'/script>');
document.write('<script src="universal-edit.js?v=1"><'+'/script>');
document.write('<script src="aml-pricebook.js?v=6"><'+'/script>');
document.write('<script src="subscriptions.js?v=2"><'+'/script>');
document.write('<script src="image-storage.js?v=1"><'+'/script>');
document.write('<script src="home-ui.js?v=16" data-dynamic="home-ui"><'+'/script>');
document.write('<script src="foodbags-list.js?v=2"><'+'/script>');

document.write('<script src="bot-information.js?v=3"><'+'/script>');
