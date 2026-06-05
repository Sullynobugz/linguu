'use client'
import dynamic from 'next/dynamic'

// SSR deaktiviert: App nutzt BrowserRouter, localStorage und Web Audio API
const App = dynamic(() => import('../src/App'), { ssr: false })

export default function Page() {
  return <App />
}
