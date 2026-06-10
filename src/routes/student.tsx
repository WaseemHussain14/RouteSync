import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useBusStore } from "@/store/busStore";
import { BusMap } from "@/components/BusMap";
import {
  Search,
  Clock,
  MapPin,
  User,
  Gauge,
  ArrowLeft,
  Activity,
  LogOut,
} from "lucide-react";
import logo from "@/assets/routesync-logo.png";
import type { Bus } from "@/lib/mockData";
import { predictETA } from "@/lib/eta";
import { nextStop } from "@/lib/eta";
import { getTomTomTraffic } from "@/lib/tomtomTraffic.functions";
import { getSession, clearSession, type Session } from "@/lib/auth";

export const Route = createFileRoute("/student")({
  head: () => ({
    meta: [
      { title: "Student Dashboard — Live Bus Tracking" },
      { name: "description", content: "Track your campus bus live, view ETAs and route stops." },
    ],
  }),
  ssr: false,
  component: StudentView,
});

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function etaFor(
  bus: Bus,
  route: import("@/lib/mockData").Route | null,
  factor?: number,
): string {
  if (bus.status !== "active") return "—";
  const r = predictETA(bus, route, factor);
  return `${r.minutes} min`;
}

function StudentView() {
  const navigate = useNavigate();
  const [session, setSessionState] = useState<Session | null>(null);
  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== "student") {
      navigate({ to: "/login/student" });
      return;
    }
    setSessionState(s);
  }, [navigate]);

  const { buses, routes, initRealtime } = useBusStore();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(buses[0]?.busId ?? null);
  const [tick, setTick] = useState(0);
  const [trafficByBus, setTrafficByBus] = useState<Record<string, { factor: number; at: number; source: string }>>({});
  const fetchTraffic = useServerFn(getTomTomTraffic);

  function logout() {
    clearSession();
    navigate({ to: "/login/student" });
  }

  useEffect(() => initRealtime(), [initRealtime]);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 12000);
    return () => clearInterval(i);
  }, []);

  // Periodically refresh HERE traffic factor for every active bus's next-stop segment.
  useEffect(() => {
    let cancelled = false;
    async function refresh() {
      const tasks = buses
        .filter((b) => b.status === "active")
        .map(async (b) => {
          const route = routes.find((r) => r.routeId === b.routeId);
          if (!route) return null;
          const next = nextStop(b, route);
          if (!next) return null;
          try {
            const r = await fetchTraffic({
              data: {
                originLat: b.latitude,
                originLng: b.longitude,
                destLat: next.stop.lat,
                destLng: next.stop.lng,
              },
            });
            return { busId: b.busId, factor: r.factor, source: r.source };
          } catch {
            return null;
          }
        });
      const results = await Promise.all(tasks);
      if (cancelled) return;
      setTrafficByBus((prev) => {
        const next = { ...prev };
        const now = Date.now();
        for (const r of results) if (r) next[r.busId] = { factor: r.factor, at: now, source: r.source };
        return next;
      });
    }
    refresh();
    const i = setInterval(refresh, 12000);
    return () => {
      cancelled = true;
      clearInterval(i);
    };
  }, [buses, routes, fetchTraffic]);

  const filtered = useMemo(
    () =>
      buses.filter(
        (b) =>
          b.routeName.toLowerCase().includes(query.toLowerCase()) ||
          b.busNumber.toLowerCase().includes(query.toLowerCase()) ||
          b.driverName.toLowerCase().includes(query.toLowerCase()),
      ),
    [buses, query],
  );

  const selected = buses.find((b) => b.busId === selectedId) ?? null;
  const selectedRoute = routes.find((r) => r.routeId === selected?.routeId) ?? null;

  return (
    <div className="flex h-screen flex-col bg-navy-deep text-foreground md:flex-row">
      {/* Sidebar */}
      <aside className="flex max-h-[60vh] w-full shrink-0 flex-col border-b border-border bg-navy md:max-h-screen md:w-[380px] md:border-b-0 md:border-r">
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex items-center gap-2">
            <img src={logo} alt="RouteSync logo" className="h-9 w-9 rounded-lg object-contain" />
            <span className="font-semibold">{session?.name ?? "RouteSync"}</span>
            <button
              onClick={logout}
              className="ml-1 rounded-lg border border-border p-1.5 text-muted-foreground hover:text-gold"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search route, bus, driver…"
              className="w-full rounded-xl border border-border bg-card/60 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[color:var(--gold)]"
            />
          </div>
        </div>

        {/* List + detail share one scroll container so the detail panel never
            covers the bus list. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No buses match "{query}"
              </div>
            )}
            {filtered.map((bus) => {
              const active = selectedId === bus.busId;
              const busFactor = trafficByBus[bus.busId]?.factor;
              return (
                <button
                  key={bus.busId}
                  onClick={() => setSelectedId(bus.busId)}
                  className={`glass w-full rounded-xl p-4 text-left transition hover:-translate-y-0.5 hover:shadow-gold ${
                    active ? "ring-2 ring-[color:var(--gold)]" : ""
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold">{bus.routeName}</div>
                      <div className="text-xs text-muted-foreground">{bus.busNumber}</div>
                    </div>
                    <span
                      className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                        bus.status === "active"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          bus.status === "active" ? "animate-pulse bg-emerald-400" : "bg-muted-foreground"
                        }`}
                      />
                      {bus.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {bus.driverName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> ETA{" "}
                      {etaFor(bus, routes.find((r) => r.routeId === bus.routeId) ?? null, busFactor)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected detail */}
          {selected && (
            <div className="mt-4 rounded-2xl border border-border bg-card/60 p-4">
              {(() => {
                const live = trafficByBus[selected.busId];
                const eta = predictETA(selected, selectedRoute, live?.factor);
                const etaAge = live ? Math.max(0, Math.floor((Date.now() - live.at) / 1000)) : null;
                // tick keeps this re-rendering every 12s so the "updated"
                // labels stay fresh.
                void tick;
                return (
                  <>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <Stat icon={<Gauge className="h-4 w-4" />} label="Speed" value={`${selected.speed} km/h`} />
                      <Stat
                        icon={<Clock className="h-4 w-4" />}
                        label="ETA"
                        value={selected.status === "active" ? `${eta.minutes} min` : "—"}
                      />
                      <Stat
                        icon={<Activity className="h-4 w-4" />}
                        label="GPS"
                        value={timeAgo(selected.updatedAt)}
                      />
                    </div>
                    {selected.status === "active" && (
                      <div
                        className={`mt-3 flex items-center justify-between rounded-xl border px-3 py-2 text-xs ${
                          eta.traffic.level === "heavy"
                            ? "border-red-500/40 bg-red-500/10"
                            : eta.traffic.level === "moderate"
                              ? "border-amber-500/40 bg-amber-500/10"
                              : "border-emerald-500/40 bg-emerald-500/10"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 animate-pulse rounded-full ${
                              eta.traffic.level === "heavy"
                                ? "bg-red-400"
                                : eta.traffic.level === "moderate"
                                  ? "bg-amber-400"
                                  : "bg-emerald-400"
                            }`}
                          />
                          <span className="font-semibold uppercase tracking-wide">Live traffic</span>
                        </span>
                        <span className="font-mono">{eta.traffic.label}</span>
                      </div>
                    )}
                    {selected.status === "active" && (
                      <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
                        <span>
                          ETA source ·{" "}
                          <span className="font-semibold text-foreground">
                            {live?.source === "tomtom" ? "TomTom Traffic" : "Simulated"}
                          </span>
                        </span>
                        <span>
                          {etaAge !== null ? `Updated ${etaAge}s ago` : "Fetching…"}
                        </span>
                      </div>
                    )}
                    {selected.status === "active" && eta.stopName && (
                      <div className="mt-2 flex items-center justify-between rounded-xl border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/5 px-3 py-2 text-xs">
                        <span className="text-muted-foreground">
                          Next stop · <span className="font-semibold text-foreground">{eta.stopName}</span>
                        </span>
                        <span className="font-mono text-gold">
                          {eta.distanceKm} km · base {eta.baselineMinutes}m · ML
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}
              {selectedRoute && (
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-semibold uppercase tracking-wide text-gold">Stops</span>
                    <span className="text-muted-foreground">{selectedRoute.timings}</span>
                  </div>
                  <ol className="space-y-2">
                    {selectedRoute.stops.map((stop, i) => (
                      <li key={stop.name} className="flex items-center gap-3 text-sm">
                        <div className="flex flex-col items-center">
                          <div className="grid h-6 w-6 place-items-center rounded-full bg-[color:var(--gold)]/15 text-[10px] font-bold text-gold">
                            {i + 1}
                          </div>
                          {i < selectedRoute.stops.length - 1 && (
                            <div className="my-0.5 h-4 w-px bg-border" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div>{stop.name}</div>
                          <div className="text-xs text-muted-foreground">{stop.time}</div>
                        </div>
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Map */}
      <main className="relative flex-1">
        <BusMap
          buses={selected ? buses.filter((b) => b.routeId === selected.routeId) : buses}
          selectedBus={selected}
          selectedRoute={selectedRoute}
          onSelectBus={(b) => setSelectedId(b.busId)}
        />
      </main>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background/40 p-2">
      <div className="flex items-center justify-center gap-1 text-gold">{icon}</div>
      <div className="mt-1 text-xs font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
