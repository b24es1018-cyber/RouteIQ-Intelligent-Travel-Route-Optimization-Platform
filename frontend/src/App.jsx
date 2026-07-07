import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Link, NavLink, Route, Routes } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  BarChart3,
  Bookmark,
  Bot,
  Compass,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit3,
  HeartHandshake,
  Home as HomeIcon,
  Info,
  Layers3,
  Loader2,
  MapPinned,
  Moon,
  Plane,
  Route as RouteIcon,
  Search,
  Save,
  Sparkles,
  Star,
  Sun,
  Trash2,
  X,
  Users,
  WalletCards,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from './api.js';

const MapView = lazy(() => import('./components/MapView.jsx'));

const imagePool = [
  'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1200&q=80',
];

const heroImage = 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=2200&q=85';
const routeImage = 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=1000&q=80';
const avatarGradient = 'bg-gradient-to-br from-teal-400 via-blue-500 to-purple-500';

const demoPlaces = [
  { id: 0, name: 'Delhi', state: 'Delhi', latitude: 28.6139, longitude: 77.209, category: 'city', rating: 4.6, value: 85, cost: 3000 },
  { id: 1, name: 'Agra', state: 'Uttar Pradesh', latitude: 27.1767, longitude: 78.0081, category: 'heritage', rating: 4.8, value: 95, cost: 2500 },
  { id: 2, name: 'Jaipur', state: 'Rajasthan', latitude: 26.9124, longitude: 75.7873, category: 'city', rating: 4.7, value: 90, cost: 2800 },
  { id: 15, name: 'Goa', state: 'Goa', latitude: 15.2993, longitude: 74.124, category: 'beach', rating: 4.7, value: 90, cost: 4200 },
];

const navItems = [
  ['/', 'Home', HomeIcon],
  ['/explore', 'Explore', Compass],
  ['/trip-planner', 'Trip Planner', RouteIcon],
  ['/group-planner', 'Group Planner', Users],
  ['/recommendations', 'Recommendations', Sparkles],
  ['/saved-trips', 'Saved Trips', Bookmark],
  ['/about', 'About', Info],
];

function imgFor(placeOrIndex) {
  if (typeof placeOrIndex === 'object' && placeOrIndex?.imageUrl) return placeOrIndex.imageUrl;
  const id = typeof placeOrIndex === 'number' ? placeOrIndex : placeOrIndex?.id || 0;
  return imagePool[Math.abs(id) % imagePool.length];
}

function money(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return 'Not calculated';
  return `₹${Math.round(Number(value)).toLocaleString()}`;
}

function distance(value) {
  if (!value) return 'Not calculated';
  return `${Math.round(value).toLocaleString()} km`;
}

function placeName(places, id) {
  return places.find((p) => p.id === id)?.name || `Place ${id}`;
}

