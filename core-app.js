(()=>{
  const EDGE='https://bhvkhxmexyhsjhwjsytp.supabase.co/functions/v1/';
  const MAP=new Map([
    [EDGE+'clinic-auth','/api/session'],
    [EDGE+'clinic-api','/api/clinic'],
    [EDGE+'clinic-tasks','/api/tasks'],
    [EDGE+'clinic-ops','/api/ops'],
    [EDGE+'clinic-assistant','/api/assistant'],
    [EDGE+'clinic-files','/api/files']
  ]);
  const nativeFetch=window.fetch.bind(window);
  window.fetch=function(input,init={}){
    const url=typeof input==='string'?input:String(input?.url||'');
    const mapped=MAP.get(url);
    if(!mapped)return nativeFetch(input,init);
    const h=new Headers(init.headers||(typeof input!=='string'?input.headers:undefined)||{});
    h.delete('authorization');h.delete('apikey');h.delete('x-clinic-pin');
    return nativeFetch(mapped,{...init,headers:h,credentials:'same-origin'});
  };
  const tk=localStorage.getItem('clinic_session_token');
  if(tk&&tk!=='http-only-cookie'){
    localStorage.removeItem('clinic_session_token');
    localStorage.removeItem('clinic_session_expires');
  }

  const SAFE_EXACT=new Set([
    'login','logout','toggleSettings','renderGlobal','showTab','readProductImage','saveProduct','closeProduct','deleteProduct','openProduct','renderInventory','renderFoodBags','openFoodProduct','showPriceMode','renderPrices','openPrice','savePrice','closePrice','deletePrice','adjustQty','jumpProduct','jumpPrice','showInventoryMode',
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
document.write('<script src="core-app-legacy.js?v=2"><'+'/script>');
document.write('<script src="universal-edit.js?v=1"><'+'/script>');
document.write('<script src="aml-pricebook.js?v=1"><'+'/script>');
