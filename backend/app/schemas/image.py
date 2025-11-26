from pydantic import BaseModel

class StyleRequest(BaseModel):
    style_name: str

class StyleResponse(BaseModel):
    image_base64: str
