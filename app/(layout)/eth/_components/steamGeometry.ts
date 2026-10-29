// Meshes for the hero's ETH glyph (see etherDiamondScene.ts), plus its easter egg:
// the steam rising off growthepie's pie, which is itself drawn from the ETH glyph,
// wound into a twister in the glyph's shape. The logo's six wisps
// (public/logo-pie-only.svg) become ribbons wrapped around the spin axis, twisting
// as they rise; how far out they sit is a share of the glyph's outline at that
// height and angle, so they meet in its top and bottom points. Every height cuts
// each wisp once, so each ribbon is a regular grid: rows up the wisp, columns
// evenly across it.

export const COOL = 0; // growthepie's petrol → turquoise ramp
export const WARM = 1; // its red → yellow ramp

/** A flat polygon: vertex indices wound counter-clockwise seen from outside. */
export type Poly = {
  idx: number[];
  ramp: number;
  shade: number;
  outline: boolean;
  /** A triangle of a curved surface: shaded smoothly across, from normals at its
   * vertices averaged over their neighbours. */
  smooth: boolean;
};

export type Mesh = {
  x: Float32Array;
  y: Float32Array;
  z: Float32Array;
  polys: Poly[];
  /** Whether the polys must be depth-sorted each frame (else they're drawn in order). */
  sorted: boolean;
  /** A surface with no inside, lit on whichever side faces the camera (else back faces are culled). */
  doubleSided: boolean;
};

// `layer`: how far the wisp sits outside (+) or inside (-) the others, as a share
// of the glyph's outline.
const WISPS: Array<{ d: string; layer: number }> = [
  {
    // upper left
    d: "M13.4079 13.991C13.3229 12.805 13.6459 11.716 14.3389 10.66C14.8029 9.958 15.4609 9.2 16.1869 8.365C18.0599 6.208 20.3799 3.538 20.9479 0C22.1829 2.712 21.5839 5.349 20.2169 7.774C19.6019 8.864 18.9209 9.647 18.2709 10.394C17.5059 11.273 16.7849 12.102 16.2669 13.321C15.9819 13.984 15.8199 14.619 15.7439 15.24L13.4079 13.991Z",
    layer: 0.03,
  },
  {
    // upper centre, the tallest: innermost
    d: "M17.416 16.1366C17.701 15.0906 18.194 14.1126 18.849 13.1636C19.391 12.3716 19.899 11.7846 20.355 11.2576C21.889 9.48264 22.841 8.38064 22.562 2.43164C22.741 2.81364 22.918 3.18164 23.09 3.53664L23.091 3.53864C24.587 6.64464 25.637 8.82264 23.873 11.8136C23.001 13.2916 22.365 14.0266 21.803 14.6766C21.17 15.4076 20.63 16.0326 19.951 17.4866L17.416 16.1366Z",
    layer: -0.075,
  },
  {
    // upper right
    d: "M23.985 15.1997C23.297 16.0147 22.174 17.1387 22.123 17.2127L28.478 13.6597C28.345 12.4757 27.472 11.0807 26.399 9.09766C26.616 11.7117 25.596 13.2907 23.985 15.1997Z",
    layer: 0.024,
  },
  {
    // lower right
    d: "M28.4311 14.8408C28.2601 15.5988 27.3241 17.1758 26.6361 17.9948C24.4621 20.5808 23.3301 21.6838 21.4701 25.5748C21.3651 25.1538 21.2551 24.7568 21.1501 24.3778C20.6311 22.5058 20.3121 20.9468 20.9341 19.6028L28.4311 14.8408Z",
    layer: 0.084,
  },
  {
    // lower left
    d: "M20.0362 23.6073C19.5042 22.0503 19.1222 20.7483 19.4002 19.1013L17.1782 17.6533C17.0552 20.0763 18.0902 22.9053 20.9482 26.5473C20.7962 25.6453 20.3402 24.4973 20.0362 23.6073Z",
    layer: 0.072,
  },
  {
    // small left
    d: "M15.697 16.6883C15.735 17.4763 16.222 19.5593 16.658 20.6613C15.414 19.0743 14.054 16.6393 13.665 15.3633L15.697 16.6883Z",
    layer: -0.015,
  },
];

const CURVE_STEPS = 8; // line segments per Bézier curve
const MIN_SEGMENT = 0.15; // SVG units; shorter segments are merged away
const FILL = 0.85; // share of the glyph's outline the ribbons sit at
// The logo's width is wrapped around the axis, twisting further round towards
// the top.
const WRAP = 4.5; // rad around the axis per unit of logo width
const HELIX = 2.6; // rad of extra twist from bottom to top
const ROW_STEP = 0.05; // units between a ribbon's rows
const COLUMNS = 6; // across each ribbon
// Wrapped, the ribbons catch less of the key light than the glyph's tilted
// faces; brighter keeps them as turquoise as the logo's.
const RIBBON_SHADE = 1.25;

