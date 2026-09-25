import type { Team, Mission, Shelter, Resource, User, CommandRoom, ChatMessage, AuditLog, WeatherData, ThreatAssessment, KPIData, IncidentTrendPoint } from '../types';

// ─── Teams ───
export const MOCK_TEAMS: Team[] = [
  { id: 'TEAM-001', name: 'NDRF Battalion 6 — Chennai', type: 'NDRF', status: 'deployed', commandLevel: 'state', state: 'Tamil Nadu', strength: 48, currentLocation: { lat: 13.0067, lng: 80.2206 }, assignedIncidentId: 'INC-2024-001', eta: '—', contactNumber: '+91-44-23456789' },
  { id: 'TEAM-002', name: 'NDRF Battalion 10 — Vijayawada', type: 'NDRF', status: 'deployed', commandLevel: 'state', state: 'Andhra Pradesh', strength: 45, currentLocation: { lat: 15.9062, lng: 80.4518 }, assignedIncidentId: 'INC-2024-002', eta: '—', contactNumber: '+91-866-2341234' },
  { id: 'TEAM-003', name: 'TN Fire & Rescue — Chennai South', type: 'Fire', status: 'deployed', commandLevel: 'district', state: 'Tamil Nadu', district: 'Chennai', strength: 24, assignedIncidentId: 'INC-2024-001', eta: '—', contactNumber: '+91-44-23456001' },
  { id: 'TEAM-004', name: 'AP SDRF — Guntur', type: 'SDRF', status: 'deployed', commandLevel: 'state', state: 'Andhra Pradesh', strength: 36, assignedIncidentId: 'INC-2024-002', eta: '—', contactNumber: '+91-863-2341000' },
  { id: 'TEAM-005', name: 'Telangana Medical Emergency — Hyderabad', type: 'Medical', status: 'available', commandLevel: 'state', state: 'Telangana', strength: 20, contactNumber: '+91-40-27890123' },
  { id: 'TEAM-006', name: 'HP BRO Team — Kullu', type: 'Civil Defence', status: 'deployed', commandLevel: 'district', state: 'Himachal Pradesh', district: 'Kullu', strength: 15, assignedIncidentId: 'INC-2024-003', eta: '2h 30m', contactNumber: '+91-1902-234567' },
  { id: 'TEAM-007', name: 'Chennai SDRF — Boat Rescue Unit', type: 'SDRF', status: 'deployed', commandLevel: 'district', state: 'Tamil Nadu', district: 'Chennai', strength: 18, assignedIncidentId: 'INC-2024-001', eta: '—', contactNumber: '+91-44-23456002' },
  { id: 'TEAM-008', name: 'Gujarat HAZMAT — Surat', type: 'Fire', status: 'deployed', commandLevel: 'state', state: 'Gujarat', strength: 22, assignedIncidentId: 'INC-2024-004', eta: '—', contactNumber: '+91-261-2341234' },
  { id: 'TEAM-009', name: 'Surat Municipal Fire Brigade', type: 'Fire', status: 'deployed', commandLevel: 'district', state: 'Gujarat', district: 'Surat', strength: 30, assignedIncidentId: 'INC-2024-004', eta: '—', contactNumber: '+91-261-2341235' },
  { id: 'TEAM-010', name: 'Indian Coast Guard — Machilipatnam', type: 'Coast Guard', status: 'deployed', commandLevel: 'national', state: 'Andhra Pradesh', strength: 40, assignedIncidentId: 'INC-2024-002', eta: '—', contactNumber: '+91-8672-234567' },
  { id: 'TEAM-011', name: 'Rajasthan Civil Supply — Barmer', type: 'Civil Defence', status: 'deployed', commandLevel: 'district', state: 'Rajasthan', district: 'Barmer', strength: 12, assignedIncidentId: 'INC-2024-006', eta: '—', contactNumber: '+91-2982-234567' },
  { id: 'TEAM-012', name: 'Odisha Health Emergency — Bhubaneswar', type: 'Medical', status: 'deployed', commandLevel: 'state', state: 'Odisha', strength: 35, assignedIncidentId: 'INC-2024-007', eta: '—', contactNumber: '+91-674-2341234' },
  { id: 'TEAM-013', name: 'NDRF Battalion 2 — Guwahati', type: 'NDRF', status: 'standby', commandLevel: 'national', state: 'Assam', strength: 46, contactNumber: '+91-361-2341234' },
  { id: 'TEAM-014', name: 'Karnataka SDRF — Bengaluru', type: 'SDRF', status: 'available', commandLevel: 'state', state: 'Karnataka', strength: 32, contactNumber: '+91-80-22341234' },
];

