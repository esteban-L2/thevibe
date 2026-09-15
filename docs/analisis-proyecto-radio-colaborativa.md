# thevibe — Radio/Playlist Colaborativa en Vivo — Análisis y Plan de Proyecto

**Repositorio**: `esteban-L2/thevibe`

## 1. Concepto general

Una aplicación web donde varios usuarios se conectan a una "sala" (room), proponen canciones, votan las que están en cola, y todos escuchan la misma música sincronizada (o al menos ven la misma cola en tiempo real). Es una mezcla de Spotify Jam + sistema de votación tipo Reddit.

**Objetivo de aprendizaje**: practicar Supabase (DB + Realtime + Auth), FastAPI (lógica de negocio, integración con API externa), y un frontend con buenas animaciones (React + Framer Motion/Motion).

---

## 2. Alcance: define tu MVP primero

Antes de programar, decide qué SÍ y qué NO vas a hacer en la primera versión. Recomendación de alcance mínimo (MVP):

### Sí incluir en el MVP
- Crear una sala con un código/link para compartir
- Unirse a una sala (sin necesidad de cuenta completa, o con auth simple)
- Buscar canciones (vía API de Spotify o YouTube)
- Proponer una canción a la cola
- Votar (upvote) canciones en la cola
- Reordenar la cola automáticamente según votos
- Ver la cola actualizarse en tiempo real para todos los usuarios de la sala
- Reproducir la canción actual (embed de Spotify/YouTube, no audio propio)

### Dejar para después (v2)
- Reproducción sincronizada real entre todos los dispositivos (esto es complejo: requiere sincronizar tiempo de reproducción, buffering, etc.)
- Chat dentro de la sala
- Historial de canciones reproducidas
- Perfiles de usuario completos, avatares, estadísticas
- Salas privadas con permisos/roles (host vs invitado)
- Moderación (banear usuarios, borrar canciones ofensivas)

**Por qué esto importa**: la reproducción sincronizada real (que suene exactamente igual en todos los dispositivos al mismo tiempo) es un problema técnico serio (latencia, drift de audio). Para portafolio, es mucho más razonable que cada usuario reproduzca el embed por su cuenta y el "tiempo real" sea sobre la cola/votos, no sobre el audio en sí.

---

## 3. Decisiones técnicas clave (a tomar ANTES de codear)

### 3.1 ¿Spotify o YouTube para las canciones?
| | Spotify API | YouTube (Data API + embed) |
|---|---|---|
| Requiere login del usuario para reproducir | Sí (Premium para SDK completo) | No |
| Facilidad de embed sin cuenta | Limitado (preview de 30s sin auth) | Alto (embed simple funciona sin login) |
| Búsqueda de canciones | Muy buena, metadata rica | Buena, pero mezcla videos no musicales |
| Complejidad de auth (OAuth) | Alta | Media (solo API key para búsqueda) |

**Recomendación**: empieza con **YouTube** (API key simple, embed sin fricción) y considera Spotify como mejora posterior si quieres el reto de OAuth.

### 3.2 ¿Cómo defines "tiempo real"?
- **Supabase Realtime** (Postgres changes o broadcast): cuando alguien vota o agrega una canción, todos ven el cambio sin refrescar. Esto es tu columna vertebral de tiempo real — es el motivo por el que elegiste Supabase.
- Diferencia entre dos enfoques dentro de Supabase Realtime:
  - **Postgres Changes**: escuchas cambios directos en la tabla (más simple, ligado a tu esquema)
  - **Broadcast**: mensajes tipo pub/sub sin pasar por una tabla (más flexible, útil para eventos efímeros como "usuario X está escribiendo")
  - Para la cola de canciones, **Postgres Changes** es lo más natural.

### 3.3 ¿Qué hace FastAPI vs qué hace Supabase directo?
Esta es la pregunta más importante del proyecto, porque si no la respondes bien, FastAPI termina siendo un simple "pasamanos" sin propósito real.

