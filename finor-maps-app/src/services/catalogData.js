import { fetchBuildingById, fetchCareerUnits, fetchPlaceAliases, fetchPlaces } from './catalogApi';

async function allPages(fetchPage) {
  const items = [];
  let page = 1;
  while (true) {
    const response = await fetchPage(page);
    if (Array.isArray(response)) return [...items, ...response];
    items.push(...(response?.results || []));
    if (!response?.next) return items;
    page += 1;
  }
}

export async function loadPlaceDirectory() {
  const [placesData, aliases, units] = await Promise.all([
    fetchPlaces(),
    allPages(fetchPlaceAliases),
    allPages(fetchCareerUnits),
  ]);
  return {
    places: (placesData.features || []).filter((place) => place.properties?.publicado !== false),
    aliases,
    units,
  };
}

export async function loadBuildingDirectory(id) {
  const [building, directory] = await Promise.all([
    fetchBuildingById(id),
    loadPlaceDirectory(),
  ]);
  return { building, ...directory };
}

export function placeRelations(directory, placeId) {
  return {
    aliases: directory.aliases.filter((alias) => alias.lugar === placeId && alias.activo),
    units: directory.units.filter((unit) => unit.lugar === placeId && unit.activo),
  };
}

const normalized = (value = '') => String(value || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function searchPlaces(directory, query) {
  const search = normalized(query.trim());
  if (!search) return [];
  const terms = search.split(/\s+/).filter((term) => term && !['de', 'del', 'la', 'el', 'en'].includes(term))
    .map((term) => term === 'ing' ? 'ingenieria' : term);
  if (!terms.length) return [];
  return directory.places.filter((place) => {
    const p = place.properties || {};
    const { aliases, units } = placeRelations(directory, place.id);
    const searchable = [
      p.nombre, p.codigo_visible, p.codigo, p.descripcion, p.categoria_nombre,
      p.piso_nombre, p.edificio_nombre,
      ...aliases.flatMap((alias) => [alias.alias, alias.carrera_nombre]),
      ...units.flatMap((unit) => [unit.nombre, unit.carrera_nombre, unit.tipo]),
    ].map(normalized).join(' ');
    return terms.every((term) => searchable.includes(term));
  });
}
