import type {
  Team, Mission, Shelter, Resource, User, CommandRoom, ChatMessage,
  AuditLog, WeatherData, ThreatAssessment, KPIData, IncidentTrendPoint,
  JurisdictionScope, StateDistrictHierarchy, Road, CitizenReport
} from '../types';
import {
  INDIA_MASTER_GEOGRAPHY,
  CORE_JURISDICTION_PRESETS,
  INDIA_NATIONAL_SCOPE,
  buildJurisdictionScope,
  getAllStatesAndUTs,
  getStateOrUT,
  getDistrictsForState,
} from './indiaGeographyMaster';

// ─── Export Geographic Master References ───
export {
  INDIA_MASTER_GEOGRAPHY,
  INDIA_NATIONAL_SCOPE,
  buildJurisdictionScope,
  getAllStatesAndUTs,
  getStateOrUT,
  getDistrictsForState,
};

// ─── India Administrative Hierarchy (Configurable for all 28 States + 8 UTs) ───
export const INDIA_ADMIN_HIERARCHY: StateDistrictHierarchy[] = INDIA_MASTER_GEOGRAPHY.map((s) => ({
  state: s.name,
  center: s.center,
  zoom: s.zoom,
  districts: s.districts.map((d) => ({
    name: d.name,
    center: d.center,
    zoom: d.zoom,
  })),
}));

// ─── Jurisdiction Presets for Command Center & Role-aware GIS ───
export const JURISDICTION_PRESETS: JurisdictionScope[] = CORE_JURISDICTION_PRESETS;


// ─── Seed Roads for Closed-Loop Routing & Blockage Simulation ───
export const MOCK_ROADS: Road[] = [
  {
    id: 'ROAD-001',
    roadName: 'Grand Southern Trunk (GST) Road / NH-48 Corridor',
    roadNumber: 'NH-48',
    state: 'Tamil Nadu',
    district: 'Chennai',
    status: 'clear',
    affectedLengthKm: 14.5,
    elevationMeters: 18,
    path: [
      [13.0827, 80.2707],
      [13.0382, 80.2155],
      [12.9856, 80.1742],
      [12.9249, 80.1000],
    ],
    isSimulation: false,
  },
  {
    id: 'ROAD-002',
    roadName: 'Kamarajar Salai / Marina Coastal Expressway',
    roadNumber: 'SH-49A',
    state: 'Tamil Nadu',
    district: 'Chennai',
    status: 'inundated',
    blockageCause: 'Storm Surge Inundation & Sea Water Overtopping (0.8m depth)',
    affectedLengthKm: 6.2,
    elevationMeters: 4,
    path: [
      [13.0878, 80.2872],
      [13.0531, 80.2825],
      [13.0336, 80.2785],
      [13.0067, 80.2600],
    ],
    isSimulation: true,
  },
  {
    id: 'ROAD-003',
    roadName: 'NH-16 Eastern Coastal Highway (Vizag - Anandapuram Bypass)',
    roadNumber: 'NH-16',
    state: 'Andhra Pradesh',
    district: 'Visakhapatnam',
    status: 'clear',
    affectedLengthKm: 28.0,
    elevationMeters: 24,
    path: [
      [17.6868, 83.2185],
      [17.7289, 83.3228],
      [17.8100, 83.3900],
      [17.8900, 83.4500],
    ],
    isSimulation: false,
  },
  {
    id: 'ROAD-004',
    roadName: 'Beach Road Corridor (RK Beach to Rushikonda)',
    roadNumber: 'MDR-Vizag',
    state: 'Andhra Pradesh',
    district: 'Visakhapatnam',
    status: 'caution',
    blockageCause: 'High Wave Incursion & Wind-Blown Sand Drifts',
    affectedLengthKm: 12.0,
    elevationMeters: 6,
    path: [
      [17.7130, 83.3180],
      [17.7450, 83.3550],
      [17.7820, 83.3850],
    ],
    isSimulation: true,
  },
  {
    id: 'ROAD-005',
    roadName: 'Nehru Outer Ring Road (ORR) Expressway',
    roadNumber: 'ORR-HYD',
    state: 'Telangana',
    district: 'Hyderabad',
    status: 'clear',
    affectedLengthKm: 42.0,
    elevationMeters: 512,
    path: [
      [17.3850, 78.4867],
      [17.4200, 78.3500],
      [17.4900, 78.3800],
      [17.5200, 78.4800],
    ],
    isSimulation: false,
  },
];

