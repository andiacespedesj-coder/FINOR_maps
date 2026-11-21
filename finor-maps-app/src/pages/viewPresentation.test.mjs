import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

test('el grupo muestra su lista solo cuando está abierto', async () => {
  const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'silent' });
  try {
    await server.listen();
    const { PlaceGroup } = await server.ssrLoadModule('/src/pages/DetailScreen.jsx');
    const props = { group: { title: 'Aulas', icon: 'DoorOpen', places: [{ id: 1 }, { id: 2 }] }, onToggle() {} };
    const closed = renderToStaticMarkup(createElement(PlaceGroup, { ...props, expanded: false }, 'Aula S2'));
    assert.match(closed, /Aulas/);
    assert.doesNotMatch(closed, /Aula S2/);
    const open = renderToStaticMarkup(createElement(PlaceGroup, { ...props, expanded: true }, 'Aula S2'));
    assert.match(open, /Aula S2/);
  } finally {
    await server.close();
  }
});

test('los lugares muestran fotos y ruta al desplegarse, con alternativa si faltan fotos', async () => {
  const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'silent' });
  try {
    await server.listen();
    const { PlaceItem } = await server.ssrLoadModule('/src/pages/DetailScreen.jsx');
    const data = { aliases: [], units: [] };
    const props = {
      place: { id: 4, properties: { nombre: 'Aula S1', fotografias: [{ id: 1, imagen: '/aula.jpg', orden: 1 }] } },
      data,
      floorName: 'Piso 1',
      buildingName: 'Módulo 1',
      onToggle() {},
      onOpenPhoto() {},
      onNavigate() {},
    };
    const collapsed = renderToStaticMarkup(createElement(PlaceItem, { ...props, expanded: false }));
    assert.match(collapsed, /Aula S1/);
    assert.doesNotMatch(collapsed, /Cómo llegar/);

    const expanded = renderToStaticMarkup(createElement(PlaceItem, { ...props, expanded: true }));
    assert.match(expanded, /aula\.jpg/);
    assert.match(expanded, /Piso 1 · Módulo 1/);
    assert.match(expanded, /Cómo llegar/);

    const withoutPhotos = renderToStaticMarkup(createElement(PlaceItem, {
      ...props, expanded: true, place: { id: 5, properties: { nombre: 'Baño', fotografias: [] } },
    }));
    assert.match(withoutPhotos, /Aún no hay fotografías disponibles/);
    assert.match(withoutPhotos, /Cómo llegar/);

    const alternatives = [
      { id: 8, properties: { nombre: 'Dirección de carrera' } },
      { id: 9, properties: { nombre: 'Dirección de carrera' } },
    ];
    const duplicate = renderToStaticMarkup(createElement(PlaceItem, {
      ...props, expanded: true, title: 'Dirección de carrera', place: alternatives[1], alternatives, onSelectAlternative() {},
    }));
    assert.match(duplicate, /Opción 1/);
    assert.match(duplicate, /Opción 2/);
    assert.match(duplicate, /aria-pressed="true"[^>]*>Opción 2/);
    assert.match(duplicate, /Cómo llegar/);
  } finally {
    await server.close();
  }
});

test('la ruta sin foto conserva la indicación y permite continuar', async () => {
  const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'silent' });
  try {
    await server.listen();
    const { default: GuidedRouteView } = await server.ssrLoadModule('/src/components/GuidedRouteView.jsx');
    const markup = renderToStaticMarkup(createElement(GuidedRouteView, {
      destination: 'Aula S1',
      steps: [
        { id: 1, reference: 'Entrada', instruction: 'Avanza al pasillo.', arrows: [] },
        { id: 2, reference: 'Pasillo' },
      ],
      stepIndex: 0,
      onStepChange() {},
      onClose() {},
    }));
    assert.match(markup, /Sin fotografía de este punto/);
    assert.match(markup, /Avanza al pasillo/);
    assert.match(markup, /Siguiente/);
  } finally {
    await server.close();
  }
});

test('las líneas de San Miguel abren su recorrido y conservan sus paradas', async () => {
  const server = await createServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'silent' });
  try {
    await server.listen();
    const { routeForLine } = await server.ssrLoadModule('/src/services/transportRoutes.js');
    const route5 = routeForLine({ numero: '5', asociacion: 'San Miguel' });
    assert.equal(route5.title, 'Línea 5');
    assert.equal(route5.positions.length, 79);
    assert.equal(route5.points[0].name, 'Parada Finor');
    assert.equal(routeForLine({ numero: '8', asociacion: 'San Miguel' }).title, 'Línea 8 · Ida');
    const route22 = routeForLine({ numero: '22', asociacion: 'Florida' });
    assert.equal(route22.title, 'Línea 22');
    assert.equal(route22.positions.length, 69);
    assert.equal(routeForLine({ numero: '22', asociacion: 'San Miguel' }), null);
    assert.equal(routeForLine({ numero: '5', asociacion: 'Otra asociación' }), null);
  } finally {
    await server.close();
  }
});
