from pydantic import BaseModel, Field


class CrearSala(BaseModel):
    name: str = Field(min_length=1, max_length=60)

class AjustesSala(BaseModel):
    guests_can_skip: bool


class AgregarCancion(BaseModel):
    video_id: str = Field(min_length=5, max_length=20)
    title: str = Field(min_length=1, max_length=200)
    channel: str | None = Field(default=None, max_length=120)
    thumbnail_url: str | None = None