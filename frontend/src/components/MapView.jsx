import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const colors = ['#0f766e', '#2563eb', '#7c3aed', '#c2410c', '#db2777'];
const indiaCenter = { lat: 22.9734, lng: 78.6569 };

function coords(place) {
  return [place.latitude ?? place.lat, place.longitude ?? place.lng];
}

function markerIcon(index, active) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: ${active ? 34 : 28}px;
      height: ${active ? 34 : 28}px;
      border-radius: 999px;
      background: ${active ? 'linear-gradient(135deg,#0f766e,#2563eb)' : '#ffffff'};
      border: 2px solid ${active ? '#ffffff' : '#64748b'};
      color: ${active ? '#ffffff' : '#334155'};
      display: flex;
      align-items: center;
      justify-content: center;
      font: 700 11px system-ui;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.28);
    ">${index}</div>`,
    iconSize: [active ? 34 : 28, active ? 34 : 28],
    iconAnchor: [active ? 17 : 14, active ? 17 : 14],
  });
}

function popupHtml(place, index, clusteredCount = 1) {
  const image = place.imageUrl || `https://source.unsplash.com/600x400/?${encodeURIComponent(place.name || 'India travel')}`;
  const rating = place.rating ? Number(place.rating).toFixed(1) : '4.5';
  const category = place.category || 'destination';
  return `
    <article class="map-popup">
      <img src="${image}" alt="" loading="lazy" />
      <div class="map-popup-body">
        <div class="map-popup-kicker">${clusteredCount > 1 ? `${clusteredCount} nearby places` : `Stop ${index || ''}`}</div>
        <strong>${place.name}</strong>
        <span>${place.state || 'India'} · ${category}</span>
        <span class="map-popup-rating">★ ${rating}</span>
      </div>
    </article>
  `;
}

