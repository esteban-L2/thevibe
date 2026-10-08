import html
import time

import httpx

from app.config import YOUTUBE_API_KEY

URL_BUSQUEDA = "https://www.googleapis.com/youtube/v3/search"
CACHE_SEGUNDOS = 60 * 60

_cache = {}


def buscar_canciones(consulta: str, maximo: int = 8) -> list[dict]:
    clave = consulta.strip().lower()

    guardado = _cache.get(clave)
    if guardado and time.time() - guardado[0] < CACHE_SEGUNDOS:
        return guardado[1]

    respuesta = httpx.get(
        URL_BUSQUEDA,
        params={
            "key": YOUTUBE_API_KEY,
            "q": consulta,
            "part": "snippet",
            "type": "video",
            "maxResults": maximo,
        },
        timeout=10,
    )
    respuesta.raise_for_status()

    resultados = []

    for item in respuesta.json().get("items", []):
        video_id = item.get("id", {}).get("videoId")
        snippet = item.get("snippet", {})

        if not video_id or not snippet.get("title"):
            continue

        miniaturas = snippet.get("thumbnails", {})
        miniatura = miniaturas.get("medium") or miniaturas.get("default") or {}

        resultados.append({
            "video_id": video_id,
            "title": html.unescape(snippet["title"]),
            "channel": html.unescape(snippet.get("channelTitle") or ""),
            "thumbnail_url": miniatura.get("url"),
        })

    _cache[clave] = (time.time(), resultados)
    return resultados