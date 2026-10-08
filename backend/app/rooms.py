import secrets

from fastapi import APIRouter, Depends, HTTPException
from postgrest.exceptions import APIError

from app.auth import usuario_actual
from app.db import supabase
from app.schemas import AgregarCancion, CrearSala

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

    return resultado.data[0]