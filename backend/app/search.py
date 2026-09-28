import httpx
from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth import usuario_actual
from app.youtube import buscar_canciones

router = APIRouter(tags=["búsqueda"])


@router.get("/search")
def buscar(q: str = Query(min_length=2, max_length=80), usuario=Depends(usuario_actual)):
    try:
        return {"results": buscar_canciones(q)}
    except httpx.HTTPStatusError as error:
        if error.response.status_code == 403:
            raise HTTPException(
                status_code=503, detail="Se agotó la cuota de YouTube por hoy"
            )
        raise HTTPException(status_code=502, detail="YouTube no respondió correctamente")
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="No se pudo conectar con YouTube")