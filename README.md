# thevibe

Radio colaborativa en vivo: crea una sala, propón canciones, vota la cola y deja que la sala encuentre su vibe. Los cambios se ven en tiempo real para todos los participantes.

**Estado: en construcción** — Fase 0 (infraestructura) completa.

## Demo

- **Web**: https://thevibe-three.vercel.app
- **API**: https://thevibe-api.onrender.com
- **Documentación de la API**: https://thevibe-api.onrender.com/docs

> La API está en el plan gratuito de Render y se duerme tras 15 minutos sin tráfico. La primera petición puede tardar ~50 segundos.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite, Tailwind CSS 4, Motion |
| Backend | FastAPI (Python 3.12) |
| Base de datos, Auth y Realtime | Supabase (PostgreSQL) |
| Despliegue | Vercel (front), Render (API) |

El backend no es un simple proxy: concentra el ranking de la cola por votos, las validaciones anti-abuso, la integración con la API de YouTube (para no exponer la API key en el navegador) y la capa de IA. El frontend habla directo con Supabase para las lecturas en tiempo real y la autenticación.

## Estructura

```
backend/          API en FastAPI
  app/
    main.py       rutas
    config.py     variables de entorno
    db.py         cliente de Supabase
frontend/         SPA en React + Vite
docs/             análisis y plan del proyecto
```

## Levantarlo en local

Necesitas Python 3.12+, Node 20+ y un proyecto de Supabase.

### Backend

```bash
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Duplica `.env.example` con el nombre `.env` y rellena los valores desde el panel de Supabase:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=tu_llave_secreta
FRONTEND_ORIGINS=http://localhost:5173
```

```bash
uvicorn app.main:app --reload
```

Queda en http://localhost:8000 y la documentación en http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Queda en http://localhost:5173. Por defecto apunta a `http://localhost:8000`; para cambiarlo, define `VITE_API_URL`.

## Hoja de ruta

- [x] **Fase 0** — Infraestructura: Supabase, FastAPI, React y despliegue end-to-end
- [x] **Fase 1** — Salas y autenticación anónima
- [x] **Fase 2** — Cola de canciones con búsqueda en YouTube
- [x] **Fase 3** — Votación y reordenamiento en tiempo real
- [ ] **Fase 4** — Reproducción y control de la sala
- [ ] **Fase 5** — Capa de IA: recomendación y detección del "vibe"
- [ ] **Fase 6** — Pulido, animaciones y optimistic UI

El análisis completo está en [docs/analisis-proyecto-radio-colaborativa.md](docs/analisis-proyecto-radio-colaborativa.md).

## Licencia

MIT — ver [LICENSE](LICENSE).