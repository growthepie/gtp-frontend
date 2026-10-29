// Canvas renderer for the hero's 3D ETH glyph. The glyph is a 16-triangle mesh,
// flat-shaded in growthepie's cool accent ramp (petrol → turquoise) with the warm
// one (red → yellow) glowing in the gap between its halves, like the logo's
// cool pie under a warm crust. It needs no 3D library or WebGL context.
// All animation state lives here rather than in React: one requestAnimationFrame
// loop that draws without allocating, paused while the hero is off screen or the
// tab is hidden. Input: drag to spin (with inertia), a hover tilt for mice, and the
// gyroscope on phones and tablets.
// Easter egg: spin it hard enough (a few quick flicks in the same direction) and
// it twists itself into the steam of growthepie's logo, then slowly back.

import { COOL, createSteam, Mesh, Poly, WARM } from "./steamGeometry";

type Vec3 = [number, number, number];
type RGB = [number, number, number];

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const normalize = ([x, y, z]: Vec3): Vec3 => {
  const len = Math.hypot(x, y, z);
  return [x / len, y / len, z / len];
};

// ─── Geometry ─────────────────────────────────────────────────────────────────
// Two solids: a square bipyramid on top and, below it, a chevron whose top is a
// dish parallel to the bipyramid's underside, so the gap between them is even.
// Proportions are the official 256 × 417 glyph's, scaled to 2 units tall
// (y up, z towards the viewer).
const GLYPH_UNIT = 1 / 208.5;
const glyphY = (y: number) => (208.5 - y) * GLYPH_UNIT;
const RADIUS = 128 * GLYPH_UNIT;

const VERTICES: Vec3[] = [];
const vertex = (y: number, x = 0, z = 0) => VERTICES.push([x, y, z]) - 1;
const square = (y: number) => [
  vertex(y, RADIUS, 0),
  vertex(y, 0, RADIUS),
  vertex(y, -RADIUS, 0),
  vertex(y, 0, -RADIUS),
];

const TOP = vertex(glyphY(0));
const EQUATOR = square(glyphY(212.32));
const UPPER_TIP = vertex(glyphY(287.96));
const RIM = square(glyphY(236.59));
const DISH_TIP = vertex(glyphY(312.19));
const BOTTOM = vertex(glyphY(416.9));

// Outside surfaces use the COOL ramp, the dish seen through the gap the WARM one.
// Winds a triangle so its normal points along `outward` (needed for culling and
// shading).
function face(a: number, b: number, c: number, outward: (center: Vec3) => Vec3, ramp: number, shade = 1): Poly {
  const [A, B, C] = [VERTICES[a], VERTICES[b], VERTICES[c]];
  const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
  const v = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
  const n: Vec3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const out = outward([(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3, (A[2] + B[2] + C[2]) / 3]);
  if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0) [b, c] = [c, b];
  return { idx: [a, b, c], ramp, shade, outline: true, smooth: false };
}

const awayFrom = (y: number) => (p: Vec3): Vec3 => [p[0], p[1] - y, p[2]];
const up = (): Vec3 => [0, 1, 0];
// The dish sits under the bipyramid, so it gets less light.
const DISH_SHADE = 0.72;

// Drawn in this fixed order — dish, then bipyramid, then the chevron's outside —
// with back faces culled. That matches a ray-cast (depth-tested) render for every
// yaw and any pitch up to ±89°, so no per-frame depth sort is needed. Re-check
// if the proportions above change.
const FACES: Poly[] = [];
for (let i = 0; i < 4; i++) {
  FACES.push(face(DISH_TIP, RIM[i], RIM[(i + 1) % 4], up, WARM, DISH_SHADE));
}
for (let i = 0; i < 4; i++) {
  const j = (i + 1) % 4;
  FACES.push(face(TOP, EQUATOR[i], EQUATOR[j], awayFrom(VERTICES[EQUATOR[0]][1]), COOL));
  FACES.push(face(UPPER_TIP, EQUATOR[i], EQUATOR[j], awayFrom(VERTICES[EQUATOR[0]][1]), COOL));
}
const CHEVRON_CENTER_Y = (VERTICES[RIM[0]][1] + VERTICES[BOTTOM][1]) / 2;
for (let i = 0; i < 4; i++) {
  FACES.push(face(BOTTOM, RIM[i], RIM[(i + 1) % 4], awayFrom(CHEVRON_CENTER_Y), COOL));
}

const DIAMOND: Mesh = {
  x: Float32Array.from(VERTICES, (v) => v[0]),
  y: Float32Array.from(VERTICES, (v) => v[1]),
  z: Float32Array.from(VERTICES, (v) => v[2]),
  polys: FACES,
  sorted: false,
  doubleSided: false,
};

