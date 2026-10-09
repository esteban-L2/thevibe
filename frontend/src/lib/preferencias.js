// Preferencias que viven solo en este navegador. El localStorage puede fallar
// (modo privado, almacenamiento bloqueado), así que todo va protegido: si no
// se puede leer o escribir, la app sigue funcionando.
const PREFIJO = 'thevibe:'

export function yaVisto(clave) {
  try {
    return localStorage.getItem(PREFIJO + clave) === '1'
  } catch {
    return false
  }
}

export function marcarVisto(clave) {
  try {
    localStorage.setItem(PREFIJO + clave, '1')
  } catch {
    // Sin almacenamiento el tutorial se mostrará otra vez. Es molesto, pero
    // mucho mejor que romper la app por una preferencia.
  }
}
