import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, MapPin, CheckCircle2, Phone, Home, ArrowLeft, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

import { useIncidentStore } from '../store/incidentStore';
import { brgSocket } from '../utils/socket';
import type { Incident, DisasterType } from '../types';

const EMERGENCY_TYPES = [
  { value: 'flood', label: '🌊 Flood' },
  { value: 'fire', label: '🔥 Fire' },
  { value: 'cyclone', label: '🌀 Cyclone' },
  { value: 'earthquake', label: '⚡ Earthquake' },
  { value: 'landslide', label: '⛰️ Landslide' },
  { value: 'other', label: '⚠️ Other Emergency' },
];

export const CitizenPortalPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { language, setLanguage } = useAppStore();
  const navigate = useNavigate();
  const { addIncident } = useIncidentStore();

  const [form, setForm] = useState({ type: 'flood', location: '', description: '', contact: '' });
  const [submitted, setSubmitted] = useState(false);
  const [trackingId, setTrackingId] = useState(`BRG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const newTrackingId = `BRG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setTrackingId(newTrackingId);

    // Create real incident in store and broadcast via socket
    const createdIncident: Incident = {
      id: newTrackingId,
      title: `Citizen Emergency: ${form.type.toUpperCase()} · ${form.location || 'Reported Sector'}`,
      type: (form.type === 'other' ? 'other' : form.type) as DisasterType,
      severity: 'high',
      status: 'reported',
      location: {
        state: 'Andhra Pradesh',
        district: form.location ? form.location.split(',')[0].trim() : 'Visakhapatnam',
        area: form.location || 'Reported Location',
        coordinates: {
          lat: 17.6868 + (Math.random() - 0.5) * 0.08,
          lng: 83.2185 + (Math.random() - 0.5) * 0.08,
        },
      },
      description: form.description || 'Citizen reported emergency requiring emergency relief.',
      reportedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedTeams: [],
      affectedPopulation: 50,
      casualties: 0,
      notes: [
        {
          id: `N-${Date.now()}`,
          author: form.contact ? `Citizen (${form.contact})` : 'Anonymous Citizen',
          role: 'Citizen Reporter',
          content: `Distress alert submitted via Citizen Portal. Contact: ${form.contact || 'Not provided'}`,
          timestamp: new Date().toISOString(),
        },
      ],
      timeline: [
        {
          id: `T1`,
          status: 'reported',
          label: 'Citizen Distress Call Logged',
          timestamp: new Date().toISOString(),
          actor: 'Citizen Portal',
        },
      ],
    };

    addIncident(createdIncident);
    brgSocket.emit('incident:created', createdIncident);

    await new Promise((r) => setTimeout(r, 600));
    setSubmitted(true);
    setLoading(false);
  };

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'te' : 'en';
    i18n.changeLanguage(newLang);
    setLanguage(newLang);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#07111F] flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          {/* Success */}
          <div className="bg-[#0D1828] border border-green-500/25 rounded-2xl p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} className="text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">{t('citizen.submitted')}</h2>
              <p className="text-sm text-slate-400 mt-1">Your report has been received and is being processed.</p>
            </div>

            {/* Tracking ID */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider">{t('citizen.trackingId')}</p>
              <p className="text-2xl font-mono font-bold text-blue-400 mt-1">{trackingId}</p>
              <p className="text-xs text-slate-600 mt-1">Save this ID to track your report</p>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-blue-500/8 border border-blue-500/20">
              <span className="text-sm text-slate-300">Current Status</span>
              <Badge variant="info">Received</Badge>
            </div>

            {/* Emergency Numbers */}
            <div className="text-left space-y-2">
              <p className="text-xs text-slate-600 uppercase tracking-wider">Emergency Numbers</p>
              {[
                { label: t('citizen.emergency'), number: '112' },
                { label: t('citizen.ndma'), number: '1078' },
                { label: t('citizen.ambulance'), number: '108' },
                { label: t('citizen.fire'), number: '101' },
              ].map((n) => (
                <div key={n.number} className="flex items-center justify-between px-3 py-2 rounded bg-white/4 border border-white/6">
                  <span className="text-xs text-slate-400">{n.label}</span>
                  <a href={`tel:${n.number}`} className="text-sm font-bold text-blue-400 hover:text-blue-300">{n.number}</a>
                </div>
              ))}
            </div>

            <Button variant="ghost" fullWidth onClick={() => setSubmitted(false)} icon={<ArrowLeft size={14} />}>
              Submit another report
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111F] px-4 py-8">
      {/* Header */}
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100">{t('citizen.title')}</h1>
              <p className="text-xs text-slate-500">Bharat Response Grid · Citizen Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-400 hover:text-slate-200 bg-white/5 border border-white/10"
            >
              <Globe size={12} />
              {language === 'en' ? 'తెలుగు' : 'English'}
            </button>
            <button onClick={() => navigate('/login')} className="text-xs text-blue-400 hover:text-blue-300">
              Staff Login
            </button>
          </div>
        </div>

        {/* Emergency numbers strip */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {[
            { label: 'Emergency', number: '112', color: 'bg-red-500/12 border-red-500/25 text-red-400' },
            { label: 'NDMA', number: '1078', color: 'bg-blue-500/12 border-blue-500/25 text-blue-400' },
            { label: 'Ambulance', number: '108', color: 'bg-green-500/12 border-green-500/25 text-green-400' },
            { label: 'Fire', number: '101', color: 'bg-orange-500/12 border-orange-500/25 text-orange-400' },
          ].map((n) => (
            <a
              key={n.number}
              href={`tel:${n.number}`}
              className={`flex-shrink-0 flex flex-col items-center px-4 py-2 rounded-xl border ${n.color} text-center transition-transform hover:scale-105`}
            >
              <span className="text-xs text-slate-500 leading-none">{n.label}</span>
              <span className="text-lg font-bold tabular-nums leading-tight mt-0.5">{n.number}</span>
            </a>
          ))}
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0D1828] border border-white/8 rounded-2xl p-5 space-y-4"
        >
          <p className="text-sm text-slate-400">{t('citizen.subtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Emergency Type */}
            <Select
              id="emergency-type"
              label={t('citizen.type')}
              options={EMERGENCY_TYPES}
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            />

            {/* Location */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin size={11} /> {t('citizen.location')}
              </label>
              <input
                type="text"
                required
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder={language === 'te' ? 'మీ ప్రస్తుత స్థానం వివరాలు' : 'Village / Area / Landmark / Pincode'}
                className="w-full bg-[#132238] border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 px-3 py-2.5"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">{t('citizen.description')}</label>
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder={language === 'te' ? 'అత్యవసర పరిస్థితిని వివరించండి...' : 'Describe the emergency situation, number of people affected, immediate dangers...'}
                className="w-full bg-[#132238] border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 px-3 py-2.5 resize-none"
              />
            </div>

            {/* Contact (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Phone size={11} /> Contact Number (Optional)
              </label>
              <input
                type="tel"
                value={form.contact}
                onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                placeholder="+91 00000 00000"
                className="w-full bg-[#132238] border border-white/10 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 px-3 py-2.5"
              />
              <p className="text-xs text-slate-700">Anonymous reporting is allowed. Contact is optional.</p>
            </div>

            <Button type="submit" variant="danger" fullWidth size="lg" loading={loading}>
              {t('citizen.submit')}
            </Button>
          </form>
        </motion.div>

        {/* Nearby Shelters Note */}
        <div className="mt-4 px-4 py-3 rounded-xl bg-green-500/6 border border-green-500/15 flex items-start gap-2">
          <Home size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-400">Nearby Shelters</p>
            <p className="text-xs text-slate-500 mt-0.5">After submitting your report, we will provide information about the nearest relief camps and shelters.</p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-700 mt-6">
          All emergency reports are processed by the National Disaster Management Authority
        </p>
      </div>
    </div>
  );
};
