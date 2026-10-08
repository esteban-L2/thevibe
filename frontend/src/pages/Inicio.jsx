import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../lib/api'
import Logo from '../components/Logo'
import OndaSonora from '../components/OndaSonora'

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

const CARACTERISTICAS = [
  { texto: 'sin registro', color: 'bg-emerald-400' },
  { texto: 'en tiempo real', color: 'bg-violet-400' },
  { texto: 'deciden votando', color: 'bg-fuchsia-400' },
]

const contenedor = {
  oculto: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
}

const elemento = {
  oculto: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
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
      variants={contenedor}
      initial="oculto"
      animate="visible"
      className="relative z-10 grid w-full max-w-4xl items-center gap-12 md:grid-cols-[1.1fr_1fr] md:gap-16"
    >
      <motion.div
        variants={contenedor}
        className="flex flex-col items-center md:items-start md:text-left"
      >
        <motion.div variants={elemento} className="relative self-center">
          <motion.div
            className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-violet-600/50 to-fuchsia-600/40 blur-2xl"
            animate={{ opacity: [0.45, 0.9, 0.45], scale: [0.95, 1.08, 0.95] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <Logo className="relative h-14 w-14" />
        </motion.div>

        <motion.div
          variants={elemento}
          className="mt-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.35em] text-neutral-500"
        >
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-white/25 md:hidden" />
          radio colaborativa
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-white/25" />
        </motion.div>

        <motion.h1
          variants={elemento}
          className="mt-3 bg-gradient-to-r from-white via-fuchsia-300 to-violet-400 bg-[length:200%_auto] bg-clip-text text-7xl font-bold tracking-tighter text-transparent drop-shadow-[0_4px_30px_rgba(168,85,247,0.4)]"
          animate={{ backgroundPosition: ['0% 50%', '200% 50%'] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
        >
          thevibe
        </motion.h1>

        <motion.div variants={elemento} className="w-full">
          <OndaSonora className="md:[mask-image:linear-gradient(to_right,black_55%,transparent)]" />
        </motion.div>

        <motion.p
          variants={elemento}
          className="mt-1 max-w-xs text-balance text-base leading-relaxed text-neutral-400 md:max-w-sm"
        >
          Crea una sala, comparte el código y{' '}
          <span className="font-medium text-white">decidan juntos qué suena</span>.
        </motion.p>

        <motion.div
          variants={elemento}
          className="mt-7 flex flex-wrap justify-center gap-2 md:justify-start"
        >
          {CARACTERISTICAS.map(({ texto, color }) => (
            <span
              key={texto}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] py-1.5 pl-2.5 pr-3.5 text-xs font-medium text-neutral-300 shadow-lg shadow-black/40 backdrop-blur-md"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
              {texto}
            </span>
          ))}
        </motion.div>
      </motion.div>

      <motion.div variants={elemento} className="w-full">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/50 backdrop-blur-md">
          <form onSubmit={crearSala}>
            <label className="mb-2 block text-left text-xs uppercase tracking-widest text-neutral-500">
              empezar una sala
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              placeholder="Nombre de la sala"
              maxLength={60}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-neutral-100 placeholder-neutral-600 outline-none transition-all focus:border-violet-500/60 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15)]"
            />
            <motion.button
              type="submit"
              disabled={!listo}
              whileHover={listo ? { scale: 1.02 } : undefined}
              whileTap={listo ? { scale: 0.98 } : undefined}
              className="mt-3 w-full rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 font-medium text-white shadow-lg shadow-violet-900/30 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              {enviando ? 'creando…' : 'Crear sala'}
            </motion.button>
          </form>

          <div className="my-5 flex items-center gap-4 text-[10px] uppercase tracking-[0.2em] text-neutral-700">
            <div className="h-px flex-1 bg-white/10" />
            o
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={unirseASala}>
            <label className="mb-2 block text-left text-xs uppercase tracking-widest text-neutral-500">
              entrar con código
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={codigo}
                onChange={(evento) => setCodigo(evento.target.value.toUpperCase())}
                placeholder="CÓDIGO"
                maxLength={6}
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-center font-mono tracking-[0.3em] text-neutral-100 placeholder-neutral-600 outline-none transition-all focus:border-violet-500/60 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.15)]"
              />
              <motion.button
                type="submit"
                disabled={!listo || codigo.trim().length < 6}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="rounded-xl border border-white/10 px-5 py-3 font-medium text-neutral-300 transition-colors hover:border-violet-500/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Entrar
              </motion.button>
            </div>
          </form>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm text-rose-400"
            >
              {error}
            </motion.p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-center gap-3 text-xs text-neutral-600">
          <span className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${COLORES[estado]} ${
                estado === 'cargando' ? 'animate-pulse' : ''
              }`}
            />
            {TEXTOS[estado]}
          </span>
          <span className="text-neutral-800">·</span>
          <span className="font-mono">
            {usuario ? `sesión ${usuario.id.slice(0, 8)}` : 'creando sesión…'}
          </span>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default Inicio
