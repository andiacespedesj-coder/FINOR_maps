import test from 'node:test';
import assert from 'node:assert/strict';
import { positionOnContainedImage } from './photoArrows.js';

test('la flecha conserva su posición en una foto vertical con márgenes laterales', () => {
  assert.deepEqual(positionOnContainedImage(0.5, 0.25, { width: 600, height: 1200 }, { width: 400, height: 400 }), { left: 200, top: 100 });
  assert.deepEqual(positionOnContainedImage(0, 1, { width: 600, height: 1200 }, { width: 400, height: 400 }), { left: 100, top: 400 });
});

test('rechaza coordenadas fuera de la fotografía', () => {
  assert.equal(positionOnContainedImage(1.1, 0.5, { width: 100, height: 100 }, { width: 400, height: 400 }), null);
});