// ─── Citizen Reports (Verification Workflow: NEW -> UNVERIFIED -> CORROBORATED -> VERIFIED) ───
export const MOCK_CITIZEN_REPORTS: CitizenReport[] = [
  {
    id: 'CIT-8021',
    type: 'flood',
    severity: 'critical',
    title: 'Adyar River embankment breaching near Saidapet slum settlement',
    description: 'Water levels rising rapidly above waist height. Over 15 families stranded on rooftop of school building.',
    location: {
      state: 'Tamil Nadu',
      district: 'Chennai',
      area: 'Saidapet Riverbank',
      coordinates: { lat: 13.0218, lng: 80.2232 },
    },
    contact: 'Citizen Volunteer Unit 4',
    status: 'CORROBORATED',
    reportedAt: '2024-11-15T09:12:00Z',
    confidenceScore: 88,
    corroborationCount: 4,
    upvotes: 18,
  },
  {
    id: 'CIT-8022',
    type: 'cyclone',
    severity: 'high',
    title: 'High tension electricity cable snapped across Beach Road near Siripuram',
    description: 'Live sparking wires in standing water pool. Traffic halted, pedestrian hazard.',
    location: {
      state: 'Andhra Pradesh',
      district: 'Visakhapatnam',
      area: 'Siripuram Jn',
      coordinates: { lat: 17.7240, lng: 83.3190 },
    },
    status: 'VERIFIED',
    reportedAt: '2024-11-15T09:20:00Z',
    verifiedAt: '2024-11-15T09:35:00Z',
    confidenceScore: 95,
    corroborationCount: 6,
    upvotes: 27,
  },
  {
    id: 'CIT-8023',
    type: 'other',
    severity: 'medium',
    title: 'Drinking water shortage and generator fuel depletion at Community Shelter 2',
    description: 'Approx 300 evacuees present. Generator runs low on diesel.',
    location: {
      state: 'Tamil Nadu',
      district: 'Chennai',
      area: 'Velachery Bypass',
      coordinates: { lat: 12.9815, lng: 80.2180 },
    },
    status: 'UNVERIFIED',
    reportedAt: '2024-11-15T09:40:00Z',
    confidenceScore: 62,
    corroborationCount: 1,
    upvotes: 5,
  },
  {
    id: 'CIT-8024',
    type: 'flood',
    severity: 'low',
    title: 'Basement water ingress in residential apartment block',
    description: 'Pumps required to evacuate parking basement.',
    location: {
      state: 'Telangana',
      district: 'Hyderabad',
      area: 'Madhapur',
      coordinates: { lat: 17.4483, lng: 78.3915 },
    },
    status: 'NEW',
    reportedAt: '2024-11-15T09:55:00Z',
    confidenceScore: 50,
    corroborationCount: 0,
    upvotes: 2,
  },
];

