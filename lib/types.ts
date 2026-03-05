export type PageConfig = {
  format: "A4";
  orientation: "portrait";
};

export type GridConfig = {
  enabled: boolean;
  sizeMm: number;
  snap: boolean;
};

export type CanvasItem = {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};
