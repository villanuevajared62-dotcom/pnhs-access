import type { Metadata } from 'next'
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