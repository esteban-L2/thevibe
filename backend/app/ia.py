import time

import anthropic
from pydantic import BaseModel, Field

from app.config import ANTHROPIC_API_KEY

MODELO = "claude-opus-5-5"
CACHE_SEGUNDOS = 120

_cliente = None
_cache: dict[str, tuple[float, dict]] = {}


class Vibe(BaseModel):
    """Lo que le pedimos al modelo que devuelva, con su forma exacta."""

    etiqueta: str = Field(
        description="Dos o tres palabras en español que describan el ambiente, en minúsculas"
    )
    emoji: str = Field(description="Un solo emoji que represente ese ambiente")
    descripcion: str = Field(
        description="Una frase corta y con gracia sobre el ambiente de la sala"
    )


def hay_ia() -> bool:
    return bool(ANTHROPIC_API_KEY)


def _obtener_cliente() -> anthropic.Anthropic:
    global _cliente

    if _cliente is None:
        _cliente = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

    return _cliente


def detectar_vibe(room_id: str, canciones: list[dict]) -> dict | None:
    """Devuelve el ambiente de la sala a partir de lo que suena y lo que espera."""
    if not canciones:
        return None

    # La clave del caché incluye las canciones: si no cambian, no gastamos otra
    # llamada, pero en cuanto entra una nueva el vibe se recalcula.
    firma = ",".join(sorted(cancion["video_id"] for cancion in canciones))
    clave = f"{room_id}:{firma}"

    guardado = _cache.get(clave)
    if guardado and time.time() - guardado[0] < CACHE_SEGUNDOS:
        return guardado[1]

    lista = "\n".join(
        f"- {cancion['title']} ({cancion.get('channel') or 'sin canal'})"
        for cancion in canciones[:15]
    )

    respuesta = _obtener_cliente().messages.parse(
        model=MODELO,
        max_tokens=1024,
        system=(
            "Eres el DJ de una sala de música colaborativa. A partir de las canciones "
            "que suenan y esperan, describes el ambiente de la sala en español, con "
            "tono cercano y divertido, sin sonar a informe. Nunca juzgues los gustos."
        ),
        messages=[
            {
                "role": "user",
                "content": f"Estas son las canciones de la sala:\n{lista}\n\n¿Cuál es el vibe?",
            }
        ],
        output_format=Vibe,
    )

    vibe = respuesta.parsed_output.model_dump()
    _cache[clave] = (time.time(), vibe)

    return vibe
