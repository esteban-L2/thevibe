import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]

FRONTEND_ORIGINS = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")

YOUTUBE_API_KEY = os.environ["YOUTUBE_API_KEY"]

# Opcional a propósito: sin llave, la app funciona igual y solo se apaga la
# capa de IA. Así el proyecto se puede levantar sin cuenta de Anthropic.
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")