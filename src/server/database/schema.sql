-- ============================================================
-- BRG — BHARAT RESPONSE GRID
-- Master PostgreSQL 16 + PostGIS Relational & Spatial Schema
-- National Disaster Decision Intelligence & Emergency Operations
-- ============================================================

-- Enable PostGIS spatial extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. Enums & Custom Types ───
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'national_admin',
        'state_admin',
        'district_admin',
        'police_officer',
        'fire_officer',
        'medical_officer',
        'rescue_officer',
        'shelter_manager',
        'citizen'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE command_echelon AS ENUM ('national', 'state', 'district');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE disaster_category AS ENUM (
        'flood',
        'cyclone',
        'earthquake',
        'fire',
        'landslide',
        'drought',
        'heatwave',
        'tsunami',
        'industrial',
        'infrastructure',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE incident_lifecycle_status AS ENUM (
        'reported',
        'verified',
        'responding',
        'contained',
        'resolved',
        'closed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE mission_lifecycle_status AS ENUM (
        'created',
        'assigned',
        'en_route',
        'arrived',
        'in_progress',
        'completed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE shelter_operational_status AS ENUM ('active', 'near_capacity', 'full', 'closed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ─── 2. Roles Table ───
CREATE TABLE IF NOT EXISTS roles (
    role_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    command_level command_echelon NOT NULL DEFAULT 'district',
    permissions JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Standard Roles
INSERT INTO roles (role_id, name, description, command_level, permissions) VALUES
('national_admin', 'National Disaster Command Director', 'Full nationwide command and policy orchestration', 'national', '["*"]'),
('state_admin', 'State SDMA Commissioner', 'State-level multi-agency dispatch and shelter management', 'state', '["incidents:read","incidents:write","shelters:write","resources:allocate"]'),
('district_admin', 'District Collector / EOC Magistrate', 'District-level emergency response and local evacuations', 'district', '["incidents:read","incidents:write","citizen:verify","dispatch:teams"]'),
('rescue_officer', 'NDRF / SDRF Unit Commander', 'Field tactical search, rescue, and telemetry reporting', 'district', '["incidents:read","teams:update","routes:view"]'),
('medical_officer', 'Chief Medical & Health Officer', 'Casualty triage and emergency hospital bed allocation', 'district', '["hospitals:write","incidents:read"]'),
('citizen', 'Public Citizen / Volunteer', 'Distress reporting and community safety assistance', 'district', '["citizen:report","alerts:read"]')
ON CONFLICT (role_id) DO NOTHING;

-- ─── 3. Users & RBAC ───
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL REFERENCES roles(role_id) DEFAULT 'citizen',
    command_level command_echelon NOT NULL DEFAULT 'district',
    state_assigned VARCHAR(100),
    district_assigned VARCHAR(100),
    department VARCHAR(100),
    phone_contact VARCHAR(30),
    avatar_initials VARCHAR(4),
    status VARCHAR(30) DEFAULT 'active',
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_district ON users(state_assigned, district_assigned);

-- ─── 4. Critical Infrastructure Registry ───
CREATE TABLE IF NOT EXISTS infrastructure (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- hospital, bridge, sub_station, water_treatment, telecom_tower
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    location_geom GEOMETRY(Point, 4326) NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    elevation_meters NUMERIC(6, 2) DEFAULT 10.0,
    operational_status VARCHAR(30) DEFAULT 'operational', -- operational, impaired, inundated, destroyed
    emergency_contact VARCHAR(100),
    capacity_rating INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_infra_spatial ON infrastructure USING GIST (location_geom);
CREATE INDEX IF NOT EXISTS idx_infra_category ON infrastructure(category);

-- ─── 5. Hospitals & Trauma Centers ───
CREATE TABLE IF NOT EXISTS hospitals (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'District Civil Hospital', -- Trauma Center, Medical College, PHC
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    location_geom GEOMETRY(Point, 4326) NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    total_beds INTEGER NOT NULL DEFAULT 200,
    icu_beds_available INTEGER NOT NULL DEFAULT 25,
    general_beds_available INTEGER NOT NULL DEFAULT 80,
    blood_bank_status VARCHAR(30) DEFAULT 'adequate',
    emergency_helpline VARCHAR(50),
    status VARCHAR(30) DEFAULT 'operational',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hospitals_spatial ON hospitals USING GIST (location_geom);

-- ─── 6. Hazards & Hazard Tracking Polygons ───
CREATE TABLE IF NOT EXISTS hazards (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category disaster_category NOT NULL,
    severity severity_level NOT NULL,
    epicenter_geom GEOMETRY(Point, 4326) NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    impact_radius_km NUMERIC(6, 2) NOT NULL,
    impact_polygon_geom GEOMETRY(Polygon, 4326),
    trajectory_bearing_deg NUMERIC(5, 2),
    speed_kmh NUMERIC(5, 2),
    wind_speed_kmh NUMERIC(5, 2),
    rainfall_mm NUMERIC(6, 2),
    description TEXT,
    is_simulation BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hazards_spatial ON hazards USING GIST (epicenter_geom);
CREATE INDEX IF NOT EXISTS idx_hazards_poly ON hazards USING GIST (impact_polygon_geom);

-- ─── 7. Incidents & Disaster Events ───
CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type disaster_category NOT NULL,
    severity severity_level NOT NULL,
    status incident_lifecycle_status NOT NULL DEFAULT 'reported',
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    area VARCHAR(255) NOT NULL,
    location_geom GEOMETRY(Point, 4326) NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    impact_buffer_geom GEOMETRY(Polygon, 4326),
    description TEXT,
    affected_population INTEGER DEFAULT 0,
    casualties INTEGER DEFAULT 0,
    verified_by_user_id VARCHAR(64) REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    ai_briefing TEXT,
    risk_score NUMERIC(5, 2) DEFAULT 50.0,
    hazard_id VARCHAR(64) REFERENCES hazards(id),
    is_simulation BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_incidents_spatial ON incidents USING GIST (location_geom);
CREATE INDEX IF NOT EXISTS idx_incidents_status_severity ON incidents(status, severity);

-- ─── 8. High-Ground Relief Shelters ───
CREATE TABLE IF NOT EXISTS shelters (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    area VARCHAR(255) NOT NULL,
    location_geom GEOMETRY(Point, 4326) NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    elevation_meters NUMERIC(6, 2) DEFAULT 15.0,
    total_capacity INTEGER NOT NULL,
    current_occupancy INTEGER NOT NULL DEFAULT 0,
    food_stock_rating VARCHAR(30) DEFAULT 'adequate',
    water_stock_rating VARCHAR(30) DEFAULT 'adequate',
    medical_doctor_on_site BOOLEAN DEFAULT TRUE,
    backup_power_generator BOOLEAN DEFAULT TRUE,
    status shelter_operational_status NOT NULL DEFAULT 'active',
    in_charge_officer VARCHAR(255),
    contact_number VARCHAR(50),
    is_simulation BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shelters_spatial ON shelters USING GIST (location_geom);

-- ─── 9. Shelter Capacity History (Auditable Load Tracking) ───
CREATE TABLE IF NOT EXISTS shelter_capacity_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shelter_id VARCHAR(64) NOT NULL REFERENCES shelters(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    occupancy INTEGER NOT NULL,
    capacity INTEGER NOT NULL,
    occupancy_percent NUMERIC(5, 2) GENERATED ALWAYS AS (ROUND((occupancy::numeric / NULLIF(capacity, 0)::numeric) * 100, 2)) STORED,
    inflow_rate_per_hour INTEGER DEFAULT 0,
    food_status VARCHAR(30),
    water_status VARCHAR(30)
);

CREATE INDEX IF NOT EXISTS idx_shelter_hist_time ON shelter_capacity_history(shelter_id, recorded_at DESC);

-- ─── 10. Emergency Teams & NDRF Response Units ───
CREATE TABLE IF NOT EXISTS response_teams (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- NDRF, SDRF, Fire, Medical, Police
    command_level command_echelon NOT NULL DEFAULT 'district',
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    personnel_count INTEGER NOT NULL,
    current_location_geom GEOMETRY(Point, 4326) NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    assigned_incident_id VARCHAR(64) REFERENCES incidents(id),
    status VARCHAR(50) DEFAULT 'available', -- available, deployed, resting, transit
    eta_label VARCHAR(50),
    contact_number VARCHAR(50),
    is_simulation BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teams_spatial ON response_teams USING GIST (current_location_geom);

-- ─── 11. Emergency Logistics & Resources ───
CREATE TABLE IF NOT EXISTS resources (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- vehicle, boat, pump, medical_kit, food_rations
    total_quantity INTEGER NOT NULL,
    allocated_quantity INTEGER NOT NULL DEFAULT 0,
    available_quantity INTEGER GENERATED ALWAYS AS (total_quantity - allocated_quantity) STORED,
    depot_location VARCHAR(255) NOT NULL,
    state VARCHAR(100) NOT NULL,
    location_geom GEOMETRY(Point, 4326) NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    status VARCHAR(50) DEFAULT 'available',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resources_spatial ON resources USING GIST (location_geom);

-- ─── 12. Roads & Transportation Network Status ───
CREATE TABLE IF NOT EXISTS roads (
    id VARCHAR(64) PRIMARY KEY,
    road_name VARCHAR(255) NOT NULL,
    road_number VARCHAR(50), -- NH-16, SH-9
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    path_geom GEOMETRY(LineString, 4326) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'clear', -- clear, caution, blocked, inundated
    blockage_cause VARCHAR(100), -- flood, landslide, fallen_trees, bridge_collapse
    affected_length_km NUMERIC(5, 2) DEFAULT 0.0,
    elevation_meters NUMERIC(6, 2) DEFAULT 10.0,
    is_simulation BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_roads_spatial ON roads USING GIST (path_geom);
CREATE INDEX IF NOT EXISTS idx_roads_status ON roads(status);

-- ─── 13. Citizen Distress Reports & Verification ───
CREATE TABLE IF NOT EXISTS citizen_reports (
    id VARCHAR(64) PRIMARY KEY,
    tracking_code VARCHAR(32) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    severity severity_level NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    area VARCHAR(255) NOT NULL,
    location_geom GEOMETRY(Point, 4326) NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    contact_phone VARCHAR(50),
    status VARCHAR(30) DEFAULT 'NEW', -- NEW, UNVERIFIED, CORROBORATED, VERIFIED, RESOLVED
    verification_score NUMERIC(4, 2) DEFAULT 0.50,
    verified_by_user_id VARCHAR(64) REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    upvotes INTEGER DEFAULT 1,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_spatial ON citizen_reports USING GIST (location_geom);
CREATE INDEX IF NOT EXISTS idx_reports_status ON citizen_reports(status);

-- ─── 14. Risk-Aware Evacuation Routes ───
CREATE TABLE IF NOT EXISTS evacuation_routes (
    id VARCHAR(64) PRIMARY KEY,
    incident_id VARCHAR(64) REFERENCES incidents(id),
    shelter_id VARCHAR(64) NOT NULL REFERENCES shelters(id),
    route_name VARCHAR(255) NOT NULL,
    route_type VARCHAR(30) NOT NULL, -- RECOMMENDED, ALTERNATIVE_1, ALTERNATIVE_2
    route_geom GEOMETRY(LineString, 4326) NOT NULL,
    origin_latitude NUMERIC(10, 6) NOT NULL,
    origin_longitude NUMERIC(10, 6) NOT NULL,
    destination_latitude NUMERIC(10, 6) NOT NULL,
    destination_longitude NUMERIC(10, 6) NOT NULL,
    distance_km NUMERIC(6, 2) NOT NULL,
    travel_time_minutes INTEGER NOT NULL,
    risk_level severity_level NOT NULL,
    risk_exposure_index NUMERIC(4, 3) NOT NULL,
    is_blocked BOOLEAN DEFAULT FALSE,
    blocked_reason TEXT,
    waypoints JSONB,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_routes_spatial ON evacuation_routes USING GIST (route_geom);

-- ─── 15. Common Alerting Protocol (CAP v1.2) Alerts ───
CREATE TABLE IF NOT EXISTS alerts (
    identifier VARCHAR(128) PRIMARY KEY,
    sender VARCHAR(255) NOT NULL,
    sent_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(30) NOT NULL, -- Actual, Exercise, System, Test
    msg_type VARCHAR(30) NOT NULL, -- Alert, Update, Cancel
    scope VARCHAR(30) NOT NULL DEFAULT 'Public',
    category VARCHAR(50) NOT NULL, -- Met, Geo, Safety, Rescue, Fire
    event VARCHAR(255) NOT NULL,
    urgency VARCHAR(30) NOT NULL, -- Immediate, Expected, Future
    severity VARCHAR(30) NOT NULL, -- Extreme, Severe, Moderate, Minor
    certainty VARCHAR(30) NOT NULL, -- Observed, Likely, Possible
    headline TEXT NOT NULL,
    description TEXT NOT NULL,
    instruction TEXT NOT NULL,
    area_description TEXT NOT NULL,
    target_roles JSONB,
    area_polygon_geom GEOMETRY(Polygon, 4326),
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    dispatched_by_user_id VARCHAR(64) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_alerts_spatial ON alerts USING GIST (area_polygon_geom);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(effective_from, expires_at);

-- ─── 16. Weather Observations (Open-Meteo & IMD Telemetry) ───
CREATE TABLE IF NOT EXISTS weather_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_key VARCHAR(50) NOT NULL,
    station_name VARCHAR(100) NOT NULL,
    location_geom GEOMETRY(Point, 4326) NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    temperature_c NUMERIC(5, 2),
    wind_speed_kmh NUMERIC(5, 2),
    wind_direction_deg NUMERIC(5, 1),
    surface_pressure_hpa NUMERIC(6, 2),
    precipitation_mm NUMERIC(6, 2),
    humidity_percent NUMERIC(5, 2),
    source_provider VARCHAR(50) DEFAULT 'Open-Meteo',
    observation_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_weather_station_time ON weather_observations(station_key, observation_timestamp DESC);

-- ─── 17. Earthquake Events (USGS GSN Real-Time Feeds) ───
CREATE TABLE IF NOT EXISTS earthquake_events (
    id VARCHAR(64) PRIMARY KEY,
    place VARCHAR(255) NOT NULL,
    magnitude NUMERIC(3, 1) NOT NULL,
    depth_km NUMERIC(6, 2) NOT NULL,
    location_geom GEOMETRY(Point, 4326) NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    tsunami_flag SMALLINT DEFAULT 0,
    event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    source_feed VARCHAR(50) DEFAULT 'USGS',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_earthquake_time ON earthquake_events(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_earthquake_mag ON earthquake_events(magnitude DESC);

-- ─── 18. Research Benchmarks & Runs ───
CREATE TABLE IF NOT EXISTS research_runs (
    id VARCHAR(64) PRIMARY KEY,
    scenario_id VARCHAR(50) NOT NULL,
    scenario_name VARCHAR(255) NOT NULL,
    random_seed INTEGER NOT NULL,
    sample_size INTEGER NOT NULL,
    executed_by_user_id VARCHAR(64) REFERENCES users(id),
    status VARCHAR(30) DEFAULT 'COMPLETED',
    baseline_algorithm VARCHAR(100) NOT NULL,
    experimental_algorithm VARCHAR(100) NOT NULL,
    duration_ms NUMERIC(8, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── 19. Research Results & Statistical Measurements ───
CREATE TABLE IF NOT EXISTS research_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id VARCHAR(64) NOT NULL REFERENCES research_runs(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    baseline_mean NUMERIC(10, 3) NOT NULL,
    baseline_median NUMERIC(10, 3) NOT NULL,
    baseline_std_dev NUMERIC(10, 3) NOT NULL,
    baseline_min NUMERIC(10, 3) NOT NULL,
    baseline_max NUMERIC(10, 3) NOT NULL,
    brg_mean NUMERIC(10, 3) NOT NULL,
    brg_median NUMERIC(10, 3) NOT NULL,
    brg_std_dev NUMERIC(10, 3) NOT NULL,
    brg_min NUMERIC(10, 3) NOT NULL,
    brg_max NUMERIC(10, 3) NOT NULL,
    mean_delta_percent NUMERIC(6, 2) NOT NULL,
    p_value NUMERIC(6, 5),
    confidence_interval_lower NUMERIC(6, 2),
    confidence_interval_upper NUMERIC(6, 2),
    interpretation TEXT
);

CREATE INDEX IF NOT EXISTS idx_research_results_run ON research_results(run_id);

-- ─── 20. Security Audit Logs ───
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(64),
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(100),
    ip_address VARCHAR(50),
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(created_at DESC);
