import React, { useState } from 'react';
import useSWR from 'swr';
import { Database, Plus, RefreshCw, Warehouse } from 'lucide-react';
import { brgApi } from '../services/brgApi';
import { useAppStore } from '../store/appStore';

export const ResourceManagementPage: React.FC = () => {
  const currentUser = useAppStore((store) => store.currentUser);
  const canManage = ['national_admin', 'state_admin', 'district_admin'].includes(currentUser?.role ?? '');
  const { data: resourceEnvelope, isLoading: resourcesLoading, mutate: refreshResources } = useSWR('brg-resources', brgApi.resources, { revalidateOnFocus: true, shouldRetryOnError: false });
  const { data: shelterEnvelope, isLoading: sheltersLoading, mutate: refreshShelters } = useSWR('brg-shelters-all', () => brgApi.shelters(), { revalidateOnFocus: true, shouldRetryOnError: false });
  const [panel, setPanel] = useState<'resource' | 'shelter' | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('supply');
  const [quantity, setQuantity] = useState('');
  const [available, setAvailable] = useState('');
  const [address, setAddress] = useState('');
  const [state, setState] = useState(currentUser?.stateAssigned ?? '');
  const [district, setDistrict] = useState(currentUser?.districtAssigned ?? '');
  const [capacity, setCapacity] = useState('');
  const [occupancy, setOccupancy] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const resources = resourceEnvelope?.data ?? [];
  const shelters = shelterEnvelope?.data ?? [];

  const reset = () => {
    setName(''); setCategory('supply'); setQuantity(''); setAvailable(''); setAddress(''); setCapacity(''); setOccupancy(''); setLatitude(''); setLongitude('');
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!panel || !canManage) return;
    if (Boolean(latitude) !== Boolean(longitude)) {
      setError('Provide both coordinates or leave both blank.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const location = {
        state: state.trim(),
        district: district.trim() || undefined,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
      };
      if (panel === 'resource') {
        await brgApi.createResource({ name: name.trim(), category, quantity: Number(quantity), available: Number(available), ...location });
        await refreshResources();
      } else {
        await brgApi.createShelter({ name: name.trim(), address: address.trim(), ...location, capacity: capacity ? Number(capacity) : undefined, occupancy: occupancy ? Number(occupancy) : undefined, status: 'standby' });
        await refreshShelters();
      }
      reset();
      setPanel(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Record could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Resource coordination</p><h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">Resources and shelters</h1><p className="mt-1 text-sm text-slate-400">Persisted inventory only. Empty registries remain empty until an authorized operator records data.</p></div>
        <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-slate-700 px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-300">RESOURCE {resourceEnvelope?.status ?? 'CHECKING'}</span><button type="button" onClick={() => { void refreshResources(); void refreshShelters(); }} className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:text-white" aria-label="Refresh resource records"><RefreshCw size={15} /></button>{canManage && <><button type="button" onClick={() => setPanel('resource')} className="inline-flex items-center gap-1 rounded-lg bg-sky-500 px-3 py-2 text-xs font-semibold text-slate-950"><Plus size={13} /> Add resource</button><button type="button" onClick={() => setPanel('shelter')} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200"><Warehouse size={13} /> Add shelter</button></>}</div>
      </header>

      {panel && <form onSubmit={submit} className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:grid-cols-2 xl:grid-cols-3">
        <h2 className="text-sm font-semibold text-slate-100 sm:col-span-2 xl:col-span-3">New {panel === 'resource' ? 'resource' : 'shelter'} record</h2>
        <label className="text-xs text-slate-400">Name<input value={name} onChange={(event) => setName(event.target.value)} required maxLength={160} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100" /></label>
        {panel === 'resource' ? <label className="text-xs text-slate-400">Category<select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100"><option value="medical">Medical</option><option value="vehicle">Vehicle</option><option value="equipment">Equipment</option><option value="personnel">Personnel</option><option value="supply">Supply</option></select></label> : <label className="text-xs text-slate-400">Address<input value={address} onChange={(event) => setAddress(event.target.value)} required maxLength={240} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100" /></label>}
        <label className="text-xs text-slate-400">State<input value={state} onChange={(event) => setState(event.target.value)} required maxLength={100} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100" /></label>
        <label className="text-xs text-slate-400">District<input value={district} onChange={(event) => setDistrict(event.target.value)} maxLength={100} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100" /></label>
        {panel === 'resource' ? <><label className="text-xs text-slate-400">Total quantity<input type="number" min="0" value={quantity} onChange={(event) => setQuantity(event.target.value)} required className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100" /></label><label className="text-xs text-slate-400">Available quantity<input type="number" min="0" value={available} onChange={(event) => setAvailable(event.target.value)} required className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100" /></label></> : <><label className="text-xs text-slate-400">Capacity (optional)<input type="number" min="0" value={capacity} onChange={(event) => setCapacity(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100" /></label><label className="text-xs text-slate-400">Occupancy (optional)<input type="number" min="0" value={occupancy} onChange={(event) => setOccupancy(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100" /></label></>}
        <label className="text-xs text-slate-400">Latitude (optional)<input type="number" min="-90" max="90" step="any" value={latitude} onChange={(event) => setLatitude(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100" /></label>
        <label className="text-xs text-slate-400">Longitude (optional)<input type="number" min="-180" max="180" step="any" value={longitude} onChange={(event) => setLongitude(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100" /></label>
        {error && <p className="text-sm text-rose-200 sm:col-span-2 xl:col-span-3" role="alert">{error}</p>}
        <div className="flex justify-end gap-2 sm:col-span-2 xl:col-span-3"><button type="button" onClick={() => { setPanel(null); setError(''); }} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400">Cancel</button><button type="submit" disabled={saving} className="rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50">{saving ? 'Saving…' : 'Save record'}</button></div>
      </form>}

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-xl border border-slate-800 bg-slate-900/60">
          <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3"><div className="flex items-center gap-2"><Database size={15} className="text-sky-300" /><h2 className="text-sm font-semibold text-slate-100">Resource inventory</h2></div><span className="text-xs text-slate-500">{resourceEnvelope?.status ?? 'CHECKING'}</span></header>
          <div className="divide-y divide-slate-800/80">{resources.map((item) => <article key={item.id} className="flex items-center justify-between gap-3 px-4 py-3"><div><p className="text-sm font-medium text-slate-200">{item.name}</p><p className="mt-1 text-xs capitalize text-slate-500">{item.category} · {item.state}{item.district ? ` · ${item.district}` : ''}</p></div><div className="text-right"><p className="font-mono text-sm text-slate-100">{item.available}/{item.quantity}</p><p className="text-[10px] uppercase text-slate-500">{item.status}</p></div></article>)}{!resources.length && <p className="px-4 py-8 text-center text-sm text-slate-500">{resourcesLoading ? 'Loading inventory…' : resourceEnvelope?.status === 'OFFLINE' ? 'Resource service unavailable; no sample inventory is shown.' : 'No resource records are stored.'}</p>}</div>
        </section>
        <section className="rounded-xl border border-slate-800 bg-slate-900/60">
          <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3"><div className="flex items-center gap-2"><Warehouse size={15} className="text-emerald-300" /><h2 className="text-sm font-semibold text-slate-100">Shelters</h2></div><span className="text-xs text-slate-500">{shelterEnvelope?.status ?? 'CHECKING'}</span></header>
          <div className="divide-y divide-slate-800/80">{shelters.map((item) => <article key={item.id} className="flex items-center justify-between gap-3 px-4 py-3"><div><p className="text-sm font-medium text-slate-200">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.address} · {item.state}{item.district ? ` · ${item.district}` : ''}</p></div><div className="text-right"><p className="text-sm text-slate-100">{item.occupancy == null || item.capacity == null ? '—' : `${item.occupancy}/${item.capacity}`}</p><p className="text-[10px] uppercase text-slate-500">{item.status}</p></div></article>)}{!shelters.length && <p className="px-4 py-8 text-center text-sm text-slate-500">{sheltersLoading ? 'Loading shelters…' : shelterEnvelope?.status === 'OFFLINE' ? 'Shelter service unavailable; no sample locations are shown.' : 'No shelter records are stored.'}</p>}</div>
        </section>
      </div>
    </main>
  );
};
