import test from 'node:test'
import assert from 'node:assert/strict'
import {parseHours,mapsUrl,photoUrl} from './maps.mjs'
import {validateListing} from './create.mjs'
test('hours preserve missing days and flag holidays or split schedules',()=>{
 const r=parseHours(['Monday, 9:30 AM to 6 PM, Copy open hours','Tuesday, Closed, Copy open hours','Wednesday, 12 PM to 7:30 PM, Copy open hours','Thursday, 9 AM to 6 PM, Hours might differ','Friday, 9 AM to 12 PM, 1 PM to 6 PM']);assert.deepEqual(r.hours,{mon:'09:30-18:00',tue:'closed',wed:'12:00-19:30'});assert.equal(r.warnings.length,2)
})
test('URL validation accepts listing and photo origins and rejects arbitrary requests',()=>{
 assert.match(mapsUrl('https://maps.app.goo.gl/example'),/hl=en/);assert.match(photoUrl('https://lh3.googleusercontent.com/p/example=w200'),/example/)
 for(const u of ['http://127.0.0.1','https://google.com.evil.test/maps','https://www.google.com:123/maps','https://user:pass@www.google.com/maps'])assert.throws(()=>mapsUrl(u))
 for(const u of ['https://example.com/a.jpg','https://lh3.googleusercontent.com/a-/avatar','file:///etc/passwd'])assert.throws(()=>photoUrl(u))
})
test('invalid fields and impossible hours fail before writing a site',()=>{
 assert.throws(()=>validateListing({name:'',address:'Anywhere'}));assert.throws(()=>validateListing({name:'Nails',address:'Anywhere',hours:{mon:'25:30-29:00'}}));assert.throws(()=>validateListing({name:'Nails',address:'Anywhere',bookingUrl:'javascript:alert(1)'}));assert.deepEqual(validateListing({name:' Nails ',address:'Anywhere',hours:{sun:'closed'}}).hours,{sun:'closed'})
})

import fs from 'node:fs/promises'
import path from 'node:path'
import {createSalon} from './create.mjs'
import {sitesDir} from '../generator/scaffold.mjs'
test('blank generation builds three pages without client imagery; repeated names do not overwrite',async()=>{
 const name=`Builder Test ${Date.now()}`,created=[]
 try {
   const input={listing:{name,address:'123 Test Road, Test City, CA 90000',hours:{mon:'09:00-17:00'},phone:''},photos:[]}
   const first=await createSalon(input);created.push(first.dir)
   const second=await createSalon(input);created.push(second.dir)
   assert.notEqual(first.slug,second.slug)
   const c=JSON.parse(await fs.readFile(path.join(first.dir,'salon.config.json')))
   assert.deepEqual(c.photos,[]);assert.equal(c.heroImage,null);assert.deepEqual(c.reviews,[]);assert.equal(c.bookingDelivery,'preview');assert.equal(c.hours.length,1)
   for(const page of ['index.html','book/index.html','gallery/index.html']){const html=await fs.readFile(path.join(first.dir,'dist',page),'utf8');assert.match(html,/noindex/);assert.ok(!html.includes('Precious Nails'))}
 } finally {for(const dir of created){assert.ok(dir.startsWith(path.join(sitesDir,'builder-test-')));await fs.rm(dir,{recursive:true,force:true})}}
})

test('uploaded originals survive and requested hero leads the responsive image set',async()=>{
 const source=await fs.readFile(path.join(sitesDir,'precious-nails-el-sobrante/public/photos/01.webp'))
 const hero=await fs.readFile(path.join(sitesDir,'precious-nails-el-sobrante/public/photos/hero-editorial-v2.webp'))
 let dir
 try{
   const result=await createSalon({listing:{name:`Builder Photo Test ${Date.now()}`,address:'123 Test Road, Test City, CA 90000',hours:{}},photos:[{data:'data:image/webp;base64,'+source.toString('base64'),alt:'Portrait'},{data:'data:image/webp;base64,'+hero.toString('base64'),hero:true,alt:'Chosen hero'}]});dir=result.dir
   const c=JSON.parse(await fs.readFile(path.join(dir,'salon.config.json')))
   assert.equal(c.photos.length,2);assert.equal(c.heroImage.src,c.photos[0].src);assert.equal(c.photos[0].width,1672);assert.equal(c.photos[0].smallWidth,800)
   assert.deepEqual(await fs.readFile(path.join(dir,'source-images/01.webp')),hero)
 } finally {if(dir)await fs.rm(dir,{recursive:true,force:true})}
})
