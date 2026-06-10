// TomTom Routing API traffic-adjusted travel-time lookup.
// Called from the student dashboard every ~12s to refresh the live traffic
// factor for each active bus's next-stop segment.

import { createServerFn } from "@tanstack/react-start";

export interface TomTomTrafficResult {
  factor: number;          // travelTime / noTrafficTravelTime (1.0 = free flow)
  baseSeconds: number;
  trafficSeconds: number;
  distanceMeters: number;
  source: "tomtom" | "fallback";
  error?: string;
}

interface Input {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
}

function validate(input: unknown): Input {
  const i = input as Input;
  if (
    !i ||
    typeof i.originLat !== "number" ||
    typeof i.originLng !== "number" ||
    typeof i.destLat !== "number" ||
    typeof i.destLng !== "number"
  ) {
    throw new Error("Invalid coordinates");
  }
  return i;
}

export const getTomTomTraffic = createServerFn({ method: "POST" })
  .inputValidator(validate)
  .handler(async ({ data }): Promise<TomTomTrafficResult> => {
    const apiKey = process.env.TOMTOM_API_KEY;
    if (!apiKey) {
      return {
        factor: 1,
        baseSeconds: 0,
        trafficSeconds: 0,
        distanceMeters: 0,
        source: "fallback",
        error: "TOMTOM_API_KEY not configured",
      };
    }

    const loc = `${data.originLat},${data.originLng}:${data.destLat},${data.destLng}`;
    // TomTom Routing v1: returns summary.travelTimeInSeconds (with live traffic)
    // and summary.noTrafficTravelTimeInSeconds (free-flow baseline).
    const url =
      `https://api.tomtom.com/routing/1/calculateRoute/${encodeURIComponent(loc)}/json` +
      `?traffic=true&travelMode=car&computeTravelTimeFor=all&key=${apiKey}`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text();
        return {
          factor: 1,
          baseSeconds: 0,
          trafficSeconds: 0,
          distanceMeters: 0,
          source: "fallback",
          error: `TomTom ${res.status}: ${text.slice(0, 120)}`,
        };
      }
      const json = (await res.json()) as {
        routes?: Array<{
          summary?: {
            lengthInMeters?: number;
            travelTimeInSeconds?: number;
            noTrafficTravelTimeInSeconds?: number;
          };
        }>;
      };
      const s = json.routes?.[0]?.summary ?? {};
      const trafficSeconds = s.travelTimeInSeconds ?? 0;
      const baseSeconds = s.noTrafficTravelTimeInSeconds ?? trafficSeconds ?? 1;
      const base = baseSeconds || trafficSeconds || 1;
      const factor = Math.max(0.85, Math.min(2.5, trafficSeconds / base));
      return {
        factor,
        baseSeconds,
        trafficSeconds,
        distanceMeters: s.lengthInMeters ?? 0,
        source: "tomtom",
      };
    } catch (err) {
      return {
        factor: 1,
        baseSeconds: 0,
        trafficSeconds: 0,
        distanceMeters: 0,
        source: "fallback",
        error: err instanceof Error ? err.message : "fetch failed",
      };
    }
  });
