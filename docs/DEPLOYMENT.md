# Deployment Guide

## Local Production Build

Backend:

```bash
cmake -S backend -B backend/build-verify -DCMAKE_BUILD_TYPE=Release
cmake --build backend/build-verify --target travel_server -j2
cd backend
PORT=8080 PLACES_DATASET=data/indian_places.json ./build-verify/travel_server
```

Frontend:

```bash
cd frontend
npm ci
VITE_API_BASE_URL=http://localhost:8080 npm run build
npm run preview -- --port 5173
```

## Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

Services:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- Health: `http://localhost:8080/api/health`

The production frontend image serves static files with nginx and proxies `/api` to the backend service.

## Environment Variables

| Variable | Used By | Description |
| --- | --- | --- |
| `PORT` | Backend | Drogon listen port |
| `PLACES_DATASET` | Backend | JSON dataset path |
| `GOOGLE_MAPS_API_KEY` | Backend | Optional Google Routes key |
| `VITE_API_BASE_URL` | Frontend | API base URL for Vite builds |
| `VITE_GOOGLE_MAPS_API_KEY` | Frontend | Optional Google Maps JavaScript key |

## Production Notes

- Use `VITE_API_BASE_URL=/api` when the nginx frontend proxies API requests.
- Keep backend and frontend Google keys separate.
- Serve only `frontend/dist` or the nginx image in production.
- Put TLS, compression, and domain routing at the reverse proxy/load balancer.
- Replace the seed JSON with a larger dataset by setting `PLACES_DATASET`.
