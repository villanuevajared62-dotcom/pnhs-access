import type { Metadata } from 'next'
<<<<<<< HEAD
import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const plusJakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta' })

export const metadata: Metadata = {
  title: 'PNHS ACCESS - Pantabangan National High School',
  description: 'Academic Content & Community Enhancement System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${plusJakarta.variable} font-sans`}>{children}</body>
    </html>
  )
}
=======
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PNHS ACCESS | Pantabangan National High School',
  description: 'Academic Content & Community Enhancement System - Empowering education through technology',
  keywords: 'PNHS, Pantabangan NHS, Student Portal, Education System, ACCESS Portal, Nueva Ecija',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
>>>>>>> abd22b2953a867c47a19ce65745932cb9bbe898c
