import logging
import secrets

from fastapi import APIRouter, Depends, HTTPException
from postgrest.exceptions import APIError

from app.auth import usuario_actual
from app.db import supabase
from app.ia import detectar_vibe, hay_ia
from app.schemas import AgregarCancion, AjustesSala, CrearSala

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/rooms", tags=["salas"])

ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
CODIGO_DUPLICADO = "23505"
LIMITE_POR_USUARIO = 3


def generar_codigo(longitud: int = 6) -> str:
    return "".join(secrets.choice(ALFABETO) for _ in range(longitud))


@router.post("", status_code=201)
def crear_sala(datos: CrearSala, usuario=Depends(usuario_actual)):
    for _ in range(5):
        try:
            resultado = (
                supabase.table("rooms")
                .insert({
                    "code": generar_codigo(),
                    "name": datos.name,
                    "host_id": usuario.id,
                })
                .execute()
            )
        except APIError as error:
            if error.code == CODIGO_DUPLICADO:
                continue
            raise

        sala = resultado.data[0]

        supabase.table("room_members").insert(
            {"room_id": sala["id"], "user_id": usuario.id}
        ).execute()

        return sala

    raise HTTPException(status_code=500, detail="No se pudo generar un código único")


def buscar_sala(code: str) -> dict:
    resultado = supabase.table("rooms").select("*").eq("code", code.upper()).execute()

    if not resultado.data:
        raise HTTPException(status_code=404, detail="Esa sala no existe")

    return resultado.data[0]


@router.get("/{code}")
def obtener_sala(code: str, usuario=Depends(usuario_actual)):
    return buscar_sala(code)


@router.post("/{code}/join", status_code=201)
def unirse_a_sala(code: str, usuario=Depends(usuario_actual)):
    sala = buscar_sala(code)

    try:
        supabase.table("room_members").insert(
            {"room_id": sala["id"], "user_id": usuario.id}
        ).execute()
    except APIError as error:
        if error.code != CODIGO_DUPLICADO:
            raise

    return sala


@router.post("/{code}/queue", status_code=201)
def agregar_a_cola(code: str, datos: AgregarCancion, usuario=Depends(usuario_actual)):
    sala = buscar_sala(code)

    pendientes = (
        supabase.table("queue_items")
        .select("id", count="exact")
        .eq("room_id", sala["id"])
        .eq("added_by", usuario.id)
        .eq("status", "pending")
        .execute()
    )

    if pendientes.count >= LIMITE_POR_USUARIO:
        raise HTTPException(
            status_code=429,
            detail=f"Ya tienes {LIMITE_POR_USUARIO} canciones esperando. Deja sonar alguna.",
        )

    try:
        resultado = (
            supabase.table("queue_items")
            .insert({
                "room_id": sala["id"],
                "video_id": datos.video_id,
                "title": datos.title,
                "channel": datos.channel,
                "thumbnail_url": datos.thumbnail_url,
                "added_by": usuario.id,
            })
            .execute()
        )
    except APIError as error:
        if error.code == CODIGO_DUPLICADO:
            raise HTTPException(
                status_code=409, detail="Esa canción ya está en la cola"
            )
        raise

    if cancion_actual(sala["id"]) is None:
        promover_siguiente(sala["id"])

    return resultado.data[0]


def cola_ordenada(room_id: str, user_id: str | None = None) -> list[dict]:
    resultado = (
        supabase.table("queue_items")
        .select("*, votes(user_id)")
        .eq("room_id", room_id)
        .eq("status", "pending")
        .execute()
    )

    cola = []

    for item in resultado.data:
        votantes = [voto["user_id"] for voto in item.pop("votes", [])]
        item["votes"] = len(votantes)
        item["voted_by_me"] = user_id in votantes
        cola.append(item)

    cola.sort(key=lambda item: (-item["votes"], item["created_at"]))

    return cola


def cancion_actual(room_id: str) -> dict | None:
    resultado = (
        supabase.table("queue_items")
        .select("*")
        .eq("room_id", room_id)
        .eq("status", "playing")
        .limit(1)
        .execute()
    )

    return resultado.data[0] if resultado.data else None


def promover_siguiente(room_id: str) -> dict | None:
    actual = cancion_actual(room_id)

    if actual:
        supabase.table("queue_items").update({"status": "played"}).eq(
            "id", actual["id"]
        ).execute()

    cola = cola_ordenada(room_id)

    if not cola:
        return None

    siguiente = cola[0]

    supabase.table("queue_items").update({"status": "playing"}).eq(
        "id", siguiente["id"]
    ).execute()

    return siguiente


@router.get("/{code}/queue")
def ver_cola(code: str, usuario=Depends(usuario_actual)):
    sala = buscar_sala(code)

    return {
        "current": cancion_actual(sala["id"]),
        "queue": cola_ordenada(sala["id"], usuario.id),
    }


@router.post("/{code}/next")
def siguiente_cancion(code: str, usuario=Depends(usuario_actual)):
    sala = buscar_sala(code)

    if usuario.id != sala["host_id"] and not sala["guests_can_skip"]:
        raise HTTPException(
            status_code=403, detail="Solo el host puede pasar de canción"
        )

    return {"current": promover_siguiente(sala["id"])}


@router.get("/{code}/vibe")
def ver_vibe(code: str, usuario=Depends(usuario_actual)):
    if not hay_ia():
        raise HTTPException(status_code=503, detail="La capa de IA no está configurada")

    sala = buscar_sala(code)

    actual = cancion_actual(sala["id"])
    canciones = ([actual] if actual else []) + cola_ordenada(sala["id"])

    try:
        return {"vibe": detectar_vibe(sala["id"], canciones)}
    except Exception:
        logger.exception("Fallo al detectar el vibe de la sala %s", code)
        raise HTTPException(status_code=502, detail="No se pudo leer el vibe de la sala")


@router.patch("/{code}/settings")
def cambiar_ajustes(code: str, datos: AjustesSala, usuario=Depends(usuario_actual)):
    sala = buscar_sala(code)

    if usuario.id != sala["host_id"]:
        raise HTTPException(
            status_code=403, detail="Solo el host puede cambiar los ajustes"
        )

    resultado = (
        supabase.table("rooms")
        .update({"guests_can_skip": datos.guests_can_skip})
        .eq("id", sala["id"])
        .execute()
    )

    return resultado.data[0]