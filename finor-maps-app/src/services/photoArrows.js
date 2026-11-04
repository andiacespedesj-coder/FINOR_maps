export function positionOnContainedImage(x, y, image, frame) {
  const horizontal = Number(x);
  const vertical = Number(y);
  if (![horizontal, vertical, image?.width, image?.height, frame?.width, frame?.height].every(Number.isFinite)) return null;
  if (horizontal < 0 || horizontal > 1 || vertical < 0 || vertical > 1 || image.width <= 0 || image.height <= 0 || frame.width <= 0 || frame.height <= 0) return null;
  const scale = Math.min(frame.width / image.width, frame.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  return {
    left: (frame.width - width) / 2 + width * horizontal,
    top: (frame.height - height) / 2 + height * vertical,
  };
}