// The steam twister is built within the glyph's outline, softened so its ribbons
// bend rather than crease where they cross the glyph's edges: how far out it is
// at height y, in direction `angle` (about the vertical axis, 0 towards +z).
// Lengthwise it narrows from the middle of the gap to the top and bottom points,
// bulging a little; its cross-sections are squares (corners on the x and z axes)
// with rounded corners.
const TOP_Y = VERTICES[TOP][1];
const BOTTOM_Y = VERTICES[BOTTOM][1];
const WAIST_Y = (VERTICES[EQUATOR[0]][1] + VERTICES[RIM[0]][1]) / 2;
const OUTLINE_BULGE = 1.3; // 1 would be straight
const OUTLINE_ROUNDING = 1.5; // 1 would be square, 2 round
function outlineRadius(y: number, angle: number) {
  const t = y > WAIST_Y ? (y - WAIST_Y) / (TOP_Y - WAIST_Y) : (WAIST_Y - y) / (WAIST_Y - BOTTOM_Y);
  const half = 1 - clamp(t, 0, 1) ** OUTLINE_BULGE;
  const q = OUTLINE_ROUNDING;
  return (RADIUS * half) / (Math.abs(Math.sin(angle)) ** q + Math.abs(Math.cos(angle)) ** q) ** (1 / q);
}

const STEAM = createSteam(outlineRadius);

// ─── Look ─────────────────────────────────────────────────────────────────────
// A key light from the upper left (view space), as in the flat ETH logo where the
// left half is lighter. Brightness picks a step on the face's accent ramp.
const LIGHT = normalize([-0.45, 0.75, 0.5]);
const HALF = normalize([LIGHT[0], LIGHT[1], LIGHT[2] + 1]);
const AMBIENT = 0.2;
const DIFFUSE = 0.65;
const SPECULAR = 0.4;
const SHININESS = 18;
const RAMP_STEPS = 64;
// Facet edges are stroked a few ramp steps brighter than their fill.
const EDGE_LIFT = 8;

const CAMERA_DISTANCE = 6; // units; mild perspective
const SCALE = 0.4; // px per unit, as a share of the canvas height
const MAX_SCALE_BY_WIDTH = 0.49; // same, by width: keeps the floor glow inside narrow canvases
const CENTER_Y = 0.46; // share of the canvas height, leaving room for the floor glow
const FLOOR_GAP = 0.1; // units below the glyph
const FLOOR_RADIUS = 0.8; // units
const MAX_DPR = 2;

// ─── Motion ───────────────────────────────────────────────────────────────────
const AUTO_SPIN = 24 * DEG; // rad/s: one turn every 15 s
const SPIN_SETTLE = 1.1; // s for a flick to ease back into the idle spin
const MAX_FLICK = 720 * DEG; // rad/s
const MAX_SPIN = 1440 * DEG; // rad/s, after stacking flicks
// A flick in the direction it's already spinning adds to the spin, if it's a real
// flick and the glyph was only briefly held.
const STACK_MIN_FLICK = 180 * DEG; // rad/s
const STACK_WINDOW_MS = 500;
const REST_PITCH = 20 * DEG; // looking down into the gap, which shows the glyph's chevron
const PITCH_SETTLE = 0.45; // s
const MAX_PITCH = 55 * DEG; // drag + hover + tilt combined
const DRAG_PITCH_LIMIT = 40 * DEG;
const DRAG_SPIN_PER_PX = 0.6 * DEG; // about what keeps the front face under the cursor
const DRAG_PITCH_PER_PX = 0.35 * DEG;
const TOUCH_SLOP = 6; // px sideways before a touch drag takes over from scrolling
const FLICK_WINDOW_MS = 100;
const HOVER_YAW = 14 * DEG;
const HOVER_PITCH = 10 * DEG;
const HOVER_SETTLE = 0.25; // s
const TILT_GAIN = 1.2; // view rotation per unit of device rotation
const TILT_LIMIT = 28 * DEG;
const TILT_RECENTER = 1.5; // s for the view to drift back to neutral once the device is still
const TILT_DEADZONE = 1.5; // deg/s of gyro noise to ignore
const BOB_PERIOD = 6; // s
const BOB_HEIGHT = 0.035; // units
const MAX_DT = 0.05; // s; avoids a jump after a dropped frame

// ─── Easter egg: steam ────────────────────────────────────────────────────────
// Spinning faster than CHARGE_SPIN charges it up (two quick flicks will do); the
// charge shows as the facet edges glowing warm and thicker, a brighter floor
// glow and, near the end, a tremble. Full charge twists the diamond into the logo's
// steam; after a while it slowly twists back.
const CHARGE_SPIN = 480 * DEG; // rad/s
const CHARGE_TIME = 0.6; // s above CHARGE_SPIN to fill
const CHARGE_DRAIN = 3; // s to empty
const HEAT_LEVELS = 12; // pre-built edge ramps between cool and warm
const HEAT_EDGE_WIDTH = 2.5; // px at full charge
const TREMBLE_FROM = 0.6; // charge
const TREMBLE = 0.012; // units
const TO_STEAM = 0.7; // s
const TO_DIAMOND = 2.4; // s: the same animation, reversed and slower
const STEAM_HOLD = 8; // s as steam, not counting while it's held
// The morph's halfway point, where the diamond swaps for the steam, is hidden in a
// twist about the vertical axis (more towards the top), a pull into a taller,
// narrower flame and a flash.
const TWIST = 300 * DEG; // at the top
const SHRINK = 0.15;
const STRETCH = 0.2;
const PINCH = 0.4; // at the top
const FLASH_WIDTH = 0.18; // share of the morph
const FLASH_ALPHA = 0.55;
const FLASH_RADIUS = 0.9; // units

