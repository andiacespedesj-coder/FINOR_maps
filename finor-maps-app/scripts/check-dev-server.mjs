import { createServer } from 'vite';

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const fetchChecked = async (url) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
  assert(response.ok, `${url} respondió HTTP ${response.status}`);
  return response;
};

let server;
try {
  server = await createServer({
    server: { host: '127.0.0.1', port: 0, strictPort: true },
    logLevel: 'error',
  });

  const target = server.config.server.proxy?.['/api']?.target;
  assert(target === 'https://162.35.162.131', `El proxy de /api apunta a ${target || 'ningún servidor'} en vez del VPS.`);
  assert(!server.config.env.VITE_API_URL, 'VITE_API_URL está definido para desarrollo y evita usar el proxy del VPS. Revisa .env.development.');

  await server.listen();
  const port = server.httpServer.address().port;
  const base = `http://127.0.0.1:${port}`;

  const page = await fetchChecked(base);
  assert((await page.text()).includes('/src/main.jsx'), 'Vite no entregó la página de React.');

  const app = await fetchChecked(`${base}/src/main.jsx`);
  assert((await app.text()).includes('App'), 'Vite no pudo transformar la entrada de React.');

  const map = await fetchChecked(`${base}/api/edificios/mapa/`);
  assert(map.headers.get('content-type')?.includes('application/json'), 'La API del mapa no devolvió JSON.');
  const data = await map.json();
  assert(Array.isArray(data.edificios?.features), 'La API no devolvió la lista de edificios.');
  assert(Array.isArray(data.lugares?.features), 'La API no devolvió la lista de lugares.');

  console.log(`OK: React y API del VPS responden; ${data.edificios.features.length} edificios y ${data.lugares.features.length} lugares en el mapa.`);
} catch (error) {
  console.error(`Fallo de desarrollo: ${error.message}`);
  console.error('Comprueba la conexión al VPS y ejecuta npm.cmd run check:dev antes de abrir la app.');
  process.exitCode = 1;
} finally {
  await server?.close();
}
