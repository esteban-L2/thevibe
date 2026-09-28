from fastapi import Header, HTTPException

from app.db import supabase


def usuario_actual(authorization: str = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Falta el token de autenticación")

    token = authorization.removeprefix("Bearer ").strip()

    try:
        respuesta = supabase.auth.get_user(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    if respuesta is None or respuesta.user is None:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")

    return respuesta.user