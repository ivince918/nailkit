#!/usr/bin/env node
// For agent-assisted listing collection: one reviewed JSON file, no browser or key required.
import fs from 'node:fs/promises'
import path from 'node:path'
import {createSalon} from './create.mjs'
const file=process.argv[2]
if(!file){console.log('Usage: npm run generate -- inputs/salon.json\nFields: listing (name, address, phone, hours, services), photos (URL or data URI), theme.');process.exit(0)}
const raw=JSON.parse(await fs.readFile(path.resolve(file),'utf8'))
try{const result=await createSalon(raw.listing?raw:{listing:raw,photos:raw.photos||[],theme:raw.theme},console.log);console.log(`Created ${result.dir}\nPreview: npm run dev -- ${result.slug}`)}catch(e){console.error(e.message);process.exitCode=1}
