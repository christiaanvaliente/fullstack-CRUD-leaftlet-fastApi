from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Tuple, Literal, Optional, Dict, Any
from database import create_point_in_db,get_all_point_from_db, get_point_by_id
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ----------------------------------------------------------------------
# CONFIGURACIÓN CORS (Se debe añadir justo después de app = FastAPI())
# ----------------------------------------------------------------------
origins = [
    "http://localhost:5173",  # Puerto de React/Vite
    "http://127.0.0.1:5173", # Puerto de fallback
    # Puedes añadir otros orígenes si tu frontend corre en otro lado
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Permite peticiones desde el frontend
    allow_credentials=True,      # Permite cookies/headers de autenticación
    allow_methods=["*"],         # Permite todos los métodos (GET, POST, etc.)
    allow_headers=["*"],         # Permite todos los encabezados
)


#modelo para la respuesta, euivalente a la interface de tp
class PointProperties(BaseModel):
    nombre: str
    descripcion: Optional[str]=None

class GeometryPoint(BaseModel):
    type:Literal['Point']='Point'
    coordinates: Tuple[float,float]#Lng Lat

#este es el Feature que enviara el front, react
class GeoJsonPointFeatureIn(BaseModel):
    type: Literal['Feature']='Feature'
    properties:PointProperties
    geometry: GeometryPoint

#Modleo para la respuesta
class GeoJsonPointFeatureOut(BaseModel):
    id: int
    nombre: str
    geojson: GeoJsonPointFeatureIn

#::::::::::::::
#:::Endpoint:::
#::::::::::::::

#1 endpoint pra crear
@app.post("/api/points", response_model=GeoJsonPointFeatureOut)
async def create_point(point_data: GeoJsonPointFeatureIn):
    """Inserta un punto geo en l BD"""
    #convirtiendo el modeloPydantic a un dccionario para simular la BD
    new_point_data= point_data.model_dump(by_alias=True)

    new_point=create_point_in_db(new_point_data)

    return GeoJsonPointFeatureOut(**new_point)

#2 enpoint para leer todo
@app.get("/api/points", response_model=List[GeoJsonPointFeatureOut])
async def list_points():
    """Devuelve todos lospuntos para la lista desplegable"""
    db_data= get_all_point_from_db()

    #mapeando los diccoinaio de la BD a mdelos pydantic
    return [GeoJsonPointFeatureOut(**p) for p in db_data]

#3 leer 1 elemento puntual
@app.get("/api/points/{point_id}", response_model=GeoJsonPointFeatureOut)
async def get_point(point_id:int):
    """Devuelve los datos de un punto por ID (para cargar el formulario)."""
    point=get_point_by_id(point_id)
    if point is None:
        raise HTTPException(status_code=404, detail="Punto no encontrado")
    return GeoJsonPointFeatureOut(**point)  