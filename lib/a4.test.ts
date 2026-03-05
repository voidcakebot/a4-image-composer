import { describe, expect, it } from "vitest";
import { exportPixelRatio, mmToPx, snapToGrid } from "./a4";

describe("a4 helpers", () => {
  it("converts mm to px proportionally", () => {
    expect(mmToPx(210)).toBeCloseTo(1240, 5);
    expect(mmToPx(10)).toBeCloseTo(59.0476, 3);
  });

  it("snaps values to nearest grid", () => {
    expect(snapToGrid(103, 20)).toBe(100);
    expect(snapToGrid(111, 20)).toBe(120);
    expect(snapToGrid(111, 0)).toBe(111);
  });

  it("calculates 300dpi export ratio", () => {
    expect(exportPixelRatio()).toBeCloseTo(2, 2);
  });
});
