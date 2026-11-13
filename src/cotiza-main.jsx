import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import CotizaApp from './cotiza/CotizaApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CotizaApp />
    <Analytics />
  </StrictMode>,
)
