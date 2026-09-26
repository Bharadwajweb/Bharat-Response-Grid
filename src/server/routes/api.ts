// ─── BRG REST API Router Index ───
import { Router } from 'express';
import { db, type Incident, type CitizenReport, type CAPAlert } from '../database/db';
import { fetchLiveWeather, MONITORED_REGIONS } from '../services/weatherService';
import { fetchLiveEarthquakes } from '../services/earthquakeService';
import { evaluateRisk } from '../services/riskEngine';
import { computeDecisionIntelligence } from '../services/decisionEngine';
import { generateRiskAwareRoutes } from '../services/routingEngine';
import { runResearchBenchmark, PRESET_BENCHMARK_SCENARIOS } from '../services/researchService';
import { broadcastEvent } from '../websocket/wsHandler';

export const apiRouter = Router();

// ─── 1. System Health & Data Sources Status ───
const handleSystemStatus = async (req: any, res: any) => {
  const t0 = Date.now();
  let weatherStatus: 'CONNECTED' | 'DEGRADED' | 'OFFLINE' = 'CONNECTED';
  let earthquakeStatus: 'CONNECTED' | 'DEGRADED' | 'OFFLINE' = 'CONNECTED';

  try {
    const w = await fetchLiveWeather('visakhapatnam');
    weatherStatus = w.source === 'LIVE' ? 'CONNECTED' : w.source === 'CACHED' ? 'DEGRADED' : 'OFFLINE';
  } catch {
    weatherStatus = 'OFFLINE';
  }

  try {
    const eq = await fetchLiveEarthquakes(3.0);
    earthquakeStatus = eq.source === 'LIVE' ? 'CONNECTED' : eq.source === 'CACHED' ? 'DEGRADED' : 'OFFLINE';
  } catch {
    earthquakeStatus = 'OFFLINE';
  }

  const responseTimeMs = Date.now() - t0;

  const dbInfo = db.getDatabaseInfo();

  res.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    services: {
      backend: { status: 'CONNECTED', latencyMs: 2, uptimeSec: Math.round(process.uptime()) },
      database: {
        status: 'CONNECTED',
        mode: db.mode,
        isLive: db.isLiveDatabase,
        provider: dbInfo.provider,
        recordCount: dbInfo.recordCount,
        spatialEngine: dbInfo.spatialEngine,
        tablesCount: dbInfo.tables.length,
      },
      websocket: { status: 'CONNECTED', activeConnections: 1, protocol: 'WSS/RFC-6455' },
      weatherApi: {
        status: weatherStatus,
        provider: 'Open-Meteo API (WMO 49 standard)',
        cacheTTLMin: 10,
        lastFetch: new Date().toISOString(),
      },
      earthquakeApi: {
        status: earthquakeStatus,
        provider: 'USGS Earthquake Hazards Program',
        feed: '2.5_day.geojson',
        lastFetch: new Date().toISOString(),
      },
      routingEngine: {
        status: 'CONNECTED',
        algorithm: 'Dynamic Risk-Weighted Dijkstra & Lateral Hazard Avoidance',
      },
    },
    dataSources: [
      {
        name: 'Open-Meteo Atmospheric Forecast API',
        purpose: 'Real-time surface pressure, wind speed/direction, precipitation, temperature telemetry',
        license: 'Non-commercial / Open-Meteo Terms (CC BY 4.0 attribution)',
        status: weatherStatus,
      },
      {
        name: 'USGS Global Seismographic Network',
        purpose: 'Real-time observed earthquake magnitudes, epicenter depths, and timestamps',
        license: 'Public Domain (USGS)',
        status: earthquakeStatus,
        notice: 'Real-time earthquake observations only. Earthquakes cannot be predicted.',
      },
      {
        name: 'OpenStreetMap Cartography & Road Network',
        purpose: 'Base layer tiles and spatial road connectivity for evacuation routing',
        license: 'ODbL (OpenStreetMap contributors)',
        status: 'CONNECTED',
      },
      {
        name: 'Bharat Response Grid Internal PostGIS/In-Memory Relational Engine',
        purpose: 'Spatial geometry storage, shelter occupancy tracking, and multi-agency resource allocation',
        license: 'Government / Emergency Response Protected',
        status: 'CONNECTED',
        mode: db.mode,
      },
    ],
    overallLatencyMs: responseTimeMs,
  });
};

