export type RGB = {
  r: number;
  g: number;
  b: number;
};

export const hsvToRgb = (h: number, s: number, v: number): RGB => {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let r = 0, g = 0, b = 0;

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
};

export const rgbToHex = ({ r, g, b }: RGB): string => {
  const toHex = (n: number): string => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

export const getColorAtPosition = (
  canvas: HTMLCanvasElement,
  x: number,
  y: number
): string => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return '#000000';
  
  const imageData = ctx.getImageData(x, y, 1, 1).data;
  return rgbToHex({
    r: imageData[0],
    g: imageData[1],
    b: imageData[2]
  });
};