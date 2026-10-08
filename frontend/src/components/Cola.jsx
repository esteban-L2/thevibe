import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { supabase } from '../lib/supabase'
import { apiFetch } from '../lib/api'

function Cola({ code, salaId }) {
  const [canciones, setCanciones] = useState([])
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    try {
      const datos = await apiFetch(`/rooms/${code}/queue`)
      setCanciones(datos.queue)
    } catch (err) {
      console.error('Error al leer la cola:', err.message)
    } finally {
      setCargando(false)
    }
  }, [code])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial; se migrará a una librería de datos
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes' },
        cargar,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [salaId, cargar])

  async function alternarVoto(cancion) {
    const yaVotada = cancion.voted_by_me

    setCanciones((actuales) =>
      [...actuales]
        .map((item) =>
          item.id === cancion.id
            ? {
                ...item,
                voted_by_me: !yaVotada,
                votes: item.votes + (yaVotada ? -1 : 1),
              }
            : item,
        )
        .sort(
          (a, b) =>
            b.votes - a.votes || a.created_at.localeCompare(b.created_at),
        ),
    )

    try {
      await apiFetch(`/queue/${cancion.id}/vote`, {
        method: yaVotada ? 'DELETE' : 'POST',
      })
    } catch (err) {
      console.error('No se pudo registrar el voto:', err.message)
      cargar()
    }
  }

  if (cargando) {
    return <p className="py-8 text-sm text-neutral-600">cargando la cola…</p>
  }

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
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2 text-left"
          >
            <span className="w-5 shrink-0 text-center font-mono text-sm text-neutral-600">
              {indice + 1}
            </span>

            <img
              src={cancion.thumbnail_url}
              alt=""
              className="h-12 w-20 shrink-0 rounded-lg object-cover"
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-neutral-200">
                {cancion.title}
              </p>
              <p className="truncate text-xs text-neutral-500">
                {cancion.channel}
              </p>
            </div>

            <button
              onClick={() => alternarVoto(cancion)}
              className={`flex shrink-0 flex-col items-center rounded-lg border px-3 py-1.5 transition-colors ${
                cancion.voted_by_me
                  ? 'border-violet-500/50 bg-violet-500/15 text-violet-300'
                  : 'border-white/10 text-neutral-400 hover:border-violet-500/40 hover:text-neutral-200'
              }`}
            >
              <span className="text-xs leading-none">▲</span>
              <span className="font-mono text-sm leading-tight">
                {cancion.votes}
              </span>
            </button>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}

export default Cola