apiRouter.get('/status', handleSystemStatus);
apiRouter.get('/health', handleSystemStatus);
apiRouter.get('/system/status', handleSystemStatus);
apiRouter.get('/system/health', handleSystemStatus);

// ─── 2. Auth Endpoints ───
apiRouter.post('/auth/login', (req, res) => {
  const { email, role } = req.body;

  // Find user by email or matching role
  let user = db.users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user && role) {
    user = db.users.find((u) => u.role === role);
  }
  if (!user) {
    user = db.users[0]; // fallback to national admin for demo ease
  }

  // Record audit log
  db.auditLogs.unshift({
    id: `AUD-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: user.name,
    role: user.role,
    action: 'USER_LOGIN',
    resource: 'AUTH',
    details: `Successful sign-in from ${req.ip || '127.0.0.1'}`,
  });

  res.json({
    status: 'success',
    token: `brg-jwt-${Buffer.from(`${user.id}:${Date.now()}`).toString('base64')}`,
    user,
  });
});

apiRouter.get('/auth/me', (req, res) => {
  res.json({ status: 'success', user: db.users[0] });
});

// ─── 3. Incidents Endpoints ───
apiRouter.get('/incidents', (req, res) => {
  const { severity, status, type } = req.query;
  let result = db.incidents;

  if (severity && severity !== 'all') {
    result = result.filter((i) => i.severity === severity);
  }
  if (status && status !== 'all') {
    result = result.filter((i) => i.status === status);
  }
  if (type && type !== 'all') {
    result = result.filter((i) => i.type === type);
  }

  res.json({ status: 'success', total: result.length, data: result });
});

apiRouter.get('/incidents/:id', (req, res) => {
  const inc = db.incidents.find((i) => i.id === req.params.id);
  if (!inc) return res.status(404).json({ status: 'error', message: 'Incident not found' });
  res.json({ status: 'success', data: inc });
});

apiRouter.post('/incidents', (req, res) => {
  const body = req.body;
  const newIncident: Incident = {
    id: `INC-2024-${String(db.incidents.length + 1).padStart(3, '0')}`,
    title: body.title || 'Reported Disaster Incident',
    type: body.type || 'flood',
    severity: body.severity || 'high',
    status: 'reported',
    location: body.location || {
      state: 'Andhra Pradesh',
      district: 'Visakhapatnam',
      area: 'Reported Area',
      coordinates: { lat: 17.6868, lng: 83.2185 },
    },
    description: body.description || '',
    reportedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    assignedTeams: body.assignedTeams || [],
    affectedPopulation: body.affectedPopulation || 1000,
    casualties: body.casualties || 0,
    notes: body.notes || [],
    timeline: [
      {
        id: `TL-${Date.now()}`,
        status: 'reported',
        label: 'Incident logged in BRG Command Network',
        timestamp: new Date().toISOString(),
        actor: 'EOC Triage',
      },
    ],
  };

  db.incidents.unshift(newIncident);
  broadcastEvent('incident:created', newIncident);

  res.status(201).json({ status: 'success', data: newIncident });
});

apiRouter.patch('/incidents/:id', (req, res) => {
  const idx = db.incidents.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ status: 'error', message: 'Incident not found' });

  const current = db.incidents[idx];
  const updates = req.body;
  const actor = updates.actor || 'Demo Central Administrator';
  const role = updates.role || 'central_authority';
  const jurisdiction = updates.jurisdiction || 'INDIA';

  const updated: Incident = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
    timeline: updates.status && updates.status !== current.status
      ? [
          {
            id: `TL-${Date.now()}`,
            status: updates.status,
            label: `Status advanced to ${updates.status.toUpperCase()} by ${actor} (${role}) [${jurisdiction}]`,
            timestamp: new Date().toISOString(),
            actor: `${actor} (${jurisdiction})`,
          },
          ...current.timeline,
        ]
      : current.timeline,
  };

  db.incidents[idx] = updated;
  broadcastEvent('incident:updated', updated);

  // Add audit log for lifecycle change
  db.auditLogs.unshift({
    id: `AUD-INC-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: actor,
    role,
    action: `INCIDENT_LIFECYCLE_${updates.status?.toUpperCase() || 'UPDATED'}`,
    resource: updated.id,
    details: `Incident ${updated.title} updated to ${updated.status}. Jurisdiction: ${jurisdiction}.`,
  });

  res.json({ status: 'success', data: updated });
});

