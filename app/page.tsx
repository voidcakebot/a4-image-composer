"use client";

import { jsPDF } from "jspdf";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Layer, Line, Rect, Stage, Transformer, Image as KonvaImage } from "react-konva";
import { v4 as uuid } from "uuid";
import { A4_MM, DEFAULT_GRID_MM, EDITOR_SIZE, exportPixelRatio, mmToPx, snapToGrid } from "@/lib/a4";
import type { CanvasItem, GridConfig, PageConfig } from "@/lib/types";
import Konva from "konva";

type LoadedImage = HTMLImageElement;

const page: PageConfig = {
  format: "A4",
  orientation: "portrait",
};

const initialGrid: GridConfig = {
  enabled: true,
  sizeMm: DEFAULT_GRID_MM,
  snap: true,
};

function createImage(src: string): Promise<LoadedImage> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export default function HomePage() {
  const [items, setItems] = useState<CanvasItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [images, setImages] = useState<Record<string, LoadedImage>>({});
  const [grid, setGrid] = useState<GridConfig>(initialGrid);
  const [viewport, setViewport] = useState({ width: 390, height: 700 });

  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const imageRefs = useRef<Record<string, Konva.Image>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const fitScale = useMemo(() => {
    const maxW = viewport.width - 24;
    const maxH = viewport.height - 200;
    return Math.min(maxW / EDITOR_SIZE.width, maxH / EDITOR_SIZE.height);
  }, [viewport]);

  const stageSize = useMemo(
    () => ({ width: EDITOR_SIZE.width * fitScale, height: EDITOR_SIZE.height * fitScale }),
    [fitScale],
  );

  const gridPx = useMemo(() => mmToPx(grid.sizeMm), [grid.sizeMm]);

  useEffect(() => {
    if (!transformerRef.current) return;
    const node = activeId ? imageRefs.current[activeId] : null;
    transformerRef.current.nodes(node ? [node] : []);
    transformerRef.current.getLayer()?.batchDraw();
  }, [activeId, items]);

  const handleImageAdd = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    for (const file of files) {
      const src = URL.createObjectURL(file);
      const loaded = await createImage(src);
      const maxWidth = EDITOR_SIZE.width * 0.45;
      const scale = Math.min(1, maxWidth / loaded.width);
      const width = loaded.width * scale;
      const height = loaded.height * scale;
      const item: CanvasItem = {
        id: uuid(),
        src,
        width,
        height,
        x: (EDITOR_SIZE.width - width) / 2,
        y: (EDITOR_SIZE.height - height) / 2,
        rotation: 0,
      };
      setImages((prev) => ({ ...prev, [item.id]: loaded }));
      setItems((prev) => [...prev, item]);
      setActiveId(item.id);
    }
    event.target.value = "";
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<CanvasItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }, []);

  const removeActive = useCallback(() => {
    if (!activeId) return;
    setItems((prev) => prev.filter((item) => item.id !== activeId));
    setActiveId(null);
  }, [activeId]);

  const rotateActive90 = useCallback(() => {
    if (!activeId) return;
    setItems((prev) =>
      prev.map((item) =>
        item.id === activeId ? { ...item, rotation: (item.rotation + 90) % 360 } : item,
      ),
    );
  }, [activeId]);

  const exportPngDataUrl = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return null;
    const tr = transformerRef.current;
    tr?.visible(false);
    stage.batchDraw();
    const data = stage.toDataURL({ pixelRatio: exportPixelRatio() });
    tr?.visible(true);
    stage.batchDraw();
    return data;
  }, []);

  const downloadDataUrl = useCallback((dataUrl: string, fileName: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, []);

  const exportPNG = useCallback(() => {
    const data = exportPngDataUrl();
    if (data) downloadDataUrl(data, "a4-composition.png");
  }, [downloadDataUrl, exportPngDataUrl]);

  const exportPDF = useCallback(() => {
    const data = exportPngDataUrl();
    if (!data) return;
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    pdf.addImage(data, "PNG", 0, 0, A4_MM.width, A4_MM.height, undefined, "FAST");
    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);
    downloadDataUrl(url, "a4-composition.pdf");
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, [downloadDataUrl, exportPngDataUrl]);

  const gridLines = useMemo(() => {
    if (!grid.enabled) return [];
    const lines: Array<{ points: number[]; key: string }> = [];
    for (let x = 0; x <= EDITOR_SIZE.width; x += gridPx) {
      lines.push({ key: `v-${x}`, points: [x, 0, x, EDITOR_SIZE.height] });
    }
    for (let y = 0; y <= EDITOR_SIZE.height; y += gridPx) {
      lines.push({ key: `h-${y}`, points: [0, y, EDITOR_SIZE.width, y] });
    }
    return lines;
  }, [grid.enabled, gridPx]);

  return (
    <main className="app-shell modern">
      <header className="topbar">
        <div className="chip">{page.format} {page.orientation}</div>
        <div className="chip">{items.length} item{items.length === 1 ? "" : "s"}</div>
        <div className={`chip ${grid.enabled ? "ok" : ""}`}>Grid {grid.enabled ? "on" : "off"}</div>
      </header>

      <section className="stage-wrap modern" style={{ width: stageSize.width, height: stageSize.height }}>
        {items.length === 0 && <div className="empty-hint">Add an image to start composing</div>}
        <Stage
          width={stageSize.width}
          height={stageSize.height}
          scaleX={fitScale}
          scaleY={fitScale}
          ref={stageRef}
          onMouseDown={(e) => {
            if (e.target === e.target.getStage()) setActiveId(null);
          }}
          onTouchStart={(e) => {
            if (e.target === e.target.getStage()) setActiveId(null);
          }}
        >
          <Layer>
            <Rect x={0} y={0} width={EDITOR_SIZE.width} height={EDITOR_SIZE.height} fill="#fff" />
            {gridLines.map((line) => (
              <Line key={line.key} points={line.points} stroke="#eef2f7" strokeWidth={1} />
            ))}
            {items.map((item) => (
              <KonvaImage
                key={item.id}
                ref={(node) => {
                  if (node) imageRefs.current[item.id] = node;
                }}
                image={images[item.id]}
                x={item.x}
                y={item.y}
                width={item.width}
                height={item.height}
                rotation={item.rotation}
                draggable
                onClick={() => setActiveId(item.id)}
                onTap={() => setActiveId(item.id)}
                onDragMove={(e) => {
                  if (!grid.snap) return;
                  const node = e.target;
                  node.x(snapToGrid(node.x(), gridPx));
                  node.y(snapToGrid(node.y(), gridPx));
                }}
                onDragEnd={(e) => {
                  const node = e.target;
                  updateItem(item.id, {
                    x: grid.snap ? snapToGrid(node.x(), gridPx) : node.x(),
                    y: grid.snap ? snapToGrid(node.y(), gridPx) : node.y(),
                  });
                }}
                onTransformEnd={(e) => {
                  const node = e.target;
                  const scaleX = node.scaleX();
                  const scaleY = node.scaleY();
                  node.scaleX(1);
                  node.scaleY(1);
                  updateItem(item.id, {
                    x: node.x(),
                    y: node.y(),
                    width: Math.max(24, node.width() * scaleX),
                    height: Math.max(24, node.height() * scaleY),
                    rotation: node.rotation(),
                  });
                }}
                stroke={activeId === item.id ? "#2563eb" : undefined}
                strokeWidth={activeId === item.id ? 2 : 0}
              />
            ))}
            <Transformer
              ref={transformerRef}
              rotateEnabled
              enabledAnchors={[
                "top-left",
                "top-center",
                "top-right",
                "middle-left",
                "middle-right",
                "bottom-left",
                "bottom-center",
                "bottom-right",
              ]}
              keepRatio={false}
              anchorSize={12}
              borderStroke="#2563eb"
              anchorStroke="#2563eb"
              anchorFill="#ffffff"
            />
          </Layer>
        </Stage>
      </section>

      <input
        type="file"
        accept="image/*"
        multiple
        ref={inputRef}
        onChange={handleImageAdd}
        style={{ display: "none" }}
      />

      <nav className="toolbar modern">
        <button className="btn btn-primary" onClick={() => inputRef.current?.click()}>+ Add</button>
        <button className={`btn ${grid.enabled ? "active" : ""}`} onClick={() => setGrid((g) => ({ ...g, enabled: !g.enabled }))}>
          Grid
        </button>
        <button className={`btn ${grid.snap ? "active" : ""}`} onClick={() => setGrid((g) => ({ ...g, snap: !g.snap }))}>
          Snap
        </button>
        <button className="btn" disabled={!activeId} onClick={rotateActive90}>Rotate 90°</button>
        <button className="btn" onClick={exportPNG}>PNG</button>
        <button className="btn" onClick={exportPDF}>PDF</button>
        <button className="btn btn-danger" disabled={!activeId} onClick={removeActive}>Delete</button>
      </nav>
    </main>
  );
}
