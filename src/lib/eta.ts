// ETA prediction utilities.
// Combines a deterministic haversine + speed estimate with a tiny linear
// regression "ML" model trained in-browser on synthetic historical trip data.
// The model learns: eta_minutes ≈ w0 + w1*distance_km + w2*(1/speed) + w3*stopsAhead

import type { Bus, Route, Stop } from "./mockData";

const R_EARTH_KM = 6371;

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R_EARTH_KM * Math.asin(Math.sqrt(h));
}

/** Find the next upcoming stop along the route given the bus position. */
export function nextStop(bus: Bus, route: Route): { stop: Stop; index: number; distanceKm: number } | null {
  if (!route.stops.length) return null;
  let bestIdx = 0;
  let bestDist = Infinity;
  route.stops.forEach((s, i) => {
    const d = haversineKm({ lat: bus.latitude, lng: bus.longitude }, { lat: s.lat, lng: s.lng });
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  });
  // Treat the closest stop as "current"; the next one is the upcoming target.
  const upcoming = Math.min(bestIdx + 1, route.stops.length - 1);
  const stop = route.stops[upcoming];
  const distanceKm = haversineKm(
    { lat: bus.latitude, lng: bus.longitude },
    { lat: stop.lat, lng: stop.lng },
  );
  return { stop, index: upcoming, distanceKm };
}

/* ─────────────────────────────────────────────────────────────────────
 * Tiny ML ETA model (closed-form linear regression, trained on synthetic
 * historical data once on module load). Features: [1, distKm, 1/speed, stopsAhead]
 * ──────────────────────────────────────────────────────────────────── */

type Vec = number[];
type Mat = number[][];

function matMul(A: Mat, B: Mat): Mat {
  const r = A.length, c = B[0].length, k = B.length;
  const out: Mat = Array.from({ length: r }, () => Array(c).fill(0));
  for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) {
    let s = 0;
    for (let n = 0; n < k; n++) s += A[i][n] * B[n][j];
    out[i][j] = s;
  }
  return out;
}
function transpose(A: Mat): Mat {
  return A[0].map((_, j) => A.map((row) => row[j]));
}
// Solve (X^T X) w = X^T y via Gauss-Jordan on a 4x4 system.
function solve(A: Mat, b: Vec): Vec {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < n; i++) {
    let piv = i;
    for (let k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[piv][i])) piv = k;
    [M[i], M[piv]] = [M[piv], M[i]];
    const div = M[i][i] || 1e-9;
    for (let j = i; j <= n; j++) M[i][j] /= div;
    for (let k = 0; k < n; k++) if (k !== i) {
      const f = M[k][i];
      for (let j = i; j <= n; j++) M[k][j] -= f * M[i][j];
    }
  }
  return M.map((row) => row[n]);
}

function trainModel(): Vec {
  // Synthetic historical trips: distance, speed, stopsAhead -> minutes.
  // Ground truth: t = (dist/speed)*60 + 1.4*stops + traffic noise.
  const X: Mat = [];
  const y: Vec = [];
  let seed = 42;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < 400; i++) {
    const dist = 0.2 + rand() * 8;          // km
    const speed = 8 + rand() * 35;          // km/h (urban)
    const stops = Math.floor(rand() * 5);
    const noise = (rand() - 0.5) * 1.2;
    const minutes = (dist / speed) * 60 + 1.4 * stops + 0.8 + noise;
    X.push([1, dist, 1 / speed, stops]);
    y.push(minutes);
  }
  const Xt = transpose(X);
  const XtX = matMul(Xt, X);
  const Xty = matMul(Xt, y.map((v) => [v])).map((r) => r[0]);
  return solve(XtX, Xty);
}

const WEIGHTS = trainModel();

export type TrafficLevel = "light" | "moderate" | "heavy";

export interface TrafficSignal {
  factor: number;       // multiplier applied to baseline ETA (1.0 = free flow)
  level: TrafficLevel;
  label: string;        // human readable, e.g. "Heavy · +38%"
}

