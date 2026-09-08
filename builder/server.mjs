import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import {randomUUID} from 'node:crypto'
import {fileURLToPath} from 'node:url'
import {importMaps} from './maps.mjs'
import {createSalon} from './create.mjs'
import {ROOT,sitesDir} from '../generator/scaffold.mjs'
const here=path.dirname(fileURLToPath(import.meta.url))
const jobs=new Map(),previews=new Map();let busy=false
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data))}
export async function servePreview(slug){
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw new Error('Invalid site name.')
  if(previews.has(slug))return previews.get(slug)
  const root=path.join(sitesDir,slug,'dist');await fs.access(path.join(root,'index.html'))
  const server=http.createServer(async(req,res)=>{
    try{const u=new URL(req.url,'http://localhost');let name=decodeURIComponent(u.pathname);if(name.endsWith('/'))name+='index.html';const target=path.resolve(root,'.'+name);if(!target.startsWith(root+path.sep))throw Error();const ext=path.extname(target);const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.json':'application/json'};res.setHeader('Content-Type',types[ext]||'application/octet-stream');res.end(await fs.readFile(target))}catch{res.writeHead(404);res.end('Not found')}
  });await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;previews.set(slug,url);return url
}
async function body(req){let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>48*1024*1024)throw new Error('Keep the total upload below 48 MB.')}return JSON.parse(text||'{}')}
const server=http.createServer(async(req,res)=>{
  try{
    const host=`127.0.0.1:${server.address().port}`
    if(req.headers.host!==host && req.headers.host!==`localhost:${server.address().port}`)return json(res,403,{error:'Local access only.'})
    if(req.method==='POST' && req.headers.origin && ![`http://${host}`,`http://localhost:${server.address().port}`].includes(req.headers.origin))return json(res,403,{error:'Origin not allowed.'})
    const url=new URL(req.url,`http://${host}`)
    if(req.method==='GET' && url.pathname==='/'){res.setHeader('Content-Type','text/html');return res.end(await fs.readFile(path.join(here,'index.html')))}
    if(req.method==='GET' && url.pathname==='/api/sites'){
      const dirs=await fs.readdir(sitesDir);const sites=[];for(const slug of dirs){try{const c=JSON.parse(await fs.readFile(path.join(sitesDir,slug,'salon.config.json')));sites.push({slug,name:c.name})}catch{}}return json(res,200,sites)
    }
    if(req.method==='GET' && url.pathname.startsWith('/api/jobs/'))return json(res,jobs.has(url.pathname.split('/').pop())?200:404,jobs.get(url.pathname.split('/').pop())||{error:'Job not found.'})
    if(req.method==='POST' && url.pathname==='/api/preview'){const data=await body(req);return json(res,200,{url:await servePreview(data.slug)})}
    if(req.method==='POST' && ['/api/import','/api/create'].includes(url.pathname)){
      if(busy)return json(res,409,{error:'A salon is already processing. Wait for it to finish.'})
      if(!req.headers['content-type']?.startsWith('application/json'))return json(res,415,{error:'JSON required.'})
      const data=await body(req),id=randomUUID();busy=true;const job={state:'running',message:'Starting…'};jobs.set(id,job);if(jobs.size>30)jobs.delete(jobs.keys().next().value)
      json(res,202,{id})
      const progress=message=>job.message=message
      try{job.result=url.pathname==='/api/import'?await importMaps(data.url,progress):await createSalon(data,progress);if(url.pathname==='/api/create')job.result.url=await servePreview(job.result.slug);job.state='done';job.message='Ready'}catch(e){job.state='error';job.error=e.message}finally{busy=false}
      return
    }
    json(res,404,{error:'Not found.'})
  }catch(e){json(res,400,{error:e.message})}
})
const port=Number(process.env.NAILKIT_PORT||8892)
server.listen(port,'127.0.0.1',()=>console.log(`NailKit Studio → http://127.0.0.1:${server.address().port}\nKeep this terminal running for local previews.`))
