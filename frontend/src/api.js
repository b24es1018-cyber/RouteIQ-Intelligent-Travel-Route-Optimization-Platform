import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const client = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } });

async function request(path, options = {}) {
  const response = options.method === 'POST'
    ? await client.post(path, JSON.parse(options.body || '{}'))
    : await client.get(path);
  return response.data;
}

export const api = {
  health: () => request('/api/health'),
  places: () => request('/api/places'),
  place: (id) => request(`/api/place/${id}`),
  optimizeRoute: (payload) => request('/api/route', { method: 'POST', body: JSON.stringify(payload) }),
  topKRoutes: (payload) => request('/api/top-k', { method: 'POST', body: JSON.stringify(payload) }),
  groupTrip: (payload) => request('/api/group-trip', { method: 'POST', body: JSON.stringify(payload) }),
  itinerary: (payload) => request('/api/itinerary', { method: 'POST', body: JSON.stringify(payload) }),
  shortestPath: (payload) => request('/api/shortest-path', { method: 'POST', body: JSON.stringify(payload) }),
  recommend: (payload) => request('/api/recommend', { method: 'POST', body: JSON.stringify(payload) }),
  search: (payload) => request('/api/search', { method: 'POST', body: JSON.stringify(payload) }),
  stats: () => request('/api/stats'),
  benchmark: () => request('/api/benchmark'),
};