/**
 * Real-time traffic estimate. In production this would call Google/Mapbox/HERE
 * traffic APIs keyed on the bus's current segment. Here we synthesize a
 * deterministic-yet-live factor from:
 *  - Chennai rush-hour profile (7-10am, 5-9pm spike)
 *  - A slow sinusoidal "incident" component that drifts every ~30s
 *  - A per-route bias so each bus sees different conditions
 * The factor refreshes on each call, so polling produces live changes.
 */
export function getTrafficFactor(routeId?: string, now: number = Date.now()): TrafficSignal {
  const d = new Date(now);
  const hourFrac = d.getHours() + d.getMinutes() / 60;
  // Rush hour bumps (gaussian around 8.5 and 18.5)
  const rush =
    0.55 * Math.exp(-((hourFrac - 8.5) ** 2) / 2.2) +
    0.65 * Math.exp(-((hourFrac - 18.5) ** 2) / 2.2);
  // Live drift every ~30s
  const drift = 0.12 * Math.sin(now / 30000);
  // Per-route bias so the three buses don't all look identical
  const seed = (routeId ?? "").split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const bias = 0.08 * Math.sin(seed + now / 90000);

  const factor = Math.max(0.85, Math.min(1.9, 1 + rush + drift + bias));
  const level: TrafficLevel = factor >= 1.35 ? "heavy" : factor >= 1.12 ? "moderate" : "light";
  const pct = Math.round((factor - 1) * 100);
  const label = `${level[0].toUpperCase()}${level.slice(1)} · ${pct >= 0 ? "+" : ""}${pct}%`;
  return { factor, level, label };
}

export interface ETAResult {
  minutes: number;
  baselineMinutes: number;
  distanceKm: number;
  speedKmh: number;
  source: "ml" | "fallback";
  stopName?: string;
  traffic: TrafficSignal;
}

/** Predict ETA to the next stop using the ML model + live traffic factor.
 *  Pass `liveFactor` to override the simulated traffic factor with one from
 *  a real provider (e.g. HERE Routing v8). */
export function predictETA(bus: Bus, route: Route | null, liveFactor?: number): ETAResult {
  const simulated = getTrafficFactor(route?.routeId);
  const traffic: TrafficSignal = liveFactor
    ? (() => {
        const f = Math.max(0.85, Math.min(2.5, liveFactor));
        const level: TrafficLevel = f >= 1.35 ? "heavy" : f >= 1.12 ? "moderate" : "light";
        const pct = Math.round((f - 1) * 100);
        return { factor: f, level, label: `${level[0].toUpperCase()}${level.slice(1)} · ${pct >= 0 ? "+" : ""}${pct}% · TomTom` };
      })()
    : simulated;
  if (!route || bus.status !== "active") {
    return {
      minutes: 0,
      baselineMinutes: 0,
      distanceKm: 0,
      speedKmh: bus.speed,
      source: "fallback",
      traffic,
    };
  }
  const next = nextStop(bus, route);
  if (!next)
    return {
      minutes: 0,
      baselineMinutes: 0,
      distanceKm: 0,
      speedKmh: bus.speed,
      source: "fallback",
      traffic,
    };
  const speed = Math.max(bus.speed, 5);
  const stopsAhead = Math.max(0, route.stops.length - next.index - 1);
  const x = [1, next.distanceKm, 1 / speed, stopsAhead];
  const baseline = WEIGHTS.reduce((s, w, i) => s + w * x[i], 0);
  const adjusted = baseline * traffic.factor;
  return {
    minutes: Math.max(1, Math.round(adjusted)),
    baselineMinutes: Math.max(1, Math.round(baseline)),
    distanceKm: Math.round(next.distanceKm * 10) / 10,
    speedKmh: bus.speed,
    source: "ml",
    stopName: next.stop.name,
    traffic,
  };
}

export function modelWeights() {
  return WEIGHTS;
}
