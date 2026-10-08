import { motion } from 'motion/react'

const ORBES = [
  {
    clase: 'left-1/2 top-1/3 h-[34rem] w-[34rem] bg-violet-600/20',
    movimiento: { x: [0, 80, -40, 0], y: [0, -60, 40, 0], scale: [1, 1.15, 0.95, 1] },
    duracion: 26,
  },
  {
    clase: 'left-1/4 top-2/3 h-[26rem] w-[26rem] bg-fuchsia-600/20',
    movimiento: { x: [0, -70, 50, 0], y: [0, 50, -30, 0], scale: [1, 0.9, 1.1, 1] },
    duracion: 32,
  },
  {
    clase: 'left-3/4 top-1/4 h-[22rem] w-[22rem] bg-indigo-500/20',
    movimiento: { x: [0, 40, -60, 0], y: [0, 70, 20, 0], scale: [1, 1.2, 1, 1] },
    duracion: 38,
  },
]

function Fondo() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {ORBES.map(({ clase, movimiento, duracion }) => (
        <motion.div
          key={clase}
          className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px] ${clase}`}
          animate={movimiento}
          transition={{ duration: duracion, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Velo oscuro: baja la intensidad de los orbes para que el texto respire */}
      <div className="absolute inset-0 bg-neutral-950/45" />

      {/* Viñeta: oscurece los bordes y centra la mirada */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(10,10,10,0.95)_100%)]" />
    </div>
  )
}

export default Fondo
