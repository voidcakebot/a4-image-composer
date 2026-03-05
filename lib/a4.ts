export const A4_MM = {
  width: 210,
  height: 297,
} as const;

export const EDITOR_SIZE = {
  width: 1240,
  height: Math.round((1240 * A4_MM.height) / A4_MM.width),
} as const;

export const DEFAULT_GRID_MM = 10;
export const TARGET_DPI = 300;

export function mmToPx(mm: number, pageWidthPx = EDITOR_SIZE.width) {
  return (mm / A4_MM.width) * pageWidthPx;
}

export function snapToGrid(value: number, gridSizePx: number) {
  if (!gridSizePx || gridSizePx <= 0) return value;
  return Math.round(value / gridSizePx) * gridSizePx;
}

export function exportPixelRatio(pageWidthPx = EDITOR_SIZE.width, targetDpi = TARGET_DPI) {
  const targetA4WidthPx = Math.round((A4_MM.width / 25.4) * targetDpi);
  return targetA4WidthPx / pageWidthPx;
}
