import { MapContainer, TileLayer, Popup, GeoJSON, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import { fetchAmbientes, fetchModulos } from '../services/api';

// Centro exacto de la FINOR (Ajustado)
const FINOR_CENTER = [-17.33848, -63.26879]; 

// Límites geográficos (Caja imaginaria que encierra la facultad)
// Formato: [[SurOeste], [NorEste]]
const FINOR_BOUNDS = [
  [-17.3410, -63.2720], 
  [-17.3350, -63.2650]  
];

// Helper para forzar recalibración de tamaño de Leaflet en móviles
const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

const MapView = ({ onModuloSelect, activeCategoryId }) => {
  const [modulos, setModulos] = useState([]);
  const [ambientes, setAmbientes] = useState([]);

  useEffect(() => {
    fetchModulos().then(data => setModulos(data.features || []));
    fetchAmbientes().then(data => setAmbientes(data.features || []));
  }, []);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer 
        center={FINOR_CENTER} 
        zoom={18} 
        minZoom={17}
        maxZoom={22}
        maxBounds={FINOR_BOUNDS}
        maxBoundsViscosity={1.0} /* Efecto de "muro" rígido al arrastrar */
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <MapResizer />
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://mt0.google.com/vt/lyrs=s&hl=es&x={x}&y={y}&z={z}"
          maxNativeZoom={19}
          maxZoom={22}
        />
        
        {modulos.map(modulo => (
          <GeoJSON 
            key={`mod-${modulo.id}`} 
            data={modulo} 
            style={{ color: '#004aad', weight: 2, fillColor: '#2563eb', fillOpacity: 0.15 }}
            eventHandlers={{
              click: () => {
                if (onModuloSelect) onModuloSelect(modulo);
              }
            }}
          >
            <Tooltip permanent direction="center" className="modulo-label">
              {modulo.properties.nombre}
            </Tooltip>
          </GeoJSON>
        ))}

        {/* Filtrado de Ambientes */}
        {ambientes
          .filter(ambiente => !activeCategoryId || ambiente.properties.categoria === activeCategoryId)
          .map(ambiente => (
          <GeoJSON 
            key={`amb-${ambiente.id}`} 
            data={ambiente}
          >
            <Popup className="custom-popup">
              <h3>{ambiente.properties.nombre} ({ambiente.properties.codigo})</h3>
              <p className="popup-category">{ambiente.properties.categoria_nombre}</p>
              <p>{ambiente.properties.descripcion}</p>
              <p><strong>Piso:</strong> {ambiente.properties.piso_nombre}</p>
            </Popup>
          </GeoJSON>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