// ─── Missions ───
export const MOCK_MISSIONS: Mission[] = [
  {
    id: 'MSN-001', name: 'Op Adyar Relief', priority: 'critical', status: 'active',
    assignedTeamIds: ['TEAM-001', 'TEAM-003', 'TEAM-007'], incidentId: 'INC-2024-001',
    progress: 62, startedAt: '2024-11-15T07:15:00Z', eta: '4 hours',
    objective: 'Evacuate 45,000 residents from flooded areas and establish relief camps',
  },
  {
    id: 'MSN-002', name: 'Op Cyclone Shield — AP Coast', priority: 'critical', status: 'active',
    assignedTeamIds: ['TEAM-002', 'TEAM-004', 'TEAM-010'], incidentId: 'INC-2024-002',
    progress: 35, startedAt: '2024-11-15T05:00:00Z', eta: '8 hours',
    objective: 'Pre-landfall evacuation of coastal population and critical infrastructure protection',
  },
  {
    id: 'MSN-003', name: 'Op Clearway — NH166', priority: 'high', status: 'active',
    assignedTeamIds: ['TEAM-006'], incidentId: 'INC-2024-003',
    progress: 20, startedAt: '2024-11-15T09:00:00Z', eta: '6 hours',
    objective: 'Clear landslide debris from NH-166 and rescue stranded persons',
  },
  {
    id: 'MSN-004', name: 'Op Firewall — Pandesara', priority: 'high', status: 'active',
    assignedTeamIds: ['TEAM-008', 'TEAM-009'], incidentId: 'INC-2024-004',
    progress: 55, startedAt: '2024-11-15T07:45:00Z', eta: '3 hours',
    objective: 'Contain chemical fire and prevent spread to adjacent facilities',
  },
  {
    id: 'MSN-005', name: 'Op Heatshield — Odisha', priority: 'medium', status: 'active',
    assignedTeamIds: ['TEAM-012'], incidentId: 'INC-2024-007',
    progress: 80, startedAt: '2024-11-14T00:00:00Z', eta: 'Ongoing',
    objective: 'Deploy cooling centers and medical teams across 8 districts',
  },
];

