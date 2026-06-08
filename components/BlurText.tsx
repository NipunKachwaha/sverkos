'use client'

import { motion } from 'framer-motion'

export default function BlurText({ text, className = '' }: { text: string; className?: string }) {
  const words = text.split(' ')
  return (
    <p className={`flex flex-wrap justify-center ${className}`} style={{ rowGap: '0.1em' }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ filter: 'blur(10px)', opacity: 0, y: 50 }}
          whileInView={{
            filter: ['blur(10px)', 'blur(5px)', 'blur(0px)'],
            opacity: [0, 0.5, 1],
            y: [50, -5, 0],
          }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{
            duration: 0.7,
            times: [0, 0.5, 1],
            ease: 'easeOut',
            delay: i * 0.1,
          }}
          style={{ display: 'inline-block', marginRight: '0.28em' }}
        >
          {word}
        </motion.span>
      ))}
    </p>
  )
}