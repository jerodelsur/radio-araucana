import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import FronteraApp from '../FronteraApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FronteraApp />
    <Analytics />
  </StrictMode>,
)
