import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { supabase } from '../lib/supabase'
import { apiFetch } from '../lib/api'
import { marcarVisto, yaVisto } from '../lib/preferencias'
import Buscador from '../components/Buscador'
import Cola from '../components/Cola'
import Reproductor from '../components/Reproductor'
import Tutorial from '../components/Tutorial'

// El sufijo de versión permite volver a mostrarlo si algún día cambia el
// tutorial: basta con subirlo a v2.
const CLAVE_TUTORIAL = 'tutorial-sala-v1'

function Sala({ usuario }) {
  const { code } = useParams()

  const [tutorialAbierto, setTutorialAbierto] = useState(() => !yaVisto(CLAVE_TUTORIAL))
  const [sala, setSala] = useState(null)
  const [miembros, setMiembros] = useState([])
  const [actual, setActual] = useState(null)
  const [cola, setCola] = useState([])
  const [error, setError] = useState(null)
  const [aviso, setAviso] = useState(null)
  const [copiado, setCopiado] = useState(false)
  const [vibe, setVibe] = useState(null)

  const salaId = sala?.id

  useEffect(() => {
    if (!usuario) return

    async function entrar() {
      try {
        setSala(await apiFetch(`/rooms/${code}/join`, { method: 'POST' }))
      } catch (err) {
        setError(err.message)
      }
    }

    entrar()
  }, [code, usuario])

  const cargarCola = useCallback(async () => {
    try {
      const datos = await apiFetch(`/rooms/${code}/queue`)
      setActual(datos.current)
      setCola(datos.queue)
    } catch (err) {
      console.error('Error al leer la cola:', err.message)
    }
  }, [code])

  const recargarSala = useCallback(async () => {
    try {
      setSala(await apiFetch(`/rooms/${code}`))
    } catch (err) {
      console.error('Error al leer la sala:', err.message)
    }
  }, [code])

  useEffect(() => {
    if (!salaId) return

    async function cargarMiembros() {
      const { data, error: errorSupabase } = await supabase
        .from('room_members')
        .select('user_id')
        .eq('room_id', salaId)

      if (errorSupabase) {
        console.error('Error al leer miembros:', errorSupabase.message)
        return
      }

      setMiembros(data)
    }

    cargarMiembros()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial; se migrará a una librería de datos
    cargarCola()

    const canal = supabase
      .channel(`sala-${salaId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${salaId}` },
        cargarMiembros,
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queue_items', filter: `room_id=eq.${salaId}` },
        cargarCola,
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, cargarCola)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${salaId}` },
        recargarSala,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [salaId, cargarCola, recargarSala])

  // Red de seguridad: si Realtime se cae o el navegador suspende la pestaña,
  // igual nos ponemos al día cada poco y al volver a la pestaña.
  useEffect(() => {
    if (!salaId) return

    function ponerseAlDia() {
      cargarCola()
      recargarSala()
    }

    const intervalo = setInterval(ponerseAlDia, 15000)

    function alVolver() {
      if (!document.hidden) ponerseAlDia()
    }

    document.addEventListener('visibilitychange', alVolver)

    return () => {
      clearInterval(intervalo)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [salaId, cargarCola, recargarSala])

  // Firma de lo que suena y lo que espera: solo le preguntamos a la IA cuando
  // el repertorio cambia de verdad, no en cada recarga de la cola.
  const firmaCanciones = [actual?.video_id, ...cola.map((item) => item.video_id)]
    .filter(Boolean)
    .sort()
    .join(',')

  useEffect(() => {
    if (!firmaCanciones) return

    let cancelado = false

    apiFetch(`/rooms/${code}/vibe`)
      .then((datos) => {
        if (!cancelado) setVibe(datos.vibe)
      })
      .catch(() => {
        // Sin llave de IA o error puntual: la sala funciona igual, sin insignia.
      })

    return () => {
      cancelado = true
    }
  }, [code, firmaCanciones])

  async function alternarVoto(cancion) {
    const yaVotada = cancion.voted_by_me

    setCola((actuales) =>
      [...actuales]
        .map((item) =>
          item.id === cancion.id
            ? { ...item, voted_by_me: !yaVotada, votes: item.votes + (yaVotada ? -1 : 1) }
            : item,
        )
        .sort((a, b) => b.votes - a.votes || a.created_at.localeCompare(b.created_at)),
    )

    try {
      await apiFetch(`/queue/${cancion.id}/vote`, { method: yaVotada ? 'DELETE' : 'POST' })
    } catch (err) {
      console.error('No se pudo registrar el voto:', err.message)
      cargarCola()
    }
  }

  const pasarSiguiente = useCallback(async () => {
    setAviso(null)

    try {
      const datos = await apiFetch(`/rooms/${code}/next`, { method: 'POST' })
      setActual(datos.current)
      cargarCola()
    } catch (err) {
      setAviso(err.message)
    }
  }, [code, cargarCola])

  async function alternarPermisoSalto() {
    try {
      setSala(
        await apiFetch(`/rooms/${code}/settings`, {
          method: 'PATCH',
          body: JSON.stringify({ guests_can_skip: !sala.guests_can_skip }),
        }),
      )
    } catch (err) {
      setAviso(err.message)
    }
  }

  function cerrarTutorial() {
    marcarVisto(CLAVE_TUTORIAL)
    setTutorialAbierto(false)
  }

  async function copiarCodigo() {
    await navigator.clipboard.writeText(code)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  if (error) {
    return (
      <div className="relative z-10 flex flex-col items-center">
        <p className="text-lg text-rose-400">{error}</p>
        <Link to="/" className="mt-6 text-sm text-neutral-500 transition-colors hover:text-violet-400">
          ← volver al inicio
        </Link>
      </div>
    )
  }

  if (!sala) {
    return (
      <p className="relative z-10 animate-pulse text-sm text-neutral-500">entrando a la sala…</p>
    )
  }

  const esHost = usuario?.id === sala.host_id
  const puedeSaltar = esHost || sala.guests_can_skip

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative z-10 flex w-full max-w-xl flex-col items-center"
    >
      <Tutorial abierto={tutorialAbierto} onCerrar={cerrarTutorial} />

      <p className="text-xs uppercase tracking-widest text-neutral-500">sala</p>
      <h1 className="mt-2 text-3xl font-semibold text-neutral-100">{sala.name}</h1>

      <button
        onClick={copiarCodigo}
        className="group mt-6 rounded-2xl border border-white/10 bg-white/5 px-8 py-4 transition-colors hover:border-violet-500/50"
      >
        <span className="font-mono text-3xl font-semibold tracking-[0.3em] text-violet-300">
          {sala.code}
        </span>
        <span className="mt-1 block text-xs text-neutral-500 group-hover:text-neutral-400">
          {copiado ? '¡copiado!' : 'toca para copiar'}
        </span>
      </button>

      <AnimatePresence mode="wait">
        {vibe && (
          <motion.div
            key={vibe.etiqueta}
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            title={vibe.descripcion}
            className="mt-5 flex items-center gap-2 rounded-full border border-violet-500/30 bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 px-4 py-1.5 backdrop-blur-sm"
          >
            <span className="text-base">{vibe.emoji}</span>
            <span className="text-sm font-medium text-violet-200">{vibe.etiqueta}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 flex items-center gap-3 text-sm text-neutral-400">
        <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
        {miembros.length} {miembros.length === 1 ? 'persona' : 'personas'} en la sala
        {esHost && (
          <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs uppercase tracking-widest text-violet-300">
            host
          </span>
        )}
      </div>

      {actual && (
        <div className="mt-8 w-full">
          <p className="mb-3 text-left text-xs uppercase tracking-widest text-neutral-500">
            sonando ahora
          </p>

          <Reproductor cancion={actual} onTerminar={esHost ? pasarSiguiente : undefined} />

          <p className="mt-3 truncate text-left text-sm text-neutral-300">{actual.title}</p>

          <div className="mt-3 flex items-center justify-between gap-3">
            {puedeSaltar ? (
              <button
                onClick={pasarSiguiente}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm text-neutral-300 transition-colors hover:border-violet-500/50 hover:text-white"
              >
                Siguiente ⏭
              </button>
            ) : (
              <span className="text-xs text-neutral-600">Solo el host puede pasar de canción</span>
            )}

            {esHost && (
              <label className="flex cursor-pointer items-center gap-2 text-xs text-neutral-500">
                <input
                  type="checkbox"
                  checked={sala.guests_can_skip}
                  onChange={alternarPermisoSalto}
                  className="accent-violet-500"
                />
                los invitados pueden saltar
              </label>
            )}
          </div>
        </div>
      )}

      {aviso && <p className="mt-3 text-sm text-rose-400">{aviso}</p>}

      <div className="mt-10 w-full">
        <Buscador code={sala.code} onAgregada={cargarCola} />
      </div>

      <div className="mt-8 w-full">
        <p className="mb-3 text-left text-xs uppercase tracking-widest text-neutral-500">
          en espera
        </p>
        <Cola canciones={cola} onVotar={alternarVoto} />
      </div>

      <div className="mt-10 flex items-center gap-4 text-sm text-neutral-500">
        <Link to="/" className="transition-colors hover:text-violet-400">
          ← salir de la sala
        </Link>
        <span className="text-neutral-800">·</span>
        <button
          onClick={() => setTutorialAbierto(true)}
          className="transition-colors hover:text-violet-400"
        >
          ¿cómo funciona?
        </button>
      </div>
    </motion.div>
  )
}

export default Sala