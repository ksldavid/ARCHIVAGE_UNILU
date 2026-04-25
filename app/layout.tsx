import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Portail d\'Archivage UNILU',
  description: 'Système professionnel d\'archivage des résultats académiques - Université de Lubumbashi',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
