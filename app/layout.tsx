import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Time Balance App',
  description: 'Professional time tracking and productivity app',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
