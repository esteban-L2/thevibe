import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

function AvisoLento() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const mostrar = () => setVisible(true)
    const ocultar = () => setVisible(false)

    window.addEventListener('api:lenta', mostrar)
    window.addEventListener('api:fin', ocultar)

    return () => {
      window.removeEventListener('api:lenta', mostrar)
      window.removeEventListener('api:fin', ocultar)
    }
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4"
        >
          <div className="flex items-center gap-3 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-200 backdrop-blur-md">
            <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-amber-400" />
            Despertando el servidor… puede tardar hasta un minuto la primera vez.
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default AvisoLento
