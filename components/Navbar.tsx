'use client'

import { ArrowUpRight } from './Icons'
import {
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs"
import { useAuth } from "@clerk/nextjs"
import localFont from 'next/font/local'

const Zaslia = localFont({
  src: '../public/fonts/Zaslia.otf',
  display: 'swap',
})

const links = ['Home', 'Voyages', 'Worlds', 'Innovation', 'Plan Launch']

export default function Navbar() {
  const { isSignedIn } = useAuth()

  return (
    <nav className="fixed top-4 left-0 right-0 px-8 lg:px-16 z-50 flex items-center justify-between w-full">
      {/* Logo */}
      <div className="w-20 h-12 liquid-glass rounded-xl flex items-center justify-center shrink-0">
        <span className={`${Zaslia.className} italic text-white text-lg leading-none`}>
          Sverkos
        </span>
      </div>

      {/* Center Nav Links */}
      <div className="hidden lg:flex items-center liquid-glass rounded-full px-1.5 py-1.5 gap-1">
        {links.map((item) => (
          <a
            key={item}
            href="#"
            className="px-3 py-2 text-sm font-medium text-white/90 font-body whitespace-nowrap"
          >
            {item}
          </a>
        ))}
        <button className="bg-white text-black rounded-full px-4 py-2 text-sm font-medium font-body whitespace-nowrap flex items-center gap-1.5">
          Claim a Spot
          <ArrowUpRight className="h-4 w-4" />
        </button>
      </div>

      {/* Auth Buttons */}
      <div className="flex items-center gap-2 shrink-0 liquid-glass rounded-full px-2 py-1.5">
        {!isSignedIn ? (
          <>
            <SignInButton mode="modal">
              <button className="rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white/90 font-body hover:bg-white/10 transition">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="rounded-full bg-white text-black px-4 py-2 text-sm font-medium font-body hover:bg-white/90 transition">
                Sign up
              </button>
            </SignUpButton>
          </>
        ) : (
          <UserButton />
        )}
      </div>
    </nav>
  )
}