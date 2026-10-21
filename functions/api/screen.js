// Cloudflare Pages Function: TMDB Discovery API. Secret TMDB_API_KEY (v3 API key).
const API='https://api.themoviedb.org/3';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=900'}});
export async function onRequestGet({env,request}){
 if(!env.TMDB_API_KEY)return json({status:'unconfigured',message:'Add TMDB_API_KEY as a Production secret in Cloudflare Pages',items:[]});
 const url=new URL(request.url);const kind=url.searchParams.get('kind')==='cinema'?'cinema':'netflix';
 const qs=new URLSearchParams({api_key:env.TMDB_API_KEY,language:'en-SG',region:'SG',page:'1'});
 let endpoint=kind==='cinema'?'/movie/now_playing':'/discover/tv';
 if(kind==='netflix'){qs.set('watch_region','SG');qs.set('with_watch_providers','8');qs.set('sort_by','popularity.desc');qs.set('vote_count.gte','35')}
 try{const r=await fetch(API+endpoint+'?'+qs,{cf:{cacheTtl:900,cacheEverything:true}});if(!r.ok)return json({status:'upstream_error',items:[],message:'Film discovery service unavailable ('+r.status+')'},502);const j=await r.json();
 const items=(j.results||[]).filter(x=>x.title||x.name).slice(0,18).map(x=>({id:x.id,title:x.title||x.name,overview:x.overview||'',rating:typeof x.vote_average==='number'?Number(x.vote_average.toFixed(1)):null,votes:x.vote_count||0,release:x.release_date||x.first_air_date||'',type:kind,link:'https://www.themoviedb.org/'+(kind==='cinema'?'movie':'tv')+'/'+x.id}));
 items.sort((a,b)=>((b.rating||0)*Math.log1p(b.votes))-((a.rating||0)*Math.log1p(a.votes)));
 return json({status:'live',source:'TMDB',kind,region:'SG',items,updated:new Date().toISOString(),disclaimer:kind==='netflix'?'Singapore Netflix provider catalogue as indexed by TMDB; confirm title availability on Netflix.':'Movies marked now playing in Singapore by TMDB; check local cinema showtimes. Ratings are TMDB user ratings, not Rotten Tomatoes.'});
 }catch{return json({status:'error',items:[],message:'Could not retrieve film data'},502)}
}
