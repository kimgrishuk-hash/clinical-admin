(()=>{
  if(window.ClinicData)return;

  const ROUTES={
    session:'/api/session',sync:'/api/sync',clinic:'/api/clinic',tasks:'/api/tasks',ops:'/api/ops',assistant:'/api/assistant',files:'/api/files'
  };
  const CACHE_PREFIX='clinic_cache_v4:';
  const CURSOR_KEY='clinic_sync_cursor_v4';
  const VERSIONS_KEY='clinic_sync_versions_v4';
  const PROJECT='bhvkhxmexyhsjhwjsytp';
  const REALTIME_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJodmtoeG1leHloc2pod2pzeXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNjM1NDMsImV4cCI6MjEwMTgzOTU0M30.4v63vH6m8-hlskVkMI0VcTTLrWBszfEk_uKUVw-Rpe8';
  const DATA_TOPIC={inventory:'clinic_inventory',prices:'clinic_pricebook',tasks:'clinic_tasks',ops:'clinic_ops',reminders:'clinic_reminders',inbox:'clinic_inbox_events',protocols:'clinic_protocols',quotes:'clinic_quote_simulations'};
  const state={
    cursor:Number(localStorage.getItem(CURSOR_KEY)||0),
    versions:safeJson(localStorage.getItem(VERSIONS_KEY),{}),
    memory:new Map(),loadedTopics:new Set(),inflight:new Map(),listeners:new Map(),
    boot:null,socket:null,heartbeat:null,realtimeBackoff:1000,syncing:null,taskCounts:null
  };
  const bc='BroadcastChannel'in window?new BroadcastChannel('clinic-data-v4'):null;

  function safeJson(raw,fallback){try{return JSON.parse(raw||'')}catch{return fallback}}
  function cacheKey(name){return CACHE_PREFIX+name}
  function readCache(name){
    if(state.memory.has(name))return state.memory.get(name);
    const box=safeJson(localStorage.getItem(cacheKey(name)),null);
    if(box&&box.data!==undefined){state.memory.set(name,box);return box}
    return null;
  }
  function writeCache(name,data,topic){
    const version=topic?Number(state.versions[topic]||0):0;
    const box={data,version,at:Date.now()};state.memory.set(name,box);
    try{localStorage.setItem(cacheKey(name),JSON.stringify(box))}catch{}
    emit(name,data);
    return data;
  }
  function clearCache(name){state.memory.delete(name);localStorage.removeItem(cacheKey(name))}
  function validCache(name,topic){const box=readCache(name);if(!box)return null;const current=Number(state.versions[topic]||0);if(current&&Number(box.version||0)!==current)return null;return box.data}
  function rememberVersions(v){if(!v||typeof v!=='object')return;state.versions={...state.versions,...v};localStorage.setItem(VERSIONS_KEY,JSON.stringify(state.versions))}
  function setCursor(v){const n=Number(v||0);if(n>state.cursor){state.cursor=n;localStorage.setItem(CURSOR_KEY,String(n))}}
  function loggedIn(){return !!localStorage.getItem('clinic_session_token')}
  function emit(name,data){
    const set=state.listeners.get(name);if(set)for(const fn of [...set]){try{fn(data)}catch(e){console.warn('clinic-data listener',name,e)}}
    window.dispatchEvent(new CustomEvent('clinic:data',{detail:{name,data}}));
  }
  function on(name,fn){if(!state.listeners.has(name))state.listeners.set(name,new Set());state.listeners.get(name).add(fn);return()=>state.listeners.get(name)?.delete(fn)}

  async function request(route,body={},options={}){
    const url=ROUTES[route]||route;
    const action=String(body?.action||'');
    const isRead=options.read??['list','price_list','bootstrap','changes_since','get','reminders_list','inbox_list','connection_status','quote_list'].includes(action);
    const key=isRead?url+'|'+JSON.stringify(body):'';
    if(key&&state.inflight.has(key))return state.inflight.get(key);
    const run=(async()=>{
      const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),credentials:'same-origin',cache:'no-store'});
      let j={};try{j=await r.json()}catch{}
      if(r.status===401){emit('session-expired',true);throw new Error('unauthorized')}
      if(!r.ok)throw new Error(j.error||`HTTP ${r.status}`);
      return j;
    })();
    if(key)state.inflight.set(key,run);
    try{return await run}finally{if(key)state.inflight.delete(key)}
  }

  function cacheVersion(name,topic){const box=readCache(name);return box?Number(box.version||0):0}

  async function bootstrap(){
    if(state.boot)return state.boot;
    state.boot=(async()=>{
      const cached=readCache('inventory');
      if(cached?.data){state.loadedTopics.add(DATA_TOPIC.inventory);emit('inventory',cached.data)}
      const known={clinic_inventory:cacheVersion('inventory',DATA_TOPIC.inventory)};
      const j=await request('sync',{action:'bootstrap',modules:['inventory','task_counts'],known_versions:known},{read:true});
      rememberVersions(j.versions);setCursor(j.cursor);
      if(Array.isArray(j.inventory))writeCache('inventory',j.inventory,DATA_TOPIC.inventory);
      else if(cached?.data&&Number(cached.version||0)!==Number(state.versions[DATA_TOPIC.inventory]||0))clearCache('inventory');
      if(j.task_counts){state.taskCounts=j.task_counts;emit('task-counts',j.task_counts)}
      if(document.visibilityState!=='hidden')connectRealtime();
      return {inventory:validCache('inventory',DATA_TOPIC.inventory)||j.inventory||[],task_counts:j.task_counts||state.taskCounts,versions:state.versions,cursor:state.cursor};
    })();
    try{return await state.boot}catch(e){state.boot=null;throw e}
  }

  async function inventory(){
    state.loadedTopics.add(DATA_TOPIC.inventory);
    const c=validCache('inventory',DATA_TOPIC.inventory);if(c)return c;
    const j=await request('clinic',{action:'list'},{read:true});return writeCache('inventory',j.items||[],DATA_TOPIC.inventory);
  }
  async function prices(){
    state.loadedTopics.add(DATA_TOPIC.prices);
    const c=validCache('prices',DATA_TOPIC.prices);if(c)return c;
    const j=await request('clinic',{action:'price_list'},{read:true});return writeCache('prices',j.items||[],DATA_TOPIC.prices);
  }
  async function tasks(status='open'){
    status=status==='closed'?'closed':'open';state.loadedTopics.add(DATA_TOPIC.tasks);
    const name='tasks:'+status,c=validCache(name,DATA_TOPIC.tasks);if(c)return c;
    const j=await request('tasks',{action:'list',status,include_comments:false,limit:500},{read:true});return writeCache(name,j.items||[],DATA_TOPIC.tasks);
  }
  async function task(id){state.loadedTopics.add(DATA_TOPIC.tasks);return (await request('tasks',{action:'get',id},{read:true})).item||null}
  async function ops(){
    state.loadedTopics.add(DATA_TOPIC.ops);const c=validCache('ops',DATA_TOPIC.ops);if(c)return c;
    const j=await request('ops',{action:'list'},{read:true});return writeCache('ops',j.items||{},DATA_TOPIC.ops);
  }
  async function assistant(){
    state.loadedTopics.add(DATA_TOPIC.reminders);state.loadedTopics.add(DATA_TOPIC.inbox);
    const rc=validCache('reminders',DATA_TOPIC.reminders),ic=validCache('inbox',DATA_TOPIC.inbox);
    if(rc&&ic)return {reminders:rc,inbox:ic};
    const [r,i]=await Promise.all([
      rc?Promise.resolve({items:rc}):request('assistant',{action:'reminders_list'},{read:true}),
      ic?Promise.resolve({items:ic}):request('assistant',{action:'inbox_list'},{read:true})
    ]);
    if(!rc)writeCache('reminders',r.items||[],DATA_TOPIC.reminders);if(!ic)writeCache('inbox',i.items||[],DATA_TOPIC.inbox);
    return {reminders:r.items||rc||[],inbox:i.items||ic||[]};
  }

  function upsertArray(name,topic,item){if(!item)return;const arr=[...(readCache(name)?.data||[])];const id=String(item.id);const i=arr.findIndex(x=>String(x.id)===id);if(i>=0)arr[i]=item;else arr.unshift(item);writeCache(name,arr,topic)}
  function deleteFromArray(name,topic,id){const arr=(readCache(name)?.data||[]).filter(x=>String(x.id)!==String(id));writeCache(name,arr,topic)}
  function localInventory(item){state.loadedTopics.add(DATA_TOPIC.inventory);upsertArray('inventory',DATA_TOPIC.inventory,item);broadcast(['clinic_inventory'])}
  function removeInventory(id){deleteFromArray('inventory',DATA_TOPIC.inventory,id);broadcast(['clinic_inventory'])}
  function localPrice(item){state.loadedTopics.add(DATA_TOPIC.prices);upsertArray('prices',DATA_TOPIC.prices,item);broadcast(['clinic_pricebook'])}
  function removePrice(id){deleteFromArray('prices',DATA_TOPIC.prices,id);broadcast(['clinic_pricebook'])}
  function localTask(item){
    if(!item)return;state.loadedTopics.add(DATA_TOPIC.tasks);
    const openName='tasks:open',closedName='tasks:closed';
    if(item.status==='closed'){deleteFromArray(openName,DATA_TOPIC.tasks,item.id);if(readCache(closedName))upsertArray(closedName,DATA_TOPIC.tasks,item)}
    else{deleteFromArray(closedName,DATA_TOPIC.tasks,item.id);if(readCache(openName))upsertArray(openName,DATA_TOPIC.tasks,item)}
    broadcast(['clinic_tasks']);
  }
  function removeTask(id){if(readCache('tasks:open'))deleteFromArray('tasks:open',DATA_TOPIC.tasks,id);if(readCache('tasks:closed'))deleteFromArray('tasks:closed',DATA_TOPIC.tasks,id);broadcast(['clinic_tasks'])}
  function localOps(key,data){const cur={...(readCache('ops')?.data||{})};cur[key]=data;writeCache('ops',cur,DATA_TOPIC.ops);broadcast(['clinic_ops'])}

  function applyEntityEvents(topic,cacheName,records,events){
    const box=readCache(cacheName);if(!box)return;
    let arr=Array.isArray(box.data)?[...box.data]:[];
    for(const e of events.filter(x=>x.topic===topic&&x.operation==='delete'))arr=arr.filter(x=>String(x.id)!==String(e.record_key));
    for(const item of records||[]){const i=arr.findIndex(x=>String(x.id)===String(item.id));if(i>=0)arr[i]=item;else arr.unshift(item)}
    writeCache(cacheName,arr,topic);
  }
  function applyTaskEvents(j){
    const events=j.events||[],records=j.records?.clinic_tasks||[];
    const open=readCache('tasks:open'),closed=readCache('tasks:closed');if(!open&&!closed)return;
    let a=open?[...open.data]:null,b=closed?[...closed.data]:null;
    for(const e of events.filter(x=>x.topic==='clinic_tasks'&&x.operation==='delete')){if(a)a=a.filter(x=>String(x.id)!==String(e.record_key));if(b)b=b.filter(x=>String(x.id)!==String(e.record_key))}
    for(const item of records){if(a)a=a.filter(x=>String(x.id)!==String(item.id));if(b)b=b.filter(x=>String(x.id)!==String(item.id));if(item.status==='closed'){if(b)b.unshift(item)}else if(a)a.unshift(item)}
    if(a)writeCache('tasks:open',a,DATA_TOPIC.tasks);if(b)writeCache('tasks:closed',b,DATA_TOPIC.tasks);
    if(events.some(x=>x.topic==='clinic_task_comments'))emit('task-comments-stale',true);
  }
  function applyOpsEvents(j){
    const box=readCache('ops');if(!box)return;const cur={...box.data};
    for(const e of (j.events||[]).filter(x=>x.topic==='clinic_ops'&&x.operation==='delete'))delete cur[e.record_key];
    for(const x of j.records?.clinic_ops||[])cur[x.key]=x.data;
    writeCache('ops',cur,DATA_TOPIC.ops);
  }
  function applyAssistantEvents(j){
    applyEntityEvents('clinic_reminders','reminders',j.records?.clinic_reminders,j.events||[]);
    applyEntityEvents('clinic_inbox_events','inbox',j.records?.clinic_inbox_events,j.events||[]);
  }

  async function syncChanges(){
    if(!loggedIn()||document.visibilityState==='hidden')return;
    if(state.syncing)return state.syncing;
    state.syncing=(async()=>{
      const j=await request('sync',{action:'changes_since',since:state.cursor,topics:[...state.loadedTopics]},{read:true});
      setCursor(j.cursor);
      const ev=j.events||[];
      if(ev.length){
        applyEntityEvents('clinic_inventory','inventory',j.records?.clinic_inventory,ev);
        applyEntityEvents('clinic_pricebook','prices',j.records?.clinic_pricebook,ev);
        applyTaskEvents(j);applyOpsEvents(j);applyAssistantEvents(j);
      }
      if(j.task_counts){state.taskCounts=j.task_counts;emit('task-counts',j.task_counts)}
      return j;
    })();
    try{return await state.syncing}catch(e){console.warn('clinic sync',e)}finally{state.syncing=null}
  }

  function closeRealtime(){if(state.heartbeat){clearInterval(state.heartbeat);state.heartbeat=null}if(state.socket){try{state.socket.close()}catch{}state.socket=null}}
  function connectRealtime(){
    if(!loggedIn()||document.visibilityState==='hidden'||state.socket)return;
    try{
      const ws=new WebSocket(`wss://${PROJECT}.supabase.co/realtime/v1/websocket?apikey=${encodeURIComponent(REALTIME_KEY)}&vsn=1.0.0`);state.socket=ws;
      let ref=1;
      ws.onopen=()=>{
        state.realtimeBackoff=1000;
        ws.send(JSON.stringify({topic:'realtime:public:clinic_change_events',event:'phx_join',payload:{config:{broadcast:{ack:false,self:false},presence:{key:''},postgres_changes:[{event:'*',schema:'public',table:'clinic_change_events'}],private:false}},ref:String(ref++)}));
        state.heartbeat=setInterval(()=>{if(ws.readyState===1)ws.send(JSON.stringify({topic:'phoenix',event:'heartbeat',payload:{},ref:String(ref++)}))},25000);
      };
      ws.onmessage=e=>{let m;try{m=JSON.parse(e.data)}catch{return}if(m?.event==='postgres_changes'||m?.event==='INSERT'||m?.payload?.data?.type==='INSERT'){clearTimeout(connectRealtime._t);connectRealtime._t=setTimeout(syncChanges,120)}};
      ws.onerror=()=>{};
      ws.onclose=()=>{if(state.socket===ws)state.socket=null;if(state.heartbeat){clearInterval(state.heartbeat);state.heartbeat=null}if(loggedIn()&&document.visibilityState!=='hidden'){const wait=Math.min(30000,state.realtimeBackoff);state.realtimeBackoff=Math.min(30000,state.realtimeBackoff*2);setTimeout(connectRealtime,wait)}};
    }catch(e){console.warn('clinic realtime unavailable',e)}
  }

  function broadcast(topics){try{bc?.postMessage({type:'changed',topics,at:Date.now()})}catch{}}
  if(bc)bc.onmessage=e=>{if(e.data?.type==='changed'&&document.visibilityState!=='hidden')syncChanges()};
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')closeRealtime();else{syncChanges();connectRealtime()}});
  window.addEventListener('online',()=>{syncChanges();connectRealtime()});
  window.addEventListener('beforeunload',closeRealtime);

  window.ClinicData={
    request,bootstrap,inventory,prices,tasks,task,ops,assistant,syncChanges,on,
    getTaskCounts:()=>state.taskCounts,getVersions:()=>({...state.versions}),getCursor:()=>state.cursor,
    localInventory,removeInventory,localPrice,removePrice,localTask,removeTask,localOps,
    cache:(name)=>readCache(name)?.data||null,clearCache,connectRealtime,closeRealtime,
    topics:DATA_TOPIC
  };
})();
