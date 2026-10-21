// Cloudflare Pages Function. Ticketmaster Discovery API is opt-in via environment secret.
// No fabricated events, no client-side secrets, no scraped websites.
export async function onRequestGet({request,env,waitUntil}) {
 const u=new URL(request.url), country=(request.cf?.country||'SG').toUpperCase();
 const chosen=(u.searchParams.get('country')||country).toUpperCase();
 if(!/^[A-Z]{2}$/.test(chosen))return Response.json({error:'Invalid country'},{status:400});
 const day=u.searchParams.get('date')||new Date().toISOString().slice(0,10);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||Number.isNaN(Date.parse(day)))return Response.json({error:'Invalid date'},{status:400});
 if(!env.TICKETMASTER_API_KEY)return Response.json({events:[],country:chosen,source:'none',status:'unconfigured',message:'Set TICKETMASTER_API_KEY in Cloudflare Pages environment variables to enable live event discovery.'},{headers:{'Cache-Control':'no-store'}});
 const params=new URLSearchParams({apikey:env.TICKETMASTER_API_KEY,countryCode:chosen,startDateTime:day+'T00:00:00Z',endDateTime:day+'T23:59:59Z',size:'100',sort:'date,asc'});
 const lat=Number(u.searchParams.get('lat')),lon=Number(u.searchParams.get('lon'));
 if(u.searchParams.has('lat')&&u.searchParams.has('lon')&&Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180){params.set('latlong',lat.toFixed(3)+','+lon.toFixed(3));params.set('radius','80');params.set('unit','km')}
 try{
  const r=await fetch('https://app.ticketmaster.com/discovery/v2/events.json?'+params,{signal:AbortSignal.timeout(8500)});
  if(!r.ok)throw new Error('Provider HTTP '+r.status);
  const j=await r.json();const list=j._embedded?.events||[];
  const events=list.map(e=>{const venue=e._embedded?.venues?.[0]||{};const segment=e.classifications?.[0]?.segment?.name||'';const genre=e.classifications?.[0]?.genre?.name||'';const term=(segment+' '+genre+' '+e.name).toLowerCase();let category=/art|exhibition|museum|theatre|theater|classical|festival|cultural/.test(term)?'Museum & arts':/comedy|sport|game|family|attraction/.test(term)?'Games & activities':/food|market|fair|expo|shopping/.test(term)?'Shopping & dessert':/music|concert|performance/.test(term)?'Games & activities':'Surprise me';const start=e.dates?.start?.localDate||day;return {id:'ticketmaster:'+e.id,title:String(e.name||'Event').slice(0,160),venue:String(venue.name||'Event venue').slice(0,140),address:[venue.address?.line1,venue.city?.name,venue.country?.name].filter(Boolean).join(', '),area:venue.city?.name||'',country:venue.country?.countryCode||chosen,date:start,time:e.dates?.start?.localTime||null,category,source:'Ticketmaster',url:e.url,indoor:null,cost:null,lat:Number(venue.location?.latitude)||null,lon:Number(venue.location?.longitude)||null}}).filter(e=>e.date===day&&/^https:\/\//.test(e.url||''));
  return Response.json({events,country:chosen,source:'Ticketmaster Discovery API',status:'live',checkedAt:new Date().toISOString(),message:events.length?'Live listings; verify availability and tickets with organiser.':'No events returned by this provider for this date; other organisers may have listings.'},{headers:{'Cache-Control':'public, max-age=600'}});
 }catch(e){return Response.json({events:[],country:chosen,source:'Ticketmaster Discovery API',status:'error',message:'Event provider temporarily unavailable. Permanent attractions remain available.'},{status:200,headers:{'Cache-Control':'no-store'}})}
}
