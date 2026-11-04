import test from 'node:test';
import assert from 'node:assert/strict';
import { destinationNodesForPlace, findRoute, interactiveRouteInstructions, nearestOutdoorNode, nearestRoutableOutdoorNode, nodesForPlace, routeInstructions } from './navigation.js';

const node = (id, place = null, coordinates = null, type = 'ENTRADA', floor = null) => ({
  id,
  properties: { nombre: `Punto ${id}`, lugar: place, tipo: type, piso: floor },
  geometry: coordinates ? { type: 'Point', coordinates } : null,
});
const edge = (from, to, distance, bidirectional = true) => ({
  nodo_origen: from,
  nodo_destino: to,
  distancia_metros: distance,
  bidireccional: bidirectional,
  tipo: 'PASILLO',
});

test('elige el recorrido más corto entre varios inicios y respeta conexiones dirigidas', () => {
  const nodes = [node(1, 10), node(2, 10), node(3), node(4, 20)];
  const connections = [edge(1, 3, 25), edge(2, 3, 5), edge(3, 4, 8, false)];
  const route = findRoute(nodes, connections, nodesForPlace(nodes, 10), nodesForPlace(nodes, 20));
  assert.deepEqual(route.nodes.map((item) => item.id), [2, 3, 4]);
  assert.equal(route.distanceMeters, 13);
  assert.equal(findRoute(nodes, connections, [nodes[3]], [nodes[2]]), null);
});

test('no inventa un camino cuando faltan conexiones', () => {
  const nodes = [node(1, 10), node(2, 20)];
  assert.equal(findRoute(nodes, [], [nodes[0]], [nodes[1]]), null);
});

test('un piso sin nodo propio usa una referencia cercana de ese piso, pero un aula no', () => {
  const nodes = [
    node(1, null, [-63.269469, -17.338766], 'ENTRADA', 5),
    node(2, null, [-63.269381, -17.338635], 'GRADA', 5),
    node(3, null, [-63.2692, -17.3387], 'GRADA', 6),
  ];
  const floor = {
    id: 10,
    geometry: { type: 'Point', coordinates: [-63.269196, -17.338715] },
    properties: { nombre: 'Planta Baja', piso_nombre: 'Planta Baja', piso: 5 },
  };
  const resolved = destinationNodesForPlace(nodes, floor);
  assert.equal(resolved.approximate, true);
  assert.equal(resolved.nodes[0].id, 2);
  assert.deepEqual(findRoute(nodes, [edge(1, 2, 20)], [nodes[0]], resolved.nodes).nodes.map((item) => item.id), [1, 2]);
  assert.deepEqual(destinationNodesForPlace(nodes, { ...floor, properties: { ...floor.properties, nombre: 'Aula 101' } }).nodes, []);
  assert.equal(destinationNodesForPlace([...nodes, node(4, 10, null, 'REFERENCIA', 5)], floor).nodes[0].id, 4);
});

test('GPS selecciona un punto exterior cercano y rechaza uno lejano', () => {
  const nodes = [node(1, null, [-63.2688, -17.3385]), node(2, null, [-63.26, -17.33])];
  const position = { lat: -17.3385, lng: -63.26881 };
  assert.equal(nearestOutdoorNode(nodes, position)?.node.id, 1);
  assert.equal(nearestOutdoorNode(nodes, position, 0.1), null);
});

test('GPS elige un nodo cercano que sí permite llegar al destino', () => {
  const nodes = [
    node(1, null, [-63.2688, -17.3385], 'GRADA'),
    node(2, null, [-63.2689, -17.3385]),
    node(3, 20),
  ];
  const position = { lat: -17.3385, lng: -63.2688 };
  const destination = nodesForPlace(nodes, 20);
  assert.equal(nearestRoutableOutdoorNode(nodes, [edge(1, 3, 5), edge(2, 3, 20)], position, destination)?.node.id, 2);
  assert.equal(nearestRoutableOutdoorNode(nodes, [edge(2, 3, 20)], position, destination, 2), null);
});

test('las indicaciones incluyen fotos y distancia cuando existen', () => {
  const nodes = [node(1, 10), node(2, 20)];
  const route = findRoute(nodes, [{ id: 7, ...edge(1, 2, 18) }], [nodes[0]], [nodes[1]]);
  const steps = routeInstructions(route, 'Biblioteca', 'Entrada', [
    { nodo: 1, conexion: 7, imagen: '/media/rutas/foto.jpg', direccion: 'DERECHA' },
  ]);
  assert.equal(steps[0].instruction, 'Comienza en Entrada. Gira a la derecha hacia Punto 2.');
  assert.equal(steps[1].instruction, 'Llegaste a Biblioteca.');
  assert.equal(steps[0].distance, 18);
  assert.equal(steps[0].photo.direccion, 'DERECHA');
  assert.equal(steps[0].photoIsGuided, true);
});

test('no muestra una flecha de otro sentido o de otra conexión', () => {
  const nodes = [node(1, 10), node(2, 20)];
  const route = findRoute(nodes, [{ id: 7, ...edge(1, 2, 18) }], [nodes[1]], [nodes[0]]);
  const steps = routeInstructions(route, 'Entrada', 'Biblioteca', [
    { nodo: 1, conexion: 7, imagen: '/ida.jpg', direccion: 'DERECHA' },
    { nodo: 2, conexion: null, imagen: '/referencia.jpg', direccion: 'ADELANTE' },
  ]);
  assert.equal(steps[0].photo.imagen, '/referencia.jpg');
  assert.equal(steps[0].photoIsGuided, false);
});

test('una foto muestra varias flechas y recomienda la que sigue el camino calculado', () => {
  const nodes = [node(1), node(2), node(3), node(4, 20)];
  const connections = [
    { id: 7, ...edge(1, 2, 5) },
    { id: 8, ...edge(1, 3, 10) },
    { id: 9, ...edge(2, 4, 5) },
    { id: 10, ...edge(3, 4, 5) },
  ];
  const photos = [{ nodo: 1, imagen: '/entrada.jpg', flechas: [
    { id: 11, conexion: 7, nodo_destino: 2, direccion: 'ADELANTE', posicion_x: '0.4500', posicion_y: '0.7000' },
    { id: 12, conexion: 8, nodo_destino: 3, direccion: 'DERECHA', posicion_x: '0.8000', posicion_y: '0.6500' },
  ] }];
  const graph = { nodes, connections, photos };
  const route = findRoute(nodes, connections, [nodes[0]], [nodes[3]]);
  const steps = interactiveRouteInstructions(route, 'Destino', 'Entrada', graph, [nodes[3]]);
  assert.deepEqual(route.nodes.map((item) => item.id), [1, 2, 4]);
  assert.equal(steps[0].photo.imagen, '/entrada.jpg');
  assert.equal(steps[0].photoIsGuided, true);
  assert.deepEqual(steps[0].arrows.map((arrow) => [arrow.nodo_destino, arrow.recommended]), [[2, true], [3, false]]);
});
