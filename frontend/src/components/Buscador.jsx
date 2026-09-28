import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { apiFetch } from '../lib/api'

function Buscador({ code }) {
  const [consulta, setConsulta] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [agregando, setAgregando] = useState(null)
  const [error, setError] = useState(null)

  async function buscar(evento) {
    evento.preventDefault()
    if (consulta.trim().length < 2) return

    setBuscando(true)
    setError(null)

    try {
      const datos = await apiFetch(`/search?q=${encodeURIComponent(consulta)}`)
      setResultados(datos.results)
    } catch (err) {
      setError(err.message)
    } finally {
      setBuscando(false)
    }
  }

  async function agregar(cancion) {
    setAgregando(cancion.video_id)
    setError(null)

    try {
      await apiFetch(`/rooms/${code}/queue`, {
        method: 'POST',
        body: JSON.stringify(cancion),
      })
      setResultados([])
      setConsulta('')
    } catch (err) {
      setError(err.message)
    } finally {
      setAgregando(null)
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={buscar} className="flex gap-2">
        <input
          type="text"
          value={consulta}
          onChange={(evento) => setConsulta(evento.target.value)}
          placeholder="Buscar una canción…"
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-neutral-100 placeholder-neutral-600 outline-none transition-colors focus:border-violet-500/50"
        />
        <button
          type="submit"
          disabled={buscando}
          className="rounded-xl bg-violet-600 px-5 py-3 font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-40"
        >
          {buscando ? '…' : 'Buscar'}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}

      <AnimatePresence>
        {resultados.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2 overflow-hidden"
          >
            {resultados.map((cancion) => (
              <li
                key={cancion.video_id}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2 text-left"
              >
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
                <button
                  onClick={() => agregar(cancion)}
                  disabled={agregando === cancion.video_id}
                  className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-300 transition-colors hover:border-violet-500/50 hover:text-white disabled:opacity-40"
                >
                  {agregando === cancion.video_id ? '…' : '+ Agregar'}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Buscador