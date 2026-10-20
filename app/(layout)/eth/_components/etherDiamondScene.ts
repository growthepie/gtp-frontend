// Canvas renderer for the hero's 3D ETH glyph. The glyph is a 16-triangle mesh,
// flat-shaded in growthepie's cool accent ramp (petrol → turquoise) with the warm
// one (red → yellow) glowing in the gap between its halves, like the logo's
// cool pie under a warm crust. It needs no 3D library or WebGL context.
// All animation state lives here rather than in React: one requestAnimationFrame
// loop that draws without allocating, paused while the hero is off screen or the
// tab is hidden. Input: drag to spin (with inertia), a hover tilt for mice, and the
// gyroscope on phones and tablets.

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

const COOL = 0; // outside surfaces
const WARM = 1; // the dish, seen through the gap

type Face = { a: number; b: number; c: number; nx: number; ny: number; nz: number; ramp: number; shade: number };

// Winds a triangle so its normal points along `outward` (needed for culling) and
// keeps the unit normal for shading.
function face(a: number, b: number, c: number, outward: (center: Vec3) => Vec3, ramp: number, shade = 1): Face {
  const [A, B, C] = [VERTICES[a], VERTICES[b], VERTICES[c]];
  const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
  const v = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
  let n: Vec3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const out = outward([(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3, (A[2] + B[2] + C[2]) / 3]);
  if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0) {
    [b, c] = [c, b];
    n = [-n[0], -n[1], -n[2]];
  }
  const [nx, ny, nz] = normalize(n);
  return { a, b, c, nx, ny, nz, ramp, shade };
}

const awayFrom = (y: number) => (p: Vec3): Vec3 => [p[0], p[1] - y, p[2]];
const up = (): Vec3 => [0, 1, 0];
// The dish sits under the bipyramid, so it gets less light.
const DISH_SHADE = 0.72;

// Drawn in this fixed order — dish, then bipyramid, then the chevron's outside —
// with back faces culled. That matches a ray-cast (depth-tested) render for every
// yaw and any pitch up to ±89°, so no per-frame depth sort is needed. Re-check
// if the proportions above change.
const FACES: Face[] = [];
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

// Pre-built colour strings, so drawing a frame allocates nothing.
function buildRamp(stops: Array<[number, RGB]>): string[] {
  const ramp: string[] = [];
  for (let i = 0; i < RAMP_STEPS; i++) {
    const t = i / (RAMP_STEPS - 1);
    let k = 1;
    while (k < stops.length - 1 && t > stops[k][0]) k++;
    const [t0, c0] = stops[k - 1];
    const [t1, c1] = stops[k];
    const [r, g, b] = mix(c0, c1, clamp((t - t0) / (t1 - t0), 0, 1));
    ramp.push(`rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`);
  }
  return ramp;
}

type Palette = { ramps: string[][]; floor: CanvasGradient; floorAlpha: number };

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

  return {
    ramps: [
      buildRamp([
        [0, mix(petrol, BLACK, 0.5)],
        [0.45, petrol],
        [0.82, turquoise],
        [1, mix(turquoise, WHITE, 0.6)],
      ]),
      buildRamp([
        [0, mix(red, BLACK, 0.35)],
        [0.35, red],
        [0.7, yellow],
        [1, mix(yellow, WHITE, 0.6)],
      ]),
    ],
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

export type EtherDiamondScene = {
  /** Start listening to the gyroscope again, e.g. once iOS has granted motion access. */
  enableTilt(): void;
  destroy(): void;
};

export function createEtherDiamondScene(
  wrapper: HTMLElement,
  canvas: HTMLCanvasElement,
  { onTiltActive }: { onTiltActive?: () => void } = {},
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

  const sx = new Float32Array(VERTICES.length);
  const sy = new Float32Array(VERTICES.length);

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
    ctx.globalAlpha = palette.floorAlpha * (1 - 0.15 * (lift + 1));
    ctx.fillStyle = palette.floor;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, TAU);
    ctx.fill();
    ctx.restore();

    const viewYaw = yaw + hoverYaw + tiltYaw;
    const viewPitch = clamp(pitch + hoverPitch + tiltPitch, -MAX_PITCH, MAX_PITCH);
    const cosY = Math.cos(viewYaw);
    const sinY = Math.sin(viewYaw);
    const cosP = Math.cos(viewPitch);
    const sinP = Math.sin(viewPitch);

    // Yaw about the vertical axis, then pitch about the screen's horizontal axis
    // (positive tips the top towards the viewer), then perspective.
    for (let i = 0; i < VERTICES.length; i++) {
      const v = VERTICES[i];
      const x = v[0];
      const y = v[1];
      const z = v[2];
      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;
      const y2 = y * cosP - z1 * sinP;
      const z2 = y * sinP + z1 * cosP;
      const k = (CAMERA_DISTANCE / (CAMERA_DISTANCE - z2)) * scale;
      sx[i] = cx + x1 * k;
      sy[i] = cy - (y2 + bob) * k;
    }

    ctx.lineWidth = 1;
    ctx.lineJoin = "round";
    for (const f of FACES) {
      // Screen y points down, so a face turned towards the viewer winds clockwise.
      const area = (sx[f.b] - sx[f.a]) * (sy[f.c] - sy[f.a]) - (sx[f.c] - sx[f.a]) * (sy[f.b] - sy[f.a]);
      if (area >= 0) continue;

      const nx = f.nx * cosY + f.nz * sinY;
      const nz1 = -f.nx * sinY + f.nz * cosY;
      const ny = f.ny * cosP - nz1 * sinP;
      const nz = f.ny * sinP + nz1 * cosP;
      const diffuse = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
      const specular = Math.max(0, nx * HALF[0] + ny * HALF[1] + nz * HALF[2]) ** SHININESS;
      const brightness = clamp((AMBIENT + DIFFUSE * diffuse + SPECULAR * specular) * f.shade, 0, 1);
      const ramp = palette.ramps[f.ramp];
      const shadeStep = Math.round(brightness * (RAMP_STEPS - 1));

      ctx.beginPath();
      ctx.moveTo(sx[f.a], sy[f.a]);
      ctx.lineTo(sx[f.b], sy[f.b]);
      ctx.lineTo(sx[f.c], sy[f.c]);
      ctx.closePath();
      ctx.fillStyle = ramp[shadeStep];
      ctx.fill();
      // Also hides the anti-aliasing seams between neighbouring faces.
      ctx.strokeStyle = ramp[Math.min(RAMP_STEPS - 1, shadeStep + EDGE_LIFT)];
      ctx.stroke();
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
    const listen = !reduced && touchQuery.matches && onScreen && pageVisible && typeof DeviceMotionEvent !== "undefined";
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
    const velocity = reduced || event.type !== "pointerup" ? 0 : releaseVelocity(event.timeStamp);
    spin = clamp(velocity, -MAX_FLICK, MAX_FLICK);
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
    if (reduced) spin = 0;
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

  wrapper.addEventListener("pointerdown", onPointerDown);
  wrapper.addEventListener("pointermove", onPointerMove);
  wrapper.addEventListener("pointerup", endDrag);
  wrapper.addEventListener("pointercancel", endDrag);
  wrapper.addEventListener("lostpointercapture", endDrag);
  wrapper.addEventListener("pointerleave", onPointerLeave);
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
