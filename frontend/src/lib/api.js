import { supabase } from './supabase'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function apiFetch(ruta, opciones = {}) {
  const { data: { session } } = await supabase.auth.getSession()

  const respuesta = await fetch(`${API_URL}${ruta}`, {
    ...opciones,
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

  return respuesta.json()
}