export default function MapView({ places, route = [], alternates = [] }) {
  const googleRef = useRef(null);
  const leafletRef = useRef(null);
  const leafletMap = useRef(null);
  const leafletLayer = useRef(null);
  const [ready, setReady] = useState(Boolean(window.google?.maps));
  const [googleFailed, setGoogleFailed] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const useLeaflet = !key || googleFailed;
  const byId = useMemo(() => new Map(places.map((p) => [p.id, p])), [places]);
  const routePlaces = route.map((id) => byId.get(id)).filter(Boolean);
  const markerPlaces = routePlaces.length ? routePlaces : places.slice(0, 40);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => setCurrentLocation([position.coords.latitude, position.coords.longitude]),
      () => {},
      { enableHighAccuracy: false, timeout: 4000 }
    );
  }, []);

  useEffect(() => {
    if (!key || ready) return;
    const existing = document.querySelector('script[data-google-maps]');
    if (existing) {
      existing.addEventListener('load', () => setReady(true));
      return;
    }
    const script = document.createElement('script');
    script.dataset.googleMaps = 'true';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
    script.async = true;
    script.onload = () => setReady(true);
    script.onerror = () => setGoogleFailed(true);
    document.head.appendChild(script);
    const fallbackTimer = window.setTimeout(() => {
      if (!window.google?.maps) setGoogleFailed(true);
    }, 6000);
    return () => window.clearTimeout(fallbackTimer);
  }, [key, ready]);

  useEffect(() => {
    if (useLeaflet || !ready || !googleRef.current || places.length === 0) return;
    const centerPlace = routePlaces[0] || places[0];
    const center = { lat: coords(centerPlace)[0], lng: coords(centerPlace)[1] };
    const map = new window.google.maps.Map(googleRef.current, {
      center,
      zoom: routePlaces.length ? 5 : 4,
      draggable: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });
    const bounds = new window.google.maps.LatLngBounds();
    const info = new window.google.maps.InfoWindow();
    markerPlaces.forEach((p, index) => {
      const position = { lat: coords(p)[0], lng: coords(p)[1] };
      const marker = new window.google.maps.Marker({
        map,
        position,
        title: p.name,
        label: routePlaces.length ? String(index + 1) : undefined,
      });
      marker.addListener('click', () => {
        info.setContent(popupHtml(p, routePlaces.length ? index + 1 : ''));
        info.open(map, marker);
      });
      bounds.extend(position);
    });
    if (currentLocation) {
      new window.google.maps.Marker({
        map,
        position: { lat: currentLocation[0], lng: currentLocation[1] },
        title: 'Current location',
        icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: '#8b5cf6', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2 },
      });
    }
    const draw = (ids, color) => {
      const path = ids.map((id) => byId.get(id)).filter(Boolean).map((p) => ({ lat: coords(p)[0], lng: coords(p)[1] }));
      if (path.length > 1) new window.google.maps.Polyline({ map, path, strokeColor: color, strokeWeight: color === colors[0] ? 6 : 4, strokeOpacity: color === colors[0] ? 0.95 : 0.65 });
    };
    draw(route, colors[0]);
    alternates.forEach((r, i) => draw(r.route || [], colors[(i + 1) % colors.length]));
    if (!bounds.isEmpty()) map.fitBounds(bounds);
  }, [useLeaflet, ready, places, route, alternates, byId, routePlaces, markerPlaces, currentLocation]);

  useEffect(() => {
    if (!useLeaflet || !leafletRef.current || places.length === 0) return;
    if (!leafletMap.current) {
      leafletMap.current = L.map(leafletRef.current, {
        dragging: true,
        zoomControl: true,
        scrollWheelZoom: true,
        preferCanvas: true,
        zoomAnimation: true,
        fadeAnimation: true,
        markerZoomAnimation: true,
        wheelDebounceTime: 32,
      }).setView([indiaCenter.lat, indiaCenter.lng], 4);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 20,
        detectRetina: true,
        updateWhenZooming: false,
        updateWhenIdle: true,
      }).addTo(leafletMap.current);
    }

    if (leafletLayer.current) leafletLayer.current.remove();
    const layer = L.layerGroup().addTo(leafletMap.current);
    leafletLayer.current = layer;

    const clustered = new Map();
    markerPlaces.forEach((p) => {
      const [lat, lng] = coords(p);
      const key = `${Math.round(lat * 5) / 5},${Math.round(lng * 5) / 5}`;
      clustered.set(key, [...(clustered.get(key) || []), p]);
    });

    Array.from(clustered.values()).forEach((group, index) => {
      const p = group[0];
      const [lat, lng] = coords(p);
      const marker = group.length > 1
        ? L.marker([lat, lng], { icon: markerIcon(group.length, true) })
        : L.marker([lat, lng], { icon: markerIcon(routePlaces.length ? index + 1 : '', routePlaces.includes(p)) });
      marker
        .bindPopup(popupHtml(p, routePlaces.length ? index + 1 : '', group.length), { maxWidth: 260, className: 'premium-map-popup' })
        .addTo(layer);
    });

    const routeLine = routePlaces.map(coords);
    if (routeLine.length > 1) {
      L.polyline(routeLine, { color: '#ffffff', weight: 9, opacity: 0.9, smoothFactor: 1.2 }).addTo(layer);
      L.polyline(routeLine, { color: colors[0], weight: 5, opacity: 0.95, smoothFactor: 1.2 }).addTo(layer);
    }
    if (currentLocation) {
      L.circleMarker(currentLocation, { radius: 8, color: '#ffffff', weight: 2, fillColor: '#8b5cf6', fillOpacity: 1 })
        .bindPopup('<strong>Current location</strong>')
        .addTo(layer);
    }
    alternates.forEach((r, i) => {
      const line = (r.route || []).map((id) => byId.get(id)).filter(Boolean).map(coords);
      if (line.length > 1) L.polyline(line, { color: colors[(i + 1) % colors.length], weight: 3, opacity: 0.68, dashArray: '8 8', smoothFactor: 1.2 }).addTo(layer);
    });

    const bounds = layer.getBounds?.();
    if (bounds?.isValid()) leafletMap.current.flyToBounds(bounds.pad(0.22), { maxZoom: 6, duration: 0.7, easeLinearity: 0.2 });
    setTimeout(() => leafletMap.current?.invalidateSize(), 0);
  }, [useLeaflet, places, routePlaces, markerPlaces, route, alternates, byId, currentLocation]);

  if (useLeaflet) {
    return (
      <div className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-white/10 dark:text-slate-200">
          <span>Interactive Route Map</span>
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs text-teal-700 dark:bg-teal-400/15 dark:text-teal-200">Leaflet HD</span>
        </div>
        <div ref={leafletRef} className="h-96 w-full" />
      </div>
    );
  }

  return <div ref={googleRef} className="panel min-h-96 overflow-hidden" />;
}