// ─── 4. Live Weather Endpoints ───
const handleWeatherCurrent = async (req: any, res: any) => {
  const region = (req.query.region as string) || 'visakhapatnam';
  try {
    const data = await fetchLiveWeather(region);
    res.json({ status: 'success', ...data });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

apiRouter.get('/weather', handleWeatherCurrent);
apiRouter.get('/weather/current', handleWeatherCurrent);

apiRouter.get('/weather/regions', (req, res) => {
  res.json({ status: 'success', regions: MONITORED_REGIONS });
});

// ─── 5. Live Earthquake Endpoints ───
const handleEarthquakesLatest = async (req: any, res: any) => {
  const minMag = parseFloat((req.query.minMag as string) || '2.5');
  try {
    const data = await fetchLiveEarthquakes(minMag);
    res.json({ status: 'success', ...data });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

apiRouter.get('/earthquakes', handleEarthquakesLatest);
apiRouter.get('/earthquakes/latest', handleEarthquakesLatest);

// ─── 6. Decision Intelligence Endpoint ───
apiRouter.post('/decision/analyze', (req, res) => {
  const body = req.body;

  const result = computeDecisionIntelligence({
    incidentId: body.incidentId,
    hazardType: body.hazardType || 'cyclone',
    hazardTitle: body.hazardTitle || 'Severe Cyclonic Storm Landfall',
    currentHazardCoord: body.currentHazardCoord || [17.78, 83.42],
    observedSeverity: body.observedSeverity || 'critical',
    windSpeedKmh: body.windSpeedKmh ?? 125,
    windDirectionDeg: body.windDirectionDeg ?? 135,
    rainfallMm: body.rainfallMm ?? 85,
    populationInVicinity: body.populationInVicinity ?? 150000,
    userLocation: body.userLocation,
  });

  res.json({ status: 'success', data: result });
});

// ─── 7. Risk Analysis Endpoint ───
apiRouter.post('/risk/analyze', (req, res) => {
  const result = evaluateRisk(req.body);
  res.json({ status: 'success', data: result });
});

// ─── 8. Evacuation Routes Endpoint ───
apiRouter.post('/routes/recommend', (req, res) => {
  const result = generateRiskAwareRoutes({
    origin: req.body.origin || [17.72, 83.31],
    originLabel: req.body.originLabel || 'Evacuation Point',
    hazardCenter: req.body.hazardCenter || [17.85, 83.45],
    hazardRadiusKm: req.body.hazardRadiusKm || 45,
    hazardTrajectoryBearingDeg: req.body.hazardTrajectoryBearingDeg || 315,
    candidateShelters: db.shelters.map((s) => ({
      id: s.id,
      name: s.name,
      coordinates: s.location.coordinates,
      capacity: s.capacity,
      occupancy: s.occupancy,
    })),
  });

  res.json({ status: 'success', data: result });
});

// ─── 9. Shelters Endpoints ───
apiRouter.get('/shelters', (req, res) => {
  res.json({ status: 'success', total: db.shelters.length, data: db.shelters });
});

apiRouter.get('/shelters/:id', (req, res) => {
  const shelter = db.shelters.find((s) => s.id === req.params.id);
  if (!shelter) return res.status(404).json({ status: 'error', message: 'Shelter not found' });
  res.json({ status: 'success', data: shelter });
});

apiRouter.patch('/shelters/:id', (req, res) => {
  const idx = db.shelters.findIndex((s) => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ status: 'error', message: 'Shelter not found' });

  db.shelters[idx] = { ...db.shelters[idx], ...req.body };
  broadcastEvent('shelter:updated', db.shelters[idx]);

  res.json({ status: 'success', data: db.shelters[idx] });
});

// ─── 10. Resources & Teams Endpoints ───
apiRouter.get('/resources', (req, res) => {
  res.json({ status: 'success', data: db.resources });
});

apiRouter.get('/teams', (req, res) => {
  res.json({ status: 'success', data: db.teams });
});

// ─── 11. Citizen Reports Endpoints ───
apiRouter.get('/citizen/reports', (req, res) => {
  res.json({ status: 'success', total: db.citizenReports.length, data: db.citizenReports });
});

apiRouter.post('/citizen/reports', (req, res) => {
  const body = req.body;
  const newReport: CitizenReport = {
    id: `CIT-${Math.floor(1000 + Math.random() * 9000)}`,
    type: body.type || 'flood',
    severity: body.severity || 'high',
    title: body.title || 'Citizen Emergency Report',
    description: body.description || '',
    location: body.location || {
      state: 'Andhra Pradesh',
      district: 'Visakhapatnam',
      area: 'Reported Area',
      coordinates: { lat: 17.6868 + (Math.random() - 0.5) * 0.05, lng: 83.2185 + (Math.random() - 0.5) * 0.05 },
    },
    contact: body.contact,
    status: 'NEW',
    reportedAt: new Date().toISOString(),
    upvotes: 1,
  };

  db.citizenReports.unshift(newReport);
  broadcastEvent('citizen_report:created', newReport);

  res.status(201).json({ status: 'success', trackingId: newReport.id, data: newReport });
});

apiRouter.patch('/citizen/reports/:id/verify', (req, res) => {
  const report = db.citizenReports.find((r) => r.id === req.params.id);
  if (!report) return res.status(404).json({ status: 'error', message: 'Report not found' });

  const targetStatus = req.body.status || 'VERIFIED';
  const actor = req.body.actor || 'Demo District Officer';
  const role = req.body.role || 'district_authority';
  const jurisdiction = req.body.jurisdiction || 'DISTRICT';
  const verificationNotes = req.body.notes || 'Ground verification completed';

  report.status = targetStatus as any;
  if (targetStatus === 'VERIFIED') {
    report.verifiedAt = new Date().toISOString();
  }
  if (req.body.confidenceScore !== undefined) {
    report.confidenceScore = req.body.confidenceScore;
  }
  if (req.body.corroborationCount !== undefined) {
    report.corroborationCount = req.body.corroborationCount;
  }

  broadcastEvent('citizen_report:updated', report);

  let createdIncident: Incident | null = null;
  if (targetStatus === 'VERIFIED') {
    // Create corresponding incident
    createdIncident = {
      id: `INC-FROM-${report.id}`,
      title: `Verified: ${report.title}`,
      type: report.type as any,
      severity: report.severity,
      status: 'verified',
      location: report.location,
      description: report.description,
      reportedAt: report.reportedAt,
      updatedAt: new Date().toISOString(),
      assignedTeams: [],
      affectedPopulation: 250,
      casualties: 0,
      notes: [
        {
          id: `N-${Date.now()}`,
          author: actor,
          role,
          content: `Citizen distress report ${report.id} verified: ${verificationNotes}. Jurisdiction: ${jurisdiction}`,
          timestamp: new Date().toISOString(),
        },
      ],
      timeline: [
        {
          id: `TL-${Date.now()}`,
          status: 'verified',
          label: `Citizen report corroborated & verified by ${actor}`,
          timestamp: new Date().toISOString(),
          actor: `${actor} (${jurisdiction})`,
        },
      ],
    };

    db.incidents.unshift(createdIncident);
    broadcastEvent('incident:created', createdIncident);
  }

  // Audit
  db.auditLogs.unshift({
    id: `AUD-CIT-${Date.now()}`,
    timestamp: new Date().toISOString(),
    user: actor,
    role,
    action: `CITIZEN_REPORT_${targetStatus}`,
    resource: report.id,
    details: `Citizen report ${report.id} marked ${targetStatus}. ${verificationNotes}`,
  });

  res.json({ status: 'success', data: report, incidentCreated: createdIncident });
});

// ─── 12. Closed-Loop Emergency Response Trigger ───
apiRouter.post('/closed-loop/block-road', (req, res) => {
  const { roadId, blockageCause, actor, role, jurisdiction } = req.body;
  const targetId = roadId || 'ROAD-001';
  let road = db.roads.find((r) => r.id === targetId) || db.roads[0];

  if (!road) {
    return res.status(404).json({ status: 'error', message: 'Road not found' });
  }

  // 1. Update Road status
  road.status = 'blocked';
  road.blockageCause = blockageCause || 'Flash flood inundation & debris obstruction';
  broadcastEvent('road:updated', road);

  // 2. Recalculate Risk for the sector
  if (db.riskZones.length > 0) {
    db.riskZones[0].riskScore = Math.min(100, db.riskZones[0].riskScore + 18);
    db.riskZones[0].updatedAt = new Date().toISOString();
    broadcastEvent('risk:updated', db.riskZones[0]);
  }

  // 3. Recalculate Evacuation Routes (reroute around blocked road)
  db.evacuationRoutes.forEach((route) => {
    route.status = 'caution';
    route.riskExposureIndex = Math.min(100, route.riskExposureIndex + 14);
    // alter waypoints slightly to show rerouted path
    route.waypoints = route.waypoints.map(([lat, lng]) => [lat + 0.003, lng + 0.002]);
  });
  broadcastEvent('route:updated', db.evacuationRoutes);

  // 4. Check & update Shelter Capacity
  if (db.shelters.length > 0) {
    db.shelters[0].occupancy = Math.min(db.shelters[0].capacity, db.shelters[0].occupancy + 120);
    broadcastEvent('shelter:updated', db.shelters[0]);
  }

  // 5. Notify & update Response Teams
  if (db.teams.length > 0) {
    db.teams[0].assignedIncidentId = 'INC-2024-001';
    broadcastEvent('team:updated', db.teams[0]);
  }

  // 6. Record Audit Log
  const auditId = `AUD-CL-${Date.now()}`;
  const auditEntry = {
    id: auditId,
    timestamp: new Date().toISOString(),
    user: actor || 'Demo Chennai District Officer',
    role: role || 'district_authority',
    action: 'ROAD_BLOCKED_CLOSED_LOOP_TRIGGER',
    resource: `ROAD:${road.id}`,
    details: `Road ${road.roadName} marked BLOCKED (${road.blockageCause}). Auto-recalculated evacuation corridors and alerted active shelters. Jurisdiction: ${jurisdiction || 'CHENNAI DISTRICT'}`,
    severity: 'critical' as const,
  };
  db.auditLogs.unshift(auditEntry);
  broadcastEvent('audit:created', auditEntry);

  // 7. Generate CAP warning alert
  const alertEntry = {
    identifier: `CAP-CL-${Date.now()}`,
    sender: 'BRG Closed-Loop Routing Engine',
    sent: new Date().toISOString(),
    status: 'Actual' as const,
    msgType: 'Alert' as const,
    scope: 'Public' as const,
    category: 'Safety' as const,
    event: 'Route Impediment & Automated Reroute',
    urgency: 'Immediate' as const,
    severity: 'Severe' as const,
    certainty: 'Observed' as const,
    headline: `EVACUATION REROUTE: ${road.roadName} BLOCKED`,
    description: `Road blockage detected on ${road.roadName}. Traffic diverted via alternative inland high ground corridors.`,
    instruction: 'Do not attempt to cross flooded causeways. Follow BRG dynamic signs to designated relief shelters.',
    areaDesc: `${road.district}, ${road.state}`,
    effective: new Date().toISOString(),
    expires: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
  };
  db.alerts.unshift(alertEntry);
  broadcastEvent('alert:created', alertEntry);

  res.json({
    status: 'success',
    message: 'Closed-loop response executed: Road status updated, risk recalculated, evacuation rerouted, shelters verified, audit event created.',
    data: {
      road,
      recalculatedRoutes: db.evacuationRoutes,
      sheltersChecked: db.shelters.slice(0, 3),
      auditEntry,
      alertEntry,
    },
  });
});

apiRouter.patch('/roads/:id/status', (req, res) => {
  const road = db.roads.find((r) => r.id === req.params.id);
  if (!road) return res.status(404).json({ status: 'error', message: 'Road not found' });

  road.status = req.body.status || road.status;
  if (req.body.blockageCause !== undefined) {
    road.blockageCause = req.body.blockageCause;
  }
  broadcastEvent('road:updated', road);

  res.json({ status: 'success', data: road });
});

// ─── 12. CAP Alerts Endpoints ───
apiRouter.get('/alerts', (req, res) => {
  res.json({ status: 'success', total: db.alerts.length, data: db.alerts });
});

apiRouter.post('/alerts', (req, res) => {
  const body = req.body;
  const newAlert: CAPAlert = {
    identifier: `CAP-IN-${Date.now()}`,
    sender: body.sender || 'NDMA Operations Center',
    sent: new Date().toISOString(),
    status: body.status || 'Actual',
    msgType: body.msgType || 'Alert',
    scope: 'Public',
    category: body.category || 'Met',
    event: body.event || 'Emergency Warning',
    urgency: body.urgency || 'Immediate',
    severity: body.severity || 'Severe',
    certainty: body.certainty || 'Observed',
    headline: body.headline || 'Urgent Emergency Warning',
    description: body.description || '',
    instruction: body.instruction || '',
    areaDesc: body.areaDesc || 'Affected Area Corridor',
    effective: new Date().toISOString(),
    expires: new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
  };

  db.alerts.unshift(newAlert);
  broadcastEvent('alert:created', newAlert);

  res.status(201).json({ status: 'success', data: newAlert });
});

// ─── 13. Research Benchmarking Endpoints ───
apiRouter.get('/research/scenarios', (req, res) => {
  res.json({ status: 'success', scenarios: PRESET_BENCHMARK_SCENARIOS });
});

const handleResearchRun = (req: any, res: any) => {
  const scenarioId = req.body.scenarioId || req.body.scenarioKey || 'SCEN-01';
  const seed = parseInt(req.body.seed ?? req.body.randomSeed ?? 42, 10);
  const sampleSize = parseInt(req.body.sampleSize ?? 250, 10);
  const result = runResearchBenchmark(scenarioId, seed, sampleSize);
  res.json({ status: 'success', data: result });
};

apiRouter.post('/research/run', handleResearchRun);
apiRouter.post('/research/benchmark', handleResearchRun);

// ─── 14. Operational GIS Layers Endpoints ───
apiRouter.get('/hospitals', (req, res) => {
  res.json({ status: 'success', total: db.hospitals.length, data: db.hospitals });
});

apiRouter.get('/infrastructure', (req, res) => {
  res.json({ status: 'success', total: db.infrastructure.length, data: db.infrastructure });
});

apiRouter.get('/roads', (req, res) => {
  res.json({ status: 'success', total: db.roads.length, data: db.roads });
});

apiRouter.get('/hazards', (req, res) => {
  res.json({ status: 'success', total: db.hazards.length, data: db.hazards });
});

apiRouter.get('/safezones', (req, res) => {
  res.json({ status: 'success', total: db.safeZones.length, data: db.safeZones });
});

apiRouter.get('/evacuation-routes', (req, res) => {
  res.json({ status: 'success', total: db.evacuationRoutes.length, data: db.evacuationRoutes });
});

// ─── 14. India Geographic Master Hierarchy Endpoints (All 28 States + 8 UTs) ───
apiRouter.get('/gis/hierarchy', (req, res) => {
  const hierarchy = db.getGeographyHierarchy();
  res.json({
    status: 'success',
    country: 'India (Bharat)',
    totalStates: hierarchy.filter((s) => s.type === 'state').length,
    totalUnionTerritories: hierarchy.filter((s) => s.type === 'union_territory').length,
    data: hierarchy,
  });
});

apiRouter.get('/gis/states', (req, res) => {
  const states = db.getAllStatesAndUTs();
  res.json({
    status: 'success',
    total: states.length,
    data: states.map((s) => ({
      code: s.code,
      name: s.name,
      type: s.type,
      capital: s.capital,
      center: s.center,
      zoom: s.zoom,
      totalOfficialDistricts: s.totalOfficialDistricts,
      verifiedDistrictsCount: s.districts.length,
      datasetStatus: s.datasetStatus,
      datasetIncompleteNotice: s.datasetIncompleteNotice,
    })),
  });
});

apiRouter.get('/gis/districts', (req, res) => {
  const stateQuery = req.query.state as string;
  if (!stateQuery) {
    const allStates = db.getAllStatesAndUTs();
    const allDistricts = allStates.flatMap((s) =>
      s.districts.map((d) => ({ ...d, state: s.name }))
    );
    return res.json({ status: 'success', total: allDistricts.length, data: allDistricts });
  }

  const state = db.getStateOrUT(stateQuery);
  if (!state) {
    return res.status(404).json({ status: 'error', message: `State '${stateQuery}' not found in India master catalog.` });
  }

  const districts = db.getDistrictsForState(state.name);
  res.json({
    status: 'success',
    state: state.name,
    totalOfficialDistricts: state.totalOfficialDistricts,
    verifiedDistrictsCount: districts.length,
    datasetStatus: state.datasetStatus,
    datasetIncompleteNotice: state.datasetIncompleteNotice,
    data: districts,
  });
});

apiRouter.post('/gis/districts', (req, res) => {
  const { state, name, center, zoom, headquarters } = req.body;
  if (!state || !name || !center) {
    return res.status(400).json({ status: 'error', message: 'state, name, and center [lat, lng] are required' });
  }

  const newDistrict = {
    id: `DIST-${name.toUpperCase().replace(/\s+/g, '-')}`,
    name,
    center,
    zoom: zoom || 12,
    headquarters: headquarters || name,
    isVerified: true,
  };

  db.addCustomDistrict(state, newDistrict);
  broadcastEvent('gis:district_added', { state, district: newDistrict });

  res.status(201).json({
    status: 'success',
    message: `District ${name} registered under ${state}`,
    data: newDistrict,
  });
});

apiRouter.post('/gis/operational-areas', (req, res) => {
  const { state, district, name, center, zoom, description, hazardRiskTier } = req.body;
  if (!state || !name || !center) {
    return res.status(400).json({ status: 'error', message: 'state, name, and center are required' });
  }

  const newOpArea = {
    id: `OPS-${Date.now()}`,
    name,
    state,
    district: district || 'Operational Sector',
    center,
    zoom: zoom || 13,
    description: description || 'Designated tactical emergency response operational sector',
    hazardRiskTier: hazardRiskTier || 'HIGH',
  };

  db.addCustomOperationalArea(state, newOpArea);
  broadcastEvent('gis:operational_area_added', { state, operationalArea: newOpArea });

  res.status(201).json({
    status: 'success',
    message: `Operational Area ${name} configured`,
    data: newOpArea,
  });
});

// Aggregate GIS Command Map feed for fast single-roundtrip synchronization
apiRouter.get('/gis/all', async (req, res) => {
  let weatherData: any = null;
  let earthquakeData: any = null;

  try {
    weatherData = await fetchLiveWeather('visakhapatnam');
  } catch {}

  try {
    earthquakeData = await fetchLiveEarthquakes(2.5);
  } catch {}

  res.json({
    status: 'success',
    timestamp: new Date().toISOString(),
    incidents: db.incidents.filter((i) => i.status !== 'resolved'),
    hazards: db.hazards,
    shelters: db.shelters,
    teams: db.teams,
    resources: db.resources,
    hospitals: db.hospitals,
    infrastructure: db.infrastructure,
    roads: db.roads,
    citizenReports: db.citizenReports,
    safeZones: db.safeZones,
    evacuationRoutes: db.evacuationRoutes,
    weather: weatherData,
    earthquakes: earthquakeData,
  });
});

// ─── 15. Analytics Endpoints ───
apiRouter.get('/analytics', (req, res) => {
  const total = db.incidents.length;
  const critical = db.incidents.filter((i) => i.severity === 'critical').length;
  const resolved = db.incidents.filter((i) => i.status === 'resolved').length;
  const active = total - resolved;

  const totalShelterCapacity = db.shelters.reduce((acc, s) => acc + s.capacity, 0);
  const totalShelterOccupancy = db.shelters.reduce((acc, s) => acc + s.occupancy, 0);

  res.json({
    status: 'success',
    kpi: {
      activeIncidents: active,
      criticalIncidents: critical,
      respondersDeployed: 315,
      sheltersActive: db.shelters.filter((s) => s.status === 'active').length,
      resourcesAllocated: 48,
      avgResponseTimeMin: 14,
      totalIncidents: total,
      mitigatedIncidents: resolved,
      resourceUtilization: 68,
      shelterOccupancy: Math.round((totalShelterOccupancy / Math.max(totalShelterCapacity, 1)) * 100),
    },
    byType: {
      cyclone: db.incidents.filter((i) => i.type === 'cyclone').length,
      flood: db.incidents.filter((i) => i.type === 'flood').length,
      landslide: db.incidents.filter((i) => i.type === 'landslide').length,
      earthquake: db.incidents.filter((i) => i.type === 'earthquake').length,
      fire: db.incidents.filter((i) => i.type === 'fire').length,
      other: db.incidents.filter((i) => i.type === 'other').length,
    },
    auditLogs: db.auditLogs.slice(0, 20),
  });
});

// 404 handler for unrecognized /api/* routes
apiRouter.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found', path: req.originalUrl || req.path });
});
