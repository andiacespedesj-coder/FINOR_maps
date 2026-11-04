import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, LoaderCircle, MapPin, Navigation, Route } from 'lucide-react';
import { fetchPlaces } from '../services/catalogApi';
import { getUserPosition } from '../services/geolocation';
import { destinationNodesForPlace, findRoute, interactiveRouteInstructions, nearestRoutableOutdoorNode, nodesForPlace } from '../services/navigation';
import { loadNavigationGraph } from '../services/navigationApi';
import GuidedRouteView from '../components/GuidedRouteView';
import './RouteScreen.css';

const emptyGraph = { nodes: [], connections: [], photos: [] };
const labelFor = (place) => [place.properties?.nombre, place.properties?.piso_nombre, place.properties?.edificio_nombre].filter(Boolean).join(' · ');

export default function RouteScreen() {
  const { placeId } = useParams();
  const navigate = useNavigate();
  const [places, setPlaces] = useState([]);
  const [graph, setGraph] = useState(emptyGraph);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [originMode, setOriginMode] = useState('gps');
  const [originChoice, setOriginChoice] = useState('');
  const [gpsOrigin, setGpsOrigin] = useState(null);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const [guiding, setGuiding] = useState(false);
  const autoLocateAttempted = useRef(false);
  const gpsRequestId = useRef(0);

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
  const destinationResolution = useMemo(() => destinationNodesForPlace(graph.nodes, destination), [destination, graph.nodes]);
  const destinationNodes = destinationResolution.nodes;
  const originPlace = places.find((place) => originChoice === `place:${place.id}`);
  const originNode = graph.nodes.find((node) => originChoice === `node:${node.id}`);
  const routablePlaces = useMemo(() => places.filter((place) => place.properties?.publicado !== false && nodesForPlace(graph.nodes, place.id).length), [places, graph.nodes]);
  const origins = useMemo(() => routablePlaces
    .filter((place) => String(place.id) !== placeId)
    .sort((a, b) => labelFor(a).localeCompare(labelFor(b), 'es')),
  [routablePlaces, placeId]);

  const result = useMemo(() => {
    if (!destinationNodes.length || !graph.nodes.length || !graph.connections.length) return null;
    const startNodes = originMode === 'gps'
      ? (gpsOrigin ? [gpsOrigin.node] : [])
      : (originNode ? [originNode] : originPlace ? nodesForPlace(graph.nodes, originPlace.id) : []);
    if (!startNodes.length) return null;
    return findRoute(graph.nodes, graph.connections, startNodes, destinationNodes);
  }, [destinationNodes, graph, originMode, gpsOrigin, originPlace, originNode]);

  const steps = useMemo(() => interactiveRouteInstructions(
    result,
    destinationName,
    originMode === 'gps' ? gpsOrigin?.node.properties?.nombre : originNode?.properties?.nombre || originPlace?.properties?.nombre,
    graph,
    destinationNodes,
  ), [result, destinationName, originMode, gpsOrigin, originPlace, originNode, graph, destinationNodes]);
  const locateOrigin = useCallback(async () => {
    const requestId = ++gpsRequestId.current;
    setGpsBusy(true);
    setGpsError('');
    try {
      const position = await getUserPosition();
      if (requestId !== gpsRequestId.current) return;
      if (position.accuracy > 35) {
        setGpsOrigin(null);
        setOriginMode('manual');
        setGpsError('El GPS no puede ubicarte con suficiente precisión. Elige el punto donde estás.');
        return;
      }
      const nearest = nearestRoutableOutdoorNode(
        graph.nodes, graph.connections, position, destinationNodes,
      );
      if (!nearest) {
        setGpsOrigin(null);
        setOriginMode('manual');
        setGpsError('No hay un punto exterior cercano y conectado con este destino. Si estás dentro de un edificio, elige tu lugar de origen.');
      } else {
        setOriginMode('gps');
        setGpsOrigin(nearest);
        setStepIndex(0);
        setGuiding(false);
      }
    } catch {
      if (requestId !== gpsRequestId.current) return;
      setOriginMode('manual');
      setGpsError('No se pudo obtener tu ubicación. Revisa el permiso de ubicación o elige tu lugar de origen.');
    } finally {
      if (requestId === gpsRequestId.current) setGpsBusy(false);
    }
  }, [graph.nodes, graph.connections, destinationNodes]);

  useEffect(() => {
    if (loading || !destinationNodes.length || autoLocateAttempted.current) return;
    autoLocateAttempted.current = true;
    locateOrigin();
  }, [loading, destinationNodes, locateOrigin]);

  let status = '';
  if (!loading && !loadError) {
    if (!destination) status = 'Este destino ya no está disponible.';
    else if (!graph.nodes.length || !graph.connections.length) status = 'Aún no hay recorridos disponibles en el campus.';
    else if (!destinationNodes.length) status = 'Este destino aún no tiene un recorrido registrado.';
    else if (originMode === 'manual' && !originChoice) status = 'Elige tu lugar o punto de inicio para calcular el recorrido.';
    else if (originMode === 'manual' && originPlace && !nodesForPlace(graph.nodes, originPlace.id).length) status = 'El lugar de inicio aún no tiene un recorrido registrado.';
    else if (originMode === 'gps' && !gpsOrigin) status = gpsBusy ? 'Buscando tu ubicación exterior…' : 'Usa el botón de ubicación o elige tu punto de inicio.';
    else if (!result) status = 'Todavía no existe un camino conectado entre el inicio y este destino.';
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
      setOriginMode('manual');
      setOriginChoice(`node:${arrow.nodo_destino}`);
      setGpsOrigin(null);
      setStepIndex(0);
    }}
    onClose={() => setGuiding(false)}
  />;

  return (
    <main className="route-screen">
      <header className="route-header">
        <button onClick={() => navigate(-1)} aria-label="Volver al detalle"><ArrowLeft size={21} /></button>
        <div><span>FINOR Maps</span><h1>Cómo llegar</h1></div>
      </header>

      <section className="route-destination" aria-label="Destino seleccionado">
        <span className="route-destination-icon"><MapPin size={24} /></span>
        <div><small>DESTINO</small><h2>{destinationName || (loading ? 'Cargando destino…' : 'Selecciona un destino')}</h2>
          {destination && <p>{[destination.properties?.piso_nombre, destination.properties?.edificio_nombre].filter(Boolean).join(' · ')}</p>}
        </div>
      </section>

      {destinationResolution.approximate && <div className="route-approximation" role="status"><MapPin size={18} /><p>Este piso todavía no tiene una llegada exacta. El recorrido termina en <strong>{destinationResolution.referenceName}</strong>, un punto de referencia de {destinationName}.</p></div>}

      <section className="route-origin" aria-label="Seleccionar punto de inicio">
        <h2>¿Dónde estás?</h2>
        <p>Buscaremos tu posición exterior. Si estás dentro de un edificio, selecciona el punto donde estás.</p>
        <label htmlFor="route-origin-place">Punto de inicio</label>
        <select id="route-origin-place" value={originMode === 'manual' ? originChoice : ''}
          onChange={(event) => { gpsRequestId.current += 1; setGpsBusy(false); setOriginMode('manual'); setOriginChoice(event.target.value); setGpsOrigin(null); setGpsError(''); setStepIndex(0); setGuiding(false); }}>
          <option value="">Selecciona dónde estás</option>
          {origins.length > 0 && <optgroup label="Lugares">
            {origins.map((place) => <option key={place.id} value={`place:${place.id}`}>{labelFor(place)}</option>)}
          </optgroup>}
          <optgroup label="Puntos de referencia">
            {graph.nodes.filter((node) => node.properties?.nombre && !destinationNodes.some((item) => item.id === node.id)).map((node) => <option key={node.id} value={`node:${node.id}`}>{node.properties.nombre}</option>)}
          </optgroup>
        </select>
        <button className="route-gps" onClick={locateOrigin} disabled={gpsBusy || loading || !destinationNodes.length || !graph.nodes.length}>
          {gpsBusy ? <LoaderCircle className="spin" size={19} /> : <Navigation size={19} />}
          {gpsBusy ? 'Buscando tu posición…' : 'Usar mi ubicación exterior'}
        </button>
        {originMode === 'gps' && gpsOrigin && <p className="route-gps-result">Inicio aproximado: {gpsOrigin.node.properties?.nombre || 'punto cercano'} ({Math.round(gpsOrigin.distance)} m de tu GPS).</p>}
        {gpsError && <p className="route-error" role="alert">{gpsError}</p>}
      </section>

      {loading && <div className="route-state"><LoaderCircle className="spin" size={28} /><p>Cargando recorridos…</p></div>}
      {loadError && <div className="route-state" role="alert"><p>{loadError}</p></div>}
      {status && <div className="route-state"><Route size={27} /><p>{status}</p></div>}

      {steps.length > 0 && <section className="route-preview" aria-label="Resumen de la ruta">
        <span className="route-preview-eyebrow">RECORRIDO LISTO</span>
        <h2>{steps.length} {steps.length === 1 ? 'paso' : 'pasos'} hasta {destinationName}</h2>
        <p>{result.distanceMeters != null ? `${Math.round(result.distanceMeters)} m registrados` : 'Distancia pendiente de registrar'} · {steps.filter((step) => step.photo?.imagen).length} {steps.filter((step) => step.photo?.imagen).length === 1 ? 'fotografía' : 'fotografías'} de referencia</p>
        <button className="route-start" onClick={() => { setStepIndex(0); setGuiding(true); }}>Iniciar ruta guiada <ChevronRight size={20} /></button>
        <ol className="route-preview-list">{steps.map((step) => <li key={step.id}><strong>{step.title}</strong><span>{step.reference || step.instruction}</span></li>)}</ol>
      </section>}
    </main>
  );
}
