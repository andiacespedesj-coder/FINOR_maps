function positionOnImage(x, y, image, frame, fit) {
  const horizontal = Number(x);
  const vertical = Number(y);
  if (![horizontal, vertical, image?.width, image?.height, frame?.width, frame?.height].every(Number.isFinite)) return null;
  if (horizontal < 0 || horizontal > 1 || vertical < 0 || vertical > 1 || image.width <= 0 || image.height <= 0 || frame.width <= 0 || frame.height <= 0) return null;
  const scale = fit === 'cover'
    ? Math.max(frame.width / image.width, frame.height / image.height)
    : Math.min(frame.width / image.width, frame.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  return {
    left: (frame.width - width) / 2 + width * horizontal,
    top: (frame.height - height) / 2 + height * vertical,
  };
}

export const positionOnContainedImage = (x, y, image, frame) => positionOnImage(x, y, image, frame, 'contain');
export const positionOnCoveredImage = (x, y, image, frame) => positionOnImage(x, y, image, frame, 'cover');