const FALLBACK_COLORS: Record<string, RGB> = {
  "--accent-turquoise": [29, 247, 239],
  "--accent-petrol": [16, 128, 140],
  "--accent-yellow": [255, 223, 39],
  "--accent-red": [254, 84, 104],
};

const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const BLACK: RGB = [0, 0, 0];
const WHITE: RGB = [255, 255, 255];

function buildRamp(stops: Array<[number, RGB]>): RGB[] {
  const ramp: RGB[] = [];
  for (let i = 0; i < RAMP_STEPS; i++) {
    const t = i / (RAMP_STEPS - 1);
    let k = 1;
    while (k < stops.length - 1 && t > stops[k][0]) k++;
    const [t0, c0] = stops[k - 1];
    const [t1, c1] = stops[k];
    ramp.push(mix(c0, c1, clamp((t - t0) / (t1 - t0), 0, 1)));
  }
  return ramp;
}

// Pre-built colour strings, so drawing a frame allocates nothing.
const css = (ramp: RGB[]) => ramp.map(([r, g, b]) => `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`);

// coolEdges[level] is the COOL ramp heated towards the WARM one by the easter
// egg's charge, for facet edges; coolEdges[0] is the plain COOL ramp.
type Palette = { cool: string[]; coolEdges: string[][]; warm: string[]; floor: CanvasGradient; floorAlpha: number };

// Reads the theme's accent tokens (app/globals.css) so the glyph follows
// light/dark mode.
function readPalette(ctx: CanvasRenderingContext2D): Palette {
  const style = getComputedStyle(document.documentElement);
  const token = (name: string): RGB => {
    const parts = style.getPropertyValue(name).trim().split(/\s+/).map(Number);
    return parts.length === 3 && parts.every(Number.isFinite) ? (parts as RGB) : FALLBACK_COLORS[name];
  };
  const turquoise = token("--accent-turquoise");
  const petrol = token("--accent-petrol");
  const yellow = token("--accent-yellow");
  const red = token("--accent-red");
  const isDark = document.documentElement.classList.contains("dark");

  const floor = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  floor.addColorStop(0, `rgba(${turquoise.join(", ")}, 1)`);
  floor.addColorStop(1, `rgba(${turquoise.join(", ")}, 0)`);

  const cool = buildRamp([
    [0, mix(petrol, BLACK, 0.5)],
    [0.45, petrol],
    [0.82, turquoise],
    [1, mix(turquoise, WHITE, 0.6)],
  ]);
  const warm = buildRamp([
    [0, mix(red, BLACK, 0.35)],
    [0.35, red],
    [0.7, yellow],
    [1, mix(yellow, WHITE, 0.6)],
  ]);
  const coolEdges: string[][] = [];
  for (let level = 0; level < HEAT_LEVELS; level++) {
    const t = level / (HEAT_LEVELS - 1);
    coolEdges.push(css(cool.map((c, i) => mix(c, warm[i], t))));
  }

  return {
    cool: css(cool),
    coolEdges,
    warm: css(warm),
    floor,
    floorAlpha: isDark ? 0.3 : 0.4,
  };
}

// Angle the screen is turned counter-clockwise from the device's natural
// orientation (0, 90, 180 or 270 / -90).
const screenAngle = () => {
  if (typeof screen !== "undefined" && screen.orientation) return screen.orientation.angle;
  return typeof window.orientation === "number" ? window.orientation : 0;
};

const deadzone = (rate: number | null) => (rate === null || Math.abs(rate) < TILT_DEADZONE ? 0 : rate);

// Per mesh, per frame: each vertex in view space and on screen, its smoothed
// normal and the light it gets on either side, and each poly's normal, shade step
// (-1 when it's culled), which side faces the camera, and depth.
type View = {
  vx: Float32Array;
  vy: Float32Array;
  vz: Float32Array;
  sx: Float32Array;
  sy: Float32Array;
  vnx: Float32Array;
  vny: Float32Array;
  vnz: Float32Array;
  light: Float32Array;
  lightBehind: Float32Array;
  pnx: Float32Array;
  pny: Float32Array;
  pnz: Float32Array;
  step: Int16Array;
  /** 1 where the camera sees a double-sided poly's back. */
  behind: Uint8Array;
  depth: Float32Array;
  /** Back-to-front draw order of a sorted mesh. Kept between frames, so
   * re-sorting it (insertion sort) is close to linear. */
  order: Int16Array;
};

