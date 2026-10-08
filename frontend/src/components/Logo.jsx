import { motion } from 'motion/react'

const BARRAS = [
  { x: 16, retraso: 0 },
  { x: 29, retraso: 0.2 },
  { x: 42, retraso: 0.4 },
]

function Logo({ className = 'h-12 w-12', animado = true }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-label="thevibe">
      <defs>
        <linearGradient id="logo-vibe" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#e879f9" />
        </linearGradient>
      </defs>

      <rect width="64" height="64" rx="16" fill="#0a0a0a" />
      <rect
        width="63"
        height="63"
        x="0.5"
        y="0.5"
        rx="15.5"
        fill="none"
        stroke="url(#logo-vibe)"
        strokeOpacity="0.35"
      />

      {BARRAS.map(({ x, retraso }) => (
        <motion.rect
          key={x}
          x={x}
          y={16}
          width="6"
          height="32"
          rx="3"
          fill="url(#logo-vibe)"
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          initial={{ scaleY: 0.4 }}
          animate={animado ? { scaleY: [0.35, 1, 0.55, 0.9, 0.35] } : { scaleY: 0.7 }}
          transition={{
            duration: 1.8,
            repeat: animado ? Infinity : 0,
            delay: retraso,
            ease: 'easeInOut',
          }}
        />
      ))}
    </svg>
  )
}

export default Logo
