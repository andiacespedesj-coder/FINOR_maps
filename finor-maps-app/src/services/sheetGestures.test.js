import test from 'node:test';
import assert from 'node:assert/strict';
import { clampSheetHeight, snapSheetHeight } from './sheetGestures.js';

test('limita el panel a las alturas permitidas', () => {
  assert.equal(clampSheetHeight(2), 24);
  assert.equal(clampSheetHeight(99), 82);
});

test('un arrastre se ajusta a la altura más cercana', () => {
  assert.equal(snapSheetHeight(34, 58, 500), 24);
  assert.equal(snapSheetHeight(68, 58, 500), 58);
  assert.equal(snapSheetHeight(76, 58, 500), 82);
});

test('un gesto rápido avanza una posición en la dirección del movimiento', () => {
  assert.equal(snapSheetHeight(64, 58, 200), 82);
  assert.equal(snapSheetHeight(52, 58, 200), 24);
  assert.equal(snapSheetHeight(80, 82, 200), 82);
});
