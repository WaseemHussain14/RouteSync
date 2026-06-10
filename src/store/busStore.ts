// Global bus state synced via Lovable Cloud (Supabase).
// Driver writes GPS to `bus_locations`; all clients receive realtime updates.
// Static catalog (routes, driver, busNumber) stays in mockData.

import { create } from "zustand";
import { BUSES, ROUTES, type Bus, type Route } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";

interface BusState {
  buses: Bus[];
  routes: Route[];
  updateBus: (busId: string, patch: Partial<Bus>) => void;
  setBuses: (buses: Bus[]) => void;
  initRealtime: () => () => void;
}

function mergeLocation(buses: Bus[], row: {
  bus_id: string;
  latitude: number;
  longitude: number;
  speed: number;
  status: string;
  updated_at: string;
}): Bus[] {
  return buses.map((b) =>
    b.busId === row.bus_id
      ? {
          ...b,
          latitude: row.latitude,
          longitude: row.longitude,
          speed: row.speed,
          status: row.status as Bus["status"],
          updatedAt: new Date(row.updated_at).getTime(),
        }
      : b,
  );
}

export const useBusStore = create<BusState>((set, get) => ({
  buses: BUSES,
  routes: ROUTES,

  setBuses: (buses) => set({ buses }),

  updateBus: (busId, patch) => {
    // Optimistic local update
    const buses = get().buses.map((b) =>
      b.busId === busId ? { ...b, ...patch, updatedAt: Date.now() } : b,
    );
    set({ buses });

    // Push to cloud so every other device sees it via realtime.
    const current = buses.find((b) => b.busId === busId);
    if (!current) return;
    supabase
      .from("bus_locations")
      .upsert(
        {
          bus_id: busId,
          latitude: current.latitude,
          longitude: current.longitude,
          speed: current.speed ?? 0,
          status: current.status,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "bus_id" },
      )
      .then(({ error }) => {
        if (error) console.error("[busStore] upsert failed", error);
        else console.log("[busStore] pushed", busId, current.latitude, current.longitude);
      });
  },

  initRealtime: () => {
    if (typeof window === "undefined") return () => {};

    // Initial fetch — hydrate any persisted locations
    void supabase
      .from("bus_locations")
      .select("*")
      .then(({ data }) => {
        if (!data) return;
        let buses = get().buses;
        for (const row of data) buses = mergeLocation(buses, row as never);
        set({ buses });
      });

    // Subscribe to live changes
    const channel = supabase
      .channel("bus_locations_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bus_locations" },
        (payload) => {
          const row = payload.new as never as {
            bus_id: string;
            latitude: number;
            longitude: number;
            speed: number;
            status: string;
            updated_at: string;
          };
          if (!row?.bus_id) return;
          set({ buses: mergeLocation(get().buses, row) });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  },
}));
