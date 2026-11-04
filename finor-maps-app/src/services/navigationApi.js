import { request } from './httpClient';

function pageItems(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.features)) return response.features;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.results?.features)) return response.results.features;
  return [];
}

async function allPages(path) {
  const items = [];
  let page = 1;
  while (true) {
    const response = await request(`${path}?page=${page}`, { cache: false });
    items.push(...pageItems(response));
    if (!response?.next) return items;
    page += 1;
  }
}

export async function loadNavigationGraph() {
  const [nodes, connections, photos] = await Promise.all([
    allPages('/nodos-navegacion/'),
    allPages('/conexiones-navegacion/'),
    allPages('/fotos-ruta/'),
  ]);
  return { nodes, connections, photos };
}
