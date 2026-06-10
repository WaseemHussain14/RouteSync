// Interactive Leaflet map. Imported only on the client via BusMap.tsx
// because `leaflet` touches `window` during module evaluation.
import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import type { Bus, Route } from "@/lib/mockData";
import { Bus as BusIcon, Gauge, Clock, Route as RouteIcon, Radio } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { useServerFn } from "@tanstack/react-start";
import { getTomTomRouteGeometry } from "@/lib/tomtomRoute.functions";

interface Props {
  buses: Bus[];
  selectedBus: Bus | null;
  selectedRoute: Route | null;
  onSelectBus: (bus: Bus) => void;
}

function makeBusIcon(active: boolean) {
  const html = `<div class="bus-marker ${active ? "active" : ""}">${renderToStaticMarkup(
    <BusIcon size={20} strokeWidth={2.5} />,
  )}</div>`;
  return L.divIcon({
    html,
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function FlyTo({ bus }: { bus: Bus | null }) {
  const map = useMap();
  useEffect(() => {
    if (bus) map.flyTo([bus.latitude, bus.longitude], 15, { duration: 1.2 });
  }, [bus, map]);
  return null;
}

export function BusMapInner({ buses, selectedBus, selectedRoute, onSelectBus }: Props) {
  const center = useMemo<[number, number]>(() => {
    if (selectedBus) return [selectedBus.latitude, selectedBus.longitude];
    if (buses[0]) return [buses[0].latitude, buses[0].longitude];
    return [12.9716, 77.5946];
  }, [buses, selectedBus]);

  const stopPoints = useMemo<[number, number][]>(
    () => selectedRoute?.stops.map((s) => [s.lat, s.lng]) ?? [],
    [selectedRoute],
  );

  const fetchGeometry = useServerFn(getTomTomRouteGeometry);
  const [roadPoints, setRoadPoints] = useState<[number, number][]>([]);

  useEffect(() => {
    setRoadPoints([]);
    if (!selectedRoute || selectedRoute.stops.length < 2) return;
    let cancelled = false;
    fetchGeometry({
      data: { stops: selectedRoute.stops.map((s) => ({ lat: s.lat, lng: s.lng })) },
    })
      .then((r) => {
        if (!cancelled && r.points.length > 1) setRoadPoints(r.points);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedRoute, fetchGeometry]);

  const polylinePoints = roadPoints.length > 1 ? roadPoints : stopPoints;

  return (
    <MapContainer center={center} zoom={14} className="h-full w-full" scrollWheelZoom>
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {polylinePoints.length > 1 && (
        <>
          {/* Outer glow */}
          <Polyline
            positions={polylinePoints}
            pathOptions={{ color: "#D4AF37", weight: 18, opacity: 0.12 }}
          />
          <Polyline
            positions={polylinePoints}
            pathOptions={{ color: "#D4AF37", weight: 10, opacity: 0.25 }}
          />
          {/* Core line */}
          <Polyline
            positions={polylinePoints}
            pathOptions={{ color: "#FFD86B", weight: 4, opacity: 0.95, lineCap: "round", lineJoin: "round" }}
          />
          {/* Stop markers */}
          {stopPoints.map((p, i) => (
            <CircleMarker
              key={i}
              center={p}
              radius={5}
              pathOptions={{ color: "#FFD86B", fillColor: "#0b1020", fillOpacity: 1, weight: 2 }}
            />
          ))}
        </>
      )}
      {buses.map((bus) => (
        <Marker
          key={bus.busId}
          position={[bus.latitude, bus.longitude]}
          icon={makeBusIcon(bus.status === "active")}
          eventHandlers={{ click: () => onSelectBus(bus) }}
        >
          <Popup className="bus-popup" closeButton={false} minWidth={240}>
            <div className="bus-popup-card">
              <div className="bus-popup-header">
                <div className="bus-popup-icon">
                  <BusIcon size={18} strokeWidth={2.5} />
                </div>
                <div className="bus-popup-title">
                  <div className="bus-popup-number">{bus.busNumber}</div>
                  <div className="bus-popup-status">
                    <span className={`bus-popup-dot ${bus.status === "active" ? "active" : ""}`} />
                    {bus.status === "active" ? "Live" : "Offline"}
                  </div>
                </div>
              </div>
              <div className="bus-popup-body">
                <div className="bus-popup-row">
                  <RouteIcon size={14} />
                  <span className="bus-popup-label">Route</span>
                  <span className="bus-popup-value">{bus.routeName}</span>
                </div>
                <div className="bus-popup-row">
                  <Gauge size={14} />
                  <span className="bus-popup-label">Speed</span>
                  <span className="bus-popup-value">
                    <strong>{bus.speed}</strong> km/h
                  </span>
                </div>
                <div className="bus-popup-row">
                  <Clock size={14} />
                  <span className="bus-popup-label">Updated</span>
                  <span className="bus-popup-value">
                    {new Date(bus.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
              <div className="bus-popup-footer">
                <Radio size={11} />
                <span>Live GPS · TomTom Traffic</span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
      <FlyTo bus={selectedBus} />
    </MapContainer>
  );
}
