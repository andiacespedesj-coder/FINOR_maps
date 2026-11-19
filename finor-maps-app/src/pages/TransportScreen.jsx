import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ArrowLeft, Bus, MapPin } from 'lucide-react';
import { FINOR_CENTER } from '../services/mapCoordinates';
import { fetchTransportDirectory } from '../services/transportApi';
import './TransportScreen.css';

const stopIcon = L.divIcon({
  className: 'transport-marker',
  html: '<span></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function FitStops({ stops }) {
  const map = useMap();

  useEffect(() => {
    if (!stops.length) return;
    const positions = stops.map((stop) => [stop.geometry.coordinates[1], stop.geometry.coordinates[0]]);
    map.fitBounds(L.latLngBounds([FINOR_CENTER, ...positions]), { padding: [28, 28], maxZoom: 18 });
  }, [map, stops]);

  return null;
}

export default function TransportScreen() {
  const navigate = useNavigate();
  const [directory, setDirectory] = useState(null);
  const [association, setAssociation] = useState('Todas');
  const [selectedLineId, setSelectedLineId] = useState(null);

  useEffect(() => {
    let active = true;
    fetchTransportDirectory().then((result) => { if (active) setDirectory(result); });
    return () => { active = false; };
  }, []);

  const lines = directory?.lines || [];
  const associations = ['Todas', ...new Set(lines.map((line) => line.asociacion))];
  const visibleLines = association === 'Todas' ? lines : lines.filter((line) => line.asociacion === association);
  const visibleLineIds = new Set(visibleLines.map((line) => line.id));
  const stops = (directory?.stops || []).filter((stop) =>
    stop.geometry?.coordinates?.length === 2 &&
    stop.properties?.lineas?.some((id) => visibleLineIds.has(id)) &&
    (!selectedLineId || stop.properties.lineas.includes(selectedLineId))
  );

  return (
    <main className="transport-screen">
      <header className="transport-header">
        <button className="transport-back" onClick={() => navigate('/more')} aria-label="Volver a información"><ArrowLeft size={21} /></button>
        <span>FINOR MAPS · INFORMACIÓN</span>
        <h1>Transporte cercano</h1>
        <p>Conoce las líneas que llegan a la zona de la facultad.</p>
      </header>

      <section className="transport-content" aria-label="Líneas de transporte">
        <div className="transport-section-heading"><h2>Líneas disponibles</h2><span>{visibleLines.length} {visibleLines.length === 1 ? 'línea' : 'líneas'}</span></div>
        {directory && lines.length > 0 && <div className="transport-filters" role="group" aria-label="Filtrar por asociación">
          {associations.map((name) => <button key={name} aria-pressed={association === name} className={association === name ? 'selected' : ''} onClick={() => { setAssociation(name); setSelectedLineId(null); }}>{name}</button>)}
        </div>}

        {!directory && <p className="transport-loading">Cargando líneas de transporte…</p>}
        {directory && lines.length === 0 && <p className="transport-empty">Todavía no hay líneas de transporte publicadas.</p>}

        <div className="transport-lines">
          {visibleLines.map((line) => <button key={line.id} className={`transport-line${selectedLineId === line.id ? ' selected' : ''}`} aria-pressed={selectedLineId === line.id} onClick={() => setSelectedLineId(selectedLineId === line.id ? null : line.id)}>
            <span className="transport-line-number">{line.numero}</span>
            <span className="transport-line-copy"><strong>Línea {line.numero}</strong><small>Asociación {line.asociacion}</small><span>{line.recorrido_descripcion || 'Recorrido cercano a FINOR por confirmar.'}</span>{line.horario && <small>Horario: {line.horario}</small>}</span>
          </button>)}
          <button className="transport-line transport-preview-line" onClick={() => navigate('/transport/recorrido-prueba')}>
            <span className="transport-line-number"><Bus size={22} /></span>
            <span className="transport-line-copy"><strong>Recorrido de prueba</strong><small>Archivo que exportaste</small><span>Toca aquí para ver la ruta en el mapa.</span></span>
          </button>
        </div>

        {directory && lines.length > 0 && <section className="transport-stops" aria-label="Paradas cercanas">
          <div className="transport-section-heading"><h2>Paradas cercanas</h2><span>{stops.length} {stops.length === 1 ? 'parada' : 'paradas'}</span></div>
          {stops.length > 0 ? <>
            <div className="transport-map">
              <MapContainer center={FINOR_CENTER} zoom={17} scrollWheelZoom={false} zoomControl={false} style={{ height: '100%', width: '100%' }}>
                <FitStops stops={stops} />
                <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxNativeZoom={19} />
                {stops.map((stop) => <Marker key={stop.id} position={[stop.geometry.coordinates[1], stop.geometry.coordinates[0]]} icon={stopIcon}><Popup><strong>{stop.properties.nombre}</strong>{stop.properties.referencia && <div>{stop.properties.referencia}</div>}</Popup></Marker>)}
              </MapContainer>
            </div>
            <div className="transport-stop-list">{stops.map((stop) => <article key={stop.id}><MapPin size={18} /><span><strong>{stop.properties.nombre}</strong>{stop.properties.referencia && <small>{stop.properties.referencia}</small>}</span></article>)}</div>
          </> : <div className="transport-stop-empty"><Bus size={23} /><strong>La parada aún no tiene ubicación verificada</strong><p>Estas líneas paran en una esquina cercana a FINOR. El equipo debe marcar el punto exacto para mostrarlo en el mapa.</p></div>}
        </section>}
        {directory?.provisional && <p className="transport-note">Los tramos mostrados fueron confirmados por el equipo. La ubicación de la parada y los horarios siguen pendientes.</p>}
      </section>
    </main>
  );
}
