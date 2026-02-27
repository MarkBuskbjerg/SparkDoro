import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import '@ionic/react/css/core.css'
import '@ionic/react/css/normalize.css'
import '@ionic/react/css/structure.css'
import '@ionic/react/css/typography.css'
import '@ionic/react/css/padding.css'
import '@ionic/react/css/float-elements.css'
import '@ionic/react/css/text-alignment.css'
import '@ionic/react/css/text-transformation.css'
import '@ionic/react/css/flex-utils.css'
import './i18n'
import './index.css'
import './theme/variables.css'
import App from './App'

if (import.meta.env.DEV && Capacitor.getPlatform() === 'web') {
  const { default: axe } = await import('@axe-core/react')
  const React = await import('react')
  const ReactDOM = await import('react-dom')
  axe(React, ReactDOM, 1000)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
