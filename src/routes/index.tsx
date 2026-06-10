import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, UserCog, ArrowRight } from "lucide-react";
import logo from "@/assets/routesync-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "College Bus Live Tracking System" },
      {
        name: "description",
        content:
          "Real-time campus bus tracking for students and drivers. Live map, ETAs, and route schedules.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen gradient-hero text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <img src={logo} alt="RouteSync logo" className="h-10 w-10 rounded-xl object-contain" />
          <span className="text-lg font-bold tracking-tight">RouteSync</span>
        </div>
        <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
          <Link to="/login/student" className="hover:text-gold">Student</Link>
          <Link to="/login/driver" className="hover:text-gold">Driver</Link>
          <Link to="/admin" className="hover:text-gold">Admin</Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pt-12 pb-20 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--gold)]/30 bg-card/60 px-4 py-1.5 text-xs font-medium text-gold">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--gold)]" />
          Live tracking online
        </span>
        <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-7xl">
          Never miss your{" "}
          <span className="bg-gradient-to-r from-[color:var(--gold)] to-[color:var(--gold-soft)] bg-clip-text text-transparent">
            campus bus
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Real-time GPS tracking for college transport. Students see live bus locations and ETAs,
          drivers share their position with one tap.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Link
            to="/login/student"
            className="glass group flex items-center justify-between rounded-2xl p-6 text-left transition hover:-translate-y-1 hover:shadow-gold"
          >
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-[color:var(--gold)]/15 text-gold">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <div className="text-lg font-semibold">Student View</div>
                <div className="text-sm text-muted-foreground">Live map, ETAs, route stops</div>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gold transition group-hover:translate-x-1" />
          </Link>

          <Link
            to="/login/driver"
            className="glass group flex items-center justify-between rounded-2xl p-6 text-left transition hover:-translate-y-1 hover:shadow-gold"
          >
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-[color:var(--gold)]/15 text-gold">
                <UserCog className="h-6 w-6" />
              </div>
              <div>
                <div className="text-lg font-semibold">Driver View</div>
                <div className="text-sm text-muted-foreground">Start trip, broadcast location</div>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-gold transition group-hover:translate-x-1" />
          </Link>
        </div>

      </section>
    </div>
  );
}
