import './globals.css'

export const metadata = {
  title: 'Sentinella Streamer Dashboard',
  description: 'Pre-Cognitive Content Safety Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
