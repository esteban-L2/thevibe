import { lazy, Suspense, useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { Route, Routes } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Fondo from './components/Fondo'
import Inicio from './pages/Inicio'

// La vista de sala (con el reproductor de YouTube) se descarga solo cuando
// alguien entra a una sala, no al abrir la portada.
const Sala = lazy(() => import('./pages/Sala'))

function App() {
  const [usuario, setUsuario] = useState(null)

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
      <Fondo />

      <Suspense
        fallback={
          <p className="relative z-10 animate-pulse text-sm text-neutral-500">
            cargando la sala…
          </p>
        }
      >
        <Routes>
          <Route path="/" element={<Inicio usuario={usuario} />} />
          <Route path="/sala/:code" element={<Sala usuario={usuario} />} />
        </Routes>
      </Suspense>

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