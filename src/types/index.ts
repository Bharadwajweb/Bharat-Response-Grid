// ─── Domain Types for BRG Command Gateway ───

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus = 'reported' | 'verified' | 'responding' | 'contained' | 'resolved';
export type DisasterType =
  | 'flood' | 'cyclone' | 'earthquake' | 'fire' | 'landslide'
  | 'drought' | 'heatwave' | 'tsunami' | 'industrial' | 'other';
export type ResourceStatus = 'available' | 'allocated' | 'in-transit' | 'deployed' | 'maintenance';
export type TeamStatus = 'available' | 'deployed' | 'standby' | 'off-duty';
export type MissionStatus = 'planning' | 'active' | 'paused' | 'completed' | 'aborted';
export type UserRole = 'national_admin' | 'state_admin' | 'district_admin' | 'responder' | 'citizen';
export type CommandLevel = 'national' | 'state' | 'district';
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';
export type ThemeMode = 'dark' | 'light';
export type Language = 'en' | 'te';
export type WeatherCondition = 'clear' | 'cloudy' | 'rain' | 'heavy-rain' | 'storm' | 'fog' | 'extreme-heat';

// ─── Geo ───
export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export interface Location {
  state: string;
  district: string;
  area: string;
  coordinates: GeoCoordinates;
}

// ─── User ───
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  commandLevel: CommandLevel;
  stateAssigned?: string;
  districtAssigned?: string;
  avatarInitials: string;
  status: 'active' | 'suspended';
  lastActive: string;
  onlineAt?: string;
}

// ─── Incident ───
export interface IncidentNote {
  id: string;
  author: string;
  role: string;
  content: string;
  timestamp: string;
}

export interface IncidentTimelineEvent {
  id: string;
  status: IncidentStatus;
  label: string;
  timestamp: string;
  actor: string;
}

export interface Incident {
  id: string;
  title: string;
  type: DisasterType;
  severity: Severity;
  status: IncidentStatus;
  location: Location;
  description: string;
  reportedAt: string;
  updatedAt: string;
  assignedTeams: string[];
  affectedPopulation?: number;
  casualties?: number;
  notes: IncidentNote[];
  timeline: IncidentTimelineEvent[];
  aiBriefing?: string;
  aiBriefingGeneratedAt?: string;
}

// ─── Team ───
export interface Team {
  id: string;
  name: string;
  type: 'NDRF' | 'SDRF' | 'Fire' | 'Medical' | 'Police' | 'Civil Defence' | 'Coast Guard';
  status: TeamStatus;
  commandLevel: CommandLevel;
  state: string;
  district?: string;
  strength: number;
  currentLocation?: GeoCoordinates;
  assignedIncidentId?: string;
  eta?: string;
  contactNumber: string;
}

// ─── Mission ───
export interface Mission {
  id: string;
  name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: MissionStatus;
  assignedTeamIds: string[];
  incidentId: string;
  progress: number; // 0-100
  startedAt: string;
  eta?: string;
  objective: string;
  completedAt?: string;
}

// ─── Resource ───
export interface Resource {
  id: string;
  name: string;
  category: 'medical' | 'vehicle' | 'equipment' | 'personnel' | 'supply';
  quantity: number;
  available: number;
  allocated: number;
  status: ResourceStatus;
  location: string;
  state: string;
  coordinates?: GeoCoordinates;
}

// ─── Shelter ───
export interface Shelter {
  id: string;
  name: string;
  location: Location;
  capacity: number;
  occupancy: number;
  foodStock: 'adequate' | 'low' | 'critical' | 'none';
  waterStock: 'adequate' | 'low' | 'critical' | 'none';
  medicalSupport: boolean;
  status: 'active' | 'full' | 'closed' | 'standby';
  contactNumber: string;
  inChargeOfficer: string;
}

// ─── Weather ───
export interface WeatherData {
  state: string;
  district?: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windGust: number;
  rainfall24h: number;
  pressure: number;
  condition: WeatherCondition;
  updatedAt: string;
}

export interface ThreatAssessment {
  type: DisasterType;
  riskLevel: Severity;
  confidence: number; // 0-100
  reasoning: string;
  measurements: string;
  updatedAt: string;
}

// ─── Message / Comms ───
export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  sentAt: string;
  readBy: string[];
}

export interface CommandRoom {
  id: string;
  name: string;
  level: CommandLevel;
  state?: string;
  district?: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

// ─── Audit ───
export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  userName: string;
  userRole: string;
  timestamp: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
}

// ─── Simulation ───
export interface SimulationScenario {
  disasterType: DisasterType;
  epicenter: GeoCoordinates;
  epicenterLabel: string;
  severity: Severity;
  radiusKm: number;
  populationExposure: number;
  weatherCondition: WeatherCondition;
}

export interface SimulationResult {
  estimatedAffectedArea: number;
  potentialShelters: number;
  resourceRequirements: { category: string; quantity: number }[];
  responseTeamsRequired: number;
  threatLevel: Severity;
  timeline: { phase: string; hours: number; action: string }[];
}

// ─── KPI / Analytics ───
export interface KPIData {
  activeIncidents: number;
  criticalIncidents: number;
  respondersDeployed: number;
  sheltersActive: number;
  resourcesAllocated: number;
  avgResponseTimeMin: number;
  totalIncidents: number;
  mitigatedIncidents: number;
  resourceUtilization: number;
  shelterOccupancy: number;
}

export interface IncidentTrendPoint {
  date: string;
  total: number;
  critical: number;
  resolved: number;
}
