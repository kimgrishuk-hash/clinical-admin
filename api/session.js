const {BASE,COOKIE,cookies,sameOrigin,bodyOf,json}=require('./_proxy');

function setSessionCookie(res,token,expiresAt){
  const exp=Math.max(60,Math.min(43200,Math.floor((new Date(expiresAt).getTime()-Date.now())/1000)||43200));
  res.setHeader('Set-Cookie',`${COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${exp}; HttpOnly; Secure; SameSite=Strict; Priority=High`);
}
function clearSessionCookie(res){
  res.setHeader('Set-Cookie',`${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict; Priority=High`);
}
async function upstream(action,password,token,req){
  const headers={'content-type':'application/json'};
  if(token) headers.authorization='Bearer '+token;
  const ip=String(req.headers?.['x-forwarded-for']||req.headers?.['x-real-ip']||'').split(',')[0].trim();
  if(ip) headers['x-forwarded-for']=ip;
  const payload=action==='login'?{action,password}:{action};
  const r=await fetch(BASE+'clinic-auth',{method:'POST',headers,body:JSON.stringify(payload),cache:'no-store'});
  let data={};try{data=await r.json()}catch{}
  return {r,data};
}
module.exports=async function handler(req,res){
  if(req.method!=='POST') return json(res,405,{error:'method'});
  if(!sameOrigin(req)) return json(res,403,{error:'origin'});
  let body={};try{body=bodyOf(req)}catch{return json(res,400,{error:'bad json'})}
  const action=String(body.action||'');
  if(!['login','validate','logout'].includes(action)) return json(res,400,{error:'unknown action'});
  try{
    if(action==='login'){
      const password=String(body.password||'');
      if(password.length<8||password.length>128) return json(res,401,{error:'invalid credentials'});
      const {r,data}=await upstream('login',password,'',req);
      if(!r.ok||!data.token) return json(res,r.status||401,data?.error?data:{error:'invalid credentials'});
      setSessionCookie(res,String(data.token),data.expires_at);
      return json(res,200,{ok:true,token:'http-only-cookie',expires_at:data.expires_at,user:data.user||{display_name:'צוות המרפאה'}});
    }
    const token=cookies(req)[COOKIE];
    if(!token){if(action==='logout'){clearSessionCookie(res);return json(res,200,{ok:true})}return json(res,401,{error:'unauthorized'})}
    const {r,data}=await upstream(action,'',token,req);
    if(action==='logout') clearSessionCookie(res);
    if(!r.ok){if(r.status===401) clearSessionCookie(res);return json(res,r.status,data||{error:'unauthorized'})}
    return json(res,200,data||{ok:true});
  }catch(e){
    console.error('session proxy',e);
    return json(res,502,{error:'auth unavailable'});
  }
};
