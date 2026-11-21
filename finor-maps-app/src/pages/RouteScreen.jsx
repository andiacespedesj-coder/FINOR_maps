import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, LoaderCircle, MapPin, Navigation, Route } from 'lucide-react';
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchPlaces } from '../services/catalogApi';
import { getUserPosition, locationErrorMessage } from '../services/geolocation';
import { destinationNodesForPlace, findRoute, interactiveRouteInstructions, nearbyRoutableOutdoorNodes, nodesForPlace } from '../services/navigation';
import { loadNavigationGraph } from '../services/navigationApi';
import GuidedRouteView from '../components/GuidedRouteView';
import './RouteScreen.css';

const emptyGraph = { nodes: [], connections: [], photos: [] };
const labelFor = (place) => [place.properties?.nombre, place.properties?.piso_nombre, place.properties?.edificio_nombre].filter(Boolean).join(' · ');

function FitGpsMap({ position, candidates }) {
  const map = useMap();
  useEffect(() => {
    const points = [[position.lat, position.lng], ...candidates.map(({ node }) => [node.geometry.coordinates[1], node.geometry.coordinates[0]])];
    if (points.length === 1) map.setView(points[0], 18);
    else map.fitBounds(L.latLngBounds(points), { padding: [25, 25], maxZoom: 18 });
  }, [map, position, candidates]);
  return null;
}

function OriginGpsMap({ position, candidates }) {
  return <div className="route-gps-map" aria-label="Ubicación aproximada y puntos de inicio cercanos">
    <MapContainer center={[position.lat, position.lng]} zoom={18} scrollWheelZoom={false} zoomControl={false} style={{ width: '100%', height: '100%' }}>
      <FitGpsMap position={position} candidates={candidates} />
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxNativeZoom={19} />
      {position.accuracy != null && <Circle center={[position.lat, position.lng]} radius={position.accuracy} pathOptions={{ color: '#1976d2', weight: 1, fillOpacity: .12 }} />}
      <CircleMarker center={[position.lat, position.lng]} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: '#1976d2', fillOpacity: 1 }}><Popup>Tu ubicación aproximada</Popup></CircleMarker>
      {candidates.map(({ node }) => <CircleMarker key={node.id} center={[node.geometry.coordinates[1], node.geometry.coordinates[0]]} radius={7} pathOptions={{ color: '#fff', weight: 2, fillColor: '#064478', fillOpacity: 1 }}><Popup>{node.properties?.nombre || 'Punto de inicio'}</Popup></CircleMarker>)}
    </MapContainer>
  </div>;
}

