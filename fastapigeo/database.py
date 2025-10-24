from typing import List, Dict, Any, Optional

#tbl con estructura postgis

DB_TABLE: List[Dict[str, any]] = []
next_id = 1

def create_point_in_db(geojson_point: Dict[str, Any]) -> Dict[str, Any]:
    global next_id

    new_record={
        "id": next_id,
        #leemos del diccionario la propidad propierties.nombre
        "nombre": geojson_point.get("properties",{}).get("nombre", f"Punto {next_id}"),
        "geojson":geojson_point
    }

    DB_TABLE.append(new_record)
    next_id += 1

    return new_record

def get_all_point_from_db() -> List[Dict[str, Any]]:

    """Simula el select * from"""
    return DB_TABLE

def get_point_by_id(point_id:int) -> Optional[Dict[str, Any]]:
    
    point_id_str= str(point_id)

    for elemento in DB_TABLE:
        if elemento["id"]==point_id:
            return elemento
    return None
