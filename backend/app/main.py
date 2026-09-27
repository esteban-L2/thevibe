from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import supabase

app = FastAPI(title="thevibe API", version="0.1.0", description="API for thevibe application")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/health")
def health():
    return {"status": "ok", "service": "thevibe API is running"}

@app.get("/rooms")
def get_rooms():
    response = supabase.table("rooms").select("*").execute()
    return {"rooms": response.data}