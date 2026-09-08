import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {inputToDetails} from '../generator/fromInput.mjs'
import {deriveConfig,slugify} from '../generator/derive.mjs'
import {scaffoldSite,ROOT,sitesDir} from '../generator/scaffold.mjs'
import {THEMES} from '../packages/template/src/themes.js'
import {photoUrl} from './maps.mjs'
const exec=promisify(execFile)
const DAYS=['sun','mon','tue','wed','thu','fri','sat']
export function validateListing(raw) {
  if(!raw || typeof raw.name!=='string' || !raw.name.trim() || typeof raw.address!=='string' || !raw.address.trim()) throw new Error('Salon name and address are required.')
  const r={...raw,name:raw.name.trim().slice(0,100),address:raw.address.trim().slice(0,300)}
  for(const key of ['website','bookingUrl','mapsUrl']) if(r[key] && !/^https?:\/\//.test(r[key])) throw new Error(`${key} must be an http or https URL.`)
  for(const [day,v] of Object.entries(r.hours||{})) {
    if(!DAYS.includes(day) || (v!=='closed' && !/^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/.test(v))) throw new Error(`Use HH:MM-HH:MM or closed for ${day}. Leave unknown hours blank.`)
  }
  if(r.utcOffsetMinutes!=null && (!Number.isFinite(r.utcOffsetMinutes)||Math.abs(r.utcOffsetMinutes)>840))throw new Error('Invalid UTC offset.')
  return r
}
export async function photoBytes(p) {
  if(p.data){
    if(!/^data:image\/(jpeg|png|webp);base64,/.test(p.data))throw new Error('Upload a JPG, PNG, or WebP image.')
    const data=Buffer.from(p.data.split(',')[1],'base64');if(data.length>12*1024*1024)throw new Error('Photos must be under 12 MB each.');return data
  }
  let url=photoUrl(p.url)
  for(let i=0;i<4;i++){
    const res=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(20000)})
    if(res.status>=300&&res.status<400){url=photoUrl(new URL(res.headers.get('location'),url).href);continue}
    if(!res.ok)throw new Error(`Photo could not download (${res.status}).`)
    const chunks=[];let size=0
    for await(const chunk of res.body){size+=chunk.length;if(size>12*1024*1024)throw new Error('Photo exceeds 12 MB.');chunks.push(chunk)}
    return Buffer.concat(chunks)
  }
  throw new Error('Photo redirected too many times.')
}
export async function createSalon(request,progress=()=>{}){
  const raw=validateListing(request.listing)
  const theme=request.theme||'terracotta-warm';if(!THEMES[theme])throw new Error('Unknown theme.')
  const details=inputToDetails(raw)
  const config=deriveConfig(details,{themeOverride:theme,photoSource:'blank',bookingUrl:raw.bookingUrl||null})
  const base=slugify(raw.name,config.address.city)||'nail-salon'
  let slug=base,n=2
  while(await fs.stat(path.join(sitesDir,slug)).then(()=>true,()=>false))slug=`${base}-${n++}`
  config.slug=slug
  config.pages={gallery:'/gallery/',book:'/book/'}
  config.placeholderImages=true
  config.preview=true
  config.bookingDelivery='preview'
  config.heroImage=null
  config.hero={sub:raw.tagline||'A fresh set. A slower moment. A little time for you.'}
  config.story={title:`Welcome to ${raw.name}`,body:[`${raw.name} is a nail salon in ${config.address.city||'your neighborhood'}.`,raw.description||'Explore the gallery, choose a treatment, and get in touch to plan your next visit.']}
  config.why=[];config.trust=[];config.amenities=[];config.reviews=[];config.rating=null;config.showRating=false
  config.hours=DAYS.flatMap((key,day)=>raw.hours?.[key]?[raw.hours[key]==='closed'?{day,closed:true}:{day,open:raw.hours[key].split('-')[0],close:raw.hours[key].split('-')[1]}]:[])
  config.utcOffsetMinutes=raw.utcOffsetMinutes??null
  // Services are an editable starter menu, never inferred as facts from review keywords.
  config.services=raw.services?.length?raw.services:[{name:'Manicures',icon:'hand',items:['Manicure consultation']},{name:'Pedicures',icon:'footprints',items:['Pedicure consultation']},{name:'Nail design',icon:'palette',items:['Nail design consultation']}]
  config.menuNote=raw.services?.length?'':'Sample menu · confirm treatments with the salon.'
  config.seo={title:`${raw.name} | Nail Salon${config.address.city?` in ${config.address.city}`:''}`,description:`Visit ${raw.name}${config.address.city?` in ${config.address.city}`:''}. Explore the gallery and get in touch to plan your visit.`}
  if(raw.mapEmbed && /^https:\/\/www.google.com\/maps\/embed\?/.test(raw.mapEmbed))config.mapEmbed=raw.mapEmbed
  const photoInputs=(request.photos||[]).filter(p=>p.selected!==false).slice(0,24)
  const buffers=[],warnings=[]
  for(const [i,p] of photoInputs.entries()){
    progress(`Preparing image ${i+1} of ${photoInputs.length}…`)
    try{const data=await photoBytes(p);const meta=await sharp(data,{limitInputPixels:50000000}).metadata();if(!['jpeg','png','webp'].includes(meta.format))throw new Error('Unsupported image format.');buffers.push({data,attribution:p.attribution||null,sourceUrl:p.sourceUrl||null,alt:p.alt||`${raw.name} photo`,hero:p.hero===true})}catch(e){warnings.push(`Image ${i+1}: ${e.message}`)}
  }
  const heroIndex=buffers.findIndex(p=>p.hero)
  if(heroIndex>0)buffers.unshift(...buffers.splice(heroIndex,1))
  else if(heroIndex<0 && buffers.length){
    const dimensions=await Promise.all(buffers.map(p=>sharp(p.data).metadata()))
    const best=dimensions.map((m,i)=>({i,score:(m.width>=m.height?2:0)+Math.min(m.width,2400)/2400})).sort((a,b)=>b.score-a.score)[0].i
    buffers.unshift(...buffers.splice(best,1))
  }
  config.photoSource=buffers.length?'mixed':'blank'
  progress('Creating home, gallery, and booking pages…')
  const dir=path.join(sitesDir,slug)
  await fs.mkdir(dir) // Exclusive reservation: never overwrite another generation.
  try {
  await scaffoldSite(config,buffers)
  if(config.photos.length){config.heroImage={...config.photos[0]};await fs.writeFile(path.join(dir,'salon.config.json'),JSON.stringify(config,null,2)+'\n')}
  const originals=path.join(dir,'source-images');await fs.mkdir(originals,{recursive:true})
  for(const [i,p]of buffers.entries()){const meta=await sharp(p.data).metadata();await fs.writeFile(path.join(originals,`${String(i+1).padStart(2,'0')}.${meta.format}`),p.data)}
  await fs.writeFile(path.join(dir,'import-report.json'),JSON.stringify({source:raw.mapsUrl||'manual',importedAt:request.importedAt||null,createdAt:new Date().toISOString(),warnings,listing:raw,photos:photoInputs.map(({data,...p})=>p)},null,2)+'\n')
  progress('Building the preview…')
  await exec(process.execPath,[path.join(ROOT,'node_modules/vite/bin/vite.js'),'build'],{cwd:dir,maxBuffer:2*1024*1024})
  return {slug,dir,warnings}
  } catch(error) { await fs.rm(dir,{recursive:true,force:true}); throw new Error(`Generation failed; the incomplete site was removed. ${error.message}`) }
}
