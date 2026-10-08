import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'

let apiCargada = null

function cargarApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (apiCargada) return apiCargada

  apiCargada = new Promise((resolve) => {
    window.onYouTubeIframeAPIReady = () => resolve(window.YT)
    const etiqueta = document.createElement('script')
    etiqueta.src = 'https://www.youtube.com/iframe_api'
    document.body.appendChild(etiqueta)
  })

  return apiCargada
}

function formatearTiempo(segundos) {
  if (!Number.isFinite(segundos) || segundos < 0) return '0:00'
  const minutos = Math.floor(segundos / 60)
  const resto = Math.floor(segundos % 60)
  return `${minutos}:${String(resto).padStart(2, '0')}`
}

function Ecualizador() {
  return (
    <div className="flex h-4 items-end gap-0.5">
      {[0, 0.2, 0.4].map((retraso) => (
        <motion.span
          key={retraso}
          className="w-1 rounded-full bg-violet-400"
          animate={{ height: ['25%', '100%', '40%', '80%', '25%'] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: retraso,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

function Reproductor({ cancion, onTerminar }) {
  const contenedor = useRef(null)
  const reproductor = useRef(null)
  const alTerminar = useRef(onTerminar)

  const [listo, setListo] = useState(false)
  const [reproduciendo, setReproduciendo] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [duracion, setDuracion] = useState(0)
  const [volumen, setVolumen] = useState(70)
  const [silenciado, setSilenciado] = useState(false)
  const [arrastrando, setArrastrando] = useState(false)
  const [videoVisible, setVideoVisible] = useState(false)
  const [fallo, setFallo] = useState(false)

  useEffect(() => {
    alTerminar.current = onTerminar
  }, [onTerminar])

  useEffect(() => {
    let cancelado = false

    cargarApi().then((YT) => {
      if (cancelado || !contenedor.current) return

      setFallo(false)
      setProgreso(0)

      if (reproductor.current?.loadVideoById) {
        reproductor.current.loadVideoById(cancion.video_id)
        return
      }

      reproductor.current = new YT.Player(contenedor.current, {
        videoId: cancion.video_id,
        playerVars: {
          autoplay: 1,
          playsinline: 1,
          rel: 0,
          controls: 0,
          modestbranding: 1,
        },
        events: {
          onReady: (evento) => {
            setListo(true)
            setDuracion(evento.target.getDuration())
          },
          onStateChange: (evento) => {
            setReproduciendo(evento.data === YT.PlayerState.PLAYING)

            if (evento.data === YT.PlayerState.PLAYING) {
              setDuracion(evento.target.getDuration())
            }

            if (evento.data === YT.PlayerState.ENDED) {
              alTerminar.current?.()
            }
          },
          onError: () => {
            setFallo(true)
            alTerminar.current?.()
          },
        },
      })
    })

    return () => {
      cancelado = true
    }
  }, [cancion.video_id])

  useEffect(() => {
    return () => {
      reproductor.current?.destroy?.()
      reproductor.current = null
    }
  }, [])

  useEffect(() => {
    if (!listo) return
    reproductor.current?.setVolume?.(volumen)
  }, [volumen, listo])

  useEffect(() => {
    if (!listo) return
    if (silenciado) reproductor.current?.mute?.()
    else reproductor.current?.unMute?.()
  }, [silenciado, listo])

  useEffect(() => {
    if (!listo) return

    const id = setInterval(() => {
      const api = reproductor.current
      if (!api?.getCurrentTime) return

      if (!arrastrando) setProgreso(api.getCurrentTime())
      setDuracion(api.getDuration() || 0)
    }, 500)

    return () => clearInterval(id)
  }, [listo, arrastrando])

  function alternarPlay() {
    if (reproduciendo) reproductor.current?.pauseVideo?.()
    else reproductor.current?.playVideo?.()
  }

  function saltarA(valor) {
    reproductor.current?.seekTo?.(valor, true)
    setProgreso(valor)
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5">
      <div
        className={`w-full overflow-hidden bg-black transition-all duration-300 ${
          videoVisible ? 'aspect-video' : 'h-0'
        }`}
      >
        <div ref={contenedor} className="h-full w-full" />
      </div>

      {!videoVisible && (
        <div className="flex items-center gap-4 p-4">
          <div className="relative shrink-0">
            <img
              src={cancion.thumbnail_url}
              alt=""
              className="h-16 w-16 rounded-xl object-cover"
            />
            {reproduciendo && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50">
                <Ecualizador />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-medium text-neutral-100">
              {cancion.title}
            </p>
            <p className="truncate text-xs text-neutral-500">{cancion.channel}</p>
          </div>
        </div>
      )}

      {fallo && (
        <p className="px-4 pb-2 text-xs text-amber-400">
          Este video no se puede reproducir aquí. Pasando a la siguiente.
        </p>
      )}

      <div className="flex flex-col gap-3 px-4 pb-4">
        <div className="flex items-center gap-3">
          <span className="w-9 shrink-0 text-right font-mono text-xs text-neutral-500">
            {formatearTiempo(progreso)}
          </span>

          <input
            type="range"
            min={0}
            max={duracion || 0}
            step={1}
            value={Math.min(progreso, duracion || 0)}
            onMouseDown={() => setArrastrando(true)}
            onTouchStart={() => setArrastrando(true)}
            onChange={(evento) => setProgreso(Number(evento.target.value))}
            onMouseUp={(evento) => {
              setArrastrando(false)
              saltarA(Number(evento.target.value))
            }}
            onTouchEnd={(evento) => {
              setArrastrando(false)
              saltarA(Number(evento.target.value))
            }}
            className="h-1 w-full cursor-pointer accent-violet-500"
          />

          <span className="w-9 shrink-0 font-mono text-xs text-neutral-500">
            {formatearTiempo(duracion)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={alternarPlay}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs text-white transition-colors hover:bg-violet-500"
            title={reproduciendo ? 'Pausar' : 'Reproducir'}
          >
            {reproduciendo ? '❚❚' : '▶'}
          </button>

          <button
            onClick={() => setSilenciado((valor) => !valor)}
            className="shrink-0 text-neutral-400 transition-colors hover:text-neutral-100"
            title={silenciado ? 'Quitar silencio' : 'Silenciar'}
          >
            {silenciado ? '🔇' : '🔊'}
          </button>

          <input
            type="range"
            min={0}
            max={100}
            value={silenciado ? 0 : volumen}
            onChange={(evento) => {
              setSilenciado(false)
              setVolumen(Number(evento.target.value))
            }}
            className="h-1 w-20 cursor-pointer accent-violet-500"
            title="Volumen"
          />

          <button
            onClick={() => setVideoVisible((valor) => !valor)}
            className="ml-auto shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-neutral-400 transition-colors hover:border-violet-500/40 hover:text-neutral-200"
          >
            {videoVisible ? 'Ocultar video' : 'Ver video'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Reproductor
