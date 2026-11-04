import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LoaderCircle, Route } from 'lucide-react';
import GuidedRouteView from '../components/GuidedRouteView';
import { findRoute, interactiveRouteInstructions } from '../services/navigation';
import { loadNavigationGraph } from '../services/navigationApi';
import './RouteScreen.css';

export default function GuidedRoutePreview() {
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [guiding, setGuiding] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    let active = true;
    loadNavigationGraph().then((graph) => {
      if (!active) return;
      const start = graph.nodes.find((node) => node.properties?.tipo === 'ENTRADA');
      const route = start && graph.nodes
        .map((node) => findRoute(graph.nodes, graph.connections, [start], [node]))
        .filter((candidate) => candidate?.nodes.length > 1)
        .sort((a, b) => b.nodes.length - a.nodes.length)[0];
      if (!route) {
        setError('No hay un recorrido de prueba conectado desde una entrada.');
        return;
      }
      const destination = route.nodes.at(-1).properties?.nombre || 'último punto';
      setPreview({
        destination,
        graph,
        destinationNode: route.nodes.at(-1),
        steps: interactiveRouteInstructions(route, destination, start.properties?.nombre, graph, [route.nodes.at(-1)]),
      });
    }).catch(() => active && setError('No se pudieron cargar los nodos y las fotos del VPS.'));
    return () => { active = false; };
  }, []);

  if (guiding && preview) return <GuidedRouteView {...preview} stepIndex={stepIndex} onStepChange={setStepIndex} onArrowSelect={(arrow) => {
    if (arrow.recommended) { setStepIndex((index) => index + 1); return; }
    const start = preview.graph.nodes.find((node) => String(node.id) === String(arrow.nodo_destino));
    const route = start && findRoute(preview.graph.nodes, preview.graph.connections, [start], [preview.destinationNode]);
    if (!route) return;
    setPreview({ ...preview, steps: interactiveRouteInstructions(route, preview.destination, start.properties?.nombre, preview.graph, [preview.destinationNode]) });
    setStepIndex(0);
  }} onClose={() => setGuiding(false)} />;

  return <main className="route-screen">
    <header className="route-header"><button onClick={() => navigate('/')} aria-label="Volver al mapa"><ArrowLeft size={21} /></button><div><span>SOLO EN DESARROLLO</span><h1>Vista previa de ruta</h1></div></header>
    <section className="route-preview">
      <span className="route-preview-eyebrow">PRUEBA DE DISEÑO</span>
      <h2>Ruta guiada con tus fotos</h2>
      <p>Esta vista usa los nodos conectados que ya cargaste. Sirve para revisar el diseño; todavía no es una ruta hacia un aula o carrera.</p>
      {!preview && !error && <div className="route-state"><LoaderCircle className="spin" size={25} /><p>Cargando recorrido de prueba…</p></div>}
      {error && <div className="route-state" role="alert"><Route size={24} /><p>{error}</p></div>}
      {preview && <><p>{preview.steps.length} etapas · {preview.steps.filter((step) => step.photo?.imagen).length} fotos registradas</p><button className="route-start" onClick={() => { setStepIndex(0); setGuiding(true); }}>Ver nuevo diseño</button></>}
    </section>
  </main>;
}
