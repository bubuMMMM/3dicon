const UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131 Safari/537.36";
function isTikTok(v){try{const h=new URL(v).hostname.toLowerCase();return h==="tiktok.com"||h.endsWith(".tiktok.com")}catch{return false}}
module.exports=async function(req,res){
  res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Headers","Content-Type");res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");
  if(req.method==="OPTIONS") return res.status(204).end();
  if(req.method!=="POST") return res.status(405).json({ok:false,error:"POST uniquement"});
  const url=String(req.body?.url||"").trim();
  if(!isTikTok(url)) return res.status(400).json({ok:false,error:"URL TikTok invalide"});
  try{
    const body=new URLSearchParams({url,hd:"1"});
    const r=await fetch("https://www.tikwm.com/api/?hd=1",{method:"POST",headers:{"user-agent":UA,"accept":"application/json","content-type":"application/x-www-form-urlencoded; charset=UTF-8"},body});
    const j=await r.json().catch(()=>null);
    if(!r.ok||!j||j.code!==0||!j.data) return res.status(422).json({ok:false,error:j?.msg||"TikTok bloque actuellement la résolution"});
    const d=j.data,videoUrl=d.hdplay||d.play||d.wmplay;
    if(!videoUrl) return res.status(422).json({ok:false,error:"Flux vidéo introuvable"});
    return res.status(200).json({ok:true,source:"tikwm-fallback",id:String(d.id||""),title:d.title||"",author:d.author?.unique_id||d.author?.nickname||"",cover:d.cover||d.origin_cover||"",videoUrl,duration:d.duration??null});
  }catch(e){return res.status(500).json({ok:false,error:e?.message||"Erreur interne"})}
};