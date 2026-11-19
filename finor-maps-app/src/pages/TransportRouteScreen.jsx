import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Circle, CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { ArrowLeft, LocateFixed, LoaderCircle } from 'lucide-react';
import L from 'leaflet';
import recorridoPrueba from '../assets/recorrido-prueba.json';
import { getUserPosition } from '../services/geolocation';
import './TransportRouteScreen.css';

const positions = recorridoPrueba.features[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);

function FitRouteAndLocation({ location }) {
  const map = useMap();

  useEffect(() => {
    const points = location ? [...positions, [location.lat, location.lng]] : positions;
    map.fitBounds(L.latLngBounds(points), { padding: [38, 38], maxZoom: 17 });
  }, [map, location]);

  return null;
}

export default function TransportRouteScreen() {
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [status, setStatus] = useState('Buscando tu ubicación…');
  const [locating, setLocating] = useState(true);
  const requestId = useRef(0);

  const locate = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLocating(true);
    setStatus('Buscando tu ubicación…');
    try {
      const position = await getUserPosition();
      if (currentRequest !== requestId.current) return;
      setLocation(position);
      setStatus('');
    } catch {
      if (currentRequest !== requestId.current) return;
      setStatus('No pudimos obtener tu ubicación. Revisa el GPS y los permisos e inténtalo de nuevo.');
    } finally {
      if (currentRequest === requestId.current) setLocating(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) locate(); });
    return () => { active = false; requestId.current += 1; };
  }, [locate]);

  return <main className="transport-route-screen">
    <header className="transport-route-header">
      <button onClick={() => navigate('/transport')} aria-label="Volver a líneas de transporte"><ArrowLeft size={22} /></button>
      <div><span>FINOR MAPS · VISTA DE PRUEBA</span><h1>Recorrido de prueba</h1></div>
    </header>
    <div className="transport-route-map" aria-label="Mapa del recorrido y tu ubicación">
      <MapContainer center={positions[0]} zoom={15} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <FitRouteAndLocation location={location} />
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxNativeZoom={19} />
        <Polyline positions={positions} pathOptions={{ color: '#d53030', weight: 5 }} />
        <CircleMarker center={positions[0]} radius={7} pathOptions={{ color: '#fff', weight: 3, fillColor: '#198754', fillOpacity: 1 }}><Popup>Inicio del trazado</Popup></CircleMarker>
        <CircleMarker center={positions[positions.length - 1]} radius={7} pathOptions={{ color: '#fff', weight: 3, fillColor: '#d53030', fillOpacity: 1 }}><Popup>Fin del trazado</Popup></CircleMarker>
        {location && <>
          {Number.isFinite(location.accuracy) && location.accuracy > 0 && <Circle center={[location.lat, location.lng]} radius={location.accuracy} pathOptions={{ color: '#1976d2', weight: 1, fillOpacity: 0.12 }} />}
          <CircleMarker center={[location.lat, location.lng]} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: '#1976d2', fillOpacity: 1 }}><Popup>Tu ubicación aproximada</Popup></CircleMarker>
        </>}
      </MapContainer>
      {status && <div className="transport-route-status" role="status">{status}</div>}
      <button className="transport-route-locate" onClick={locate} disabled={locating} aria-label="Actualizar mi ubicación">
        {locating ? <LoaderCircle className="spin" size={23} /> : <LocateFixed size={23} />}
      </button>
    </div>
  </main>;
}
