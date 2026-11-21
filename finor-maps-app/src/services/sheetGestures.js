export const SHEET_HEIGHTS = [24, 58, 82];

export function clampSheetHeight(height) {
  return Math.min(SHEET_HEIGHTS[SHEET_HEIGHTS.length - 1], Math.max(SHEET_HEIGHTS[0], height));
}

export function snapSheetHeight(height, startHeight, elapsedMs) {
  const clamped = clampSheetHeight(height);
  const movement = clamped - startHeight;
  if (elapsedMs < 300 && Math.abs(movement) >= 5) {
    if (movement > 0) return SHEET_HEIGHTS.find((value) => value > startHeight) ?? SHEET_HEIGHTS.at(-1);
    return [...SHEET_HEIGHTS].reverse().find((value) => value < startHeight) ?? SHEET_HEIGHTS[0];
  }
  return SHEET_HEIGHTS.reduce((closest, value) => Math.abs(value - clamped) < Math.abs(closest - clamped) ? value : closest);
}