function createView(mesh: Mesh): View {
  const vertices = mesh.y.length;
  const polys = mesh.polys.length;
  return {
    vx: new Float32Array(vertices),
    vy: new Float32Array(vertices),
    vz: new Float32Array(vertices),
    sx: new Float32Array(vertices),
    sy: new Float32Array(vertices),
    vnx: new Float32Array(vertices),
    vny: new Float32Array(vertices),
    vnz: new Float32Array(vertices),
    light: new Float32Array(vertices),
    lightBehind: new Float32Array(vertices),
    pnx: new Float32Array(polys),
    pny: new Float32Array(polys),
    pnz: new Float32Array(polys),
    step: new Int16Array(polys),
    behind: new Uint8Array(polys),
    depth: new Float32Array(polys),
    order: Int16Array.from(mesh.polys, (_, i) => i),
  };
}

export type EtherDiamondScene = {
  /** Start listening to the gyroscope again, e.g. once iOS has granted motion access. */
  enableTilt(): void;
  destroy(): void;
};

export function createEtherDiamondScene(
  wrapper: HTMLElement,
  canvas: HTMLCanvasElement,
  {
    onTiltActive,
    onSteam,
    interactive = true,
  }: {
    onTiltActive?: () => void;
    onSteam?: () => void;
    /** False: display only. It still spins on its own, but ignores pointer and gyro and never turns to steam. */
    interactive?: boolean;
  } = {},
): EtherDiamondScene | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  // Gyro only on touch devices; desktops never fire motion events anyway.
  const touchQuery = window.matchMedia("(any-pointer: coarse)");
  let reduced = reducedMotionQuery.matches;

  let palette = readPalette(ctx);
  let width = 0;
  let height = 0;
  let dpr = 1;
  let shown = false;

  let onScreen = false;
  let pageVisible = document.visibilityState === "visible";
  let raf = 0;
  let lastFrame = 0;
  let time = 0;

  let yaw = 0;
  let pitch = REST_PITCH;
  let spin = reduced ? 0 : AUTO_SPIN;
  let spinDirection = 1;
  let grabSpin = 0; // spin when the glyph was grabbed, for stacking flicks
  let grabTime = 0;

  let charge = 0; // 0–1, see CHARGE_SPIN
  let morph = 0; // 0 diamond … 1 steam
  let morphTarget = 0;
  let steamTime = 0;

  let hovering = false;
  let hoverX = 0;
  let hoverY = 0;
  let hoverYaw = 0;
  let hoverPitch = 0;

  let tiltListening = false;
  let tiltActive = false;
  let tiltRateX = 0; // rad/s about the screen's horizontal axis
  let tiltRateY = 0; // rad/s about the screen's vertical axis
  let tiltYaw = 0;
  let tiltPitch = 0;

  let pointerId: number | null = null; // the pointer pressed on the glyph
  let dragging = false; // the glyph follows that pointer
  let fromMouse = false;
  let startX = 0;
  let lastX = 0;
  let lastY = 0;
  // Recent (time, yaw) samples for the release velocity.
  const SAMPLES = 8;
  const sampleTime = new Float64Array(SAMPLES);
  const sampleYaw = new Float64Array(SAMPLES);
  let sampleHead = 0;
  let sampleCount = 0;

  const diamondView = createView(DIAMOND);
  const steamView = createView(STEAM);

  const pushSample = (t: number) => {
    sampleTime[sampleHead] = t;
    sampleYaw[sampleHead] = yaw;
    sampleHead = (sampleHead + 1) % SAMPLES;
    sampleCount = Math.min(sampleCount + 1, SAMPLES);
  };

  const releaseVelocity = (t: number) => {
    let oldest = -1;
    for (let i = 1; i <= sampleCount; i++) {
      const j = (sampleHead - i + SAMPLES) % SAMPLES;
      if (t - sampleTime[j] > FLICK_WINDOW_MS) break;
      oldest = j;
    }
    if (oldest < 0) return 0;
    const span = (t - sampleTime[oldest]) / 1000;
    return span > 0.008 ? (yaw - sampleYaw[oldest]) / span : 0;
  };

  const step = (dt: number) => {
    time += dt;

    if (!dragging) {
      if (!reduced) {
        spin += (AUTO_SPIN * spinDirection - spin) * (1 - Math.exp(-dt / SPIN_SETTLE));
        pitch += (REST_PITCH - pitch) * (1 - Math.exp(-dt / PITCH_SETTLE));
      }
      yaw = (yaw + spin * dt) % TAU;
    }

    if (!reduced) {
      // Held, it's as fast as the pointer has been turning it lately (0 once it stops).
      const speed = dragging ? releaseVelocity(lastFrame) : spin;
      const charging = interactive && morph === 0 && morphTarget === 0 && Math.abs(speed) > CHARGE_SPIN;
      charge = clamp(charge + (charging ? dt / CHARGE_TIME : -dt / CHARGE_DRAIN), 0, 1);
      if (charge === 1 && morphTarget === 0) {
        morphTarget = 1;
        steamTime = 0;
        onSteam?.();
      }
      if (morph < morphTarget) morph = Math.min(morphTarget, morph + dt / TO_STEAM);
      else if (morph > morphTarget) morph = Math.max(morphTarget, morph - dt / TO_DIAMOND);
      if (morph === 1 && !dragging) {
        steamTime += dt;
        if (steamTime > STEAM_HOLD) morphTarget = 0;
      }
    }

    let hoverTargetYaw = 0;
    let hoverTargetPitch = 0;
    if (hovering && !dragging && !reduced) {
      const rect = wrapper.getBoundingClientRect();
      hoverTargetYaw = clamp((hoverX - rect.left) / rect.width - 0.5, -0.5, 0.5) * 2 * HOVER_YAW;
      hoverTargetPitch = clamp((hoverY - rect.top) / rect.height - 0.5, -0.5, 0.5) * 2 * HOVER_PITCH;
    }
    const hoverEase = 1 - Math.exp(-dt / HOVER_SETTLE);
    hoverYaw += (hoverTargetYaw - hoverYaw) * hoverEase;
    hoverPitch += (hoverTargetPitch - hoverPitch) * hoverEase;

    // The gyro's rotation rate is integrated into a view offset that leaks back
    // to neutral, so the glyph follows the device's movement and then recentres:
    // no calibration, and it works however the device is being held.
    const leak = Math.exp(-dt / TILT_RECENTER);
    tiltYaw = clamp((tiltYaw + tiltRateY * TILT_GAIN * dt) * leak, -TILT_LIMIT, TILT_LIMIT);
    tiltPitch = clamp((tiltPitch + tiltRateX * TILT_GAIN * dt) * leak, -TILT_LIMIT, TILT_LIMIT);
  };

  // The current frame's pose, shared by the helpers below.
  let cosY = 1;
  let sinY = 0;
  let cosP = 1;
  let sinP = 0;
  let originX = 0;
  let originY = 0;
  let pixels = 0; // px per unit
  let lifted = 0; // the bob, in units

  // Places each vertex: the morph's warp, then yaw about the vertical axis, then pitch about the screen's
  // horizontal axis (positive tips the top towards the viewer), then perspective.
  const place = (mesh: Mesh, view: View, warp: number) => {
    const { vx, vy, vz, sx, sy } = view;
    for (let i = 0; i < mesh.y.length; i++) {
      let x = mesh.x[i];
      let y = mesh.y[i];
      let z = mesh.z[i];
      const h = (y + 1) / 2; // 0 at the bottom, 1 at the top
      if (warp) {
        const angle = warp * TWIST * h;
        const narrow = (1 - SHRINK * warp) * (1 - PINCH * warp * h);
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const xw = (x * cos + z * sin) * narrow;
        z = (-x * sin + z * cos) * narrow;
        x = xw;
        y *= (1 - SHRINK * warp) * (1 + STRETCH * warp);
      }
      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;
      const y2 = y * cosP - z1 * sinP;
      const z2 = y * sinP + z1 * cosP;
      const k = (CAMERA_DISTANCE / (CAMERA_DISTANCE - z2)) * pixels;
      vx[i] = x1;
      vy[i] = y2;
      vz[i] = z2;
      sx[i] = originX + x1 * k;
      sy[i] = originY - (y2 + lifted) * k;
    }
  };

  // Lights each poly facing the camera and culls the rest. Normals come from the
  // placed vertices (Newell's method), so they follow the warp.
  // Smooth triangles are lit at each vertex, by its normal averaged over its
  // neighbours, for drawSolid to blend across.
  const lightAt = (nx: number, ny: number, nz: number) => {
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len;
    ny /= len;
    nz /= len;
    const diffuse = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
    const specular = Math.max(0, nx * HALF[0] + ny * HALF[1] + nz * HALF[2]) ** SHININESS;
    return AMBIENT + DIFFUSE * diffuse + SPECULAR * specular;
  };

  const shade = (mesh: Mesh, view: View) => {
    const { polys } = mesh;
    const { vx, vy, vz, vnx, vny, vnz, light, lightBehind, pnx, pny, pnz, step, behind, depth } = view;
    vnx.fill(0);
    vny.fill(0);
    vnz.fill(0);
    for (let p = 0; p < polys.length; p++) {
      const { idx, smooth } = polys[p];
      let nx = 0;
      let ny = 0;
      let nz = 0;
      let mx = 0;
      let my = 0;
      let mz = 0;
      for (let k = 0; k < idx.length; k++) {
        const i = idx[k];
        const j = idx[k + 1 === idx.length ? 0 : k + 1];
        nx += (vy[i] - vy[j]) * (vz[i] + vz[j]);
        ny += (vz[i] - vz[j]) * (vx[i] + vx[j]);
        nz += (vx[i] - vx[j]) * (vy[i] + vy[j]);
        mx += vx[i];
        my += vy[i];
        mz += vz[i];
      }
      mx /= idx.length;
      my /= idx.length;
      mz /= idx.length;
      depth[p] = mz;
      pnx[p] = nx;
      pny[p] = ny;
      pnz[p] = nz;
      if (smooth) {
        for (let k = 0; k < idx.length; k++) {
          vnx[idx[k]] += nx;
          vny[idx[k]] += ny;
          vnz[idx[k]] += nz;
        }
      }
      // Faces turned away from the camera are culled, or lit from behind.
      const away = -nx * mx - ny * my + nz * (CAMERA_DISTANCE - mz) <= 0;
      behind[p] = away ? 1 : 0;
      step[p] = away && !mesh.doubleSided ? -1 : 0;
    }
    for (let i = 0; i < light.length; i++) {
      light[i] = lightAt(vnx[i], vny[i], vnz[i]);
      if (mesh.doubleSided) lightBehind[i] = lightAt(-vnx[i], -vny[i], -vnz[i]);
    }
    for (let p = 0; p < polys.length; p++) {
      if (step[p] < 0) continue;
      const { idx, smooth, shade: polyShade } = polys[p];
      const sign = behind[p] ? -1 : 1;
      const lights = behind[p] ? lightBehind : light;
      // A smooth triangle's step is only its average; see drawSolid.
      const lit = smooth
        ? (lights[idx[0]] + lights[idx[1]] + lights[idx[2]]) / 3
        : lightAt(sign * pnx[p], sign * pny[p], sign * pnz[p]);
      step[p] = Math.round(clamp(lit * polyShade, 0, 1) * (RAMP_STEPS - 1));
    }
  };

  const sortBackToFront = ({ order, depth }: View) => {
    for (let a = 1; a < order.length; a++) {
      const p = order[a];
      let b = a - 1;
      while (b >= 0 && depth[order[b]] > depth[p]) {
        order[b + 1] = order[b];
        b--;
      }
      order[b + 1] = p;
    }
  };

  const tracePoly = ({ sx, sy }: View, idx: number[]) => {
    ctx.beginPath();
    ctx.moveTo(sx[idx[0]], sy[idx[0]]);
    for (let k = 1; k < idx.length; k++) ctx.lineTo(sx[idx[k]], sy[idx[k]]);
    ctx.closePath();
  };

  const drawSolid = (mesh: Mesh, view: View, coolEdges: string[], edgeWidth: number) => {
    const { polys } = mesh;
    for (let n = 0; n < polys.length; n++) {
      const p = mesh.sorted ? view.order[n] : n;
      const shadeStep = view.step[p];
      if (shadeStep < 0) continue;
      const { idx, ramp: rampId, outline, smooth, shade: polyShade } = polys[p];
      const ramp = rampId === COOL ? palette.cool : palette.warm;
      const edges = rampId === COOL ? coolEdges : palette.warm;
      tracePoly(view, idx);
      const blend = smooth ? smoothFill(view, idx, view.behind[p] ? view.lightBehind : view.light, polyShade, ramp) : null;
      ctx.fillStyle = blend ?? ramp[shadeStep];
      ctx.fill();
      // Also hides the anti-aliasing seams between neighbouring faces.
      ctx.lineWidth = outline ? edgeWidth : 1;
      ctx.strokeStyle = outline ? edges[Math.min(RAMP_STEPS - 1, shadeStep + EDGE_LIFT)] : (blend ?? ramp[shadeStep]);
      ctx.stroke();
    }
  };

  // Gouraud shading for a smooth triangle: its light varies linearly across the
  // screen between its vertices', which a linear gradient along that variation
  // draws exactly, and neighbours match along their shared edges. Null when it's
  // even enough for a flat fill. (These gradients are the one per-frame
  // allocation, and only while the steam shows.)
  const smoothFill = ({ sx, sy }: View, idx: number[], light: Float32Array, polyShade: number, ramp: string[]) => {
    const top = RAMP_STEPS - 1;
    const [a, b, c] = idx;
    const fa = clamp(light[a] * polyShade, 0, 1) * top;
    const fb = clamp(light[b] * polyShade, 0, 1) * top;
    const fc = clamp(light[c] * polyShade, 0, 1) * top;
    const low = Math.min(fa, fb, fc);
    const high = Math.max(fa, fb, fc);
    if (high - low < 1) return null;
    const d1x = sx[b] - sx[a];
    const d1y = sy[b] - sy[a];
    const d2x = sx[c] - sx[a];
    const d2y = sy[c] - sy[a];
    const det = d1x * d2y - d2x * d1y;
    if (Math.abs(det) < 1e-3) return null;
    // The light's screen-space gradient, and the points along it where it's
    // lowest and highest.
    const gx = ((fb - fa) * d2y - (fc - fa) * d1y) / det;
    const gy = (d1x * (fc - fa) - d2x * (fb - fa)) / det;
    const g2 = gx * gx + gy * gy;
    const fill = ctx.createLinearGradient(
      sx[a] + (gx * (low - fa)) / g2,
      sy[a] + (gy * (low - fa)) / g2,
      sx[a] + (gx * (high - fa)) / g2,
      sy[a] + (gy * (high - fa)) / g2,
    );
    // A middle stop follows the ramp's bend.
    fill.addColorStop(0, ramp[Math.round(low)]);
    fill.addColorStop(0.5, ramp[Math.round((low + high) / 2)]);
    fill.addColorStop(1, ramp[Math.round(high)]);
    return fill;
  };

  const draw = () => {
    if (!width || !height) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const scale = Math.min(height * SCALE, width * MAX_SCALE_BY_WIDTH);
    const cx = width / 2;
    const cy = height * CENTER_Y;
    const lift = reduced ? 0 : Math.sin((time * TAU) / BOB_PERIOD);
    const bob = lift * BOB_HEIGHT;

    // Floor glow: shrinks and fades a little as the glyph floats up.
    const floorScale = scale * FLOOR_RADIUS * (1 - 0.08 * lift);
    ctx.save();
    ctx.translate(cx, cy + (1 + FLOOR_GAP) * scale);
    ctx.scale(floorScale, floorScale * 0.16);
    ctx.globalAlpha = Math.min(1, palette.floorAlpha * (1 - 0.15 * (lift + 1)) * (1 + charge));
    ctx.fillStyle = palette.floor;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, TAU);
    ctx.fill();
    ctx.restore();

    const viewYaw = yaw + hoverYaw + tiltYaw;
    const viewPitch = clamp(pitch + hoverPitch + tiltPitch, -MAX_PITCH, MAX_PITCH);
    cosY = Math.cos(viewYaw);
    sinY = Math.sin(viewYaw);
    cosP = Math.cos(viewPitch);
    sinP = Math.sin(viewPitch);

    // Easter egg: the morph eases in and out, swapping meshes at its halfway point,
    // where the warp (twist + flame pull) and the flash peak.
    const eased = morph * morph * (3 - 2 * morph);
    const warp = Math.sin(Math.PI * eased) ** 2;
    const heat = charge * charge * (3 - 2 * charge);
    const coolEdges = palette.coolEdges[Math.round(heat * (HEAT_LEVELS - 1))];
    const edgeWidth = 1 + heat * (HEAT_EDGE_WIDTH - 1);
    const tremble = morphTarget === 0 ? clamp((charge - TREMBLE_FROM) / (1 - TREMBLE_FROM), 0, 1) * TREMBLE : 0;
    originX = cx + Math.sin(time * 71) * tremble * scale;
    originY = cy + Math.cos(time * 59) * tremble * scale;
    pixels = scale;
    lifted = bob;

    ctx.lineJoin = "round";
    if (eased < 0.5) {
      place(DIAMOND, diamondView, warp);
      shade(DIAMOND, diamondView);
      drawSolid(DIAMOND, diamondView, coolEdges, edgeWidth);
    } else {
      place(STEAM, steamView, warp);
      shade(STEAM, steamView);
      sortBackToFront(steamView);
      drawSolid(STEAM, steamView, coolEdges, edgeWidth);
    }

    const flash = clamp(1 - Math.abs(eased - 0.5) / FLASH_WIDTH, 0, 1);
    if (flash > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = flash * FLASH_ALPHA;
      ctx.translate(originX, originY - bob * scale);
      ctx.scale(scale * FLASH_RADIUS, scale * FLASH_RADIUS);
      ctx.fillStyle = palette.floor;
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    if (!shown) {
      shown = true;
      canvas.style.opacity = "1";
    }
  };

  // With reduced motion nothing moves on its own, so frames only run while the
  // glyph is being dragged.
  const isAnimating = () => onScreen && pageVisible && (!reduced || dragging);

  const frame = (now: number) => {
    raf = 0;
    const dt = lastFrame ? Math.min((now - lastFrame) / 1000, MAX_DT) : 1 / 60;
    lastFrame = now;
    step(dt);
    draw();
    if (isAnimating()) raf = requestAnimationFrame(frame);
    else lastFrame = 0;
  };

  const wake = () => {
    if (!raf && onScreen && pageVisible) raf = requestAnimationFrame(frame);
  };

  const sleep = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    lastFrame = 0;
  };

  // ── Gyroscope ──
  const onMotion = (event: DeviceMotionEvent) => {
    const rate = event.rotationRate;
    if (!rate || (rate.beta === null && rate.gamma === null)) return;
    if (!tiltActive) {
      tiltActive = true;
      onTiltActive?.();
    }
    // rotationRate is in deg/s about the device's own axes (beta: x, gamma: y).
    // Rotate it into screen axes so landscape works too.
    const angle = screenAngle() * DEG;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const beta = deadzone(rate.beta);
    const gamma = deadzone(rate.gamma);
    // Tipping the top edge towards you shows more of the glyph's top; turning the
    // right edge away shows more of its left side, as if it sat behind the screen.
    tiltRateX = (cos * beta - sin * gamma) * DEG;
    tiltRateY = (sin * beta + cos * gamma) * DEG;
  };

  const updateTiltListener = () => {
    const listen = interactive && !reduced && touchQuery.matches && onScreen && pageVisible && typeof DeviceMotionEvent !== "undefined";
    if (listen === tiltListening) return;
    tiltListening = listen;
    if (listen) {
      window.addEventListener("devicemotion", onMotion);
    } else {
      window.removeEventListener("devicemotion", onMotion);
      tiltRateX = 0;
      tiltRateY = 0;
    }
  };

  // ── Pointer ──
  const startDrag = (timeStamp: number) => {
    dragging = true;
    // Fold the hover tilt into the pose so grabbing doesn't make it jump.
    yaw += hoverYaw;
    pitch = clamp(pitch + hoverPitch, -DRAG_PITCH_LIMIT, DRAG_PITCH_LIMIT);
    hoverYaw = 0;
    hoverPitch = 0;
    grabSpin = spin;
    grabTime = timeStamp;
    spin = 0;
    sampleCount = 0;
    pushSample(timeStamp);
    wrapper.style.cursor = "grabbing";
    wake();
  };

  const endDrag = (event: PointerEvent) => {
    if (event.pointerId !== pointerId) return;
    pointerId = null;
    if (wrapper.hasPointerCapture(event.pointerId)) wrapper.releasePointerCapture(event.pointerId);
    if (!dragging) return;
    dragging = false;
    wrapper.style.cursor = "";
    // Carry the flick's speed, then ease back into the idle spin in its direction.
    // A cancelled touch (the page took over to scroll) or reduced motion doesn't spin on.
    const velocity =
      reduced || event.type !== "pointerup" ? 0 : clamp(releaseVelocity(event.timeStamp), -MAX_FLICK, MAX_FLICK);
    const stacks =
      Math.abs(velocity) > STACK_MIN_FLICK &&
      Math.sign(velocity) === Math.sign(grabSpin) &&
      event.timeStamp - grabTime < STACK_WINDOW_MS;
    spin = clamp(velocity + (stacks ? grabSpin : 0), -MAX_SPIN, MAX_SPIN);
    if (Math.abs(spin) > AUTO_SPIN / 2) spinDirection = Math.sign(spin);
    wake();
  };

  const onPointerDown = (event: PointerEvent) => {
    if (pointerId !== null || (event.pointerType === "mouse" && event.button !== 0)) return;
    if (event.target instanceof Element && event.target.closest("button, a")) return;
    pointerId = event.pointerId;
    fromMouse = event.pointerType === "mouse";
    startX = lastX = event.clientX;
    lastY = event.clientY;
    if (fromMouse) {
      wrapper.setPointerCapture(event.pointerId);
      event.preventDefault();
      startDrag(event.timeStamp);
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerId === pointerId) {
      // Touch and pen wait for a sideways move: vertical swipes stay with the page
      // (touch-action: pan-y), which cancels the pointer.
      if (!dragging) {
        if (Math.abs(event.clientX - startX) < TOUCH_SLOP) return;
        startDrag(event.timeStamp);
      }
      yaw += (event.clientX - lastX) * DRAG_SPIN_PER_PX;
      if (fromMouse) {
        pitch = clamp(pitch + (event.clientY - lastY) * DRAG_PITCH_PER_PX, -DRAG_PITCH_LIMIT, DRAG_PITCH_LIMIT);
      }
      lastX = event.clientX;
      lastY = event.clientY;
      pushSample(event.timeStamp);
      wake();
    } else if (event.pointerType === "mouse") {
      hovering = true;
      hoverX = event.clientX;
      hoverY = event.clientY;
    }
  };

  const onPointerLeave = (event: PointerEvent) => {
    if (event.pointerType === "mouse") hovering = false;
  };

  // ── Lifecycle ──
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    draw(); // resizing clears the canvas, so repaint even while paused
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      onScreen = entries[entries.length - 1].isIntersecting;
      updateTiltListener();
      if (isAnimating()) wake();
      else if (!onScreen) sleep();
    },
    { rootMargin: "100px" },
  );
  intersectionObserver.observe(wrapper);

  const onVisibilityChange = () => {
    pageVisible = document.visibilityState === "visible";
    updateTiltListener();
    if (isAnimating()) wake();
    else sleep();
  };

  const onReducedMotionChange = () => {
    reduced = reducedMotionQuery.matches;
    if (reduced) {
      spin = 0;
      charge = 0;
      morph = 0;
      morphTarget = 0;
    }
    updateTiltListener();
    if (isAnimating()) wake();
    else draw();
  };

  // next-themes switches the theme with a class on <html>.
  const themeObserver = new MutationObserver(() => {
    palette = readPalette(ctx);
    draw();
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

  if (interactive) {
    wrapper.addEventListener("pointerdown", onPointerDown);
    wrapper.addEventListener("pointermove", onPointerMove);
    wrapper.addEventListener("pointerup", endDrag);
    wrapper.addEventListener("pointercancel", endDrag);
    wrapper.addEventListener("lostpointercapture", endDrag);
    wrapper.addEventListener("pointerleave", onPointerLeave);
  }
  document.addEventListener("visibilitychange", onVisibilityChange);
  reducedMotionQuery.addEventListener("change", onReducedMotionChange);

  return {
    enableTilt() {
      tiltListening = false;
      window.removeEventListener("devicemotion", onMotion);
      updateTiltListener();
    },
    destroy() {
      sleep();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      wrapper.removeEventListener("pointerdown", onPointerDown);
      wrapper.removeEventListener("pointermove", onPointerMove);
      wrapper.removeEventListener("pointerup", endDrag);
      wrapper.removeEventListener("pointercancel", endDrag);
      wrapper.removeEventListener("lostpointercapture", endDrag);
      wrapper.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedMotionQuery.removeEventListener("change", onReducedMotionChange);
      window.removeEventListener("devicemotion", onMotion);
    },
  };
}