// ─── Shelters ───
export const MOCK_SHELTERS: Shelter[] = [
  {
    id: 'SH-001', name: 'GRK Govt School — Adyar Relief Camp', location: { state: 'Tamil Nadu', district: 'Chennai', area: 'Adyar', coordinates: { lat: 13.0012, lng: 80.2560 } },
    capacity: 800, occupancy: 612, foodStock: 'adequate', waterStock: 'adequate', medicalSupport: true, status: 'active', contactNumber: '+91-44-24567891', inChargeOfficer: 'Dr. S. Ramasamy',
  },
  {
    id: 'SH-002', name: 'Saidapet Community Hall', location: { state: 'Tamil Nadu', district: 'Chennai', area: 'Saidapet', coordinates: { lat: 13.0218, lng: 80.2232 } },
    capacity: 400, occupancy: 398, foodStock: 'low', waterStock: 'adequate', medicalSupport: false, status: 'full', contactNumber: '+91-44-24567892', inChargeOfficer: 'Mr. K. Selvam',
  },
  {
    id: 'SH-003', name: 'Nizampatnam Cyclone Shelter', location: { state: 'Andhra Pradesh', district: 'Bapatla', area: 'Nizampatnam', coordinates: { lat: 15.8944, lng: 80.6517 } },
    capacity: 2000, occupancy: 1456, foodStock: 'adequate', waterStock: 'adequate', medicalSupport: true, status: 'active', contactNumber: '+91-8643-234567', inChargeOfficer: 'IAS D. Rao',
  },
  {
    id: 'SH-004', name: 'Machilipatnam Port Shelter', location: { state: 'Andhra Pradesh', district: 'Krishna', area: 'Machilipatnam', coordinates: { lat: 16.1875, lng: 81.1389 } },
    capacity: 1500, occupancy: 1100, foodStock: 'adequate', waterStock: 'low', medicalSupport: true, status: 'active', contactNumber: '+91-8672-234568', inChargeOfficer: 'Mr. V. Krishna',
  },
  {
    id: 'SH-005', name: 'Barmer District Camp — Water Supply Hub', location: { state: 'Rajasthan', district: 'Barmer', area: 'Barmer Town', coordinates: { lat: 25.7463, lng: 71.3924 } },
    capacity: 300, occupancy: 45, foodStock: 'adequate', waterStock: 'critical', medicalSupport: false, status: 'active', contactNumber: '+91-2982-234568', inChargeOfficer: 'Mr. R. Joshi',
  },
];

// ─── Resources ───
export const MOCK_RESOURCES: Resource[] = [
  { id: 'RES-001', name: 'Life Jackets', category: 'equipment', quantity: 500, available: 180, allocated: 320, status: 'allocated', location: 'Chennai Warehouse', state: 'Tamil Nadu', coordinates: { lat: 13.0827, lng: 80.2707 } },
  { id: 'RES-002', name: 'Rescue Boats (Inflatable)', category: 'vehicle', quantity: 45, available: 12, allocated: 33, status: 'deployed', location: 'Chennai Warehouse', state: 'Tamil Nadu', coordinates: { lat: 13.0450, lng: 80.2400 } },
  { id: 'RES-003', name: 'Medical Kits (Type-A)', category: 'medical', quantity: 1000, available: 650, allocated: 350, status: 'allocated', location: 'National Warehouse Delhi', state: 'Delhi', coordinates: { lat: 28.6139, lng: 77.2090 } },
  { id: 'RES-004', name: 'Water Tankers (10,000L)', category: 'vehicle', quantity: 80, available: 55, allocated: 25, status: 'in-transit', location: 'Rajasthan State Pool', state: 'Rajasthan', coordinates: { lat: 25.7500, lng: 71.4000 } },
  { id: 'RES-005', name: 'Portable Generators', category: 'equipment', quantity: 120, available: 40, allocated: 80, status: 'deployed', location: 'AP Disaster Store', state: 'Andhra Pradesh', coordinates: { lat: 16.5062, lng: 80.6480 } },
  { id: 'RES-006', name: 'Tents (Family)', category: 'supply', quantity: 2000, available: 800, allocated: 1200, status: 'allocated', location: 'National Warehouse Delhi', state: 'Delhi' },
  { id: 'RES-007', name: 'NDRF Personnel', category: 'personnel', quantity: 450, available: 145, allocated: 305, status: 'deployed', location: 'Multiple Locations', state: 'National' },
  { id: 'RES-008', name: 'HAZMAT Suits', category: 'equipment', quantity: 60, available: 15, allocated: 45, status: 'deployed', location: 'Gujarat Disaster Store', state: 'Gujarat', coordinates: { lat: 21.1702, lng: 72.8311 } },
  { id: 'RES-009', name: 'Ambulances', category: 'vehicle', quantity: 200, available: 110, allocated: 90, status: 'allocated', location: 'Multiple States', state: 'National' },
  { id: 'RES-010', name: 'Drone Units (Surveillance)', category: 'equipment', quantity: 25, available: 18, allocated: 7, status: 'allocated', location: 'NDMA Pool', state: 'National' },
];

