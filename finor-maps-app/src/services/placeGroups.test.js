import test from 'node:test';
import assert from 'node:assert/strict';
import { groupFloorPlaces, placeRowsForGroup } from './placeGroups.js';

const place = (id, nombre, categoria_nombre, categoria_icono = 'DoorOpen') => ({
  id, properties: { nombre, categoria_nombre, categoria_icono },
});

test('un piso con una carrera agrupa aulas, carrera y baños sin perder lugares', () => {
  const places = [
    place(1, 'Aula S2', 'Aula'),
    place(2, 'Aula S3', 'Aula'),
    place(3, 'Baño de Sistemas', 'Baño', 'Droplets'),
    place(4, 'Carrera de Ingeniería en Sistemas', 'Carreras', 'Building2'),
    place(5, 'Dirección de Ingeniería en Sistemas', 'Dirección de Carrera', 'Briefcase'),
    place(6, 'Laboratorio 1', 'Laboratorio', 'FlaskConical'),
    place(7, 'Sala de Estudio', 'Sala de Estudio'),
  ];
  const groups = groupFloorPlaces(places);
  assert.deepEqual(groups.map((group) => group.title), ['Aulas', 'Carrera de Ingeniería en Sistemas', 'Baños']);
  assert.deepEqual(groups.map((group) => group.places.map((item) => item.id)), [[1, 2], [4, 5, 6, 7], [3]]);
});

test('con varias carreras conserva aparte los ambientes sin relación identificable', () => {
  const places = [
    place(1, 'Carrera de Sistemas', 'Carreras'),
    place(2, 'Carrera de Derecho', 'Carreras'),
    place(3, 'Centro interno de Derecho', 'Centro Interno'),
    place(4, 'Laboratorio 1', 'Laboratorio'),
    place(5, 'Dirección de carrera', 'Dirección de Carrera'),
  ];
  const groups = groupFloorPlaces(places, [{ activo: true, lugar: 5, carrera_nombre: 'Sistemas' }]);
  assert.deepEqual(groups.find((group) => group.title === 'Carrera de Sistemas').places.map((item) => item.id), [1, 5]);
  assert.deepEqual(groups.find((group) => group.title === 'Carrera de Derecho').places.map((item) => item.id), [2, 3]);
  assert.deepEqual(groups.find((group) => group.title === 'Laboratorio').places.map((item) => item.id), [4]);
});

test('un piso sin carreras agrupa por categoría y mantiene lugares sin categoría', () => {
  const groups = groupFloorPlaces([
    place(1, 'Aula 1', 'Aulas'),
    place(2, 'Baño', 'Baños'),
    place(3, 'Laboratorio 1', 'Laboratorio'),
    place(4, 'Laboratorio 2', 'Laboratorio'),
    place(5, 'Otro', ''),
  ]);
  assert.deepEqual(groups.map((group) => [group.title, group.places.length]), [
    ['Aulas', 1], ['Baños', 1], ['Laboratorio', 2], ['Otros lugares', 1],
  ]);
});

test('simplifica los títulos de la carrera y agrupa nombres repetidos conservando ambos registros', () => {
  const places = [
    place(1, 'Carrera de Ingeniería en Sistemas', 'Carreras'),
    place(2, 'Centro Interno de Ingeniería en Sistemas', 'Centro Interno'),
    place(3, 'Dirección de Carrera de Ingeniería en Sistemas', 'Dirección'),
    place(4, 'Dirección de Carrera de Ingeniería en Sistemas', 'Dirección'),
    place(5, 'Laboratorio 1', 'Laboratorio'),
  ];
  const group = groupFloorPlaces(places)[0];
  const rows = placeRowsForGroup(group);
  assert.deepEqual(rows.map((row) => row.title), ['Información general', 'Centro interno', 'Dirección de carrera', 'Laboratorio 1']);
  assert.deepEqual(rows[2].places.map((item) => item.id), [3, 4]);
});
