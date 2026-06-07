'use client'

import { motion } from 'framer-motion'
import FadingVideo from './FadingVideo'
import { ImageIcon, MovieIcon, LightbulbIcon } from './Icons'

const cards = [
  {
    icon: ImageIcon,
    title: 'AI Scenery',
    description: 'AI analyzes your product to create indistinguishable natural environments \u2014 from Icelandic cliffs to misty forests.',
    tags: ['Natural Context', 'Photo Realism', 'Infinite Settings', 'Eco-Vibe'],
  },
  {
    icon: MovieIcon,
    title: 'Batch Production',
    description: 'Style your entire product line in minutes. Create a unified visual identity for catalogues and social media without weeks of retouching.',
    tags: ['Scale Fast', 'Visual Consistency', 'Time Saver', 'Ready to Post'],
  },
  {
    icon: LightbulbIcon,
    title: 'Smart Lighting',
    description: 'Automatic lighting and material adjustment. Achieve flawless integration with realistic shadows and sunlight.',
    tags: ['Ray Tracing', 'Physical Shadows', 'Studio Quality', 'Sunlight Sync'],
  },
]

export default function CapabilitiesSection() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-black">
      <FadingVideo
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_094631_d30ab262-45ee-4b7d-99f3-5d5848c8ef13.mp4"
        className="absolute inset-0 w-full h-full object-cover z-0"
      />
      <div className="relative z-10 px-8 md:px-16 lg:px-20 pt-24 pb-10 flex flex-col min-h-screen">
        <motion.div
          initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
          whileInView={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="mb-auto"
        >
          <p className="text-sm font-body text-white/80 mb-6">// Capabilities</p>
          <h2 className="font-heading italic text-white text-6xl md:text-7xl lg:text-[6rem] leading-[0.9] tracking-[-3px]">
            Production<br />evolved
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          {cards.map((card, i) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.title}
                initial={{ filter: 'blur(10px)', opacity: 0, y: 30 }}
                whileInView={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, delay: 0.15 * i, ease: 'easeOut' }}
                className="liquid-glass rounded-[1.25rem] p-6 min-h-[360px] flex flex-col"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="w-11 h-11 liquid-glass flex items-center justify-center shrink-0" style={{ borderRadius: '0.75rem' }}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
                    {card.tags.map((tag) => (
                      <span key={tag} className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 font-body whitespace-nowrap">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex-1" />
                <div className="mt-6">
                  <h3 className="font-heading italic text-white text-3xl md:text-4xl tracking-[-1px] leading-none">{card.title}</h3>
                  <p className="mt-3 text-sm text-white/90 font-body font-light leading-snug max-w-[32ch]">{card.description}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
