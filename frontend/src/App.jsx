import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { supabase } from './lib/supabase'

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

function App() {
  const [estado, setEstado] = useState('cargando')
  const [usuario, setUsuario] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((res) => res.json())
      .then(() => setEstado('ok'))
      .catch(() => setEstado('error'))
  }, [])

  useEffect(() => {
    async function iniciarSesion() {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        setUsuario(session.user)
        return
      }

      const { data, error } = await supabase.auth.signInAnonymously()

      if (error) {
        console.error('Error al iniciar sesión anónima:', error.message)
        return
      }

      setUsuario(data.user)
    }

    iniciarSesion()
  }, [])

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-neutral-950 px-6 py-24 text-center">
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/20 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 flex flex-col items-center"
      >
        <span className="mb-6 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-widest text-neutral-400">
          en construcción
        </span>

        <h1 className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-violet-400 bg-clip-text text-6xl font-semibold tracking-tight text-transparent sm:text-8xl">
          thevibe
        </h1>

        <p className="mt-6 max-w-md text-lg text-neutral-400">
          Una radio colaborativa en vivo. Propón canciones, vota la cola y deja
          que la sala encuentre su vibe.
        </p>

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

      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-2 px-6 py-8 text-xs text-neutral-600"
      >
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/esteban-L2/thevibe"
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-neutral-300"
          >
            GitHub
          </a>
          <span className="text-neutral-800">·</span>
          <span>v0.1.0</span>
        </div>
        <p>
          Hecho por{' '}
          <a
            href="https://github.com/esteban-L2"
            target="_blank"
            rel="noreferrer"
            className="text-neutral-400 transition-colors hover:text-violet-400"
          >
            Pablo Lituma
          </a>{' '}
          · © {new Date().getFullYear()}
        </p>
      </motion.footer>
    </main>
  )
}

export default App