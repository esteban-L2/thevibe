import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

// El plan gratuito de Render duerme el servicio tras 15 minutos sin tráfico y
// despertarlo tarda hasta un minuto. Avisamos al usuario en vez de dejarlo
// mirando un botón que no responde.
const MS_PARA_AVISAR = 2500
const MS_LIMITE = 90000

export async function apiFetch(ruta, opciones = {}) {
  const { data: { session } } = await supabase.auth.getSession()

  const controlador = new AbortController()
  const corte = setTimeout(() => controlador.abort(), MS_LIMITE)
  const aviso = setTimeout(
    () => window.dispatchEvent(new CustomEvent('api:lenta')),
    MS_PARA_AVISAR,
  )

  try {
    const respuesta = await fetch(`${API_URL}${ruta}`, {
      ...opciones,
      signal: controlador.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        ...opciones.headers,
      },
    })

    if (!respuesta.ok) {
      const cuerpo = await respuesta.json().catch(() => ({}))
      throw new Error(cuerpo.detail ?? `Error ${respuesta.status}`)
    }

    return await respuesta.json()
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(
        'El servidor tardó demasiado en responder. Inténtalo otra vez.',
        { cause: err },
      )
    }
    throw err
  } finally {
    clearTimeout(corte)
    clearTimeout(aviso)
    window.dispatchEvent(new CustomEvent('api:fin'))
  }
}
