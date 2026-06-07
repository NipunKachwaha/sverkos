'use client'

import { useRef, useEffect, useCallback } from 'react'

const FADE_MS = 500
const FADE_OUT_LEAD = 0.55

export default function FadingVideo({ src, className, style }: { src: string; className?: string; style?: React.CSSProperties }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const rafRef = useRef<number | null>(null)
  const fadingOutRef = useRef(false)

  const cancelFade = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const fadeTo = useCallback((target: number, duration: number) => {
    cancelFade()
    const video = videoRef.current
    if (!video) return

    const startOpacity = parseFloat(video.style.opacity) || 0
    const startTime = performance.now()
    const diff = target - startOpacity

    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - (1 - progress) * (1 - progress) * (1 - progress)
      video.style.opacity = String(startOpacity + diff * eased)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(step)
  }, [cancelFade])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onLoadedData = () => {
      video.style.opacity = '0'
      video.play()
      fadeTo(1, FADE_MS)
    }

    const onTimeUpdate = () => {
      if (!fadingOutRef.current && video.duration - video.currentTime <= FADE_OUT_LEAD && video.duration - video.currentTime > 0) {
        fadingOutRef.current = true
        fadeTo(0, FADE_MS)
      }
    }

    const onEnded = () => {
      video.style.opacity = '0'
      setTimeout(() => {
        video.currentTime = 0
        video.play()
        fadingOutRef.current = false
        fadeTo(1, FADE_MS)
      }, 100)
    }

    video.addEventListener('loadeddata', onLoadedData)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('ended', onEnded)

    if (video.readyState >= 2) {
      onLoadedData()
    }

    return () => {
      cancelFade()
      video.removeEventListener('loadeddata', onLoadedData)
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('ended', onEnded)
    }
  }, [cancelFade, fadeTo])

  return (
    <video
      ref={videoRef}
      src={src}
      autoPlay
      muted
      playsInline
      preload="auto"
      className={className}
      style={{ ...style, opacity: 0 }}
    />
  )
}