**Dale trabajo real a FastAPI**, por ejemplo:
- Lógica de reordenamiento de la cola (algoritmo de ranking por votos, con desempates, decay de votos viejos, etc.)
- Integración con la API de YouTube (búsqueda de canciones) — mejor hacerlo desde el backend para no exponer tu API key en el front
- Validaciones de negocio (límite de canciones por usuario, evitar duplicados en la cola, rate limiting de votos)
- Endpoint para "avanzar a la siguiente canción" con lógica de quién tiene permiso de hacerlo

**Deja que Supabase haga directo** (desde el front, con su SDK):
- Auth (login/signup)
- Lecturas simples en tiempo real (suscripción a cambios en la cola)
- Row Level Security (RLS) para permisos básicos

### 3.4 Modelo de datos (borrador inicial)
Piensa en estas tablas como punto de partida (lo iremos refinando):

- `rooms`: id, código de sala, nombre, host_id, created_at
- `room_members`: room_id, user_id (o guest_id si permites anónimos), joined_at
- `queue_items`: id, room_id, song_external_id (id de YouTube), title, thumbnail_url, added_by, status (pending/playing/played), created_at
- `votes`: id, queue_item_id, user_id, created_at (un voto por usuario por canción, ideal con constraint único)

### 3.5 Usuarios anónimos vs registrados
Para que sea fácil de probar (alguien entra a tu sala sin fricción), considera:
- Auth anónima de Supabase (genera un usuario temporal sin registro) para unirse a una sala
- Auth completa (email/OAuth) solo si quieres persistencia de "mis salas favoritas" u otras features de usuario recurrente

### 3.6 Capa de IA (lo que hace que "thevibe" no sea un clon típico)

El nombre del proyecto (**thevibe**) juega justo con esta idea: la IA no es un agregado decorativo, sino algo que detecta y potencia el "vibe"/ambiente de la sala. Opciones evaluadas, de menor a mayor complejidad:

1. **Recomendación de siguiente canción**: cuando la cola se vacía, un modelo sugiere qué agregar basándose en lo reproducido/votado en la sala. Resuelve un problema real (cola vacía = silencio incómodo).
2. **Detección de "vibe"/mood de la sala**: analiza el patrón de canciones reproducidas y genera una etiqueta tipo "modo chill" o "alta energía", mostrada como badge animado.
3. **Resumen/highlights al cerrar la sala**: un LLM genera un resumen tipo "Wrapped" de la sesión (canción más votada, género dominante, etc.), compartible.
4. **Moderación automática**: filtra contenido inapropiado en las propuestas de canciones antes de que entren a la cola.
5. **Asistente tipo "/dj"**: comando en lenguaje natural (`/dj algo movido`) que agrega canciones a la cola interpretando la petición.

**Para el MVP**, se recomienda implementar **una sola** (la opción 1 o la 2 son las más simples de integrar y ya justifican el nombre "thevibe"), dejando las demás como mejoras de v2. Técnicamente, esto se implementa como un endpoint en FastAPI que llama a la API de Anthropic (o similar), dándole a FastAPI un propósito real más allá de proxy hacia YouTube.

---

## 4. Retos técnicos que vas a enfrentar (y por qué son buenos para aprender)

1. **Sincronización de estado en tiempo real**: qué pasa si dos personas votan al mismo tiempo, o si alguien agrega una canción justo cuando otro la está reproduciendo. Vas a aprender sobre condiciones de carrera y cómo Postgres + Supabase Realtime las manejan.
2. **Rate limiting / anti-abuso**: evitar que una persona vote 50 veces o spamee canciones. Buen ejercicio de validación en backend.
3. **Manejo de la API externa (YouTube)**: cuotas de la API, manejo de errores cuando una búsqueda falla, caché de resultados para no gastar cuota innecesariamente.
4. **Animaciones con propósito real**: 
   - La cola reordenándose cuando cambian los votos (animación de reordenamiento tipo `layout` de Framer Motion)
   - Voto que da feedback visual inmediato (optimistic UI: se ve el cambio antes de que el servidor confirme)
   - Transición al cambiar de canción actual
5. **Optimistic UI vs estado real**: cuando votas, ¿actualizas la UI al instante (optimista) o esperas confirmación del backend? Es un concepto clave en apps modernas.
6. **Integración con un LLM desde el backend**: llamar a la API de Anthropic (u otra) desde FastAPI para la capa de IA (sección 3.6), manejando prompts, costos y tiempos de respuesta sin bloquear la experiencia del usuario.

