// ─── Domain Types for BRG Command Gateway ───

export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type IncidentStatus =
  | 'detected'
  | 'reported'
  | 'verified'
  | 'assessed'
  | 'responding'
  | 'evacuation'
  | 'contained'
  | 'resolved'
  | 'closed';
export type DisasterType =
  | 'flood' | 'cyclone' | 'earthquake' | 'fire' | 'landslide'
  | 'drought' | 'heatwave' | 'tsunami' | 'industrial' | 'other';
export type ResourceStatus = 'available' | 'allocated' | 'in-transit' | 'deployed' | 'maintenance';
export type TeamStatus = 'available' | 'deployed' | 'standby' | 'off-duty';
export type MissionStatus = 'planning' | 'active' | 'paused' | 'completed' | 'aborted';
export type UserRole =
  | 'central_authority'
  | 'state_authority'
  | 'district_authority'
  | 'emergency_operations'
  | 'citizen'
  | 'national_admin'
  | 'state_admin'
  | 'district_admin'
  | 'responder';
export type CommandLevel = 'national' | 'state' | 'district' | 'central';
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';
export type ThemeMode = 'dark' | 'light';
export type Language = 'en' | 'te' | 'hi' | 'ta';
export type WeatherCondition = 'clear' | 'cloudy' | 'rain' | 'heavy-rain' | 'storm' | 'fog' | 'extreme-heat';

// ─── Jurisdiction Hierarchy ───
export type JurisdictionLevel = 'central' | 'state' | 'district' | 'operational_area' | 'citizen';

export interface JurisdictionScope {
  id: string;
  level: JurisdictionLevel;
  label: string; // e.g., 'COMMAND SCOPE: INDIA'
  shortLabel: string; // e.g. 'INDIA', 'TAMIL NADU', 'CHENNAI DISTRICT'
  state?: string;
  district?: string;
  center: [number, number];
  zoom: number;
  description: string;
}

export interface StateDistrictHierarchy {
  state: string;
  center: [number, number];
  zoom: number;
  districts: {
    name: string;
    center: [number, number];
    zoom: number;
  }[];
}

// ─── Research & Decision Intelligence Types ───
export interface EarthquakeEvent {
  id: string;
  place: string;
  magnitude: number;
  depthKm: number;
  time: number;
  latitude: number;
  longitude: number;
  tsunami: number;
  url: string;
  source: string;
}

export interface RouteOption {
  id: string;
  name: string;
  type: 'RECOMMENDED' | 'ALTERNATIVE_1' | 'ALTERNATIVE_2';
  distanceKm: number;
  estimatedTravelTimeMin: number;
  riskLevel: Severity;
  riskExposureIndex: number;
  waypoints: [number, number][];
  elevationGainMeters: number;
  keyCheckpoints: string[];
  shelterDestinationId: string;
  shelterDestinationName: string;
  reason: string;
  warnings: string[];
  mode: 'VEHICULAR' | 'PEDESTRIAN' | 'AMPHIBIOUS';
}

export interface CandidateSafeZone {
  id: string;
  name: string;
  center: [number, number];
  radiusKm: number;
  riskScore: number;
  relativeElevationMeters: number;
  distanceFromHazardKm: number;
  bearingFromHazardDeg: number;
  sheltersPresent: string[];
  capacityAvailable: number;
  rationale: string;
}

