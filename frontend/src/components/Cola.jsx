import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { supabase } from '../lib/supabase'

function Cola({ salaId }) {
  const [canciones, setCanciones] = useState([])

  useEffect(() => {
    async function cargar() {
      const { data, error } = await supabase
        .from('queue_items')
        .select('*')
        .eq('room_id', salaId)
        .eq('status', 'pending')
        .order('created_at')

      if (error) {
        console.error('Error al leer la cola:', error.message)
        return
      }

      setCanciones(data)
    }

    cargar()

    const canal = supabase
      .channel(`cola-${salaId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_items',
          filter: `room_id=eq.${salaId}`,
        },
        cargar,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [salaId])

  if (canciones.length === 0) {
    return (
      <p className="py-8 text-sm text-neutral-600">
        La cola está vacía. Busca algo y ponlo a sonar.
      </p>
    )
  }

  return (
    <ul className="w-full space-y-2">
      <AnimatePresence initial={false}>
        {canciones.map((cancion, indice) => (
          <motion.li
            key={cancion.id}
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2 text-left"
          >
            <span className="w-6 shrink-0 text-center font-mono text-sm text-neutral-600">
              {indice + 1}
            </span>
            <img
              src={cancion.thumbnail_url}
              alt=""
              className="h-12 w-20 rounded-lg object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-neutral-200">
                {cancion.title}
              </p>
              <p className="truncate text-xs text-neutral-500">
                {cancion.channel}
              </p>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}

export default Cola