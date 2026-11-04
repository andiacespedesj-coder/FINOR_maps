const asId = (value) => value == null ? '' : String(value);
const properties = (item) => item?.properties || item || {};
const nodeId = (node) => asId(node?.id ?? properties(node).id);

export function nodesForPlace(nodes, placeId) {
  return nodes.filter((node) => asId(properties(node).lugar) === asId(placeId));
}

export function destinationNodesForPlace(nodes, place, maxReferenceDistanceMeters = 60) {
  if (!place) return { nodes: [], approximate: false };
  const exact = nodesForPlace(nodes, place.id);
  if (exact.length) return { nodes: exact, approximate: false };

  const details = properties(place);
  const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  // Un piso puede terminar en un punto de referencia; un aula necesita su propio nodo.
  if (!details.piso || normalize(details.nombre) !== normalize(details.piso_nombre)) return { nodes: [], approximate: false };
  const placePoint = pointCoordinates(place);
  if (!placePoint) return { nodes: [], approximate: false };

  const nearest = nodes
    .filter((node) => asId(properties(node).piso) === asId(details.piso) && properties(node).lugar == null)
    .map((node) => {
      const point = pointCoordinates(node);
      return point ? { node, distance: metersBetween(placePoint, point) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance)[0];
  if (!nearest || nearest.distance > maxReferenceDistanceMeters) return { nodes: [], approximate: false };
  return { nodes: [nearest.node], approximate: true, referenceName: properties(nearest.node).nombre };
}

function pointCoordinates(node) {
  const point = node?.geometry;
  if (point?.type !== 'Point' || !Array.isArray(point.coordinates)) return null;
  const [lng, lat] = point.coordinates.map(Number);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

function metersBetween(first, second) {
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const latitude = toRadians(second.lat - first.lat);
  const longitude = toRadians(second.lng - first.lng);
  const a = Math.sin(latitude / 2) ** 2 +
    Math.cos(toRadians(first.lat)) * Math.cos(toRadians(second.lat)) * Math.sin(longitude / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function nearestOutdoorNode(nodes, position, maxDistanceMeters = 120) {
  if (!position || !Number.isFinite(position.lat) || !Number.isFinite(position.lng)) return null;
  const candidates = nodes
    .map((node) => {
      const point = pointCoordinates(node);
      return point ? { node, distance: metersBetween(position, point) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance);
  return candidates[0]?.distance <= maxDistanceMeters ? candidates[0] : null;
}

export function nearestRoutableOutdoorNode(nodes, connections, position, destinationNodes, maxDistanceMeters = 120) {
  if (!position || !Number.isFinite(position.lat) || !Number.isFinite(position.lng)) return null;
  const candidates = nodes
    .filter((node) => ['ENTRADA', 'SALIDA'].includes(properties(node).tipo))
    .map((node) => {
      const point = pointCoordinates(node);
      return point ? { node, distance: metersBetween(position, point) } : null;
    })
    .filter((candidate) => candidate && candidate.distance <= maxDistanceMeters)
    .sort((a, b) => a.distance - b.distance);
  return candidates.find(({ node }) => findRoute(nodes, connections, [node], destinationNodes)) || null;
}

export function findRoute(nodes, connections, originNodes, destinationNodes) {
  const byId = new Map(nodes.map((node) => [nodeId(node), node]));
  const starts = originNodes.map(nodeId).filter((id) => byId.has(id));
  const goals = new Set(destinationNodes.map(nodeId).filter((id) => byId.has(id)));
  if (!starts.length || !goals.size) return null;

  const adjacency = new Map([...byId.keys()].map((id) => [id, []]));
  for (const connection of connections) {
    const edge = properties(connection);
    const from = asId(edge.nodo_origen);
    const to = asId(edge.nodo_destino);
    if (!adjacency.has(from) || !adjacency.has(to) || from === to) continue;
    const enteredDistance = Number(edge.distancia_metros);
    const distance = Number.isFinite(enteredDistance) && enteredDistance > 0 ? enteredDistance : null;
    const weight = distance ?? 10;
    adjacency.get(from).push({ to, connection, weight, distance });
    if (edge.bidireccional) adjacency.get(to).push({ to: from, connection, weight, distance });
  }

  const best = new Map(starts.map((id) => [id, 0]));
  const previous = new Map();
  const pending = new Set(starts);
  const visited = new Set();
  let reached = null;
  while (pending.size) {
    const current = [...pending].reduce((a, b) => best.get(a) <= best.get(b) ? a : b);
    pending.delete(current);
    if (visited.has(current)) continue;
    visited.add(current);
    if (goals.has(current)) { reached = current; break; }
    for (const step of adjacency.get(current)) {
      const candidate = best.get(current) + step.weight;
      if (candidate < (best.get(step.to) ?? Infinity)) {
        best.set(step.to, candidate);
        previous.set(step.to, { from: current, ...step });
        pending.add(step.to);
      }
    }
  }
  if (!reached) return null;

  const path = [byId.get(reached)];
  const segments = [];
  let cursor = reached;
  while (previous.has(cursor)) {
    const step = previous.get(cursor);
    segments.unshift(step);
    cursor = step.from;
    path.unshift(byId.get(cursor));
  }
  return {
    nodes: path,
    segments,
    distanceMeters: segments.every((segment) => segment.distance != null)
      ? segments.reduce((total, segment) => total + segment.distance, 0)
      : null,
  };
}

export function routeInstructions(route, destinationName, originName, photos = []) {
  if (!route) return [];
  return route.nodes.map((node, index) => {
    const details = properties(node);
    const segment = route.segments[index];
    const connection = properties(segment?.connection);
    const nextName = properties(route.nodes[index + 1]).nombre || 'el siguiente punto';
    const guidedPhoto = photos.find((item) =>
      asId(properties(item).nodo) === nodeId(node) &&
      asId(properties(item).conexion) === asId(connection.id) && connection.id != null);
    const photoWithNextArrow = photos.find((item) =>
      asId(properties(item).nodo) === nodeId(node) &&
      (properties(item).flechas || []).some((arrow) => asId(arrow.nodo_destino) === nodeId(route.nodes[index + 1])));
    const referencePhoto = photos.find((item) =>
      asId(properties(item).nodo) === nodeId(node) && properties(item).conexion == null);
    const nodePhoto = photos.find((item) => asId(properties(item).nodo) === nodeId(node));
    const photo = photoWithNextArrow || guidedPhoto || referencePhoto || nodePhoto;
    const nextArrow = (properties(photo).flechas || []).find((arrow) =>
      asId(arrow.nodo_destino) === nodeId(route.nodes[index + 1]));
    const direction = nextArrow?.direccion || guidedPhoto?.direccion || 'ADELANTE';
    let instruction = `Avanza hacia ${nextName}.`;
    if (direction === 'IZQUIERDA') instruction = `Gira a la izquierda hacia ${nextName}.`;
    if (direction === 'DERECHA') instruction = `Gira a la derecha hacia ${nextName}.`;
    if (connection.tipo === 'GRADA') instruction = `Usa las gradas hacia ${nextName}.`;
    if (connection.tipo === 'ASCENSOR') instruction = `Usa el ascensor hacia ${nextName}.`;
    if (index === 0) instruction = `Comienza en ${originName || details.nombre || 'el punto indicado'}. ${instruction}`;
    if (index === route.nodes.length - 1) instruction = `Llegaste a ${destinationName}.`;
    return {
      id: nodeId(node),
      title: index === route.nodes.length - 1 ? 'Destino' : index === 0 ? 'Inicio' : `Paso ${index}`,
      instruction,
      reference: details.nombre || '',
      distance: segment?.distance ?? null,
      photo: photo ? properties(photo) : null,
      photoIsGuided: Boolean(nextArrow || guidedPhoto),
      direction,
      connectionType: connection.tipo || null,
    };
  });
}

export function interactiveRouteInstructions(route, destinationName, originName, graph, destinationNodes) {
  return routeInstructions(route, destinationName, originName, graph.photos).map((step, index) => ({
    ...step,
    arrows: (step.photo?.flechas || []).map((arrow) => {
      const target = graph.nodes.find((node) => asId(node.id) === asId(arrow.nodo_destino));
      if (!target || !findRoute(graph.nodes, graph.connections, [target], destinationNodes)) return null;
      return {
        ...arrow,
        targetName: properties(target).nombre,
        recommended: asId(target.id) === nodeId(route.nodes[index + 1]),
      };
    }).filter(Boolean),
  }));
}
