// TomTom Routing API - fetch road-following geometry for a sequence of stops.
// Used by the map to draw the route along actual roads instead of straight
// lines that cut through buildings.

import { createServerFn } from "@tanstack/react-start";

export interface RouteGeometry {
  points: Array<[number, number]>; // [lat, lng]
  source: "tomtom" | "fallback";
  error?: string;
}

interface Input {
  stops: Array<{ lat: number; lng: number }>;
}

function validate(input: unknown): Input {
  const i = input as Input;
  if (!i || !Array.isArray(i.stops) || i.stops.length < 2) {
    throw new Error("Need at least 2 stops");
  }
  for (const s of i.stops) {
    if (typeof s.lat !== "number" || typeof s.lng !== "number") {
      throw new Error("Invalid stop coordinates");
    }
  }
  return i;
}

export const getTomTomRouteGeometry = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }): Promise<RouteGeometry> => {
    const apiKey = process.env.TOMTOM_API_KEY;
    const fallback: RouteGeometry = {
      points: data.stops.map((s) => [s.lat, s.lng] as [number, number]),
      source: "fallback",
    };
    if (!apiKey) return { ...fallback, error: "TOMTOM_API_KEY not configured" };

    // TomTom allows up to 150 waypoints. Build "lat,lng:lat,lng:..." path.
    const loc = data.stops.map((s) => `${s.lat},${s.lng}`).join(":");
    const url =
      `https://api.tomtom.com/routing/1/calculateRoute/${encodeURIComponent(loc)}/json` +
      `?travelMode=bus&routeType=fastest&traffic=false&key=${apiKey}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text();
        return { ...fallback, error: `TomTom ${res.status}: ${text.slice(0, 120)}` };
      }
      const json = (await res.json()) as {
        routes?: Array<{
          legs?: Array<{ points?: Array<{ latitude: number; longitude: number }> }>;
        }>;
      };
      const legs = json.routes?.[0]?.legs ?? [];
      const points: Array<[number, number]> = [];
      for (const leg of legs) {
        for (const p of leg.points ?? []) {
          points.push([p.latitude, p.longitude]);
        }
      }
      if (points.length < 2) return fallback;
      return { points, source: "tomtom" };
    } catch (err) {
      return { ...fallback, error: err instanceof Error ? err.message : "fetch failed" };
    }
  });
