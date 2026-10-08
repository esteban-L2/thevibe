import { useEffect, useRef } from 'react'

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

function Reproductor({ cancion, onTerminar }) {
  const contenedor = useRef(null)
  const reproductor = useRef(null)
  const alTerminar = useRef(onTerminar)

  useEffect(() => {
    alTerminar.current = onTerminar
  }, [onTerminar])

  useEffect(() => {
    let cancelado = false

    cargarApi().then((YT) => {
      if (cancelado || !contenedor.current) return

      if (reproductor.current?.loadVideoById) {
        reproductor.current.loadVideoById(cancion.video_id)
        return
      }

      reproductor.current = new YT.Player(contenedor.current, {
        videoId: cancion.video_id,
        playerVars: { autoplay: 1, playsinline: 1, rel: 0 },
        events: {
          onStateChange: (evento) => {
            if (evento.data === YT.PlayerState.ENDED) {
              alTerminar.current?.()
            }
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

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
      <div className="aspect-video w-full">
        <div ref={contenedor} className="h-full w-full" />
      </div>
    </div>
  )
}

export default Reproductor