export default function RouteScreen() {
  const { placeId } = useParams();
  const navigate = useNavigate();
  const [places, setPlaces] = useState([]);
  const [graph, setGraph] = useState(emptyGraph);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [originChoice, setOriginChoice] = useState('');
  const [gpsPosition, setGpsPosition] = useState(null);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [guiding, setGuiding] = useState(false);
  const gpsRequestId = useRef(0);

  useEffect(() => () => { gpsRequestId.current += 1; }, []);

  useEffect(() => {
    let active = true;
    Promise.all([fetchPlaces(), loadNavigationGraph()])
      .then(([catalog, navigation]) => {
        if (!active) return;
        setPlaces(catalog?.features || []);
        setGraph(navigation);
      })
      .catch(() => active && setLoadError('No se pudo cargar el recorrido. Revisa tu conexión e inténtalo de nuevo.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const destination = places.find((place) => String(place.id) === placeId);
  const destinationName = destination?.properties?.nombre || '';
  const destinationResolution = useMemo(() => destinationNodesForPlace(graph.nodes, destination, graph.connections), [destination, graph.nodes, graph.connections]);
  const destinationNodes = destinationResolution.nodes;
  const originPlace = places.find((place) => originChoice === `place:${place.id}`);
  const originNode = graph.nodes.find((node) => originChoice === `node:${node.id}`);
  const routablePlaces = useMemo(() => places.filter((place) => place.properties?.publicado !== false && nodesForPlace(graph.nodes, place.id).length), [places, graph.nodes]);
  const origins = useMemo(() => routablePlaces
    .filter((place) => String(place.id) !== placeId)
    .sort((a, b) => labelFor(a).localeCompare(labelFor(b), 'es')),
  [routablePlaces, placeId]);
  const nearbyOrigins = useMemo(() => {
    if (!gpsPosition) return [];
    const radius = Math.max(120, Math.min(gpsPosition.accuracy ?? 120, 250));
    return nearbyRoutableOutdoorNodes(graph.nodes, graph.connections, gpsPosition, destinationNodes, radius).slice(0, 5);
  }, [gpsPosition, graph.nodes, graph.connections, destinationNodes]);

  const result = useMemo(() => {
    if (!destinationNodes.length || !graph.nodes.length || !graph.connections.length) return null;
    const startNodes = originNode ? [originNode] : originPlace ? nodesForPlace(graph.nodes, originPlace.id) : [];
    if (!startNodes.length) return null;
    return findRoute(graph.nodes, graph.connections, startNodes, destinationNodes);
  }, [destinationNodes, graph, originPlace, originNode]);

  const steps = useMemo(() => interactiveRouteInstructions(
    result,
    destinationName,
    originNode?.properties?.nombre || originPlace?.properties?.nombre,
    graph,
    destinationNodes,
  ), [result, destinationName, originPlace, originNode, graph, destinationNodes]);
  const locateOrigin = useCallback(async () => {
    const requestId = ++gpsRequestId.current;
    setGpsBusy(true);
    setGpsError('');
    try {
      const position = await getUserPosition();
      if (requestId !== gpsRequestId.current) return;
      setGpsPosition(position);
      setOriginChoice('');
      setStepIndex(0);
      setGuiding(false);
    } catch (error) {
      if (requestId !== gpsRequestId.current) return;
      setGpsPosition(null);
      setGpsError(locationErrorMessage(error));
    } finally {
      if (requestId === gpsRequestId.current) setGpsBusy(false);
    }
  }, []);

  const chooseOrigin = (value) => {
    gpsRequestId.current += 1;
    setGpsBusy(false);
    setOriginChoice(value);
    setGpsError('');
    setStepIndex(0);
    setGuiding(false);
  };

  let status = '';
  if (!loading && !loadError) {
    if (!destination) status = 'Este destino ya no está disponible.';
    else if (!graph.nodes.length || !graph.connections.length) status = 'Aún no hay recorridos disponibles en el campus.';
    else if (!destinationNodes.length) status = 'Este destino aún no tiene un recorrido registrado.';
    else if (originPlace && !nodesForPlace(graph.nodes, originPlace.id).length) status = 'El lugar de inicio aún no tiene un recorrido registrado.';
    else if (originChoice && !result) status = 'Aún no hay una ruta desde este punto. Prueba con otro inicio.';
  }

  if (guiding && steps.length) return <GuidedRouteView
    destination={destinationName}
    steps={steps}
    stepIndex={stepIndex}
    onStepChange={setStepIndex}
    onArrowSelect={(arrow) => {
      if (arrow.recommended) { setStepIndex((index) => index + 1); return; }
      gpsRequestId.current += 1;
      setGpsBusy(false);
      setOriginChoice(`node:${arrow.nodo_destino}`);
      setStepIndex(0);
    }}
    onClose={() => setGuiding(false)}
  />;

  return (
    <main className="route-screen">
      <header className="route-header">
        <button onClick={() => navigate(-1)} aria-label="Volver al detalle"><ArrowLeft size={21} /></button>
        <h1>Cómo llegar</h1>
      </header>

      <section className="route-plan" aria-label="Preparar ruta">
        <div className="route-point route-point-origin">
          <span className="route-point-marker" aria-hidden="true" />
          <div className="route-point-content">
            <div className="route-point-heading"><label htmlFor="route-origin-place">Desde</label>
              <button className="route-gps" onClick={locateOrigin} disabled={gpsBusy} aria-label="Buscar mi ubicación aproximada">
                {gpsBusy ? <LoaderCircle className="spin" size={16} /> : <Navigation size={16} />}
                {gpsBusy ? 'Buscando…' : 'Ubicarme'}
              </button>
            </div>
            <select id="route-origin-place" value={originChoice} onChange={(event) => chooseOrigin(event.target.value)}>
              <option value="">Elige tu punto de inicio</option>
              {origins.length > 0 && <optgroup label="Lugares">
                {origins.map((place) => <option key={place.id} value={`place:${place.id}`}>{labelFor(place)}</option>)}
              </optgroup>}
              <optgroup label="Puntos de referencia">
                {graph.nodes.filter((node) => node.properties?.nombre && !destinationNodes.some((item) => item.id === node.id)).map((node) => <option key={node.id} value={`node:${node.id}`}>{node.properties.nombre}</option>)}
              </optgroup>
            </select>
            {gpsError && <p className="route-error" role="alert">{gpsError}</p>}
          </div>
        </div>

        <div className="route-point route-point-destination">
          <span className="route-point-marker" aria-hidden="true"><MapPin size={16} /></span>
          <div className="route-point-content"><span className="route-point-label">Hasta</span>
            <strong>{destinationName || (loading ? 'Cargando destino…' : 'Destino no disponible')}</strong>
            {destination && <small>{[destination.properties?.piso_nombre, destination.properties?.edificio_nombre].filter(Boolean).join(' · ')}</small>}
          </div>
        </div>

        {gpsPosition && <section className="route-nearby" aria-label="Ubicación y puntos cercanos">
          <div className="route-nearby-heading"><strong>Tu ubicación</strong><span>{gpsPosition.accuracy == null ? 'Aproximada' : `± ${Math.round(gpsPosition.accuracy)} m`}</span></div>
          <OriginGpsMap position={gpsPosition} candidates={nearbyOrigins} />
          {loading && <p className="route-nearby-help">Buscando puntos cercanos…</p>}
          {!loading && nearbyOrigins.length > 0 && <div className="route-nearby-list" role="group" aria-label="Puntos de inicio cercanos">
            <strong>¿Desde dónde comienzas?</strong>
            <p className="route-nearby-help">El GPS no identifica aulas ni pisos. Elige un punto que reconozcas.</p>
            {nearbyOrigins.map(({ node, distance }) => <button key={node.id} type="button" aria-pressed={originChoice === `node:${node.id}`} onClick={() => chooseOrigin(`node:${node.id}`)}>
              <MapPin size={16} /><span>{node.properties?.nombre || 'Punto de inicio'}</span><small>~{Math.round(distance)} m</small>
            </button>)}
          </div>}
          {!loading && nearbyOrigins.length === 0 && <p className="route-nearby-help">No hay puntos cercanos para este destino. Elige un inicio de la lista.</p>}
        </section>}

        {destinationResolution.approximate && <p className="route-approximation" role="status">Llegada aproximada: {destinationResolution.referenceName}</p>}
        {loading && <div className="route-state"><LoaderCircle className="spin" size={20} /><p>Cargando ruta…</p></div>}
        {loadError && <div className="route-state" role="alert"><p>{loadError}</p></div>}
        {status && <div className="route-state"><Route size={18} /><p>{status}</p></div>}

        {steps.length > 0 && <div className="route-ready">
          <span><Route size={17} /> Ruta lista · {steps.length} {steps.length === 1 ? 'punto' : 'puntos'}</span>
          <button className="route-start" onClick={() => { setStepIndex(0); setGuiding(true); }}>Iniciar recorrido <ChevronRight size={20} /></button>
        </div>}
      </section>
    </main>
  );
}
