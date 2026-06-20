import type { Metadata } from 'next'
import { Instrument_Serif, Barlow } from 'next/font/google'
import { ClerkProvider } from "@clerk/nextjs";
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
  title: 'Sverkos | Build AI Apps at the Speed of Thought',
  description: 'Meet your personal AI software engineer. Turn simple text prompts into fully functional, production-ready full-stack web apps in seconds with Sverkos.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${instrumentSerif.variable} ${barlow.variable}`}>
        <body className="bg-black text-white font-body antialiased">
          <main>{children}</main>  
        </body>
      </html>
    </ClerkProvider>
  );
}