function splitInterests(value) {
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

function PlaceAutocomplete({ places, value, onChange, placeholder = 'Search destination...' }) {
  const selected = places.find((p) => p.id === value);
  const [text, setText] = useState(selected ? `${selected.name}, ${selected.state}` : '');
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const matches = places
    .filter((p) => `${p.name} ${p.state} ${p.category} ${(p.tags || []).join(' ')}`.toLowerCase().includes(text.toLowerCase()))
    .slice(0, 8);

  useEffect(() => {
    const next = places.find((p) => p.id === value);
    if (next) setText(`${next.name}, ${next.state}`);
  }, [places, value]);

  const selectPlace = (place) => {
    onChange(place.id);
    setText(`${place.name}, ${place.state}`);
    setOpen(false);
  };

  const handleKeyDown = (event) => {
    if (!matches.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, matches.length - 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === 'Enter' && open) {
      event.preventDefault();
      selectPlace(matches[activeIndex] || matches[0]);
    }
    if (event.key === 'Escape') setOpen(false);
  };

  return (
    <div className="relative">
      <input
        aria-autocomplete="list"
        aria-expanded={open}
        aria-label={placeholder}
        className="premium-input"
        role="combobox"
        value={text}
        placeholder={placeholder}
        onChange={(e) => { setText(e.target.value); setOpen(true); setActiveIndex(0); }}
        onFocus={() => { setText(''); setOpen(true); }}
        onKeyDown={handleKeyDown}
      />
      {open && text && matches.length > 0 && !matches.some((p) => `${p.name}, ${p.state}` === text) && (
        <div className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-white/70 bg-white/95 p-2 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-slate-950/95" role="listbox">
          {matches.map((p, index) => (
            <button key={p.id} type="button" onMouseEnter={() => setActiveIndex(index)} onClick={() => selectPlace(p)} className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition ${index === activeIndex ? 'bg-teal-50 dark:bg-white/10' : 'hover:bg-teal-50 dark:hover:bg-white/10'}`} role="option" aria-selected={index === activeIndex}>
              <img src={imgFor(p)} alt={p.name} className="h-10 w-12 rounded-lg object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black">{p.name}</span>
                <span className="block truncate text-xs text-slate-500 dark:text-slate-300">{p.state} · {p.category}</span>
              </span>
              <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-black text-amber-600">★ {p.rating}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [places, setPlaces] = useState(demoPlaces);
  const [stats, setStats] = useState(null);
  const [dark, setDark] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    api.places().then(setPlaces).catch(() => setToast('Using offline destination samples.'));
    api.stats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3200);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dffdf6,transparent_34%),linear-gradient(135deg,#f8fbff,#eef7ff_45%,#fff7ed)] text-slate-900 transition-colors dark:bg-[radial-gradient(circle_at_top_left,#164e63,transparent_30%),linear-gradient(135deg,#07111f,#111827_55%,#1e1b4b)] dark:text-white">
        <Navbar dark={dark} setDark={setDark} />
        <AnimatePresence>
          {toast && (
            <motion.div role="status" aria-live="polite" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="fixed right-5 top-24 z-[1000] rounded-2xl border border-white/40 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700 shadow-2xl backdrop-blur dark:bg-slate-900/90 dark:text-white">
              {toast}
            </motion.div>
          )}
        </AnimatePresence>
        <Routes>
          <Route path="/" element={<Home stats={stats} />} />
          <Route path="/explore" element={<Explore places={places} />} />
          <Route path="/trip-planner" element={<TripPlanner places={places} showToast={showToast} />} />
          <Route path="/group-planner" element={<GroupPlanner places={places} showToast={showToast} />} />
          <Route path="/recommendations" element={<Recommendations places={places} showToast={showToast} />} />
          <Route path="/saved-trips" element={<SavedTrips places={places} />} />
          <Route path="/about" element={<About stats={stats} />} />
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function Navbar({ dark, setDark }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/50 bg-white/75 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-400 via-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25">
            <Plane size={22} />
          </div>
          <div>
            <div className="text-lg font-black tracking-tight">TripCraft India</div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-300">AI route intelligence</div>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 xl:flex">
          {navItems.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} className={({ isActive }) => `flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition ${isActive ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-lg shadow-teal-500/20' : 'text-slate-600 hover:bg-white hover:text-teal-700 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'}`}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setDark(!dark)} className="grid h-11 w-11 place-items-center rounded-full bg-white text-slate-700 shadow-md transition hover:-translate-y-0.5 hover:shadow-xl dark:bg-white/10 dark:text-white">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className={`grid h-11 w-11 place-items-center rounded-full ${avatarGradient} font-black text-white shadow-lg`}>AI</div>
        </div>
      </div>
      <nav className="mx-auto flex max-w-[1500px] gap-2 overflow-x-auto px-4 pb-3 xl:hidden" aria-label="Mobile navigation">
        {navItems.map(([to, label, Icon]) => (
          <NavLink key={to} to={to} className={({ isActive }) => `flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-black transition ${isActive ? 'bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-lg shadow-teal-500/20' : 'bg-white/70 text-slate-600 hover:bg-white hover:text-teal-700 dark:bg-white/10 dark:text-slate-200'}`}>
            <Icon size={14} />
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

function Home({ stats }) {
  const features = [
    ['AI Route Optimization', Bot, 'Held-Karp DP and heuristics pick high-value routes under real constraints.'],
    ['Budget Planning', WalletCards, 'Estimate city costs and route tradeoffs before committing.'],
    ['Group Trips', HeartHandshake, 'Balance shared plans with personal add-ons and traveler interests.'],
    ['Alternate Routes', Layers3, 'Compare diverse top-k routes instead of a single rigid answer.'],
    ['Smart Recommendations', Sparkles, 'Rank attractions by interests, distance, rating, budget, and trip duration.'],
  ];
  return (
    <main>
      <section className="relative min-h-[76vh] overflow-hidden">
        <img src={heroImage} alt="Taj Mahal at sunrise" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/35 to-transparent" />
        <div className="relative mx-auto flex min-h-[76vh] max-w-[1400px] items-center px-5 py-16">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl text-white">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-bold backdrop-blur-xl">
              <Sparkles size={16} /> Powered by graph algorithms
            </div>
            <h1 className="text-5xl font-black leading-tight md:text-7xl">Plan the Perfect Indian Trip with AI</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/90">Build optimized routes across India using C++ graph algorithms, budget-aware planning, shortest paths, alternate-route search, and intelligent recommendations.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/trip-planner" className="rounded-full bg-gradient-to-r from-teal-400 via-emerald-400 to-blue-500 px-7 py-4 font-black text-white shadow-2xl shadow-teal-500/30 transition hover:-translate-y-1">Start Planning</Link>
              <Link to="/explore" className="rounded-full border border-white/35 bg-white/15 px-7 py-4 font-black text-white backdrop-blur-xl transition hover:bg-white/25">Explore India</Link>
            </div>
          </motion.div>
        </div>
      </section>
      <section className="mx-auto -mt-16 grid max-w-[1400px] gap-5 px-5 pb-16 md:grid-cols-5">
        {features.map(([title, Icon, copy], i) => (
          <motion.div key={title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="glass-card rounded-[20px] p-5 transition hover:-translate-y-2 hover:shadow-2xl">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-teal-400 to-purple-500 text-white shadow-lg">
              <Icon size={22} />
            </div>
            <h3 className="font-black">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{copy}</p>
          </motion.div>
        ))}
      </section>
      <section className="mx-auto grid max-w-[1400px] gap-5 px-5 pb-16 md:grid-cols-4">
        <StatCard label="Graph Nodes" value={stats?.nodes ?? 'Live'} icon={MapPinned} />
        <StatCard label="Weighted Edges" value={stats?.edges ?? 'Ready'} icon={RouteIcon} />
        <StatCard label="Components" value={stats?.components ?? 'Connected'} icon={Activity} />
        <StatCard label="Algorithms" value="9+" icon={BarChart3} />
      </section>
    </main>
  );
}

function Explore({ places }) {
  const [query, setQuery] = useState('');
  const filtered = places.filter((p) => `${p.name} ${p.state} ${p.category}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <PageShell title="Explore India" subtitle="Browse hand-picked cities, heritage sites, beaches, parks, and cultural hubs from the local dataset.">
      <div className="glass-card mb-8 flex items-center gap-3 rounded-[20px] p-4">
        <Search className="text-teal-600" />
        <input className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400" placeholder="Search by destination, state, category..." value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {filtered.slice(0, 48).map((place) => <DestinationCard key={place.id} place={place} />)}
      </div>
    </PageShell>
  );
}

function TripPlanner({ places, showToast }) {
  const [start, setStart] = useState(places[0]?.id || 0);
  const [candidates, setCandidates] = useState(places.slice(1, 8).map((p) => p.id));
  const [budget, setBudget] = useState(30000);
  const [days, setDays] = useState(5);
  const [mode, setMode] = useState('heuristic');
  const [k, setK] = useState(3);
  const [transport, setTransport] = useState('Road trip');
  const [interests, setInterests] = useState('history, nature, food');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [result, setResult] = useState(null);
  const [alternates, setAlternates] = useState([]);
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const byId = useMemo(() => new Map(places.map((p) => [p.id, p])), [places]);
  const routePlaces = (result?.route || []).map((id) => byId.get(id)).filter(Boolean);
  const mapRoute = result?.route?.length ? result.route : [start, ...candidates];

  useEffect(() => {
    if (places.length) {
      setStart(places[0].id);
      setCandidates(places.slice(1, 8).map((p) => p.id));
    }
  }, [places]);

  const toggleCandidate = (id) => setCandidates((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  const moveCandidate = (index, direction) => setCandidates((current) => {
    const next = [...current];
    const target = index + direction;
    if (target < 0 || target >= next.length) return current;
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });

  const optimize = async () => {
    if (!candidates.length) {
      setError('Select at least one destination.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = { start, candidates, budget, days, mode, interests: splitInterests(interests), k };
      const route = await api.optimizeRoute(payload);
      setResult(route);
      const topK = await api.topKRoutes(payload);
      setAlternates(topK.routes || []);
      setItinerary(await api.itinerary({ route: route.route || [], days, hoursPerDay: 8 }));
      showToast('Trip optimized successfully.');
    } catch (err) {
      setError(err.message || 'Unable to optimize route.');
      showToast('Route optimization failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto grid max-w-[1700px] gap-6 px-4 py-6 xl:grid-cols-[360px_minmax(0,1fr)_360px]">
      <aside className="space-y-5">
        <PlannerControlCard
          places={places}
          start={start}
          setStart={setStart}
          candidates={candidates}
          toggleCandidate={toggleCandidate}
          moveCandidate={moveCandidate}
          budget={budget}
          setBudget={setBudget}
          days={days}
          setDays={setDays}
          interests={interests}
          setInterests={setInterests}
          mode={mode}
          setMode={setMode}
          k={k}
          setK={setK}
          transport={transport}
          setTransport={setTransport}
          destinationQuery={destinationQuery}
          setDestinationQuery={setDestinationQuery}
          loading={loading}
          optimize={optimize}
          error={error}
        />
      </aside>
      <section className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-[24px] bg-white/80 p-3 shadow-2xl shadow-blue-900/10 ring-1 ring-white/70 backdrop-blur dark:bg-white/10 dark:ring-white/10">
          <Suspense fallback={<div className="grid min-h-96 place-items-center rounded-[24px] bg-white/70 text-sm font-black text-slate-500 dark:bg-white/10 dark:text-slate-300">Loading interactive map...</div>}>
            <MapView places={places} route={mapRoute} alternates={alternates} />
          </Suspense>
        </motion.div>
        <AlternateRoutes routes={alternates} places={places} />
        <ItineraryCards itinerary={itinerary} places={places} />
      </section>
      <aside className="space-y-5">
        <RouteSummary result={result} places={places} days={days} routePlaces={routePlaces} transport={transport} />
        <TopAttractions places={routePlaces.length ? routePlaces : places.slice(0, 4)} />
      </aside>
    </main>
  );
}

function PlannerControlCard(props) {
  const { places, start, setStart, candidates, toggleCandidate, moveCandidate, budget, setBudget, days, setDays, interests, setInterests, mode, setMode, k, setK, transport, setTransport, destinationQuery, setDestinationQuery, loading, optimize, error } = props;
  const [activeDestination, setActiveDestination] = useState(0);
  const destinationMatches = places
    .filter((p) => p.id !== start)
    .filter((p) => `${p.name} ${p.state} ${p.category}`.toLowerCase().includes(destinationQuery.toLowerCase()))
    .slice(0, 32);
  const handleDestinationKey = (event) => {
    if (!destinationMatches.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveDestination((index) => Math.min(index + 1, destinationMatches.length - 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveDestination((index) => Math.max(index - 1, 0));
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      toggleCandidate(destinationMatches[activeDestination].id);
    }
  };
  return (
    <motion.div initial={{ opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} className="glass-card overflow-hidden rounded-[24px]">
      <img src="https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=900&q=80" alt="India travel" className="h-44 w-full object-cover" />
      <div className="space-y-5 p-5">
        <div>
          <h1 className="text-2xl font-black">Trip Planner</h1>
          <p className="text-sm text-slate-500 dark:text-slate-300">Tune constraints and let the C++ optimizer build your route.</p>
        </div>
        <Field label="Start City">
          <PlaceAutocomplete places={places} value={start} onChange={setStart} placeholder="Search start city..." />
        </Field>
        <Field label="Destinations">
          <div className="mb-3 flex items-center gap-2 rounded-2xl border border-white/70 bg-white/75 px-3 py-2 shadow-inner dark:border-white/10 dark:bg-white/10">
            <Search size={16} className="text-teal-600" />
            <input aria-label="Search destinations" className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400" placeholder="Search destinations..." value={destinationQuery} onChange={(e) => { setDestinationQuery(e.target.value); setActiveDestination(0); }} onKeyDown={handleDestinationKey} />
            <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-black text-teal-800">{candidates.length}</span>
          </div>
          <div className="max-h-64 space-y-2 overflow-auto pr-1" role="listbox" aria-label="Destination results">
            {destinationMatches.map((p, index) => (
              <button key={p.id} type="button" onMouseEnter={() => setActiveDestination(index)} onClick={() => toggleCandidate(p.id)} className={`flex w-full items-center gap-3 rounded-2xl border p-2 text-left transition hover:-translate-y-0.5 ${candidates.includes(p.id) ? 'border-teal-300 bg-teal-50 shadow-md dark:bg-teal-400/15' : index === activeDestination ? 'border-blue-200 bg-blue-50 dark:border-blue-300/30 dark:bg-blue-400/10' : 'border-white/60 bg-white/70 dark:border-white/10 dark:bg-white/5'}`} role="option" aria-selected={candidates.includes(p.id)}>
                <img src={imgFor(p)} alt={p.name} className="h-12 w-14 rounded-xl object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black">{p.name}</span>
                  <span className="block truncate text-xs text-slate-500 dark:text-slate-300">{p.state} · {p.category}</span>
                </span>
                <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-black text-amber-600">★ {p.rating || 4.5}</span>
              </button>
            ))}
            {destinationMatches.length === 0 && <div className="rounded-2xl bg-white/70 p-4 text-sm font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-300">No destinations match that search.</div>}
          </div>
          {candidates.length > 0 && (
            <div className="mt-3 space-y-2">
              {candidates.map((id, index) => {
                const place = places.find((p) => p.id === id);
                if (!place) return null;
                return (
                  <div key={id} className="flex items-center gap-2 rounded-2xl bg-white/75 px-2 py-2 shadow-sm dark:bg-white/10">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-teal-500 text-xs font-black text-white">{index + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-xs font-black text-slate-700 dark:text-slate-100">{place.name}</span>
                    <button type="button" aria-label={`Move ${place.name} earlier`} onClick={() => moveCandidate(index, -1)} disabled={index === 0} className="icon-button"><ChevronUp size={14} /></button>
                    <button type="button" aria-label={`Move ${place.name} later`} onClick={() => moveCandidate(index, 1)} disabled={index === candidates.length - 1} className="icon-button"><ChevronDown size={14} /></button>
                    <button type="button" aria-label={`Remove ${place.name}`} onClick={() => toggleCandidate(id)} className="icon-button text-rose-600"><X size={14} /></button>
                  </div>
                );
              })}
            </div>
          )}
        </Field>
        <Field label={`Budget ${money(budget)}`}>
          <input type="range" min="5000" max="120000" step="1000" value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="w-full accent-teal-500" />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Travel Days"><input className="premium-input" type="number" min="1" value={days} onChange={(e) => setDays(Number(e.target.value))} /></Field>
          <Field label="Top-K Routes"><input className="premium-input" type="number" min="1" max="8" value={k} onChange={(e) => setK(Number(e.target.value))} /></Field>
        </div>
        <Field label="Interests"><input className="premium-input" value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="history, food, nature" /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Transport"><select className="premium-input" value={transport} onChange={(e) => setTransport(e.target.value)}><option>Road trip</option><option>Train mix</option><option>Flight + cab</option></select></Field>
          <Field label="Optimization"><select className="premium-input" value={mode} onChange={(e) => setMode(e.target.value)}><option value="heuristic">Heuristic</option><option value="exact">Exact</option></select></Field>
        </div>
        <button type="button" aria-live="polite" onClick={optimize} disabled={loading} className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-teal-500 via-blue-500 to-purple-600 px-5 py-4 font-black text-white shadow-xl shadow-blue-500/25 transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-70">
          <span className="absolute inset-0 translate-x-[-100%] bg-white/20 transition group-hover:translate-x-[100%]" />
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
          {loading ? 'Optimizing...' : 'Optimize Route'}
        </button>
        {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div>}
      </div>
    </motion.div>
  );
}

function RouteSummary({ result, places, days, routePlaces, transport }) {
  if (!result) {
    return (
      <div className="glass-card rounded-[24px] p-5">
        <img src={routeImage} alt="Route preview" className="mb-4 h-36 w-full rounded-[20px] object-cover" />
        <h2 className="text-xl font-black">Your route summary</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">No route generated yet. Choose destinations and click Optimize to see cost, distance, value score, route order, and day-wise itinerary.</p>
      </div>
    );
  }
  const chartData = [
    { name: 'Cost', value: Math.round(result.cost || 0) },
    { name: 'Value', value: result.value || 0 },
    { name: 'Distance', value: Math.round(result.distanceKm || 0) },
  ];
  return (
    <motion.div initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} className="glass-card rounded-[24px] p-5">
      <img src={routePlaces[0] ? imgFor(routePlaces[0]) : routeImage} alt="Route" className="mb-4 h-36 w-full rounded-[20px] object-cover" />
      <h2 className="text-xl font-black">Optimized Route</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Metric label="Total Cost" value={money(result.cost)} icon={CreditCard} />
        <Metric label="Distance" value={distance(result.distanceKm)} icon={RouteIcon} />
        <Metric label="Value Score" value={result.value ?? 'Not calculated'} icon={Star} />
        <Metric label="Algorithm" value={result.algorithm || result.mode || 'Optimized'} icon={Bot} />
        <Metric label="Travel Days" value={`${days} days`} icon={CalendarIcon} />
        <Metric label="Est. Time" value={result.travelHours ? `${Math.round(result.travelHours)} hrs` : transport} icon={Activity} />
      </div>
      <div className="mt-5 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis hide />
            <Tooltip />
            <Bar dataKey="value" radius={[10, 10, 0, 0]}>
              {chartData.map((_, i) => <Cell key={i} fill={['#14b8a6', '#8b5cf6', '#3b82f6'][i]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-5">
        <h3 className="font-black">Route Order</h3>
        <div className="mt-3 space-y-2">
          {(result.route || []).map((id, index) => (
            <div key={`${id}-${index}`} className="flex items-center gap-3 rounded-2xl bg-white/70 p-3 dark:bg-white/10">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-teal-400 to-blue-500 text-sm font-black text-white">{index + 1}</span>
              <span className="font-bold">{placeName(places, id)}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function TopAttractions({ places }) {
  return (
    <div className="glass-card rounded-[24px] p-5">
      <h2 className="text-xl font-black">Top Attractions</h2>
      <div className="mt-4 space-y-3">
        {places.slice(0, 4).map((p) => (
          <div key={p.id} className="flex gap-3 rounded-2xl bg-white/70 p-3 transition hover:-translate-y-1 hover:shadow-lg dark:bg-white/10">
            <img src={imgFor(p)} alt={p.name} className="h-16 w-20 rounded-2xl object-cover" />
            <div>
              <div className="font-black">{p.name}</div>
              <div className="mt-1 flex items-center gap-1 text-sm text-amber-500"><Star size={14} fill="currentColor" /> {p.rating || 4.5}</div>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-300">High-value stop for culture, food, landscapes, and local experiences.</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlternateRoutes({ routes, places }) {
  if (!routes.length) {
    return (
      <div className="glass-card rounded-[24px] p-5">
        <h2 className="text-xl font-black">Alternate Routes</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Optimize a route to compare diverse alternatives.</p>
      </div>
    );
  }
  return (
    <div>
      <h2 className="mb-4 text-2xl font-black">Alternate Routes</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {routes.map((route, index) => (
          <motion.div key={index} whileHover={{ y: -6 }} className="glass-card rounded-[22px] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="font-black">Route {index + 1}</div>
              <span className="h-3 w-10 rounded-full" style={{ background: ['#14b8a6', '#3b82f6', '#8b5cf6'][index % 3] }} />
            </div>
            <div className="grid gap-2 text-sm">
              <span>Cost: <b>{money(route.cost)}</b></span>
              <span>Distance: <b>{distance(route.distanceKm)}</b></span>
              <span>Value: <b>{route.value}</b></span>
              <span>Algorithm: <b>{route.algorithm || route.mode}</b></span>
            </div>
            <p className="mt-3 line-clamp-2 text-xs text-slate-500 dark:text-slate-300">{(route.route || []).map((id) => placeName(places, id)).join(' -> ')}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ItineraryCards({ itinerary, places }) {
  const days = itinerary?.days || [];
  if (!days.length) {
    return (
      <div className="glass-card rounded-[24px] p-5">
        <h2 className="text-xl font-black">Trip Itinerary</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Day cards appear after optimization.</p>
      </div>
    );
  }
  return (
    <div>
      <h2 className="mb-4 text-2xl font-black">Trip Itinerary</h2>
      <div className="flex gap-4 overflow-x-auto pb-3">
        {days.map((day) => {
          const first = places.find((p) => p.id === day.places?.[0]);
          return (
            <motion.div key={day.day} whileHover={{ y: -6 }} className="glass-card min-w-[280px] rounded-[24px] p-4">
              <img src={first ? imgFor(first) : imagePool[day.day % imagePool.length]} alt={`Day ${day.day}`} className="h-32 w-full rounded-[20px] object-cover" />
              <div className="mt-4 text-sm font-bold text-teal-600">Day {day.day}</div>
              <h3 className="text-xl font-black">{first?.name || 'Flexible day'}</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Attractions: {(day.places || []).map((id) => placeName(places, id)).join(', ') || 'Open exploration'}</p>
              <div className="mt-3 space-y-1 text-sm">
                <div>Hotel: Boutique heritage stay</div>
                <div>Restaurants: Local tasting trail</div>
                <div>Time: {Number(day.usedHours || 0).toFixed(1)} hrs</div>
                <div>Cost: {money((day.usedHours || 1) * 1200)}</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function GroupPlanner({ places, showToast }) {
  const [travelers, setTravelers] = useState([{ name: '', budget: '', age: '', availableDays: '', interests: '' }]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const byId = new Map(places.map((p) => [p.id, p]));

  const update = (index, key, value) => setTravelers((current) => current.map((t, i) => i === index ? { ...t, [key]: value } : t));
  const addTraveler = () => setTravelers((current) => [...current, { name: '', budget: '', age: '', availableDays: '', interests: '' }]);
  const removeTraveler = (index) => setTravelers((current) => current.length === 1 ? current : current.filter((_, i) => i !== index));

  const optimize = async () => {
    const normalized = travelers.map((t, index) => ({
      name: t.name.trim() || `Traveler ${index + 1}`,
      budget: Number(t.budget),
      age: Number(t.age) || 0,
      availableDays: Number(t.availableDays) || 1,
      interests: splitInterests(t.interests),
      preferredCategories: [],
    })).filter((t) => t.budget > 0);
    if (!normalized.length) {
      setError('Add at least one traveler with a budget.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = { start: places[0]?.id || 0, candidates: places.slice(1, 16).map((p) => p.id), travelers: normalized };
      setResult(await api.groupTrip(payload));
      showToast('Group trip optimized.');
    } catch (err) {
      setError(err.message || 'Unable to optimize group trip.');
      showToast('Group optimization failed.');
    } finally {
      setLoading(false);
    }
  };

  const pieData = (result?.travelers || []).map((t) => ({ name: t.name, value: Math.round(t.cost || 0) }));
  return (
    <PageShell title="Group Planner" subtitle="Create traveler cards, optimize a shared route, then compare budget usage and satisfaction.">
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            {travelers.map((traveler, index) => (
              <motion.div key={index} whileHover={{ y: -5 }} className="glass-card rounded-[24px] p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className={`grid h-14 w-14 place-items-center rounded-full ${avatarGradient} text-lg font-black text-white`}>{traveler.name?.[0]?.toUpperCase() || index + 1}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-black">Traveler {index + 1}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-300">Personal preferences</div>
                  </div>
                  <button type="button" onClick={() => removeTraveler(index)} disabled={travelers.length === 1} className="icon-button text-rose-600" aria-label={`Remove traveler ${index + 1}`}><Trash2 size={15} /></button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Name"><input aria-label={`Traveler ${index + 1} name`} className="premium-input" placeholder="Traveler name" value={traveler.name} onChange={(e) => update(index, 'name', e.target.value)} /></Field>
                  <Field label="Budget"><input aria-label={`Traveler ${index + 1} budget`} className="premium-input" type="number" min="1" placeholder="20000" value={traveler.budget} onChange={(e) => update(index, 'budget', e.target.value)} /></Field>
                  <Field label="Age"><input aria-label={`Traveler ${index + 1} age`} className="premium-input" type="number" min="1" placeholder="30" value={traveler.age} onChange={(e) => update(index, 'age', e.target.value)} /></Field>
                  <Field label="Days"><input aria-label={`Traveler ${index + 1} days`} className="premium-input" type="number" min="1" placeholder="4" value={traveler.availableDays} onChange={(e) => update(index, 'availableDays', e.target.value)} /></Field>
                </div>
                <Field label="Interests"><input aria-label={`Traveler ${index + 1} interests`} className="premium-input" placeholder="history, food, nature" value={traveler.interests} onChange={(e) => update(index, 'interests', e.target.value)} /></Field>
              </motion.div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={addTraveler} className="btn-secondary">Add Traveler</button>
            <button type="button" onClick={optimize} disabled={loading} className="btn-primary disabled:opacity-70">
              {loading ? <Loader2 className="animate-spin" /> : <Users />}
              {loading ? 'Optimizing...' : 'Optimize Group Trip'}
            </button>
          </div>
          {error && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 font-semibold text-rose-700">{error}</div>}
        </section>
        <aside className="space-y-5">
          <div className="glass-card rounded-[24px] p-5">
            <h2 className="text-xl font-black">Shared Route</h2>
            {!result ? <p className="mt-3 text-sm text-slate-500 dark:text-slate-300">Add traveler budgets and interests to generate a shared route.</p> : (
              <div className="mt-4 space-y-2">{(result.sharedRoute || []).map((id, i) => <div key={id} className="flex items-center gap-3 rounded-2xl bg-teal-50 px-3 py-2 text-sm font-black text-teal-800 dark:bg-teal-400/15 dark:text-teal-100"><span className="grid h-7 w-7 place-items-center rounded-full bg-teal-500 text-white">{i + 1}</span>{byId.get(id)?.name || id}</div>)}</div>
            )}
          </div>
          {result && (
            <>
              <div className="glass-card rounded-[24px] p-5">
                <h2 className="text-xl font-black">Budget Distribution</h2>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={82}>
                        {pieData.map((_, i) => <Cell key={i} fill={['#14b8a6', '#3b82f6', '#8b5cf6', '#f97316'][i % 4]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {(result.travelers || []).map((t) => (
                <div key={t.name} className="glass-card rounded-[24px] p-5">
                  <div className="flex items-center gap-3">
                    <div className={`grid h-12 w-12 place-items-center rounded-full ${avatarGradient} font-black text-white`}>{t.name[0]}</div>
                    <div><div className="font-black">{t.name}</div><div className="text-xs text-slate-500 dark:text-slate-300">Personal plan</div></div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <Metric label="Budget Usage" value={money(t.cost)} icon={WalletCards} />
                    <Metric label="Value Score" value={t.value} icon={Star} />
                  </div>
                  <div className="mt-4 rounded-2xl bg-white/70 p-3 text-sm dark:bg-white/10">
                    <b>Personal route:</b> {(t.addOns || []).map((id) => byId.get(id)?.name || id).join(', ') || 'Shared route covers core preferences.'}
                  </div>
                </div>
              ))}
            </>
          )}
        </aside>
      </div>
    </PageShell>
  );
}

function Recommendations({ places, showToast }) {
  const [origin, setOrigin] = useState(places[0]?.id || 0);
  const [budget, setBudget] = useState(20000);
  const [days, setDays] = useState(4);
  const [interests, setInterests] = useState('history, nature');
  const [ids, setIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const byId = new Map(places.map((p) => [p.id, p]));
  const recs = ids.map((id) => byId.get(id)).filter(Boolean);
  const run = async () => {
    setLoading(true);
    try {
      const res = await api.recommend({ origin, budget, days, interests: splitInterests(interests), limit: 12 });
      setIds((res.results || res.places || []).map((item) => typeof item === 'number' ? item : item.id));
      showToast('Recommendations generated.');
    } catch {
      showToast('Recommendation API unavailable.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <PageShell title="Smart Recommendations" subtitle="Premium travel cards ranked by interests, rating, budget, trip duration, and distance.">
      <div className="glass-card mb-8 grid gap-4 rounded-[24px] p-5 md:grid-cols-5">
        <Field label="Origin"><PlaceAutocomplete places={places} value={origin} onChange={setOrigin} placeholder="Search origin..." /></Field>
        <Field label="Budget"><input className="premium-input" type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} /></Field>
        <Field label="Days"><input className="premium-input" type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} /></Field>
        <Field label="Interests"><input className="premium-input" value={interests} onChange={(e) => setInterests(e.target.value)} /></Field>
        <button onClick={run} className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-blue-600 px-5 py-3 font-black text-white shadow-xl">{loading ? <Loader2 className="animate-spin" /> : <Sparkles />} Generate</button>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {(recs.length ? recs : places.slice(0, 8)).map((p) => <DestinationCard key={p.id} place={p} />)}
      </div>
    </PageShell>
  );
}

function SavedTrips({ places }) {
  const storageKey = 'tripcraft.savedTrips';
  const [trips, setTrips] = useState([]);
  const [name, setName] = useState('Weekend India Circuit');
  const [budget, setBudget] = useState(45000);
  const [duration, setDuration] = useState(5);
  const [draftIds, setDraftIds] = useState(places.slice(0, 3).map((p) => p.id));
  const [destinationToAdd, setDestinationToAdd] = useState(places[0]?.id || 0);

  const loadTrips = () => {
    try {
      setTrips(JSON.parse(window.localStorage.getItem(storageKey) || '[]'));
    } catch {
      setTrips([]);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  useEffect(() => {
    if (!draftIds.length && places.length) {
      setDraftIds(places.slice(0, 3).map((p) => p.id));
      setDestinationToAdd(places[0].id);
    }
  }, [places, draftIds.length]);

  const persist = (next) => {
    setTrips(next);
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  };

  const createTrip = () => {
    const cleaned = draftIds.filter((id, index, ids) => ids.indexOf(id) === index);
    if (!cleaned.length) return;
    persist([
      {
        id: Date.now(),
        name: name.trim() || 'Saved India Trip',
        ids: cleaned,
        budget: Number(budget) || 1,
        duration: Number(duration) || 1,
        createdAt: new Date().toISOString(),
      },
      ...trips,
    ]);
  };

  const renameTrip = (id, nextName) => persist(trips.map((trip) => trip.id === id ? { ...trip, name: nextName || trip.name } : trip));
  const deleteTrip = (id) => persist(trips.filter((trip) => trip.id !== id));
  const addDraftDestination = () => setDraftIds((current) => current.includes(destinationToAdd) ? current : [...current, destinationToAdd]);
  const removeDraftDestination = (id) => setDraftIds((current) => current.filter((x) => x !== id));

  return (
    <PageShell title="Saved Trips" subtitle="Persist local trip ideas, reload them across sessions, and keep portfolio demos interactive without a database.">
      <div className="glass-card mb-8 grid gap-5 rounded-[24px] p-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section>
          <h2 className="text-xl font-black">Create Saved Trip</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Field label="Trip Name"><input aria-label="Trip name" className="premium-input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Budget"><input aria-label="Trip budget" className="premium-input" type="number" min="1" value={budget} onChange={(e) => setBudget(Number(e.target.value))} /></Field>
            <Field label="Days"><input aria-label="Trip days" className="premium-input" type="number" min="1" value={duration} onChange={(e) => setDuration(Number(e.target.value))} /></Field>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <PlaceAutocomplete places={places} value={destinationToAdd} onChange={setDestinationToAdd} placeholder="Add destination..." />
            <button type="button" onClick={addDraftDestination} className="btn-primary"><Save size={18} /> Add Stop</button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {draftIds.map((id, index) => (
              <button key={id} type="button" onClick={() => removeDraftDestination(id)} className="rounded-full bg-teal-100 px-3 py-2 text-xs font-black text-teal-800 transition hover:bg-rose-100 hover:text-rose-700" aria-label={`Remove ${placeName(places, id)}`}>
                {index + 1}. {placeName(places, id)} <X className="ml-1 inline" size={12} />
              </button>
            ))}
          </div>
        </section>
        <aside className="flex flex-col justify-end gap-3">
          <button type="button" onClick={createTrip} className="btn-primary"><Save size={18} /> Save Trip</button>
          <button type="button" onClick={loadTrips} className="btn-secondary"><Activity size={18} /> Reload</button>
        </aside>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {trips.map((trip, i) => (
          <motion.div key={trip.id} whileHover={{ y: -8 }} className="glass-card overflow-hidden rounded-[24px]">
            <img src={imgFor(places.find((p) => p.id === trip.ids[0]) || i + 3)} alt={trip.name} className="h-52 w-full object-cover" />
            <div className="p-5">
              <div className="flex items-start gap-2">
                <input aria-label={`Rename ${trip.name}`} className="min-w-0 flex-1 bg-transparent text-xl font-black outline-none focus-visible:ring-2 focus-visible:ring-teal-300" value={trip.name} onChange={(e) => renameTrip(trip.id, e.target.value)} />
                <Edit3 className="mt-1 text-slate-400" size={16} />
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">{trip.ids.map((id) => placeName(places, id)).join(' -> ')}</p>
              <div className="mt-4 flex justify-between text-sm font-bold"><span>{money(trip.budget)}</span><span>{trip.duration} days</span></div>
              <button type="button" onClick={() => deleteTrip(trip.id)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 font-black text-rose-700 transition hover:bg-rose-100 dark:bg-rose-400/10 dark:text-rose-200"><Trash2 size={17} /> Delete</button>
            </div>
          </motion.div>
        ))}
        {trips.length === 0 && (
          <div className="glass-card rounded-[24px] p-6 md:col-span-3">
            <h2 className="text-xl font-black">No saved trips yet</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">Create a local trip above and it will stay available after refresh through browser storage.</p>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function About({ stats }) {
  const algorithms = [
    ['BFS / DFS / Components', 'O(V + E)', 'Graph reachability and diagnostics'],
    ['Dijkstra', 'O((V + E) log V)', 'Shortest path'],
    ['A*', 'Guided O(E)', 'Haversine heuristic'],
    ['Bellman-Ford', 'O(VE)', 'Flexible edge models'],
    ['Held-Karp DP', 'O(n²2ⁿ)', 'Exact optimizer up to 18 nodes'],
    ['2-opt / Annealing', 'Heuristic', 'Large route optimization'],
    ['Yen Top-K', 'O(KV(E + V log V))', 'Alternate routes'],
  ];
  return (
    <PageShell title="About the Project" subtitle="A production-style travel platform built to showcase C++ data structures and algorithms through a polished frontend.">
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <section className="space-y-6">
          <div className="glass-card rounded-[24px] p-6">
            <h2 className="text-2xl font-black">Project Overview</h2>
            <p className="mt-3 leading-8 text-slate-600 dark:text-slate-300">TripCraft India combines React, Leaflet/Google Maps, and a C++ Drogon backend that constructs weighted graphs and runs shortest-path, DP, heuristic, top-k, recommendation, group, and itinerary algorithms.</p>
          </div>
          <div className="glass-card rounded-[24px] p-6">
            <h2 className="text-2xl font-black">Architecture</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {['React + Vite UI', 'Drogon API Layer', 'C++ DSA Engine'].map((x, i) => <div key={x} className="rounded-2xl bg-gradient-to-br from-white to-teal-50 p-5 text-center font-black shadow dark:from-white/10 dark:to-white/5">{i + 1}. {x}</div>)}
            </div>
          </div>
          <div className="glass-card overflow-hidden rounded-[24px] p-6">
            <h2 className="text-2xl font-black">Time Complexity</h2>
            <div className="mt-4 overflow-auto">
              <table className="w-full text-left text-sm">
                <tbody>{algorithms.map((r) => <tr key={r[0]} className="border-t border-white/50"><td className="py-3 font-black">{r[0]}</td><td className="font-semibold text-teal-700">{r[1]}</td><td className="text-slate-500 dark:text-slate-300">{r[2]}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </section>
        <aside className="space-y-6">
          <div className="glass-card rounded-[24px] p-6">
            <h2 className="text-2xl font-black">Tech Stack</h2>
            <div className="mt-4 flex flex-wrap gap-2">{['C++17', 'Drogon', 'React', 'TailwindCSS', 'Leaflet', 'Google Maps', 'Recharts', 'Framer Motion'].map((x) => <span key={x} className="rounded-full bg-white px-3 py-2 text-sm font-black shadow dark:bg-white/10">{x}</span>)}</div>
          </div>
          <div className="glass-card rounded-[24px] p-6">
            <h2 className="text-2xl font-black">Graph Size</h2>
            <div className="mt-4 grid gap-3">
              <Metric label="Nodes" value={stats?.nodes ?? 'Dataset'} icon={MapPinned} />
              <Metric label="Edges" value={stats?.edges ?? 'Weighted'} icon={RouteIcon} />
              <Metric label="Components" value={stats?.components ?? 'Connected'} icon={Activity} />
            </div>
          </div>
          <div className="glass-card rounded-[24px] p-6">
            <h2 className="text-2xl font-black">Team</h2>
            <div className="mt-4 flex items-center gap-3"><div className={`grid h-14 w-14 place-items-center rounded-full ${avatarGradient} font-black text-white`}>SE</div><div><div className="font-black">Software Engineering Portfolio</div><div className="text-sm text-slate-500 dark:text-slate-300">Frontend + C++ algorithm systems</div></div></div>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

function DestinationCard({ place }) {
  const description = `${place.state} destination for ${(place.interests || ['culture', 'food']).slice(0, 2).join(' and ')} with a ${place.rating || 4.5} traveler rating.`;
  return (
    <motion.div whileHover={{ y: -8 }} className="glass-card group overflow-hidden rounded-[24px]">
      <div className="relative">
        <img src={imgFor(place)} alt={place.name} loading="lazy" className="h-56 w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-sm font-black text-slate-800 backdrop-blur"><Star size={14} className="mr-1 inline fill-amber-400 text-amber-400" />{place.rating || 4.5}</div>
      </div>
      <div className="p-5">
        <h3 className="text-xl font-black">{place.name}</h3>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-300">{place.state}</p>
        <p className="mt-3 min-h-[3rem] text-sm leading-6 text-slate-500 dark:text-slate-300">{description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-black text-teal-800">{place.category || 'destination'}</span>
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black text-purple-800">{money(place.cost)}</span>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-800"><Clock size={12} className="mr-1 inline" />{place.visitHours || 3} hrs</span>
        </div>
        <Link to="/trip-planner" className="mt-5 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-teal-500 to-blue-600 px-4 py-3 font-black text-white shadow-lg transition hover:-translate-y-1">Plan Stop</Link>
      </div>
    </motion.div>
  );
}

function PageShell({ title, subtitle, children }) {
  return (
    <main className="mx-auto max-w-[1500px] px-4 py-8">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-black text-teal-700 shadow backdrop-blur dark:bg-white/10 dark:text-teal-200"><Sparkles size={16} /> Premium planner</div>
        <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">{title}</h1>
        <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-300">{subtitle}</p>
      </motion.div>
      {children}
    </main>
  );
}

function Field({ label, children }) {
  return <label className="block text-sm font-black text-slate-700 dark:text-slate-200"><span className="mb-2 block">{label}</span>{children}</label>;
}

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl bg-white/75 p-3 shadow-sm dark:bg-white/10">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-300">{Icon && <Icon size={14} />}{label}</div>
      <div className="mt-1 text-base font-black">{value}</div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="glass-card rounded-[24px] p-5">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-teal-400 to-purple-500 text-white"><Icon /></div>
      <div className="mt-4 text-3xl font-black">{value}</div>
      <div className="text-sm font-semibold text-slate-500 dark:text-slate-300">{label}</div>
    </div>
  );
}

function CalendarIcon(props) {
  return <Activity {...props} />;
}

function ErrorPage() {
  return (
    <PageShell title="Page not found" subtitle="This travel route does not exist yet. Return home or start a new plan.">
      <Link to="/" className="inline-flex rounded-2xl bg-gradient-to-r from-teal-500 to-purple-600 px-6 py-3 font-black text-white">Back Home</Link>
    </PageShell>
  );
}
