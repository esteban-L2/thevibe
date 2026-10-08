import { motion } from 'motion/react'

const BARRAS = Array.from({ length: 32 }, (_, indice) => indice)

function OndaSonora({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`flex h-10 items-center justify-center gap-[3px] [mask-image:linear-gradient(to_right,transparent,black_25%,black_75%,transparent)] ${className}`}
    >
      {BARRAS.map((indice) => (
        <motion.span
          key={indice}
          className="h-full w-[3px] rounded-full bg-gradient-to-t from-violet-600/50 via-violet-400/70 to-fuchsia-300"
          style={{ transformOrigin: 'center' }}
          initial={{ scaleY: 0.15 }}
          animate={{ scaleY: [0.15, 0.85, 0.3, 0.65, 0.15] }}
          transition={{
            duration: 1.8 + (indice % 5) * 0.35,
            repeat: Infinity,
            delay: indice * 0.07,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

export default OndaSonora
