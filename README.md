# Travel Planner AI

Production-style full-stack travel planner for India. The app combines a React travel UI with a C++17 Drogon backend that runs graph, route optimization, Top-K diversification, group planning, recommendation, and itinerary algorithms over a local destination dataset.

## Architecture

```text
frontend/              React + Vite + TailwindCSS client
backend/src/           C++17 algorithm core and Drogon API
backend/data/          Local Indian destination dataset
backend/tests/         Algorithm smoke/regression tests
docs/                  API, algorithm, and dataset notes
screenshots/           Portfolio screenshot capture folder
```

The backend loads `backend/data/indian_places.json`, builds a weighted graph, and exposes JSON APIs. If `GOOGLE_MAPS_API_KEY` is configured, route estimates can use Google Routes; otherwise the API uses Haversine fallback estimates. The frontend uses Google Maps when `VITE_GOOGLE_MAPS_API_KEY` exists and falls back to Leaflet with Carto Voyager HD tiles.

## Features

- Home, Explore, Trip Planner, Group Planner, Recommendations, Saved Trips, and About pages.
- Search autocomplete, removable destination chips, route summary cards, itinerary cards, recommendation cards, and saved trip cards.
- Google Maps or Leaflet map with draggable zoom, fit bounds, current location, route polylines, alternate route polylines, search markers, and clustered markers.
- Budget-aware route optimization with exact and heuristic modes.
- Diversified Top-K alternate routes.
- Group route planning with shared route and personal add-ons.
- Recommendation ranking by interest, budget, days, rating, distance, and destination value.
- Benchmark endpoint for comparing algorithm behavior.

## Algorithms

| Algorithm | Use | Time | Space |
| --- | --- | --- | --- |
| BFS / DFS | Traversal and diagnostics | `O(V + E)` | `O(V)` |
| Connected Components | Graph health | `O(V + E)` | `O(V)` |
| Dijkstra | Shortest path | `O((V + E) log V)` | `O(V + E)` |
| A* | Shortest path with Haversine heuristic | `O(E)` typical | `O(V)` |
| Bellman-Ford | Flexible shortest path baseline | `O(VE)` | `O(V)` |
| Held-Karp DP | Exact budgeted route optimization | `O(n^2 2^n)` | `O(n 2^n)` |
| Nearest Neighbor + 2-opt | Large route heuristic | `O(n^2)` | `O(n)` |
| Simulated Annealing | Route-order improvement | `O(iterations * n)` | `O(n)` |
| Diversified Top-K | Alternate route generation and selection | `O(A * optimizer + K * A)` | `O(A * n)` |
| Greedy Itinerary Packing | Day-wise itinerary | `O(n)` after route order | `O(days + n)` |

`A` is the generated alternate-route pool size. Held-Karp is automatically limited for larger candidate sets; larger trips use heuristics.

## API

Base URL: `http://localhost:8080`

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Server and route-provider status |
| `GET` | `/api/places` | List all destinations |
| `GET` | `/api/place/{id}` | Fetch one destination |
| `POST` | `/api/shortest-path` | Dijkstra, A*, or Bellman-Ford path |
| `POST` | `/api/route` | Exact or heuristic optimized route |
| `POST` | `/api/top-k` | Diversified alternate routes |
| `POST` | `/api/group-trip` | Shared and personal group plans |
| `POST` | `/api/recommend` | Ranked destination recommendations |
| `POST` | `/api/itinerary` | Day-wise itinerary cards |
| `POST` | `/api/search` | Destination search and filters |
| `GET` | `/api/stats` | Graph node, edge, component stats |
| `GET` | `/api/benchmark` | Algorithm benchmark summary |

Example route request:

```bash
curl -X POST http://localhost:8080/api/route \
  -H "Content-Type: application/json" \
  -d '{"start":0,"candidates":[1,2,3,4,5],"budget":25000,"days":5,"mode":"heuristic","interests":["history","heritage"],"useGoogleRoutes":false}'
```

Example Top-K request:

```bash
curl -X POST http://localhost:8080/api/top-k \
  -H "Content-Type: application/json" \
  -d '{"start":0,"candidates":[1,2,3,4,5,6,7,8],"budget":50000,"mode":"heuristic","interests":["history","nature"],"k":5}'
```

## Setup

Backend:

```bash
cmake -S backend -B backend/build-verify -DCMAKE_BUILD_TYPE=Release
cmake --build backend/build-verify --target algorithm_tests travel_server
./backend/build-verify/algorithm_tests
cd backend
PORT=8080 PLACES_DATASET=data/indian_places.json ./build-verify/travel_server
```

Frontend:

```bash
cd frontend
npm install
npm run build
npm run dev -- --port 5173
```

Optional environment:

```bash
GOOGLE_MAPS_API_KEY=...
VITE_GOOGLE_MAPS_API_KEY=...
VITE_API_BASE_URL=http://localhost:8080
```

## Deployment

- Build the backend in Release mode and run `travel_server` behind a reverse proxy or container runtime.
- Serve the frontend from `frontend/dist` after `npm run build`.
- Set `PLACES_DATASET` to the deployed JSON dataset path.
- Configure CORS/reverse-proxy rules if frontend and backend are deployed on different origins.
- Use Google Maps/Routes keys only in the appropriate frontend/backend environment variables.
- See `docs/DEPLOYMENT.md` for local production and Docker Compose deployment steps.

## Dataset

The checked-in seed dataset contains 60 Indian destinations across cities, heritage sites, forts, temples, hill stations, beaches, backwaters, parks, airports, railway stations, and museums. Every destination includes coordinates, state, category, cost, value, rating, interests, tags, visit hours, opening hours, and an image URL.

The backend schema supports larger local datasets generated from OpenStreetMap, Geofabrik extracts, Nominatim enrichment, and optional Google Routes enrichment.

## Screenshots

Capture portfolio screenshots from the verified Vite app:

- `screenshots/home.png` from `/`
- `screenshots/explore.png` from `/explore`
- `screenshots/trip-planner.png` from `/trip-planner`
- `screenshots/group-planner.png` from `/group-planner`
- `screenshots/recommendations.png` from `/recommendations`
- `screenshots/map-results.png` after optimizing a trip

## Verified Status

Last local verification in this workspace:

- Backend configure: passed.
- Backend build: `algorithm_tests` and `travel_server` passed.
- Algorithm tests: passed.
- Frontend install: up to date.
- Frontend build: passed.
- API verification: all required endpoints returned successful responses.
- Top-K verification: returned 5 routes with 5 unique ordered paths and 5 unique destination sets for the verification payload.
- Frontend route shell verification: `/`, `/explore`, `/trip-planner`, `/group-planner`, `/recommendations`, `/saved-trips`, and `/about` returned the Vite app shell.

Browser-console verification requires a browser automation/runtime tool. This environment did not include Playwright, Puppeteer, Chromium, Chrome, or Edge.

## Known Limitations

- Saved Trips are client-side curated examples, not persistent user data.
- Google Routes integration is optional and falls back to Haversine estimates when no backend key is set.
- Browser-console and visual screenshot verification need a local browser runtime.
- The production bundle is functional but large; route-level code splitting would reduce initial JS size.
