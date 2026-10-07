const URL=Deno.env.get('SUPABASE_URL')!;
const KEY=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ALLOWED=new Set(['https://clinic-inventory-admin.vercel.app']);
const H={apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json'};
const te=new TextEncoder();
const hex=(a:ArrayBuffer)=>[...new Uint8Array(a)].map(x=>x.toString(16).padStart(2,'0')).join('');
const sha=async(s:string)=>hex(await crypto.subtle.digest('SHA-256',te.encode(s)));
const cors=(req:Request)=>{const o=req.headers.get('origin')||'';return {'Access-Control-Allow-Origin':ALLOWED.has(o)?o:'https://clinic-inventory-admin.vercel.app','Vary':'Origin','Access-Control-Allow-Headers':'content-type,authorization','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Max-Age':'86400'}};
const J=(req:Request,x:any,s=200)=>new Response(JSON.stringify(x),{status:s,headers:{...cors(req),'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function auth(req:Request){const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');if(!token)return false;const th=await sha(token);const r=await fetch(`${URL}/rest/v1/clinic_sessions?select=id&token_hash=eq.${th}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&limit=1`,{headers:H});return r.ok&&(await r.json()).length>0}
const ARRAY_KEYS=new Set(['orders','expiry','contacts','opening','closing','knowledge','subscriptions','protocols','staff','injections','marpet_plans']);
const OBJECT_KEYS=new Set(['site_content','bot_information']);
const validData=(key:string,data:any)=>(ARRAY_KEYS.has(key)&&Array.isArray(data))||(OBJECT_KEYS.has(key)&&data&&typeof data==='object'&&!Array.isArray(data));
Deno.serve(async(req)=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers:cors(req)});
  if(req.method!=='POST')return J(req,{error:'method'},405);
  const origin=req.headers.get('origin')||'';
  if(origin&&!ALLOWED.has(origin))return J(req,{error:'origin'},403);
  if(!(await auth(req)))return J(req,{error:'unauthorized'},401);
  let b:any={};try{b=await req.json()}catch{return J(req,{error:'bad json'},400)}
  try{
    if(b.action==='bot_context'){
      const settings=await fetch(URL+'/rest/v1/clinic_ops?key=eq.bot_information&select=data&limit=1',{headers:H});
      if(!settings.ok)return J(req,{error:'load failed'},500);
      const rows=await settings.json(),info=rows[0]?.data||{};
      const approved=info.approved===true;
      const publicPrices:any[]=[];
      return J(req,{info:{name:info.name||'',phone:info.phone||'',greeting:info.greeting||'',address:approved?info.address||'':'',hours:approved?info.hours||'':'',appointment_policy:info.appointment_policy||'',emergency_message:info.emergency_message||'',faq:(Array.isArray(info.faq)?info.faq:[]).filter((x:any)=>x.enabled&&x.question&&x.answer).map((x:any)=>({question:x.question,answer:x.answer,aliases:Array.isArray(x.aliases)?x.aliases.filter((a:any)=>typeof a==='string').slice(0,30):[]}))},prices:publicPrices,updated_at:info.updated_at||null});
    }
    if(b.action==='list'){
      const r=await fetch(URL+'/rest/v1/clinic_ops?select=key,data,updated_at',{headers:H});
      if(!r.ok)return J(req,{error:'load failed'},500);
      const rows=await r.json();const out:any={};for(const x of rows)out[x.key]=x.data;
      return J(req,{items:out});
    }
    if(b.action==='save'){
      const key=String(b.key||'').trim(),data=b.data;
      if(!validData(key,data))return J(req,{error:'invalid'},400);
      const raw=JSON.stringify(data);
      if(raw.length>600000)return J(req,{error:'too large'},413);
      const r=await fetch(URL+'/rest/v1/clinic_ops?on_conflict=key',{method:'POST',headers:{...H,Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({key,data,updated_at:new Date().toISOString()})});
      return r.ok?J(req,{ok:true,item:(await r.json())[0]}):J(req,{error:'save failed'},500);
    }
    return J(req,{error:'unknown'},400);
  }catch(e){console.error(e);return J(req,{error:'server error'},500)}
});
