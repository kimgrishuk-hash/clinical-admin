const BASE='https://bhvkhxmexyhsjhwjsytp.supabase.co/functions/v1/';
const COOKIE='__Host-clinic_session';

function headers(extra={}){return {'content-type':'application/json; charset=utf-8','cache-control':'no-store, max-age=0','x-content-type-options':'nosniff',...extra}}
function response(statusCode,payload,extra={}){return {statusCode,headers:headers(extra),body:JSON.stringify(payload??{})}}
function cookies(event){const raw=String(event.headers?.cookie||'');const out={};for(const part of raw.split(';')){const i=part.indexOf('=');if(i<0)continue;out[part.slice(0,i).trim()]=decodeURIComponent(part.slice(i+1).trim())}return out}
function sameOrigin(event){const origin=String(event.headers?.origin||'');if(!origin)return true;const host=String(event.headers?.['x-forwarded-host']||event.headers?.host||'');const proto=String(event.headers?.['x-forwarded-proto']||'https').split(',')[0].trim();return origin===`${proto}://${host}`}
function bodyOf(event){if(!event.body)return {};return JSON.parse(event.body)}
function sessionCookie(token,expiresAt){const exp=Math.max(60,Math.min(43200,Math.floor((new Date(expiresAt).getTime()-Date.now())/1000)||43200));return `${COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${exp}; HttpOnly; Secure; SameSite=Strict; Priority=High`}
function clearCookie(){return `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict; Priority=High`}
async function proxyEdge(event,slug,allowedActions,maxBytes=524288){
  if(event.httpMethod!=='POST')return response(405,{error:'method'});
  if(!sameOrigin(event))return response(403,{error:'origin'});
  let body={};try{body=bodyOf(event)}catch{return response(400,{error:'bad json'})}
  const raw=JSON.stringify(body);if(Buffer.byteLength(raw,'utf8')>maxBytes)return response(413,{error:'request too large'});
  if(!allowedActions.has(String(body.action||'')))return response(400,{error:'unknown action'});
  const token=cookies(event)[COOKIE];if(!token)return response(401,{error:'unauthorized'});
  try{const r=await fetch(BASE+slug,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+token},body:raw,cache:'no-store'});const text=await r.text();return {statusCode:r.status,headers:headers(),body:text||'{}'}}catch(e){console.error('proxyEdge',slug,e);return response(502,{error:'upstream unavailable'})}
}
module.exports={BASE,COOKIE,response,cookies,sameOrigin,bodyOf,sessionCookie,clearCookie,proxyEdge};
