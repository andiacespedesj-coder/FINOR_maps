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

test('el directorio excluye lugares no publicados', async () => {
  const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'silent' });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const body = String(url).includes('/lugares/')
      ? { features: [
        { id: 1, properties: { nombre: 'Aula publicada', publicado: true } },
        { id: 2, properties: { nombre: 'Aula no publicada', publicado: false } },
      ] }
      : { results: [], next: null };
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const { loadPlaceDirectory, searchPlaces } = await server.ssrLoadModule('/src/services/catalogData.js');
    const directory = await loadPlaceDirectory();
    assert.deepEqual(directory.places.map((place) => place.id), [1]);
    assert.equal(searchPlaces(directory, 'no publicada').length, 0);
  } finally {
    globalThis.fetch = originalFetch;
    await server.close();
  }
});
