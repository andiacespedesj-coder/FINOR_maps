import linea5 from '../assets/linea-5.json';
import linea8 from '../assets/linea-8-ida.json';
import linea22 from '../assets/linea-22.json';

function route(id, title, number, association, data, detail) {
  const line = data.features.find((feature) => feature.geometry?.type === 'LineString');
  return {
    id, title, number, association, detail,
    positions: line.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
    points: data.features.filter((feature) => feature.geometry?.type === 'Point').map((feature) => ({
      name: feature.properties?.nombre || 'Parada',
      position: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
    })),
  };
}

export const transportRoutes = {
  'linea-5': route('linea-5', 'Línea 5', '5', 'san miguel', linea5, 'Ver recorrido'),
  'linea-8-ida': route('linea-8-ida', 'Línea 8 · Ida', '8', 'san miguel', linea8, 'Ver recorrido'),
  'linea-22': route('linea-22', 'Línea 22', '22', 'florida', linea22, 'Ver recorrido'),
};

export function routeForLine(line) {
  const association = line.asociacion?.trim().toLocaleLowerCase('es');
  return Object.values(transportRoutes).find((item) => item.association === association && item.number === String(line.numero).trim()) || null;
}
