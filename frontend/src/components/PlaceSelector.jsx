import React from 'react';

export default function PlaceSelector({ places, start, setStart, candidates, setCandidates }) {
  const toggle = (id) => {
    setCandidates(candidates.includes(id) ? candidates.filter((x) => x !== id) : [...candidates, id]);
  };

  return (
    <div className="panel p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">
          Start city
          <select className="field mt-1" value={start} onChange={(e) => setStart(Number(e.target.value))}>
            {places.map((p) => <option key={p.id} value={p.id}>{p.name}, {p.state}</option>)}
          </select>
        </label>
        <div className="text-sm font-medium">
          Candidate destinations
          <div className="mt-1 h-44 overflow-auto rounded-md border border-slate-300 bg-white p-2">
            {places.map((p) => (
              <label key={p.id} className="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50">
                <input type="checkbox" checked={candidates.includes(p.id)} onChange={() => toggle(p.id)} />
                <span>{p.name}</span>
                <span className="ml-auto text-xs text-slate-500">{p.category || 'place'}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
