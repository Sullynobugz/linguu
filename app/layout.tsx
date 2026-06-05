import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Linguu — Deutsch lernen',
  description: 'Deutsch lernen für echte Alltagssituationen in Deutschland',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
