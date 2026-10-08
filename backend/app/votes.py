from fastapi import APIRouter, Depends, HTTPException
from postgrest.exceptions import APIError

from app.auth import usuario_actual
from app.db import supabase

router = APIRouter(prefix="/queue", tags=["votos"])

CODIGO_DUPLICADO = "23505"
CODIGO_SIN_REFERENCIA = "23503"


@router.post("/{item_id}/vote", status_code=201)
def votar(item_id: str, usuario=Depends(usuario_actual)):
    try:
        supabase.table("votes").insert(
            {"queue_item_id": item_id, "user_id": usuario.id}
        ).execute()
    except APIError as error:
        if error.code == CODIGO_DUPLICADO:
            return {"voted": True}
        if error.code == CODIGO_SIN_REFERENCIA:
            raise HTTPException(status_code=404, detail="Esa canción ya no está en la cola")
        raise

    return {"voted": True}


@router.delete("/{item_id}/vote")
def quitar_voto(item_id: str, usuario=Depends(usuario_actual)):
    supabase.table("votes").delete().eq("queue_item_id", item_id).eq(
        "user_id", usuario.id
    ).execute()

    return {"voted": False}