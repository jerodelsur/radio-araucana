import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import FronteraApp from '../FronteraApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <FronteraApp />
  </StrictMode>,
)
