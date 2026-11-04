import { destinationNodesForPlace, findRoute } from '../src/services/navigation.js';

const placeId = process.argv[2] || '1';
const originId = process.argv[3] || '1';
const base = 'http://127.0.0.1:5173/api';

async function get(path) {
  const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json();
}

try {
  const [catalog, nodePage, connectionPage] = await Promise.all([
    get('/lugares/'), get('/nodos-navegacion/'), get('/conexiones-navegacion/'),
  ]);
  const place = catalog.features?.find((item) => String(item.id) === placeId);
  if (!place) throw new Error(`No se encontró el lugar ${placeId}.`);
  const nodes = nodePage.results?.features || nodePage.results || [];
  const connections = connectionPage.results || [];
  const origin = nodes.find((node) => String(node.id) === originId);
  if (!origin) throw new Error(`No se encontró el nodo inicial ${originId}.`);
  const destination = destinationNodesForPlace(nodes, place);
  if (!destination.nodes.length) throw new Error(`El lugar ${place.properties.nombre} aún no tiene un nodo de llegada.`);
  const route = findRoute(nodes, connections, [origin], destination.nodes);
  if (!route) throw new Error('No hay conexiones entre el inicio y el destino.');

  console.log(`Ruta disponible: ${route.nodes.map((node) => node.properties.nombre).join(' → ')}`);
  if (destination.approximate) console.log(`Llegada de piso aproximada: ${destination.referenceName}`);
} catch (error) {
  console.error(`Prueba de ruta fallida: ${error.message}`);
  console.error('Inicia Vite con npm.cmd run dev y revisa los nodos y conexiones publicados en el VPS.');
  process.exitCode = 1;
}
