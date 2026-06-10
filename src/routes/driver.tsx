import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useBusStore } from "@/store/busStore";
import { ArrowLeft, Play, Square, MapPin, AlertTriangle, Wifi, LogOut } from "lucide-react";
import logo from "@/assets/routesync-logo.png";
import { getSession, clearSession, type Session } from "@/lib/auth";

export const Route = createFileRoute("/driver")({
  head: () => ({
    meta: [
      { title: "Driver Panel — RouteSync" },
      { name: "description", content: "Driver interface to broadcast live bus location." },
    ],
  }),
  ssr: false,
  component: DriverView,
});

function DriverView() {
  const navigate = useNavigate();
  const [session, setSessionState] = useState<Session | null>(null);
  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== "driver") {
      navigate({ to: "/login/driver" });
      return;
    }
    setSessionState(s);
  }, [navigate]);

  const { buses, updateBus, initRealtime } = useBusStore();
  const [selectedBusId, setSelectedBusId] = useState(buses[0]?.busId ?? "");
  const [tripActive, setTripActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSent, setLastSent] = useState<{ lat: number; lng: number; t: number } | null>(null);
  const watchRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCoordsRef = useRef<{ lat: number; lng: number; speed: number } | null>(null);

  useEffect(() => initRealtime(), [initRealtime]);

  const selectedBus = buses.find((b) => b.busId === selectedBusId);

  function startTrip() {
    setError(null);
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by this browser.");
      return;
    }
    if (!selectedBus) return;

    // Continuous position watcher for accuracy + speed
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        lastCoordsRef.current = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 25,
        };
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );

    // Push to "Firebase" every 10 seconds
    const push = () => {
      const c = lastCoordsRef.current;
      if (!c) return;
      updateBus(selectedBus.busId, {
        latitude: c.lat,
        longitude: c.lng,
        speed: c.speed,
        status: "active",
      });
      setLastSent({ lat: c.lat, lng: c.lng, t: Date.now() });
    };
    push();
    intervalRef.current = setInterval(push, 10000);

    updateBus(selectedBus.busId, { status: "active" });
    setTripActive(true);
  }

  function stopTrip() {
    if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    watchRef.current = null;
    intervalRef.current = null;
    if (selectedBus) updateBus(selectedBus.busId, { status: "inactive", speed: 0 });
    setTripActive(false);
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function logout() {
    if (tripActive) stopTrip();
    clearSession();
    navigate({ to: "/login/driver" });
  }

  if (!session) return null;
  if (!selectedBus) {
    return <div className="p-8 text-center text-muted-foreground">No buses available.</div>;
  }

  return (
    <div className="min-h-screen gradient-hero p-4 text-foreground md:p-8">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-xs sm:block">
              <div className="font-semibold">{session.name}</div>
              <div className="text-muted-foreground">{session.id}</div>
            </div>
            <img src={logo} alt="RouteSync logo" className="h-9 w-9 rounded-lg object-contain" />
            <button
              onClick={logout}
              className="rounded-lg border border-border p-2 text-muted-foreground hover:text-gold"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Bus selector */}
        <div className="glass rounded-2xl p-5">
          <label className="text-xs uppercase tracking-wide text-muted-foreground">
            Assigned Bus
          </label>
          <select
            value={selectedBusId}
            onChange={(e) => setSelectedBusId(e.target.value)}
            disabled={tripActive}
            className="mt-2 w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-[color:var(--gold)] disabled:opacity-60"
          >
            {buses.map((b) => (
              <option key={b.busId} value={b.busId}>
                {b.busNumber} — {b.routeName}
              </option>
            ))}
          </select>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <Field label="Driver" value={selectedBus.driverName} />
            <Field label="Bus #" value={selectedBus.busNumber} />
            <Field label="Route" value={selectedBus.routeName} className="col-span-2" />
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl bg-background/40 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  tripActive ? "animate-pulse bg-emerald-400" : "bg-muted-foreground"
                }`}
              />
              <span className="font-medium">
                {tripActive ? "Trip in progress" : "Trip not started"}
              </span>
            </div>
            <Wifi className={`h-4 w-4 ${tripActive ? "text-emerald-400" : "text-muted-foreground"}`} />
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={startTrip}
            disabled={tripActive}
            className="flex items-center justify-center gap-2 rounded-2xl gradient-gold px-4 py-5 text-base font-bold text-[color:var(--navy-deep)] shadow-gold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="h-5 w-5 fill-current" /> Start Trip
          </button>
          <button
            onClick={stopTrip}
            disabled={!tripActive}
            className="flex items-center justify-center gap-2 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-5 text-base font-bold text-destructive transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Square className="h-5 w-5 fill-current" /> Stop Trip
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {lastSent && (
          <div className="glass mt-5 rounded-2xl p-4 text-sm">
            <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-gold">
              <MapPin className="h-3.5 w-3.5" /> Last broadcast
            </div>
            <div className="font-mono text-xs text-muted-foreground">
              {lastSent.lat.toFixed(5)}, {lastSent.lng.toFixed(5)}
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(lastSent.t).toLocaleTimeString()}
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Location is sent every 10 seconds while a trip is active.
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`rounded-xl bg-background/40 p-3 ${className}`}>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-semibold">{value}</div>
    </div>
  );
}