---

## 5. Stack técnico propuesto

- **Frontend**: React + Vite, Framer Motion (Motion) para animaciones, Tailwind para estilos rápidos
- **Backend**: FastAPI (Python), para lógica de negocio y proxy hacia YouTube API
- **Base de datos + Realtime + Auth**: Supabase (Postgres administrado)
- **API externa**: YouTube Data API v3 (búsqueda de canciones/videos), API de Anthropic (u otro LLM) para la capa de IA
- **Deploy**: Vercel/Netlify (front), Railway/Render (FastAPI), Supabase ya es hosteado

---

## 6. Fases sugeridas de desarrollo (alto nivel)

1. **Fase 0 — Setup**: repo, Supabase project, FastAPI esqueleto, conexión entre ambos, deploy básico funcionando de "hola mundo" end-to-end
2. **Fase 1 — Salas y auth**: crear/unirse a salas, auth anónima
3. **Fase 2 — Cola básica (sin votos)**: buscar canciones (YouTube API vía FastAPI), agregarlas a la cola, verlas en tiempo real
4. **Fase 3 — Votación**: votar canciones, reordenar cola por votos, en tiempo real
5. **Fase 4 — Reproducción**: embed del video/canción actual, botón de "siguiente"
6. **Fase 5 — Capa de IA**: implementar la funcionalidad elegida en la sección 3.6 (recomendación de siguiente canción o detección de vibe)
7. **Fase 6 — Pulido y animaciones**: transiciones, optimistic UI, feedback visual
8. **Fase 7 — Deploy final + documentación**: README, demo en vivo, video corto de demo para el portafolio

---

## 7. Preguntas abiertas para definir contigo antes de empezar a codear

- ¿Quieres autenticación real (email/Google) o prefieres empezar con usuarios anónimos por sala para simplificar?
- ¿YouTube o te interesa el reto extra de integrar Spotify más adelante?
- ¿Quieres que el "host" de la sala tenga poderes especiales (saltar canción, expulsar usuarios) desde el MVP, o eso queda para v2?
- ¿Prefieres React con Vite (más simple, SPA) o Next.js (si te interesa aprender SSR/rutas de servidor de paso)?

---

## 9. Preferencia de aprendizaje: Git/GitHub por consola

El usuario quiere aprender a usar Git/GitHub desde la terminal a la par que construye el proyecto, no solo que el código funcione. Esto debe respetarse durante todo el desarrollo:

- Cada vez que corresponda hacer un `git pull`, `git commit`, `git push`, crear una rama (`git branch` / `git checkout -b`), fusionar (`merge`), o resolver un conflicto, **explicar el comando antes de ejecutarlo o pedírselo**: qué hace, por qué se usa en ese momento, y qué esperar como resultado.
- Si un comando de Git da error, no solo corregirlo — explicar **qué significó el error** y por qué ocurrió, para que la próxima vez el usuario lo reconozca solo.
- Introducir el flujo de ramas (branches) de forma progresiva conforme el proyecto lo amerite, por ejemplo:
  - Rama `main` para lo estable
  - Ramas tipo `feature/nombre-de-la-funcionalidad` para cada parte nueva (ej. `feature/auth`, `feature/cola-votos`)
  - Cuándo y cómo hacer merge de una rama a `main`
- Ir soltando buenas prácticas de commits (mensajes claros, commits pequeños y frecuentes en vez de uno gigante) en el momento en que se den, no como teoría aislada.

**Meta**: que al terminar el proyecto, el usuario domine el flujo básico de Git/GitHub por consola de forma autónoma, no que dependa de memorizar comandos sin entenderlos.

---

## 10. Próximos pasos

Cuando compartas tu carpeta de proyecto, el plan es:
1. Revisar la estructura actual (si ya tienes algo iniciado)
2. Confirmar las decisiones de la sección 7
3. Armar el esquema de base de datos definitivo en Supabase
4. Empezar por la Fase 0 y avanzar contigo paso a paso, explicando cada pieza para que quede el aprendizaje, no solo el código funcionando — incluyendo cada paso de Git/GitHub como se describe en la sección 9