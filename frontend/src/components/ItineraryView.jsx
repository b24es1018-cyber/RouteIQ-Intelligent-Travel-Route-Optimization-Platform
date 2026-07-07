import React from 'react';

export default function ItineraryView({ places, itinerary }) {
  const byId = new Map(places.map((p) => [p.id, p]));
  return (
    <div className="panel p-4">
      <h2 className="text-lg font-semibold">Day-wise Itinerary</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {(itinerary?.days || []).map((day) => (
          <div key={day.day} className="rounded-md border border-slate-200 p-3">
            <div className="font-semibold">Day {day.day}</div>
            <div className="mt-1 text-xs text-slate-500">{Number(day.usedHours || 0).toFixed(1)} planned hours</div>
            <div className="mt-3 space-y-2 text-sm">
              {(day.places || []).map((id) => <div key={id} className="rounded bg-slate-50 px-2 py-1">{byId.get(id)?.name || id}</div>)}
            </div>
          </div>
        ))}
        {(!itinerary?.days || itinerary.days.length === 0) && <p className="text-sm text-slate-500">Generate a route to build an itinerary.</p>}
      </div>
    </div>
  );
}
