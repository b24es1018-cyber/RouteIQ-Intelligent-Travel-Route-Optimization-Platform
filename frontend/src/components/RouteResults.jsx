import React from 'react';

export default function RouteResults({ places, result, alternates = [] }) {
  const byId = new Map(places.map((p) => [p.id, p]));
  const route = result?.route || [];

  if (!result) {
    return (
      <div className="panel p-4">
        <h2 className="text-lg font-semibold">Best Route</h2>
        <p className="mt-3 text-sm text-slate-600">No route generated yet. Choose places and click Optimize.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="panel p-4">
        <h2 className="text-lg font-semibold">Best Route</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <Metric label="Cost" value={money(result.cost)} />
          <Metric label="Value" value={result.value ?? 'Not calculated'} />
          <Metric label="Distance" value={distance(result.distanceKm)} />
          <Metric label="Algorithm" value={result.algorithm || result.mode || 'Optimized'} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {route.map((id, index) => <span key={`${id}-${index}`} className="rounded-md bg-teal-50 px-3 py-1 text-sm text-teal-900">{index + 1}. {byId.get(id)?.name || id}</span>)}
        </div>
      </div>
      <div className="panel p-4">
        <h2 className="text-lg font-semibold">Alternate Routes</h2>
        <div className="mt-3 grid gap-3">
          {alternates.map((r, i) => (
            <div key={i} className="rounded-md border border-slate-200 p-3">
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <span className="font-semibold">Route {i + 1}</span>
                <span>Value {r.value ?? 'Not calculated'} · {money(r.cost)} · Diversity {Number(r.diversityScore || 0).toFixed(2)}</span>
              </div>
              <div className="mt-2 text-sm text-slate-600">{(r.route || []).map((id) => byId.get(id)?.name || id).join(' → ')}</div>
            </div>
          ))}
          {alternates.length === 0 && <p className="text-sm text-slate-500">No alternate routes returned for this selection.</p>}
        </div>
      </div>
    </div>
  );
}

function money(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return 'Not calculated';
  return `₹${Math.round(Number(value)).toLocaleString()}`;
}

function distance(value) {
  if (!value || Number.isNaN(Number(value))) return 'Not calculated';
  return `${Math.round(Number(value)).toLocaleString()} km`;
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs uppercase text-slate-500">{label}</div>
      <div className="mt-1 text-base font-semibold">{value}</div>
    </div>
  );
}