// ─── Teams ───
export const MOCK_TEAMS: Team[] = [
  { id: 'TEAM-001', name: 'NDRF Battalion 6 — Chennai Unit', type: 'NDRF', status: 'deployed', commandLevel: 'state', state: 'Tamil Nadu', strength: 48, currentLocation: { lat: 13.0067, lng: 80.2206 }, assignedIncidentId: 'INC-2024-001', eta: 'On Scene', contactNumber: '+91-44-23456789' },
  { id: 'TEAM-002', name: 'NDRF Battalion 10 — Vijayawada Quick Reaction', type: 'NDRF', status: 'deployed', commandLevel: 'state', state: 'Andhra Pradesh', strength: 45, currentLocation: { lat: 15.9062, lng: 80.4518 }, assignedIncidentId: 'INC-2024-002', eta: 'On Scene', contactNumber: '+91-866-2341234' },
  { id: 'TEAM-003', name: 'TN Fire & Rescue — Chennai South Taskforce', type: 'Fire', status: 'deployed', commandLevel: 'district', state: 'Tamil Nadu', district: 'Chennai', strength: 24, assignedIncidentId: 'INC-2024-001', eta: 'On Scene', contactNumber: '+91-44-23456001' },
  { id: 'TEAM-004', name: 'AP SDRF — Guntur Response Group', type: 'SDRF', status: 'deployed', commandLevel: 'state', state: 'Andhra Pradesh', strength: 36, assignedIncidentId: 'INC-2024-002', eta: 'On Scene', contactNumber: '+91-863-2341000' },
  { id: 'TEAM-005', name: 'Telangana Medical Emergency — Hyderabad Sector', type: 'Medical', status: 'available', commandLevel: 'state', state: 'Telangana', strength: 20, contactNumber: '+91-40-27890123' },
  { id: 'TEAM-006', name: 'HP BRO Team — Kullu Road Clearing', type: 'Civil Defence', status: 'deployed', commandLevel: 'district', state: 'Himachal Pradesh', district: 'Kullu', strength: 15, assignedIncidentId: 'INC-2024-003', eta: '2h 30m', contactNumber: '+91-1902-234567' },
  { id: 'TEAM-007', name: 'Chennai SDRF — Flood Inflatable Boat Unit', type: 'SDRF', status: 'deployed', commandLevel: 'district', state: 'Tamil Nadu', district: 'Chennai', strength: 18, assignedIncidentId: 'INC-2024-001', eta: 'On Scene', contactNumber: '+91-44-23456002' },
  { id: 'TEAM-008', name: 'Gujarat HAZMAT — Surat Industrial Unit', type: 'Fire', status: 'deployed', commandLevel: 'state', state: 'Gujarat', strength: 22, assignedIncidentId: 'INC-2024-004', eta: 'On Scene', contactNumber: '+91-261-2341234' },
  { id: 'TEAM-009', name: 'Surat Municipal Fire Brigade', type: 'Fire', status: 'deployed', commandLevel: 'district', state: 'Gujarat', district: 'Surat', strength: 30, assignedIncidentId: 'INC-2024-004', eta: 'On Scene', contactNumber: '+91-261-2341235' },
  { id: 'TEAM-010', name: 'Indian Coast Guard — Machilipatnam Station', type: 'Coast Guard', status: 'deployed', commandLevel: 'national', state: 'Andhra Pradesh', strength: 40, assignedIncidentId: 'INC-2024-002', eta: 'On Scene', contactNumber: '+91-8672-234567' },
  { id: 'TEAM-011', name: 'Rajasthan Civil Supply — Barmer Unit', type: 'Civil Defence', status: 'deployed', commandLevel: 'district', state: 'Rajasthan', district: 'Barmer', strength: 12, assignedIncidentId: 'INC-2024-006', eta: 'On Scene', contactNumber: '+91-2982-234567' },
  { id: 'TEAM-012', name: 'Odisha Health Emergency — Bhubaneswar Medical Unit', type: 'Medical', status: 'deployed', commandLevel: 'state', state: 'Odisha', strength: 35, assignedIncidentId: 'INC-2024-007', eta: 'On Scene', contactNumber: '+91-674-2341234' },
  { id: 'TEAM-013', name: 'NDRF Battalion 2 — Guwahati Reserve', type: 'NDRF', status: 'standby', commandLevel: 'national', state: 'Assam', strength: 46, contactNumber: '+91-361-2341234' },
  { id: 'TEAM-014', name: 'Karnataka SDRF — Bengaluru Reserve', type: 'SDRF', status: 'available', commandLevel: 'state', state: 'Karnataka', strength: 32, contactNumber: '+91-80-22341234' },
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

// ─── Fictional Demo Accounts (DEMO / RESEARCH SYSTEM ONLY - No Real Persons or Real Govt Emails) ───
export const MOCK_USERS: User[] = [
  {
    id: 'DEMO-CENTRAL',
    name: 'Demo Central Administrator',
    email: 'central.admin@demo.brg.local',
    role: 'central_authority',
    commandLevel: 'national',
    avatarInitials: 'CA',
    status: 'active',
    lastActive: 'Just now',
    onlineAt: '2024-11-15T09:30:00Z',
  },
  {
    id: 'DEMO-STATE-TN',
    name: 'Demo Tamil Nadu State Administrator',
    email: 'tn.state@demo.brg.local',
    role: 'state_authority',
    commandLevel: 'state',
    stateAssigned: 'Tamil Nadu',
    avatarInitials: 'TN',
    status: 'active',
    lastActive: '3m ago',
    onlineAt: '2024-11-15T09:45:00Z',
  },
  {
    id: 'DEMO-STATE-AP',
    name: 'Demo Andhra Pradesh State Administrator',
    email: 'ap.state@demo.brg.local',
    role: 'state_authority',
    commandLevel: 'state',
    stateAssigned: 'Andhra Pradesh',
    avatarInitials: 'AP',
    status: 'active',
    lastActive: '1m ago',
    onlineAt: '2024-11-15T09:50:00Z',
  },
  {
    id: 'DEMO-STATE-TS',
    name: 'Demo Telangana State Administrator',
    email: 'ts.state@demo.brg.local',
    role: 'state_authority',
    commandLevel: 'state',
    stateAssigned: 'Telangana',
    avatarInitials: 'TS',
    status: 'active',
    lastActive: '4m ago',
    onlineAt: '2024-11-15T09:40:00Z',
  },
  {
    id: 'DEMO-DIST-CHN',
    name: 'Demo Chennai District Officer',
    email: 'chennai.district@demo.brg.local',
    role: 'district_authority',
    commandLevel: 'district',
    stateAssigned: 'Tamil Nadu',
    districtAssigned: 'Chennai',
    avatarInitials: 'CD',
    status: 'active',
    lastActive: 'Just now',
  },
  {
    id: 'DEMO-DIST-CBE',
    name: 'Demo Coimbatore District Officer',
    email: 'coimbatore.district@demo.brg.local',
    role: 'district_authority',
    commandLevel: 'district',
    stateAssigned: 'Tamil Nadu',
    districtAssigned: 'Coimbatore',
    avatarInitials: 'CB',
    status: 'active',
    lastActive: '10m ago',
  },
  {
    id: 'DEMO-DIST-VZG',
    name: 'Demo Visakhapatnam District Officer',
    email: 'vizag.district@demo.brg.local',
    role: 'district_authority',
    commandLevel: 'district',
    stateAssigned: 'Andhra Pradesh',
    districtAssigned: 'Visakhapatnam',
    avatarInitials: 'VD',
    status: 'active',
    lastActive: '2m ago',
  },
  {
    id: 'DEMO-DIST-HYD',
    name: 'Demo Hyderabad District Officer',
    email: 'hyderabad.district@demo.brg.local',
    role: 'district_authority',
    commandLevel: 'district',
    stateAssigned: 'Telangana',
    districtAssigned: 'Hyderabad',
    avatarInitials: 'HD',
    status: 'active',
    lastActive: '6m ago',
  },
  {
    id: 'DEMO-OPS-OFFICER',
    name: 'Demo Emergency Operations Officer',
    email: 'ops.officer@demo.brg.local',
    role: 'emergency_operations',
    commandLevel: 'district',
    stateAssigned: 'Tamil Nadu',
    districtAssigned: 'Chennai',
    avatarInitials: 'EO',
    status: 'active',
    lastActive: 'Just now',
  },
  {
    id: 'DEMO-CITIZEN',
    name: 'Demo Citizen',
    email: 'citizen@demo.brg.local',
    role: 'citizen',
    commandLevel: 'district',
    avatarInitials: 'CZ',
    status: 'active',
    lastActive: 'Just now',
  },
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
