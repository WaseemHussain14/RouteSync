// Client-only wrapper for the Leaflet map.
import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import type { Bus, Route } from "@/lib/mockData";

const BusMapInner = lazy(() =>
  import("./BusMapInner").then((m) => ({ default: m.BusMapInner })),
);

interface Props {
  buses: Bus[];
  selectedBus: Bus | null;
  selectedRoute: Route | null;
  onSelectBus: (bus: Bus) => void;
}

export function BusMap(props: Props) {
  const fallback = (
    <div className="grid h-full w-full place-items-center bg-navy-deep text-sm text-muted-foreground">
      Loading map…
    </div>
  );
  return (
    <ClientOnly fallback={fallback}>
      <Suspense fallback={fallback}>
        <BusMapInner {...props} />
      </Suspense>
    </ClientOnly>
  );
}
