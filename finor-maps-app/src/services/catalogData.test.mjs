import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

test('encuentra Ingeniería de Sistemas con la búsqueda abreviada', async () => {
  const server = await createServer({
    server: { host: '127.0.0.1', port: 0 },
    logLevel: 'silent',
  });
  try {
    const { searchPlaces } = await server.ssrLoadModule('/src/services/catalogData.js');
    const directory = {
      places: [{ id: 2, properties: { nombre: 'Aulas de Ingeniería en Sistemas' } }],
      aliases: [],
      units: [],
    };
    assert.equal(searchPlaces(directory, 'ing de sistemas').length, 1);
  } finally {
    await server.close();
  }
});