// ─── Users ───
export const MOCK_USERS: User[] = [
  { id: 'USR-001', name: 'Adv. Priya Menon', email: 'priya.menon@ndma.gov.in', role: 'national_admin', commandLevel: 'national', avatarInitials: 'PM', status: 'active', lastActive: '5m ago', onlineAt: '2024-11-15T09:30:00Z' },
  { id: 'USR-002', name: 'IAS Rajesh Kumar', email: 'rajesh.kumar@tn.gov.in', role: 'state_admin', commandLevel: 'state', stateAssigned: 'Tamil Nadu', avatarInitials: 'RK', status: 'active', lastActive: '2m ago', onlineAt: '2024-11-15T09:45:00Z' },
  { id: 'USR-003', name: 'Col. D. Venkatesh', email: 'd.venkatesh@ndrf.gov.in', role: 'responder', commandLevel: 'national', avatarInitials: 'DV', status: 'active', lastActive: '1m ago' },
  { id: 'USR-004', name: 'Dr. Sunitha Rao', email: 'sunitha.rao@ap.gov.in', role: 'state_admin', commandLevel: 'state', stateAssigned: 'Andhra Pradesh', avatarInitials: 'SR', status: 'active', lastActive: '8m ago', onlineAt: '2024-11-15T09:15:00Z' },
  { id: 'USR-005', name: 'Mr. Harish Gupta', email: 'harish.gupta@rajasthan.gov.in', role: 'district_admin', commandLevel: 'district', stateAssigned: 'Rajasthan', districtAssigned: 'Barmer', avatarInitials: 'HG', status: 'active', lastActive: '45m ago' },
  { id: 'USR-006', name: 'Smt. Lalitha N.', email: 'lalitha.n@ts.gov.in', role: 'responder', commandLevel: 'state', stateAssigned: 'Telangana', avatarInitials: 'LN', status: 'active', lastActive: '12m ago' },
  { id: 'USR-007', name: 'Mr. Arun Singh', email: 'arun.singh@hp.gov.in', role: 'district_admin', commandLevel: 'district', stateAssigned: 'Himachal Pradesh', districtAssigned: 'Kullu', avatarInitials: 'AS', status: 'suspended', lastActive: '3 days ago' },
];

// ─── Command Rooms ───
export const MOCK_ROOMS: CommandRoom[] = [
  { id: 'ROOM-NATIONAL', name: 'National Command', level: 'national', participants: ['USR-001', 'USR-003'], lastMessage: 'NDRF Bn-6 reports 600 evacuated from Zone A', lastMessageAt: '2024-11-15T10:10:00Z', unreadCount: 3 },
  { id: 'ROOM-TN', name: 'Tamil Nadu — State EOC', level: 'state', state: 'Tamil Nadu', participants: ['USR-002', 'USR-003'], lastMessage: 'Second relief camp operational at T. Nagar', lastMessageAt: '2024-11-15T10:08:00Z', unreadCount: 7 },
  { id: 'ROOM-AP', name: 'Andhra Pradesh — State EOC', level: 'state', state: 'Andhra Pradesh', participants: ['USR-004'], lastMessage: 'Evacuation 78% complete — Bapatla coastal belt', lastMessageAt: '2024-11-15T10:05:00Z', unreadCount: 2 },
  { id: 'ROOM-CHENNAI', name: 'Chennai — District EOC', level: 'district', state: 'Tamil Nadu', district: 'Chennai', participants: ['USR-002'], lastMessage: 'Pumping operations started at Adyar bridge', lastMessageAt: '2024-11-15T10:12:00Z', unreadCount: 5 },
];

