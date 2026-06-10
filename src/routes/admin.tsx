import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useBusStore } from "@/store/busStore";
import { ArrowLeft, Activity, Brain, Gauge } from "lucide-react";
import logo from "@/assets/routesync-logo.png";
import { predictETA, modelWeights } from "@/lib/eta";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Monitoring — RouteSync" },
      { name: "description", content: "Live monitoring dashboard for all buses." },
    ],
  }),
  ssr: false,
  component: AdminView,
});

function AdminView() {
  const { buses, routes, initRealtime } = useBusStore();
  useEffect(() => initRealtime(), [initRealtime]);

  const active = buses.filter((b) => b.status === "active").length;
  const avgSpeed = active
    ? Math.round(
        buses.filter((b) => b.status === "active").reduce((s, b) => s + b.speed, 0) / active,
      )
    : 0;
  const weights = modelWeights();

  return (
    <div className="min-h-screen gradient-hero p-6 text-foreground md:p-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex items-center gap-2">
            <img src={logo} alt="RouteSync logo" className="h-9 w-9 rounded-lg object-contain" />
            <span className="font-semibold">Admin Console</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <KPI label="Total Buses" value={buses.length} />
          <KPI label="Active Now" value={active} accent />
          <KPI label="Inactive" value={buses.length - active} />
          <KPI label="Avg Speed" value={avgSpeed} suffix="km/h" />
        </div>

        {/* ML model card */}
        <div className="glass mt-6 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-[color:var(--gold)]/15">
                <Brain className="h-4 w-4 text-gold" />
              </div>
              <div>
                <div className="text-sm font-semibold">ETA Prediction Model</div>
                <div className="text-xs text-muted-foreground">
                  Linear regression · trained on 400 synthetic trips · features: distance, 1/speed, stops-ahead
                </div>
              </div>
            </div>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-xs md:grid-cols-4">
            {["bias", "w·dist", "w·1/spd", "w·stops"].map((label, i) => (
              <div key={label} className="rounded-lg bg-background/40 p-2">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
                <div className="text-gold">{weights[i].toFixed(3)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass mt-6 overflow-hidden rounded-2xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-background/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Bus</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Speed</th>
                <th className="px-4 py-3">ML ETA</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {buses.map((b) => {
                const route = routes.find((r) => r.routeId === b.routeId) ?? null;
                const eta = predictETA(b, route);
                return (
                  <tr key={b.busId} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{b.busNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">{b.routeName}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <DriverNameCell busId={b.busId} value={b.driverName} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                          b.status === "active"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            b.status === "active" ? "animate-pulse bg-emerald-400" : "bg-muted-foreground"
                          }`}
                        />
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{b.speed} km/h</td>
                    <td className="px-4 py-3 text-gold">
                      {b.status === "active" ? `${eta.minutes} min · ${eta.distanceKm} km` : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(b.updatedAt).toLocaleTimeString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, accent, suffix }: { label: string; value: number; accent?: boolean; suffix?: string }) {
  return (
    <div className={`glass rounded-2xl p-5 ${accent ? "shadow-gold" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <Activity className={`h-4 w-4 ${accent ? "text-gold" : "text-muted-foreground"}`} />
      </div>
      <div className={`mt-2 text-3xl font-bold ${accent ? "text-gold" : ""}`}>
        {value}
        {suffix && <span className="ml-1 text-sm font-normal text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function DriverNameCell({ busId, value }: { busId: string; value: string }) {
  const updateBus = useBusStore((s) => s.updateBus);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  const commit = () => {
    setEditing(false);
    const next = draft.trim();
    if (next && next !== value) updateBus(busId, { driverName: next });
    else setDraft(value);
  };

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setDraft(value); setEditing(false); }
        }}
        className="w-full rounded-md border border-border bg-background/60 px-2 py-1 text-sm text-foreground outline-none focus:border-gold"
      />
    );
  }
  return (
    <button
      onClick={() => setEditing(true)}
      className="w-full rounded-md px-2 py-1 text-left hover:bg-background/40 hover:text-foreground"
      title="Click to edit driver name"
    >
      {value}
    </button>
  );
}
