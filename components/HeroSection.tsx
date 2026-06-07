'use client'

import { motion } from 'framer-motion'
import FadingVideo from './FadingVideo'
import Navbar from './Navbar'
import BlurText from './BlurText'
import { ArrowUpRight, PlayIcon, ClockIcon, GlobeIcon } from './Icons'

const stats = [
  { icon: ClockIcon, value: '34.5 Min', label: 'Average Videos Watch Time' },
  { icon: GlobeIcon, value: '2.8B+', label: 'Users Across the Globe' },
]
const partners = ['Aeon', 'Vela', 'Apex', 'Orbit', 'Zeno']

export default function HeroSection() {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-black">
      <FadingVideo
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4"
        className="absolute left-1/2 top-0 -translate-x-1/2 object-cover object-top z-0"
        style={{ width: '120%', height: '120%' }}
      />
      <div className="relative z-10 flex flex-col h-full">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center pt-24 px-4">
          <motion.div
            initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
            className="liquid-glass rounded-full inline-flex items-center gap-0 mb-6"
          >
            <span className="bg-white text-black px-3 py-1 text-xs font-semibold rounded-full">New</span>
            <span className="text-sm text-white/90 pr-3 font-body">Maiden Crewed Voyage to Mars Arrives 2026</span>
          </motion.div>

          <BlurText
            text="Venture Past Our Sky Across the Universe"
            className="text-6xl md:text-7xl lg:text-[5.5rem] font-heading italic text-white leading-[0.8] max-w-2xl tracking-[-4px]"
          />

          <motion.p
            initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8, ease: 'easeOut' }}
            className="mt-4 text-sm md:text-base text-white max-w-2xl font-body font-light leading-tight text-center"
          >
            Discover the universe in ways once unimaginable. Our pioneering vessels and breakthrough engineering bring deep-space exploration within reach&mdash;secure and extraordinary.
          </motion.p>

          <motion.div
            initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.1, ease: 'easeOut' }}
            className="flex items-center gap-6 mt-6"
          >
            <button className="liquid-glass-strong rounded-full px-5 py-2.5 text-sm font-medium text-white flex items-center gap-2 font-body">
              Start Your Voyage
              <ArrowUpRight className="h-5 w-5" />
            </button>
            <button className="text-sm font-medium text-white font-body flex items-center gap-2">
              View Liftoff
              <PlayIcon className="h-4 w-4" />
            </button>
          </motion.div>

          <motion.div
            initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
            animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.3, ease: 'easeOut' }}
            className="flex items-stretch gap-4 mt-8"
          >
            {stats.map((stat, i) => {
              const Icon = stat.icon
              return (
                <div key={i} className="liquid-glass p-5 w-[220px] rounded-[1.25rem]">
                  <Icon className="text-white w-7 h-7" />
                  <div className="mt-3 font-heading italic text-white text-4xl tracking-[-1px] leading-none">{stat.value}</div>
                  <div className="text-xs text-white font-body font-light mt-2">{stat.label}</div>
                </div>
              )
            })}
          </motion.div>
        </div>

        <motion.div
          initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
          animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.4, ease: 'easeOut' }}
          className="flex flex-col items-center gap-4 pb-8"
        >
          <div className="liquid-glass rounded-full px-3.5 py-1 text-xs font-medium text-white font-body">
            Collaborating with top aerospace pioneers globally
          </div>
          <div className="flex items-center justify-center text-2xl md:text-3xl tracking-tight gap-12 md:gap-16 font-heading italic text-white">
            {partners.map((name, i) => (
              <span key={name}>{name}{i < partners.length - 1 ? ' \u00B7' : ''}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
