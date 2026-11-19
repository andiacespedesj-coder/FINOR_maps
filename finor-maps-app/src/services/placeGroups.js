const normalize = (value = '') => String(value || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

const careerName = (value = '') => String(value).trim().replace(/^carreras?\s+(?:(?:de|del)\s+)?/i, '');

function placeType(place) {
  const category = normalize(place.properties?.categoria_nombre);
  if (/^aulas?(?:\b|$)/.test(category)) return 'classrooms';
  if (/^banos?(?:\b|$)/.test(category)) return 'bathrooms';
  if (/^carreras?$/.test(category)) return 'career';
  return 'other';
}

export function groupFloorPlaces(places, units = []) {
  const careers = new Map();
  const addCareer = (name, title) => {
    const key = normalize(careerName(name));
    if (key && !careers.has(key)) careers.set(key, { id: `career:${key}`, title, icon: 'GraduationCap', places: [] });
  };

  for (const place of places) {
    if (placeType(place) === 'career' && place.properties?.nombre) {
      addCareer(place.properties.nombre, place.properties.nombre);
    }
  }
  for (const unit of units) {
    if (unit.activo && unit.carrera_nombre && places.some((place) => String(place.id) === String(unit.lugar))) {
      addCareer(unit.carrera_nombre, `Carrera de ${unit.carrera_nombre}`);
    }
  }

  const groups = new Map();
  const append = (group, place) => {
    if (!groups.has(group.id)) groups.set(group.id, group);
    groups.get(group.id).places.push(place);
  };

  for (const place of places) {
    const properties = place.properties || {};
    const type = placeType(place);
    if (type === 'classrooms' || type === 'bathrooms') {
      append(type === 'classrooms'
        ? { id: 'classrooms', title: 'Aulas', icon: 'DoorOpen', places: [] }
        : { id: 'bathrooms', title: 'Baños', icon: 'Droplets', places: [] }, place);
      continue;
    }

    const relatedUnit = units.find((unit) => unit.activo && unit.carrera_nombre && String(unit.lugar) === String(place.id));
    const normalizedName = normalize(properties.nombre);
    let career = type === 'career' ? careers.get(normalize(careerName(properties.nombre))) : null;
    if (!career && relatedUnit) career = careers.get(normalize(careerName(relatedUnit.carrera_nombre)));
    if (!career) {
      const matches = [...careers.entries()].filter(([name]) => normalizedName.includes(name));
      if (matches.length === 1) career = matches[0][1];
    }
    if (!career && careers.size === 1) career = careers.values().next().value;

    if (career) {
      append(career, place);
    } else {
      const category = properties.categoria_nombre || 'Otros lugares';
      append({ id: `category:${normalize(category)}`, title: category, icon: properties.categoria_icono, places: [] }, place);
    }
  }

  const priority = (group) => group.id === 'classrooms' ? 0 : group.id.startsWith('career:') ? 1 : group.id === 'bathrooms' ? 2 : 3;
  return [...groups.values()].sort((a, b) => priority(a) - priority(b) || a.title.localeCompare(b.title, 'es'));
}

export function placeRowsForGroup(group) {
  const rows = new Map();
  const career = group.id.startsWith('career:') ? group.id.slice('career:'.length) : '';

  for (const place of group.places) {
    const properties = place.properties || {};
    const originalName = properties.nombre || 'Lugar';
    const normalizedName = normalize(originalName);
    let title = originalName;
    if (career && placeType(place) === 'career' && normalize(careerName(originalName)) === career) {
      title = 'Información general';
    } else if (career && normalizedName.endsWith(career) && normalizedName !== career) {
      const prefix = originalName.slice(0, originalName.length - career.length).replace(/\s+(?:de|del)\s*$/i, '').trim();
      if (prefix) {
        title = normalize(prefix) === 'direccion de carrera'
          ? 'Dirección de carrera'
          : prefix.charAt(0).toUpperCase() + prefix.slice(1).toLowerCase();
      }
    }

    const key = `${normalize(properties.categoria_nombre)}:${normalizedName}`;
    if (!rows.has(key)) rows.set(key, { id: key, title, places: [] });
    rows.get(key).places.push(place);
  }
  return [...rows.values()];
}
