import React from 'react';

export default function GroupTripForm({ travelers, setTravelers }) {
  const update = (index, key, value) => {
    const next = travelers.map((t, i) => i === index ? { ...t, [key]: value } : t);
    setTravelers(next);
  };

  const addTraveler = () => {
    setTravelers([...travelers, { name: '', budget: '', age: '', availableDays: '', interests: '' }]);
  };

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Group Members</h2>
        <button className="btn-secondary" type="button" onClick={addTraveler}>Add Member</button>
      </div>
      <div className="mt-3 grid gap-3">
        {travelers.map((t, index) => (
          <div key={index} className="grid gap-3 rounded-md border border-slate-200 p-3 md:grid-cols-5">
            <label className="text-sm font-medium text-slate-700">
              Name
              <input className="field mt-1" placeholder="Traveler name" value={t.name} onChange={(e) => update(index, 'name', e.target.value)} />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Budget
              <input className="field mt-1" type="number" min="0" placeholder="20000" value={t.budget} onChange={(e) => update(index, 'budget', e.target.value)} />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Age
              <input className="field mt-1" type="number" min="0" placeholder="30" value={t.age} onChange={(e) => update(index, 'age', e.target.value)} />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Available Days
              <input className="field mt-1" type="number" min="1" placeholder="4" value={t.availableDays} onChange={(e) => update(index, 'availableDays', e.target.value)} />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Interests
              <input className="field mt-1" placeholder="history, nature" value={t.interests} onChange={(e) => update(index, 'interests', e.target.value)} />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
