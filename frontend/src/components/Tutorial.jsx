import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

const PASOS = [
  {
    icono: '🔗',
    titulo: 'Comparte el código',
    texto: 'Pásale el código de la sala a quien quieras. Entran desde cualquier dispositivo, sin registrarse.',
  },
  {
    icono: '🔎',
    titulo: 'Propongan canciones',
    texto: 'Busca en YouTube y agrégalas a la cola. Puedes tener hasta tres esperando a la vez.',
  },
  {
    icono: '▲',
    titulo: 'Voten qué suena',
    texto: 'Un voto por persona y por canción. La más votada es la siguiente, y la cola se reordena para todos al instante.',
  },
  {
    icono: '🎧',
    titulo: 'Escuchen juntos',
    texto: 'Cada quien reproduce en su dispositivo, pero la cola y la canción actual son las mismas para toda la sala.',
  },
]

function Tutorial({ abierto, onCerrar }) {
  const [paso, setPaso] = useState(0)

  function cerrar() {
    setPaso(0)
    onCerrar()
  }

  useEffect(() => {
    if (!abierto) return

    function alTeclear(evento) {
      if (evento.key === 'Escape') cerrar()
    }

    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  })

  const actual = PASOS[paso]
  const esUltimo = paso === PASOS.length - 1

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={cerrar}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Cómo funciona thevibe"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(evento) => evento.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-900/95 p-6 text-center shadow-2xl shadow-black/60"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={paso}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-500/30 bg-violet-500/10 text-2xl">
                  {actual.icono}
                </div>

                <h2 className="mt-4 text-lg font-semibold text-neutral-100">
                  {actual.titulo}
                </h2>

                <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                  {actual.texto}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 flex items-center justify-center gap-1.5">
              {PASOS.map((item, indice) => (
                <span
                  key={item.titulo}
                  className={`h-1.5 rounded-full transition-all ${
                    indice === paso ? 'w-5 bg-violet-400' : 'w-1.5 bg-white/20'
                  }`}
                />
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={cerrar}
                className="text-xs text-neutral-500 transition-colors hover:text-neutral-300"
              >
                Saltar
              </button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => (esUltimo ? cerrar() : setPaso(paso + 1))}
                className="ml-auto rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-violet-900/30"
              >
                {esUltimo ? '¡Entendido!' : 'Siguiente'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Tutorial
