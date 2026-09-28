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

    resultados = [
        {
            "video_id": item["id"]["videoId"],
            "title": item["snippet"]["title"],
            "channel": item["snippet"]["channelTitle"],
            "thumbnail_url": item["snippet"]["thumbnails"]["medium"]["url"],
        }
        for item in respuesta.json().get("items", [])
    ]

    _cache[clave] = (time.time(), resultados)
    return resultados