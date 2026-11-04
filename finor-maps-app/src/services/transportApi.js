import { request } from './httpClient';

// Permite consultar las líneas confirmadas mientras se publica la nueva API en el VPS.
const initialLines = [
  { id: 'san-miguel-5', asociacion: 'San Miguel', numero: '5', recorrido_descripcion: 'Desde la parada cercana a FINOR continúa por la avenida Paichané.' },
  { id: 'san-miguel-8', asociacion: 'San Miguel', numero: '8', recorrido_descripcion: 'Desde la parada cercana a FINOR continúa por la avenida Paichané.' },
  { id: 'san-miguel-10', asociacion: 'San Miguel', numero: '10', recorrido_descripcion: 'Desde la parada cercana a FINOR continúa por la avenida Paichané.' },
  { id: 'florida-22', asociacion: 'Florida', numero: '22', recorrido_descripcion: 'Desde la parada cercana a FINOR continúa por la avenida Paseo Universitario.' },
];

export async function fetchTransportDirectory() {
  try {
    const [lines, stops] = await Promise.all([
      request('/lineas-transporte/'),
      request('/paradas-transporte/'),
    ]);
    return { lines, stops: stops.features || [], provisional: false };
  } catch {
    return { lines: initialLines, stops: [], provisional: true };
  }
}
