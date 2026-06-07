import type { Metadata } from 'next'
import { Instrument_Serif, Barlow } from 'next/font/google'
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import './globals.css'

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-heading',
  display: 'swap',
})

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Space — Venture Past Our Sky',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${instrumentSerif.variable} ${barlow.variable}`}>
        <body className="bg-black text-white font-body antialiased">
          <Navbar />
          <main className="p-4">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}