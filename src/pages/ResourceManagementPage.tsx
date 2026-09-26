import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package, Home, Users, Send
} from 'lucide-react';
import { MOCK_SHELTERS, MOCK_RESOURCES } from '../data/mockData';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/Card';
import { Tabs, Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { fetchSheltersApi } from '../utils/api';
import { brgSocket } from '../utils/socket';
import type { Resource, Shelter } from '../types';

const RESOURCE_CATEGORY_ICONS: Record<string, React.ReactNode> = {
  medical: <span>🏥</span>,
  vehicle: <span>🚗</span>,
  equipment: <span>🔧</span>,
  personnel: <span>👤</span>,
  supply: <span>📦</span>,
};

export const ResourceManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('shelters');
  const [shelters, setShelters] = useState<Shelter[]>(MOCK_SHELTERS);
  const [resources, setResources] = useState<Resource[]>(MOCK_RESOURCES);

  useEffect(() => {
    fetchSheltersApi()
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setShelters(res.data);
        }
      })
      .catch((err) => {
        console.warn('Using local mock shelters fallback:', err);
      });
  }, []);

  // Dispatch Modal
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    resourceId: resources[0]?.id || 'RES-001',
    quantity: '20',
    destination: 'Visakhapatnam Cyclone Shelter',
  });

  const handleDispatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(dispatchForm.quantity, 10) || 0;
    if (qty <= 0) return;

    setResources((prev) =>
      prev.map((r) => {
        if (r.id !== dispatchForm.resourceId) return r;
        const newAvailable = Math.max(0, r.available - qty);
        const newAllocated = r.allocated + (r.available - newAvailable);
        const updated = { ...r, available: newAvailable, allocated: newAllocated };
        brgSocket.emit('resource:updated', updated);
        return updated;
      })
    );

    setDispatchModalOpen(false);
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-6 py-5 border-b border-white/6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Package size={20} className="text-cyan-400" />
              Resource & Logistics Management
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Relief shelters, emergency equipment inventory, and supply chain tracking
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<Send size={14} />}
            onClick={() => setDispatchModalOpen(true)}
          >
            Dispatch Supplies
          </Button>
        </div>
      </div>

      <Tabs
        tabs={[
          { id: 'shelters', label: 'Relief Shelters', icon: <Home size={14} />, count: shelters.length },
          { id: 'resources', label: 'Equipment & Stock Inventory', icon: <Package size={14} />, count: resources.length },
        ]}
        active={activeTab}
        onChange={setActiveTab}
        className="px-6"
      />

      <div className="flex-1 p-4 sm:p-6 overflow-auto">
        {activeTab === 'shelters' && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {[
                { label: 'Designated Shelters', value: shelters.length, color: 'text-slate-100' },
                {
                  label: 'Currently Active',
                  value: shelters.filter((s) => s.status === 'active').length,
                  color: 'text-green-400',
                },
                {
                  label: 'Total Bed Capacity',
                  value: shelters.reduce((s, sh) => s + sh.capacity, 0).toLocaleString('en-IN'),
                  color: 'text-slate-100',
                },
                {
                  label: 'Sheltered Citizens',
                  value: shelters.reduce((s, sh) => s + sh.occupancy, 0).toLocaleString('en-IN'),
                  color: 'text-blue-400',
                },
              ].map((item) => (
                <div key={item.label} className="bg-[#0D1828] border border-white/8 rounded-xl p-4 shadow-md">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{item.label}</p>
                  <p className={`text-2xl font-bold mt-1 tabular-nums ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {shelters.map((shelter, idx) => {
                const pct = Math.round((shelter.occupancy / shelter.capacity) * 100);
                return (
                  <motion.div
                    key={shelter.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.04, 0.2) }}
                    className={`bg-[#0D1828] border rounded-xl p-4 space-y-3.5 shadow-lg ${
                      shelter.status === 'full'
                        ? 'border-amber-500/30'
                        : shelter.status === 'active'
                        ? 'border-green-500/20'
                        : 'border-white/8'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-100 leading-snug">{shelter.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {shelter.location.area}, {shelter.location.district}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase border flex-shrink-0 ${
                          shelter.status === 'active'
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : shelter.status === 'full'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : shelter.status === 'closed'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                        }`}
                      >
                        {shelter.status}
                      </span>
                    </div>

                    {/* Occupancy */}
                    <div>
                      <ProgressBar
                        value={shelter.occupancy}
                        max={shelter.capacity}
                        label="Occupancy Load"
                        showValue
                        size="sm"
                        color={pct >= 95 ? 'red' : pct >= 75 ? 'amber' : 'green'}
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        {shelter.occupancy.toLocaleString()} / {shelter.capacity.toLocaleString()} persons ·{' '}
                        <strong className="text-slate-300">{shelter.capacity - shelter.occupancy} beds available</strong>
                      </p>
                    </div>

                    {/* Stocks */}
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      {[
                        { label: '🍱 Food', stock: shelter.foodStock },
                        { label: '💧 Water', stock: shelter.waterStock },
                        { label: '🏥 Medical', stock: shelter.medicalSupport ? 'adequate' : 'none' },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className={`px-2 py-1.5 rounded border text-center ${
                            item.stock === 'adequate'
                              ? 'border-green-500/20 text-green-300 bg-green-500/5'
                              : item.stock === 'low'
                              ? 'border-amber-500/20 text-amber-300 bg-amber-500/5'
                              : item.stock === 'critical'
                              ? 'border-red-500/20 text-red-300 bg-red-500/5'
                              : 'border-slate-500/20 text-slate-500'
                          }`}
                        >
                          <div className="font-semibold">{item.label}</div>
                          <div className="capitalize text-[11px] opacity-90 mt-0.5">{item.stock}</div>
                        </div>
                      ))}
                    </div>

                    {/* Officers */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-white/5">
                      <div className="flex items-center gap-1 text-slate-400">
                        <Users size={12} />
                        <span>{shelter.inChargeOfficer}</span>
                      </div>
                      <span className="font-mono text-slate-400">{shelter.contactNumber}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div className="space-y-4">
            {/* Category breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
              {['medical', 'vehicle', 'equipment', 'personnel', 'supply'].map((cat) => {
                const items = resources.filter((r) => r.category === cat);
                const total = items.reduce((s, r) => s + r.quantity, 0);
                const allocated = items.reduce((s, r) => s + r.allocated, 0);
                return (
                  <div key={cat} className="bg-[#0D1828] border border-white/8 rounded-xl p-3.5 shadow-md">
                    <div className="flex items-center gap-1.5 mb-1">
                      {RESOURCE_CATEGORY_ICONS[cat]}
                      <span className="text-xs font-semibold text-slate-400 capitalize">{cat}</span>
                    </div>
                    <p className="text-xl font-bold text-slate-100 tabular-nums">{total.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-slate-500 mt-0.5 tabular-nums">{allocated.toLocaleString('en-IN')} deployed</p>
                  </div>
                );
              })}
            </div>

            <div className="bg-[#0D1828] border border-white/8 rounded-xl overflow-hidden shadow-xl">
              <table className="data-table min-w-[780px]">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Equipment / Material</th>
                    <th>Depot Hub</th>
                    <th>Total Pool</th>
                    <th>Available</th>
                    <th>Deployed</th>
                    <th>Utilization</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((res, idx) => {
                    const utilPct = Math.round((res.allocated / res.quantity) * 100);
                    return (
                      <motion.tr
                        key={res.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                        className="hover:bg-white/[0.02]"
                      >
                        <td>
                          <div className="flex items-center gap-1.5">
                            {RESOURCE_CATEGORY_ICONS[res.category]}
                            <span className="text-xs text-slate-400 capitalize font-medium">{res.category}</span>
                          </div>
                        </td>
                        <td>
                          <p className="text-sm font-semibold text-slate-200">{res.name}</p>
                          <p className="text-xs font-mono text-slate-500">{res.id}</p>
                        </td>
                        <td>
                          <p className="text-xs text-slate-300">{res.location}</p>
                          <p className="text-xs text-slate-500">{res.state}</p>
                        </td>
                        <td>
                          <span className="text-sm font-semibold tabular-nums text-slate-300">
                            {res.quantity.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`text-sm font-semibold tabular-nums ${
                              res.available < res.quantity * 0.2 ? 'text-amber-400' : 'text-green-400'
                            }`}
                          >
                            {res.available.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td>
                          <span className="text-sm font-semibold tabular-nums text-blue-400">
                            {res.allocated.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <ProgressBar
                              value={utilPct}
                              size="xs"
                              color={utilPct > 80 ? 'red' : 'blue'}
                              className="w-20"
                            />
                            <span className="text-xs text-slate-400 tabular-nums">{utilPct}%</span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${
                              res.status === 'deployed'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : res.status === 'available'
                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                : res.status === 'in-transit'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                            }`}
                          >
                            {res.status}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Dispatch Supplies Modal */}
      <Modal
        open={dispatchModalOpen}
        onClose={() => setDispatchModalOpen(false)}
        title="Emergency Logistics Requisition & Dispatch"
        subtitle="National Relief Supply Chain Mobilization"
        size="md"
      >
        <form onSubmit={handleDispatchSubmit} className="space-y-4">
          <Select
            label="Resource Category / Item"
            options={resources.map((r) => ({
              value: r.id,
              label: `${r.name} (Available: ${r.available})`,
            }))}
            value={dispatchForm.resourceId}
            onChange={(e) => setDispatchForm({ ...dispatchForm, resourceId: e.target.value })}
          />

          <Input
            label="Quantity to Allocate"
            type="number"
            min={1}
            required
            value={dispatchForm.quantity}
            onChange={(e) => setDispatchForm({ ...dispatchForm, quantity: e.target.value })}
          />

          <Input
            label="Destination Dispatch Center / Shelter"
            required
            placeholder="e.g. Visakhapatnam Relief Camp 2"
            value={dispatchForm.destination}
            onChange={(e) => setDispatchForm({ ...dispatchForm, destination: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setDispatchModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Authorize Dispatch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
