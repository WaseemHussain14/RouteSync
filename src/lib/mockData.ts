// Mock seed data for buses, routes, and drivers.
// Routes 104, 116, 120 are real BSACIST (B.S. Abdur Rahman Crescent) college
// bus routes in Chennai, sourced from the official route sheet.

export interface Stop {
  name: string;
  time: string;
  lat: number;
  lng: number;
}

export interface Route {
  routeId: string;
  routeName: string;
  stops: Stop[];
  timings: string;
}

export interface Bus {
  busId: string;
  busNumber: string;
  routeId: string;
  routeName: string;
  driverName: string;
  status: "active" | "inactive";
  latitude: number;
  longitude: number;
  speed: number; // km/h
  updatedAt: number; // epoch ms
}

export const ROUTES: Route[] = [
  {
    routeId: "R-104",
    routeName: "Route 104 · Nungambakkam → BSACIST",
    timings: "6:55 AM • Drop 4:45 PM",
    stops: [
      { name: "Crescent School Nungambakkam", time: "6:55 AM", lat: 13.06381975, lng: 80.2506762 },
      { name: "Co-Optex – Museum", time: "7:00 AM", lat: 13.06836686, lng: 80.25415589 },
      { name: "D1 Triplicane Police Station", time: "7:08 AM", lat: 13.0673002, lng: 80.27359164 },
      { name: "Aadham Market", time: "7:13 AM", lat: 13.06378501, lng: 80.27383665 },
      { name: "Ratna Coffee", time: "7:15 AM", lat: 13.05894311, lng: 80.2740342 },
      { name: "Ice House", time: "7:17 AM", lat: 13.05319408, lng: 80.27349081 },
      { name: "Crescent Hospital", time: "7:18 AM", lat: 13.05303441, lng: 80.27273428 },
      { name: "Mirsahibpet", time: "7:20 AM", lat: 13.05333226, lng: 80.26970422 },
      { name: "New College", time: "7:23 AM", lat: 13.05429381, lng: 80.25907194 },
      { name: "Gemini", time: "7:26 AM", lat: 13.05195931, lng: 80.25062323 },
      { name: "Guindy", time: "7:40 AM", lat: 13.00902638, lng: 80.21186147 },
      { name: "BSACIST", time: "8:20 AM", lat: 12.87552175, lng: 80.08371105 },
    ],
  },
  {
    routeId: "R-116",
    routeName: "Route 116 · Tansi Nagar → BSACIST",
    timings: "7:25 AM • Drop 4:45 PM",
    stops: [
      { name: "Tansi Nagar", time: "7:25 AM", lat: 12.9777593, lng: 80.22430259 },
      { name: "Velachery Signal", time: "7:28 AM", lat: 12.9756257, lng: 80.22097637 },
      { name: "Pallikaranai", time: "7:52 AM", lat: 12.93748495, lng: 80.20496912 },
      { name: "Oil Mill", time: "7:55 AM", lat: 12.92582409, lng: 80.19761985 },
      { name: "Medavakkam", time: "7:58 AM", lat: 12.91825267, lng: 80.18844469 },
      { name: "Medavakkam X-Road", time: "8:00 AM", lat: 12.92045593, lng: 80.1847274 },
      { name: "Vijayanagar", time: "8:03 AM", lat: 12.91837087, lng: 80.17656306 },
      { name: "Santhoshpuram", time: "8:05 AM", lat: 12.91959497, lng: 80.17160212 },
      { name: "Sembakkam", time: "8:07 AM", lat: 12.92338646, lng: 80.15895703 },
      { name: "Kamarajapuram", time: "8:10 AM", lat: 12.92346311, lng: 80.1583734 },
      { name: "Mahalakshmi Nagar", time: "8:12 AM", lat: 12.92247308, lng: 80.14685707 },
      { name: "Camp Road", time: "8:15 AM", lat: 12.92245216, lng: 80.14265137 },
      { name: "Christ King School", time: "8:18 AM", lat: 12.92272645, lng: 80.13065378 },
      { name: "MCC", time: "8:20 AM", lat: 12.92339549, lng: 80.11831555 },
      { name: "BSACIST", time: "8:35 AM", lat: 12.87552175, lng: 80.08371105 },
    ],
  },
  {
    routeId: "R-120",
    routeName: "Route 120 · Adambakkam → BSACIST",
    timings: "7:10 AM • Drop 4:45 PM",
    stops: [
      { name: "Adambakkam (Sakthi Cars)", time: "7:10 AM", lat: 12.97987328, lng: 80.20004431 },
      { name: "Palavanthangal Subway", time: "7:25 AM", lat: 12.9903418, lng: 80.18509202 },
      { name: "Canara Bank (Nanganallur Market)", time: "7:30 AM", lat: 12.98608215, lng: 80.18837563 },
      { name: "Roja Medicals", time: "7:32 AM", lat: 12.98063915, lng: 80.18829476 },
      { name: "Ranga Theater", time: "7:35 AM", lat: 12.98026349, lng: 80.18196295 },
      { name: "Nanganallur Bus Stand (Near JK Mahal)", time: "7:37 AM", lat: 12.97611652, lng: 80.18322897 },
      { name: "Brilliant School", time: "7:40 AM", lat: 12.97081402, lng: 80.18638831 },
      { name: "Madipakkam", time: "7:45 AM", lat: 12.96770953, lng: 80.18933114 },
      { name: "Vels Signal", time: "7:55 AM", lat: 12.95450319, lng: 80.15865662 },
      { name: "Chromepet Bus Stop", time: "8:00 AM", lat: 12.95726838, lng: 80.1437608 },
      { name: "Chitlapakkam (Varadaraja Theatre)", time: "8:10 AM", lat: 12.94440222, lng: 80.13497726 },
      { name: "Tambaram", time: "8:20 AM", lat: 12.92727381, lng: 80.11853361 },
      { name: "BSACIST", time: "8:35 AM", lat: 12.87552175, lng: 80.08371105 },
    ],
  },
];

export const BUSES: Bus[] = [
  {
    busId: "BUS-104",
    busNumber: "TN-22-BC-1104",
    routeId: "R-104",
    routeName: "Route 104 · Nungambakkam → BSACIST",
    driverName: "Ravi Kumar",
    status: "active",
    latitude: 13.05894311,
    longitude: 80.2740342,
    speed: 32,
    updatedAt: Date.now(),
  },
  {
    busId: "BUS-116",
    busNumber: "TN-22-BC-1116",
    routeId: "R-116",
    routeName: "Route 116 · Tansi Nagar → BSACIST",
    driverName: "Anita Singh",
    status: "active",
    latitude: 12.93748495,
    longitude: 80.20496912,
    speed: 28,
    updatedAt: Date.now(),
  },
  {
    busId: "BUS-120",
    busNumber: "TN-22-BC-1120",
    routeId: "R-120",
    routeName: "Route 120 · Adambakkam → BSACIST",
    driverName: "Mohammed Iqbal",
    status: "active",
    latitude: 12.96770953,
    longitude: 80.18933114,
    speed: 24,
    updatedAt: Date.now(),
  },
];