// ─── Chat Messages ───
export const MOCK_MESSAGES: ChatMessage[] = [
  { id: 'MSG-001', roomId: 'ROOM-NATIONAL', senderId: 'USR-003', senderName: 'Col. D. Venkatesh', senderRole: 'National Responder', content: 'NDRF Bn-6 reports 600 evacuated from Zone A. Proceeding to Zone B.', sentAt: '2024-11-15T10:10:00Z', readBy: ['USR-001'] },
  { id: 'MSG-002', roomId: 'ROOM-NATIONAL', senderId: 'USR-001', senderName: 'Adv. Priya Menon', senderRole: 'National Admin', content: 'Confirm Zone B priority. Medical teams on standby at Camp-1.', sentAt: '2024-11-15T10:12:00Z', readBy: ['USR-001', 'USR-003'] },
  { id: 'MSG-003', roomId: 'ROOM-TN', senderId: 'USR-002', senderName: 'IAS Rajesh Kumar', senderRole: 'TN State Admin', content: 'Second relief camp at T. Nagar now operational. Capacity 600.', sentAt: '2024-11-15T10:08:00Z', readBy: [] },
  { id: 'MSG-004', roomId: 'ROOM-TN', senderId: 'USR-003', senderName: 'Col. D. Venkatesh', senderRole: 'National Responder', content: 'Noted. Coordinating with TN SDRF for boat deployment at Saidapet.', sentAt: '2024-11-15T10:09:00Z', readBy: ['USR-002'] },
  { id: 'MSG-005', roomId: 'ROOM-CHENNAI', senderId: 'USR-002', senderName: 'IAS Rajesh Kumar', senderRole: 'TN State Admin', content: 'Pumping operations started at Adyar bridge crossing.', sentAt: '2024-11-15T10:12:00Z', readBy: [] },
];

// ─── Audit Logs ───
export const MOCK_AUDIT_LOGS: AuditLog[] = [
  { id: 'AUD-001', action: 'Incident Created', userId: 'USR-002', userName: 'IAS Rajesh Kumar', userRole: 'State Admin', timestamp: '2024-11-15T06:45:00Z', details: 'Created INC-2024-001: Severe Urban Flooding — Chennai', severity: 'info' },
  { id: 'AUD-002', action: 'Team Deployed', userId: 'USR-001', userName: 'Adv. Priya Menon', userRole: 'National Admin', timestamp: '2024-11-15T07:10:00Z', details: 'Deployed NDRF Bn-6 to INC-2024-001', severity: 'warning' },
  { id: 'AUD-003', action: 'User Suspended', userId: 'USR-001', userName: 'Adv. Priya Menon', userRole: 'National Admin', timestamp: '2024-11-14T14:30:00Z', details: 'Suspended USR-007: Arun Singh — security review', severity: 'critical' },
  { id: 'AUD-004', action: 'Resource Allocated', userId: 'USR-004', userName: 'Dr. Sunitha Rao', userRole: 'State Admin', timestamp: '2024-11-15T05:30:00Z', details: 'Allocated 5 rescue boats and 200 life jackets to AP coastal ops', severity: 'info' },
  { id: 'AUD-005', action: 'Mission Created', userId: 'USR-001', userName: 'Adv. Priya Menon', userRole: 'National Admin', timestamp: '2024-11-15T07:15:00Z', details: 'Created MSN-001: Op Adyar Relief', severity: 'info' },
];

