import React from 'react'
import { createRoot } from 'react-dom/client'
import SalonSite from '@nailkit/template'
import '@nailkit/template/styles.css'
import config from '../salon.config.json'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SalonSite config={config} />
  </React.StrictMode>
)
