import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import ExtractosApp from './extractos/ExtractosApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ExtractosApp />
  </StrictMode>,
)
