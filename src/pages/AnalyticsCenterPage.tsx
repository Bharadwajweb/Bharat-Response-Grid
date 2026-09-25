import React, { useState } from 'react';
import { BarChart3, Download, Calendar } from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { MOCK_KPI, MOCK_TREND } from '../data/mockData';
import { StatCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LiveIndicator } from '../components/ui/Badge';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#94A3B8', font: { family: 'Inter', size: 11 }, boxWidth: 12 } },
    tooltip: {
      backgroundColor: '#132238',
      borderColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1,
      titleColor: '#F1F5F9',
      bodyColor: '#94A3B8',
      padding: 12,
    },
  },
  scales: {
    x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B', font: { size: 11 } } },
    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B', font: { size: 11 } } },
  },
};

const TIME_FILTERS = ['24 HOURS', '7 DAYS', '30 DAYS'];

export const AnalyticsCenterPage: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState('7 DAYS');
  const kpi = MOCK_KPI;
  const trend = MOCK_TREND;

  // Chart data
  const trendChartData = {
    labels: trend.map((t) => t.date),
    datasets: [
      { label: 'Total', data: trend.map((t) => t.total), borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#3B82F6' },
      { label: 'Critical', data: trend.map((t) => t.critical), borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#EF4444' },
      { label: 'Resolved', data: trend.map((t) => t.resolved), borderColor: '#22C55E', backgroundColor: 'rgba(34,197,94,0.1)', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#22C55E' },
    ],
  };

  const typeChartData = {
    labels: ['Flood', 'Cyclone', 'Fire', 'Heatwave', 'Landslide', 'Drought', 'Earthquake'],
    datasets: [{
      data: [3, 2, 1, 1, 1, 1, 1],
      backgroundColor: ['#3B82F6', '#6366F1', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316', '#EC4899'],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const responseTimeData = {
    labels: trend.map((t) => t.date),
    datasets: [{
      label: 'Avg Response Time (min)',
      data: [28, 25, 24, 22, 21, 24, 23],
      backgroundColor: 'rgba(59,130,246,0.6)',
      borderRadius: 4,
    }],
  };

  const resourceUtilData = {
    labels: ['Medical', 'Vehicles', 'Equipment', 'Personnel', 'Supplies'],
    datasets: [{
      label: 'Utilization %',
      data: [72, 73, 67, 68, 60],
      backgroundColor: ['rgba(239,68,68,0.7)', 'rgba(245,158,11,0.7)', 'rgba(59,130,246,0.7)', 'rgba(34,197,94,0.7)', 'rgba(99,102,241,0.7)'],
      borderRadius: 4,
    }],
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-6 py-5 border-b border-white/6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <BarChart3 size={20} className="text-violet-400" />
              Analytics Center
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Operational performance and situational analytics</p>
          </div>
          <div className="flex items-center gap-2">
            <LiveIndicator />
            {/* Time filter */}
            <div className="flex gap-1 bg-white/5 border border-white/8 rounded-lg p-0.5">
              {TIME_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setTimeFilter(f)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${timeFilter === f ? 'bg-white/15 text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" icon={<Download size={13} />}>
              Situation Report
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-auto">
        {/* Top KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: 'Total Incidents', value: kpi.totalIncidents, color: 'text-slate-100' },
            { label: 'Active', value: kpi.activeIncidents, color: 'text-amber-400' },
            { label: 'Critical', value: kpi.criticalIncidents, color: 'text-red-400' },
            { label: 'Mitigated', value: kpi.mitigatedIncidents, color: 'text-green-400' },
            { label: 'Responders', value: kpi.respondersDeployed, color: 'text-blue-400' },
            { label: 'Shelters', value: kpi.sheltersActive, color: 'text-cyan-400' },
            { label: 'Resource Util %', value: `${kpi.resourceUtilization}%`, color: 'text-violet-400' },
            { label: 'Shelter Occ %', value: `${kpi.shelterOccupancy}%`, color: 'text-slate-300' },
          ].map((item) => (
            <div key={item.label} className="col-span-1 sm:col-span-1 bg-[#0D1828] border border-white/8 rounded-lg p-3">
              <p className="text-xs text-slate-600 uppercase tracking-wider">{item.label}</p>
              <p className={`text-2xl font-bold tabular-nums mt-1 ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Incident Trend */}
          <div className="bg-[#0D1828] border border-white/8 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Incident Trends</h3>
            <div style={{ height: '220px' }}>
              <Line data={trendChartData} options={{ ...CHART_DEFAULTS } as any} />
            </div>
          </div>

          {/* Incident Types */}
          <div className="bg-[#0D1828] border border-white/8 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Incident Types Distribution</h3>
            <div style={{ height: '220px' }} className="flex items-center justify-center">
              <Doughnut
                data={typeChartData}
                options={{
                  ...CHART_DEFAULTS,
                  scales: {},
                  plugins: {
                    ...CHART_DEFAULTS.plugins,
                    legend: { position: 'right' as const, labels: { ...CHART_DEFAULTS.plugins.legend.labels, boxWidth: 10, padding: 10 } },
                  },
                } as any}
              />
            </div>
          </div>

          {/* Response Time */}
          <div className="bg-[#0D1828] border border-white/8 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Average Response Time (minutes)</h3>
            <div style={{ height: '200px' }}>
              <Bar data={responseTimeData} options={{ ...CHART_DEFAULTS, plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } } } as any} />
            </div>
          </div>

          {/* Resource Utilization */}
          <div className="bg-[#0D1828] border border-white/8 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Resource Utilization by Category (%)</h3>
            <div style={{ height: '200px' }}>
              <Bar data={resourceUtilData} options={{ ...CHART_DEFAULTS, indexAxis: 'y' as const, plugins: { ...CHART_DEFAULTS.plugins, legend: { display: false } }, scales: { x: { ...CHART_DEFAULTS.scales.x, max: 100 }, y: { ...CHART_DEFAULTS.scales.y } } } as any} />
            </div>
          </div>
        </div>

        {/* Shelter Occupancy Table */}
        <div className="bg-[#0D1828] border border-white/8 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-200">Shelter Occupancy Status</h3>
            <span className="text-xs text-slate-600">Avg: {kpi.shelterOccupancy}% occupancy</span>
          </div>
          <div className="space-y-3">
            {[
              { name: 'GRK Govt School — Adyar', cap: 800, occ: 612 },
              { name: 'Saidapet Community Hall', cap: 400, occ: 398 },
              { name: 'Nizampatnam Cyclone Shelter', cap: 2000, occ: 1456 },
              { name: 'Machilipatnam Port Shelter', cap: 1500, occ: 1100 },
              { name: 'Barmer District Camp', cap: 300, occ: 45 },
            ].map((s) => {
              const pct = Math.round((s.occ / s.cap) * 100);
              return (
                <div key={s.name} className="flex items-center gap-4">
                  <span className="text-xs text-slate-400 w-56 truncate flex-shrink-0">{s.name}</span>
                  <div className="flex-1">
                    <div className="w-full h-2 bg-white/8 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${pct >= 95 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-green-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 tabular-nums w-16 text-right">{s.occ}/{s.cap}</span>
                  <span className={`text-xs font-semibold tabular-nums w-10 text-right ${pct >= 95 ? 'text-red-400' : pct >= 75 ? 'text-amber-400' : 'text-green-400'}`}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
