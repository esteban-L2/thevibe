from fastapi import FastAPI

app = FastAPI(title= "thevibe API", version="0.1.0", description="API for thevibe application")

@app.get("/health")
def health():
    return {"status": "ok", "service": "thevibe API is running"}