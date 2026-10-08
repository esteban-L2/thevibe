import logging

from fastapi import Depends, FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.auth import usuario_actual
from app.config import FRONTEND_ORIGINS
from app.rooms import router as rooms_router
from app.search import router as search_router
from app.votes import router as votes_router

logger = logging.getLogger("uvicorn.error")

app = FastAPI(
    title="thevibe API",
    version="0.1.0",
    description="API for thevibe application",
)

app.include_router(rooms_router)
app.include_router(search_router)
app.include_router(votes_router)


@app.middleware("http")
async def capturar_errores(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception:
        logger.exception("Error no controlado en %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=500, content={"detail": "Error interno del servidor"}
        )


app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "service": "thevibe API",
        "version": "0.1.0",
        "docs": "/docs",
        "endpoints": ["/health", "/me", "/search", "/rooms"],
    }


@app.get("/health")
def health():
    return {"status": "ok", "service": "thevibe API is running"}


@app.get("/me")
def me(usuario=Depends(usuario_actual)):
    return {"id": usuario.id, "is_anonymous": usuario.is_anonymous}