import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Asegúrate de importar el CSS de Leaflet
import * as L from 'leaflet';

interface Geopoint{
    id: number,
    nombre: string,
    geojson: {
        type: "Feature",
        properties: {
            nombre:string;
            descripcion: string;
        };
        geometry: {
            type:"Point";
            coordinates:[number, number];
        };
    }
}
interface GeoPointPayLoad{
    type:"Feature";
    properties:{
        nombre:string;
        descripcion: string;
    }
    geometry:{
        type:"Point";
        coordinates: [number,number]
    };
}

const API_BASE_URL = "http://127.0.0.1:8000/api/points";

async function createGeoPoint(data: GeoPointPayLoad) :Promise<Geopoint>{
    const response = await fetch(API_BASE_URL, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`Error ${response.status} al crear.`);
    return response.json();
}

async function fetchAllPoints(): Promise<Geopoint[]> {
    const response= await fetch(API_BASE_URL);
    if (!response.ok) throw new Error(`Error ${response.status} al listar.`);
    return response.json();    
}

async function fetchPointById(id: number): Promise<Geopoint> {

    const response= await fetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) throw new Error(`Error ${response.status} al buscar por ID.`);
    return response.json();    
}

interface LocationMarkerProps{
    onMapClick:(lat:number, lng: number) => void;
}

const LocationMarker: React.FC<LocationMarkerProps> = ({ onMapClick }) => {
    useMapEvents({ click(e) { onMapClick(e.latlng.lat, e.latlng.lng); }, });
    return null;
};


export const GeoCrudForm = () => {
const [nombre, setNombre] = useState('');
const [descripcion, setDescripcion] = useState('');
const [latlng, setLatlng] = useState<[number, number] | null>(null);
const [selectedPointId, setSelectedPointId] = useState('');

//estado de datos de la BD
const [points, setPoints] = useState<Geopoint[]>([]);

//funcion de recarga
const loadPoints= useCallback(async () => {
    try{
        const data=await fetchAllPoints();
        setPoints(data);        
    }catch (error){
        console.error('Error al cargar los datos ', error);
    }
},[]);

//craga inicial
useEffect(()=> { loadPoints();}, [loadPoints]);

//click en mapa, guarda lat lng 
const handleMapClick= (lat:number, lng:number)=>{
    setLatlng([lat, lng]);
};

//carga de datos al seleccionar la lista
const handleSelectChange = async (evento: React.ChangeEvent<HTMLSelectElement>) =>{
    const id = evento.target.value;
    setSelectedPointId(id);

    if(id===''){
        setNombre('');
        setDescripcion('');
        setLatlng(null);
        return;
    }
    try{
        const point = await fetchPointById(Number(id));
        setNombre(point.nombre);
        setDescripcion(point.geojson.properties.descripcion || '');

        const [lng, lat] = point.geojson.geometry.coordinates;
        setLatlng([lat,lng]);
    }catch(error){
        console.error('error al cargar datos del punto', error);        
    }    
};

//enviar datos a fastapi

const handleSubmit= async (e: React.FormEvent) => {

    e.preventDefault();
    if (!latlng || !nombre){
        alert("debe seleccionar un punto en el mapa y darle nombre, no se imbecil!");
        return;
    }
    const [lat, lng]=latlng;
    const payload: GeoPointPayLoad={
        type:"Feature",
        properties: {nombre, descripcion},
        geometry:{
            type:"Point",
            coordinates:[lng, lat],
        },
    };
    try {
        await createGeoPoint(payload);
        alert(`Punto ${nombre} creado con exito`);

        //Limpiar el los usestate
        setNombre('');
        setDescripcion('');
        setLatlng(null);
        loadPoints();//rectiva la carga de la lista
    }catch (error){
        console.error('Error al insertar ', error);        
    }
};


  return (
    <div>
        {/*formulario y controles*/}
        <div>
            <h2>geocrud</h2>

            <select value={selectedPointId} onChange={handleSelectChange} >
                {
                    points.map(p=>(

                        <option key={p.id} value={p.id}>{p.id}:{p.nombre}</option>
                    ))
                }
            </select>

            <form onSubmit={handleSubmit}>

                <label > Nombre</label>
                <input type='text' value={nombre} onChange={(e)=> setNombre(e.target.value)}></input>

                <label > Descripcion</label>
                <input type='text' value={descripcion} onChange={(e)=> setDescripcion(e.target.value)}></input>

                <label > Coordenadas lat lng</label>
                <input 
                type="text"
                readOnly
                value={latlng ? `${latlng[0].toFixed(4)},${latlng[1].toFixed(4)}`: 'N/A'}
                />

                <button type='submit'>enviar</button>        
            </form>            
        </div>
        {/*_________Mapa__________*/}
        <div style={{ flex: 1, height: '500px' }}>
            <MapContainer center={[-33.4372, -70.6506]} zoom={13} style={{ height: '100%', width: '100%' }}>
                    

                <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                    />
                <LocationMarker onMapClick={handleMapClick}/>

                {/*marcaor dle punto seleccionado*/}
                {latlng && <Marker position={latlng}/>}

                {/*mrcadores de puntos guardados, todos*/}
                {
                    points.map(
                        p=>(
                            <Marker
                                key={p.id}
                                position={[p.geojson.geometry.coordinates[1], p.geojson.geometry.coordinates[0]]}
                                />
                           )
                    )
                }

            </MapContainer>
        </div>

    </div>
  )
}