export interface DecisionIntelligenceOutput {
  decisionId: string;
  timestamp: string;
  hazardSummary: {
    type: DisasterType;
    severity: Severity;
    coordinates: [number, number];
    windSpeedKmh: number;
    rainfallMm: number;
    affectedPopulationEst: number;
  };
  impactEstimation: {
    hazardMovementDirection: string;
    hazardMovementSpeedKmh: number;
    impactRadiusKm: number;
    estimatedExpansion6hKm: number;
    hazardContourPolygon: [number, number][];
  };
  riskAssessment: {
    compositeScore: number;
    level: Severity;
    primaryDriver: string;
  };
  recommendedActions: {
    evacuationPriority: 'IMMEDIATE_MANDATORY' | 'URGENT_PREPARATION' | 'CAUTION_MONITOR';
    recommendedDirectionVector: {
      cardinal: string;
      bearingDeg: number;
      explanation: string;
    };
    candidateSafeZones: CandidateSafeZone[];
    recommendedShelter: {
      id: string;
      name: string;
      coordinates: { lat: number; lng: number };
      totalCapacity: number;
      currentOccupancy: number;
      availableSlots: number;
      loadBalanceReason: string;
    };
    routing: {
      recommended: RouteOption;
      alternatives: RouteOption[];
    };
    recommendedAgencyDeployment: {
      agency: string;
      personnelStrength: number;
      primaryObjective: string;
      priority: 'HIGH' | 'CRITICAL';
    }[];
  };
  explainableReasoningTree: {
    step: number;
    criterion: string;
    observation: string;
    inference: string;
  }[];
  confidenceUncertainty: {
    modelConfidencePercent: number;
    telemetrySourceReliability: 'HIGH' | 'MODERATE' | 'LOW';
    keyUncertaintyFactors: string[];
    recommendedReviewIntervalMin: number;
  };
  generatedCAPAlert: {
    headline: string;
    instruction: string;
    urgency: string;
    severity: string;
  };
}

export interface MetricDistribution {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
}

export interface StatisticalMetric {
  key?: string;
  metricName: string;
  unit: string;
  sampleSize: number;
  baseline: MetricDistribution;
  brg: MetricDistribution;
  meanDeltaPercent: number;
  confidenceInterval95: [number, number];
  pValueEstimated: number;
  interpretation: string;
}

export interface ResearchEvaluationResult {
  scenarioId: string;
  scenarioName: string;
  randomSeed?: number;
  sampleSize?: number;
  timestamp: string;
  isExperimental?: boolean;
  sampleSizeClassification?: 'SMALL_SAMPLE_PILOT' | 'STATISTICALLY_SUFFICIENT' | 'HIGH_CONFIDENCE';
  executionTimeMs: {
    baselineAlgorithmMs: number;
    brgAlgorithmMs: number;
    totalBenchmarkMs?: number;
  };
  metrics: StatisticalMetric[];
  statisticalSummary: {
    sampleSize: number;
    routeDistanceDeltaMean: number;
    travelTimeDeltaMean: number;
    riskExposureDeltaMean: number;
    hazardExposureDeltaMean: number;
    shelterCongestionDeltaMean: number;
    computationTimeDeltaMean: number;
    reroutesDeltaMean: number;
    completionRateDeltaMean: number;
    scientificLimitationNotice: string;
  };
}

export interface CAPAlert {
  identifier: string;
  sender: string;
  sent: string;
  status: 'Actual' | 'Exercise' | 'System' | 'Test';
  msgType: 'Alert' | 'Update' | 'Cancel';
  scope: 'Public' | 'Restricted';
  category: 'Met' | 'Geo' | 'Safety' | 'Rescue' | 'Fire' | 'Other';
  event: string;
  urgency: 'Immediate' | 'Expected' | 'Future';
  severity: 'Extreme' | 'Severe' | 'Moderate' | 'Minor';
  certainty: 'Observed' | 'Likely' | 'Possible';
  headline: string;
  description: string;
  instruction: string;
  areaDesc: string;
  effective: string;
  expires: string;
}

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

// ─── Citizen Report & Closed-Loop Intelligence ───
export type CitizenVerificationStatus = 'NEW' | 'UNVERIFIED' | 'CORROBORATED' | 'VERIFIED' | 'REJECTED';

export interface CitizenReport {
  id: string;
  type: DisasterType | string;
  severity: Severity;
  title: string;
  description: string;
  location: Location;
  contact?: string;
  status: CitizenVerificationStatus;
  reportedAt: string;
  verifiedAt?: string;
  confidenceScore?: number;
  corroborationCount?: number;
  upvotes?: number;
  mediaAttachment?: string;
}

export interface Road {
  id: string;
  roadName: string;
  roadNumber: string;
  state: string;
  district: string;
  status: 'clear' | 'caution' | 'blocked' | 'inundated';
  blockageCause?: string;
  affectedLengthKm: number;
  elevationMeters: number;
  path: [number, number][];
  isSimulation?: boolean;
}

export interface ClosedLoopResponseResult {
  action: string;
  roadId: string;
  roadName: string;
  newStatus: string;
  recalculatedRoutesCount: number;
  sheltersCheckedCount: number;
  teamsNotifiedCount: number;
  timestamp: string;
  auditId: string;
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
