import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { supabase } from '../lib/supabase'
import { apiFetch } from '../lib/api'

function Sala({ usuario }) {
  const { code } = useParams()

  const [sala, setSala] = useState(null)
  const [miembros, setMiembros] = useState([])
  const [error, setError] = useState(null)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (!usuario) return

    async function entrar() {
      try {
        const datos = await apiFetch(`/rooms/${code}/join`, { method: 'POST' })
        setSala(datos)
      } catch (err) {
        setError(err.message)
      }
    }

    entrar()
  }, [code, usuario])

  useEffect(() => {
    if (!sala) return

    async function cargarMiembros() {
      const { data, error: errorSupabase } = await supabase
        .from('room_members')
        .select('user_id, joined_at')
        .eq('room_id', sala.id)
        .order('joined_at')

      if (errorSupabase) {
        console.error('Error al leer miembros:', errorSupabase.message)
        return
      }

      setMiembros(data)
    }

    cargarMiembros()

    const canal = supabase
      .channel(`sala-${sala.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_members',
          filter: `room_id=eq.${sala.id}`,
        },
        cargarMiembros,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [sala])

  async function copiarCodigo() {
    await navigator.clipboard.writeText(code)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  if (error) {
    return (
      <div className="relative z-10 flex flex-col items-center">
        <p className="text-lg text-rose-400">{error}</p>
        <Link
          to="/"
          className="mt-6 text-sm text-neutral-500 transition-colors hover:text-violet-400"
        >
          ← volver al inicio
        </Link>
      </div>
    )
  }

  if (!sala) {
    return (
      <p className="relative z-10 animate-pulse text-sm text-neutral-500">
        entrando a la sala…
      </p>
    )
  }

  const esHost = usuario?.id === sala.host_id

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative z-10 flex w-full max-w-sm flex-col items-center"
    >
      <p className="text-xs uppercase tracking-widest text-neutral-500">sala</p>

      <h1 className="mt-2 text-3xl font-semibold text-neutral-100">
        {sala.name}
      </h1>

      <button
        onClick={copiarCodigo}
        className="group mt-8 rounded-2xl border border-white/10 bg-white/5 px-8 py-5 transition-colors hover:border-violet-500/50"
      >
        <span className="font-mono text-4xl font-semibold tracking-[0.3em] text-violet-300">
          {sala.code}
        </span>
        <span className="mt-2 block text-xs text-neutral-500 group-hover:text-neutral-400">
          {copiado ? '¡copiado!' : 'toca para copiar'}
        </span>
      </button>

      <div className="mt-8 flex items-center gap-3 text-sm text-neutral-400">
        <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
        {miembros.length} {miembros.length === 1 ? 'persona' : 'personas'} en la
        sala
      </div>

      {esHost && (
        <span className="mt-4 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs uppercase tracking-widest text-violet-300">
          eres el host
        </span>
      )}

      <Link
        to="/"
        className="mt-10 text-sm text-neutral-500 transition-colors hover:text-violet-400"
      >
        ← salir de la sala
      </Link>
    </motion.div>
  )
}

export default Sala