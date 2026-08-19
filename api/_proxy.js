const BASE='https://bhvkhxmexyhsjhwjsytp.supabase.co/functions/v1/';
const COOKIE='__Host-clinic_session';

function cookies(req){
  const raw=String(req.headers?.cookie||'');
  const out={};
  for(const part of raw.split(';')){
    const i=part.indexOf('=');
    if(i<0) continue;
    out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim());
  }
  return out;
}
function sameOrigin(req){
  const origin=String(req.headers?.origin||'');
  if(!origin) return true;
  const host=String(req.headers?.['x-forwarded-host']||req.headers?.host||'');
  const proto=String(req.headers?.['x-forwarded-proto']||'https').split(',')[0].trim();
  return origin===`${proto}://${host}`;
}
function bodyOf(req){
  if(req.body&&typeof req.body==='object') return req.body;
  if(typeof req.body==='string'&&req.body) return JSON.parse(req.body);
  return {};
}
function json(res,status,payload){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.setHeader('X-Content-Type-Options','nosniff');
  return res.status(status).json(payload);
}
async function proxyEdge(req,res,slug,allowedActions,maxBytes=524288){
  if(req.method!=='POST') return json(res,405,{error:'method'});
  if(!sameOrigin(req)) return json(res,403,{error:'origin'});
  let body={};
  try{body=bodyOf(req)}catch{return json(res,400,{error:'bad json'})}
  const raw=JSON.stringify(body);
  if(Buffer.byteLength(raw,'utf8')>maxBytes) return json(res,413,{error:'request too large'});
  if(!allowedActions.has(String(body.action||''))) return json(res,400,{error:'unknown action'});
  const token=cookies(req)[COOKIE];
  if(!token) return json(res,401,{error:'unauthorized'});
  try{
    const r=await fetch(BASE+slug,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+token},body:raw,cache:'no-store'});
    const text=await r.text();
    res.setHeader('Content-Type','application/json; charset=utf-8');
    res.setHeader('Cache-Control','no-store, max-age=0');
    res.setHeader('X-Content-Type-Options','nosniff');
    return res.status(r.status).send(text||'{}');
  }catch(e){
    console.error('proxyEdge',slug,e);
    return json(res,502,{error:'upstream unavailable'});
  }
}
module.exports={BASE,COOKIE,cookies,sameOrigin,bodyOf,json,proxyEdge};
