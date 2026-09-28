from fastapi import Depends, FastAPI 
from fastapi.middleware.cors import CORSMiddleware
from app.db import supabase
from app.config import FRONTEND_ORIGINS
from app.auth import usuario_actual
from app.rooms import router as rooms_router

app = FastAPI(title="thevibe API", version="0.1.0", description="API for thevibe application")
app.include_router(rooms_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/")
def root():
    return {
        "service": "thevibe API",
        "version": "0.1.0",
        "docs": "/docs",
        "endpoints": ["/health", "/rooms", "/me"],
    }

@app.get("/health")
def health():
    return {"status": "ok", "service": "thevibe API is running"}

@app.get("/rooms")
def get_rooms():
    response = supabase.table("rooms").select("*").execute()
    return {"rooms": response.data}

@app.get("/me")
def me(usuario=Depends(usuario_actual)):
    return {"id": usuario.id, "is_anonymous": usuario.is_anonymous}