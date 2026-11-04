// Utilidades conservadas para la antigua pantalla GPS, actualmente fuera de la navegación.

export const FINOR_CENTER = [-17.33848, -63.26879];
export const CAMPUS_RADIUS_METERS = 500;

// Fórmula de Haversine para calcular distancia en metros entre 2 coordenadas
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Algoritmo Ray-Casting para detectar si [lat, lng] está dentro del polígono
export const isPointInPolygon = (lat, lng, coordinates) => {
  if (!coordinates || !coordinates.length) return false;
  const ring = coordinates[0];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect =
      yi > lat !== yj > lat &&
      lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

// Calcular centroide de un polígono
export const getPolygonCentroid = (coordinates) => {
  if (!coordinates || !coordinates.length) return null;
  const ring = coordinates[0];
  let sumLat = 0;
  let sumLng = 0;
  ring.forEach(([lng, lat]) => {
    sumLat += lat;
    sumLng += lng;
  });
  return {
    lat: sumLat / ring.length,
    lng: sumLng / ring.length,
  };
};

// Detectar en qué módulo se encuentra el usuario
export const detectCurrentModulo = (userLat, userLng, modulosList) => {
  if (!modulosList || !modulosList.length) return null;

  // 1. Verificación geométrica exacta
  for (const modulo of modulosList) {
    if (modulo.geometry && modulo.geometry.coordinates) {
      if (isPointInPolygon(userLat, userLng, modulo.geometry.coordinates)) {
        return { modulo, status: 'inside', distance: 0 };
      }
    }
  }

  // 2. Verificación por proximidad al centro del módulo (tolerancia GPS de 35m)
  let closestModulo = null;
  let minDistance = Infinity;

  for (const modulo of modulosList) {
    if (modulo.geometry && modulo.geometry.coordinates) {
      const centroid = getPolygonCentroid(modulo.geometry.coordinates);
      if (centroid) {
        const dist = calculateDistance(userLat, userLng, centroid.lat, centroid.lng);
        if (dist < minDistance) {
          minDistance = dist;
          closestModulo = modulo;
        }
      }
    }
  }

  if (closestModulo && minDistance <= 35) {
    return { modulo: closestModulo, status: 'near', distance: Math.round(minDistance) };
  }

  return null;
};
