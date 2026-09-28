import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

const COLORES = {
  cargando: 'bg-amber-400',
  ok: 'bg-emerald-400',
  error: 'bg-rose-500',
}

const TEXTOS = {
  cargando: 'conectando con el servidor',
  ok: 'servidor conectado',
  error: 'servidor fuera de línea',
}

function Inicio({ usuario }) {
  const navigate = useNavigate()

  const [estado, setEstado] = useState('cargando')
  const [nombre, setNombre] = useState('')
  const [codigo, setCodigo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((res) => res.json())
      .then(() => setEstado('ok'))
      .catch(() => setEstado('error'))
  }, [])

  async function crearSala(evento) {
    evento.preventDefault()
    setEnviando(true)
    setError(null)

    try {
      const sala = await apiFetch('/rooms', {
        method: 'POST',
        body: JSON.stringify({ name: nombre.trim() || 'Sala sin nombre' }),
      })
      navigate(`/sala/${sala.code}`)
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  async function unirseASala(evento) {
    evento.preventDefault()
    setEnviando(true)
    setError(null)

    try {
      const sala = await apiFetch(`/rooms/${codigo.trim().toUpperCase()}/join`, {
        method: 'POST',
      })
      navigate(`/sala/${sala.code}`)
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  const listo = Boolean(usuario) && !enviando

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="relative z-10 flex w-full max-w-sm flex-col items-center"
    >
      <h1 className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-violet-400 bg-clip-text text-6xl font-semibold tracking-tight text-transparent sm:text-7xl">
        thevibe
      </h1>

      <p className="mt-4 text-neutral-400">
        Crea una sala, comparte el código y decidan juntos qué suena.
      </p>

      <form onSubmit={crearSala} className="mt-10 w-full">
        <input
          type="text"
          value={nombre}
          onChange={(evento) => setNombre(evento.target.value)}
          placeholder="Nombre de la sala"
          maxLength={60}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-neutral-100 placeholder-neutral-600 outline-none transition-colors focus:border-violet-500/50"
        />
        <button
          type="submit"
          disabled={!listo}
          className="mt-3 w-full rounded-xl bg-violet-600 px-4 py-3 font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {enviando ? 'creando…' : 'Crear sala'}
        </button>
      </form>

      <div className="my-8 flex w-full items-center gap-4 text-xs uppercase tracking-widest text-neutral-700">
        <div className="h-px flex-1 bg-white/10" />
        o
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={unirseASala} className="flex w-full gap-2">
        <input
          type="text"
          value={codigo}
          onChange={(evento) => setCodigo(evento.target.value.toUpperCase())}
          placeholder="CÓDIGO"
          maxLength={6}
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center font-mono tracking-widest text-neutral-100 placeholder-neutral-600 outline-none transition-colors focus:border-violet-500/50"
        />
        <button
          type="submit"
          disabled={!listo || codigo.trim().length < 6}
          className="rounded-xl border border-white/10 px-5 py-3 font-medium text-neutral-300 transition-colors hover:border-violet-500/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Entrar
        </button>
      </form>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-sm text-rose-400"
        >
          {error}
        </motion.p>
      )}

      <div className="mt-10 flex flex-col items-center gap-2 text-sm text-neutral-500">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${COLORES[estado]} ${
              estado === 'cargando' ? 'animate-pulse' : ''
            }`}
          />
          {TEXTOS[estado]}
        </div>
        <div className="font-mono text-xs text-neutral-600">
          {usuario ? `sesión: ${usuario.id.slice(0, 8)}` : 'creando sesión…'}
        </div>
      </div>
    </motion.div>
  )
}

export default Inicio