// ─── Weather ───
export const MOCK_WEATHER: WeatherData[] = [
  { state: 'Tamil Nadu', district: 'Chennai', temperature: 28, humidity: 92, windSpeed: 45, windGust: 62, rainfall24h: 280, pressure: 994, condition: 'heavy-rain', updatedAt: '2024-11-15T10:00:00Z' },
  { state: 'Andhra Pradesh', district: 'Bapatla', temperature: 27, humidity: 95, windSpeed: 130, windGust: 155, rainfall24h: 180, pressure: 972, condition: 'storm', updatedAt: '2024-11-15T10:00:00Z' },
  { state: 'Rajasthan', district: 'Barmer', temperature: 44, humidity: 8, windSpeed: 22, windGust: 35, rainfall24h: 0, pressure: 1003, condition: 'extreme-heat', updatedAt: '2024-11-15T10:00:00Z' },
  { state: 'Himachal Pradesh', district: 'Kullu', temperature: 8, humidity: 78, windSpeed: 18, windGust: 28, rainfall24h: 55, pressure: 1010, condition: 'rain', updatedAt: '2024-11-15T10:00:00Z' },
  { state: 'Gujarat', district: 'Surat', temperature: 33, humidity: 65, windSpeed: 12, windGust: 18, rainfall24h: 5, pressure: 1008, condition: 'cloudy', updatedAt: '2024-11-15T10:00:00Z' },
];

export const MOCK_THREATS: ThreatAssessment[] = [
  { type: 'flood', riskLevel: 'critical', confidence: 92, reasoning: 'River gauge levels 3.8m above danger mark. IMD red alert active for 24h. Upstream reservoir releasing 95,000 cusecs.', measurements: 'Rainfall: 280mm/24h | River level: 8.3m (danger: 4.5m)', updatedAt: '2024-11-15T10:00:00Z' },
  { type: 'cyclone', riskLevel: 'critical', confidence: 96, reasoning: 'Category 3 cyclone tracking toward AP coast. Wind shear reducing. Sea surface temperature anomaly +2.1°C.', measurements: 'Wind: 130-150 kmph | Surge: 2-3m | Landfall: 6h', updatedAt: '2024-11-15T10:00:00Z' },
  { type: 'heatwave', riskLevel: 'high', confidence: 88, reasoning: 'Multiple day temperature anomaly +5°C above seasonal norm. No relief forecast for 5 days. High humidity amplifying heat index.', measurements: 'Temp: 44°C | Heat Index: 52°C | Days above 42°C: 7', updatedAt: '2024-11-15T10:00:00Z' },
  { type: 'fire', riskLevel: 'medium', confidence: 65, reasoning: 'Forest fire risk elevated in Maharashtra. Low humidity + dry winds + dried vegetation. No active fires reported.', measurements: 'Humidity: 12% | Wind: 40 kmph | FFMC: 87', updatedAt: '2024-11-15T10:00:00Z' },
  { type: 'landslide', riskLevel: 'high', confidence: 78, reasoning: 'Continuous rainfall saturating slopes in HP/Uttarakhand. Several slope stability reports flagged. Historical landslide zones active.', measurements: 'Rainfall: 55mm/24h | Soil saturation: 94%', updatedAt: '2024-11-15T10:00:00Z' },
];

// ─── KPI ───
export const MOCK_KPI: KPIData = {
  activeIncidents: 6,
  criticalIncidents: 2,
  respondersDeployed: 305,
  sheltersActive: 5,
  resourcesAllocated: 1200,
  avgResponseTimeMin: 23,
  totalIncidents: 8,
  mitigatedIncidents: 2,
  resourceUtilization: 68,
  shelterOccupancy: 73,
};

// ─── Trend Data ───
export const MOCK_TREND: IncidentTrendPoint[] = [
  { date: 'Nov 9', total: 2, critical: 0, resolved: 2 },
  { date: 'Nov 10', total: 3, critical: 1, resolved: 2 },
  { date: 'Nov 11', total: 2, critical: 1, resolved: 1 },
  { date: 'Nov 12', total: 4, critical: 1, resolved: 3 },
  { date: 'Nov 13', total: 5, critical: 2, resolved: 2 },
  { date: 'Nov 14', total: 6, critical: 2, resolved: 3 },
  { date: 'Nov 15', total: 8, critical: 2, resolved: 0 },
];