// Flattens an SVG path that uses absolute M, L, C and Z commands into points.
function flatten(d: string): Array<[number, number]> {
  const tokens = d.match(/[MLCZ]|-?\d*\.?\d+/g) ?? [];
  const points: Array<[number, number]> = [];
  const add = (x: number, y: number) => {
    const last = points[points.length - 1];
    if (!last || Math.hypot(x - last[0], y - last[1]) >= MIN_SEGMENT) points.push([x, y]);
  };
  let i = 0;
  let command = "";
  let x = 0;
  let y = 0;
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/[MLCZ]/.test(tokens[i])) command = tokens[i++];
    if (command === "M" || command === "L") {
      x = num();
      y = num();
      add(x, y);
    } else if (command === "C") {
      const [x1, y1, x2, y2, x3, y3] = [num(), num(), num(), num(), num(), num()];
      for (let s = 1; s <= CURVE_STEPS; s++) {
        const t = s / CURVE_STEPS;
        const u = 1 - t;
        add(
          u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
          u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
        );
      }
      x = x3;
      y = y3;
    } else {
      command = ""; // Z, or a stray number
      i++;
    }
  }
  const [first, last] = [points[0], points[points.length - 1]];
  if (points.length > 3 && Math.hypot(first[0] - last[0], first[1] - last[1]) < MIN_SEGMENT) points.pop();
  return points;
}

// Where a horizontal line at height y enters and leaves a wisp's outline.
function span(points: Array<[number, number]>, y: number): [number, number] {
  let left = Infinity;
  let right = -Infinity;
  for (let i = 0; i < points.length; i++) {
    const [ax, ay] = points[i];
    const [bx, by] = points[(i + 1) % points.length];
    if ((ay - y) * (by - y) > 0 || ay === by) continue;
    const x = ax + ((bx - ax) * (y - ay)) / (by - ay);
    left = Math.min(left, x);
    right = Math.max(right, x);
  }
  return [left, right];
}

/**
 * Builds the steam twister within an outline: `radiusAt(y, angle)` is how far the
 * glyph's surface is from the vertical axis at height y, in direction `angle`
 * (0 towards +z).
 */
export function createSteam(radiusAt: (y: number, angle: number) => number): Mesh {
  const outlines = WISPS.map((wisp) => flatten(wisp.d));

  // Scale the steam to the diamond's 2 units tall, centred (y up).
  const all = outlines.flat();
  const minX = Math.min(...all.map((p) => p[0]));
  const maxX = Math.max(...all.map((p) => p[0]));
  const minY = Math.min(...all.map((p) => p[1]));
  const maxY = Math.max(...all.map((p) => p[1]));
  const unit = 2 / (maxY - minY);
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;

  const xs: number[] = [];
  const ys: number[] = [];
  const zs: number[] = [];
  const polys: Poly[] = [];

  outlines.forEach((outline, w) => {
    const points = outline.map(([px, py]): [number, number] => [(px - midX) * unit, (midY - py) * unit]);
    const low = Math.min(...points.map((p) => p[1]));
    const high = Math.max(...points.map((p) => p[1]));
    const rows = Math.max(2, Math.ceil((high - low) / ROW_STEP));
    const first = xs.length;
    for (let row = 0; row <= rows; row++) {
      // Just inside the ends, where the outline narrows to a point or an edge.
      const y = low + (high - low) * (0.001 + (0.998 * row) / rows);
      const [left, right] = span(points, y);
      for (let column = 0; column <= COLUMNS; column++) {
        const px = left + ((right - left) * column) / COLUMNS;
        const angle = px * WRAP + HELIX * ((y + 1) / 2);
        const r = radiusAt(y, angle) * (FILL + WISPS[w].layer);
        xs.push(r * Math.sin(angle));
        ys.push(y);
        zs.push(r * Math.cos(angle));
      }
    }
    const at = (row: number, column: number) => first + row * (COLUMNS + 1) + column;
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < COLUMNS; column++) {
        const a = at(row, column);
        const b = at(row, column + 1);
        const c = at(row + 1, column + 1);
        const d = at(row + 1, column);
        polys.push({ idx: [a, b, c], ramp: COOL, shade: RIBBON_SHADE, outline: false, smooth: true });
        polys.push({ idx: [a, c, d], ramp: COOL, shade: RIBBON_SHADE, outline: false, smooth: true });
      }
    }
  });

  return {
    x: Float32Array.from(xs),
    y: Float32Array.from(ys),
    z: Float32Array.from(zs),
    polys,
    sorted: true,
    doubleSided: true,
  };
}
