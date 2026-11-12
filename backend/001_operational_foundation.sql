CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE IF NOT EXISTS brg_roles (
  name varchar(40) PRIMARY KEY,
  description varchar(180) NOT NULL
);

INSERT INTO brg_roles (name, description) VALUES
  ('CENTRAL_AUTHORITY', 'National command authority'),
  ('STATE_AUTHORITY', 'State command authority'),
  ('DISTRICT_OFFICER', 'District command officer'),
  ('EMERGENCY_OFFICER', 'Emergency response officer'),
  ('CITIZEN', 'Verified citizen reporter')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS brg_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id varchar(255) NOT NULL UNIQUE,
  email varchar(320),
  display_name varchar(160),
  email_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_brg_users_auth_user_id ON brg_users (auth_user_id);

CREATE TABLE IF NOT EXISTS brg_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES brg_users(id) ON DELETE CASCADE,
  role_name varchar(40) NOT NULL REFERENCES brg_roles(name),
  state_scope varchar(100),
  district_scope varchar(100),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_brg_user_role_scope UNIQUE (user_id, role_name, state_scope, district_scope)
);
CREATE INDEX IF NOT EXISTS ix_brg_user_roles_user_id ON brg_user_roles (user_id);

CREATE TABLE IF NOT EXISTS incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference varchar(24) NOT NULL UNIQUE,
  hazard_type varchar(40) NOT NULL,
  title varchar(180) NOT NULL,
  description text NOT NULL DEFAULT '',
  severity varchar(16) NOT NULL,
  status varchar(24) NOT NULL DEFAULT 'reported',
  location_text varchar(240) NOT NULL,
  state varchar(100) NOT NULL,
  district varchar(100),
  latitude double precision,
  longitude double precision,
  geom geometry(POINT, 4326),
  reported_by varchar(255) NOT NULL,
  assigned_to varchar(255),
  affected_population integer,
  resolution_minutes integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_incidents_reference ON incidents (reference);
CREATE INDEX IF NOT EXISTS ix_incidents_status ON incidents (status);
CREATE INDEX IF NOT EXISTS ix_incidents_state ON incidents (state);
CREATE INDEX IF NOT EXISTS ix_incidents_district ON incidents (district);
CREATE INDEX IF NOT EXISTS ix_incidents_assigned_to ON incidents (assigned_to);
CREATE INDEX IF NOT EXISTS ix_incidents_created_at ON incidents (created_at);
CREATE INDEX IF NOT EXISTS ix_incidents_geom ON incidents USING GIST (geom);

CREATE TABLE IF NOT EXISTS disaster_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES incidents(id) ON DELETE SET NULL,
  source varchar(120) NOT NULL,
  external_id varchar(160) UNIQUE,
  event_type varchar(40) NOT NULL,
  title varchar(180) NOT NULL,
  magnitude double precision,
  depth_km double precision,
  latitude double precision,
  longitude double precision,
  geom geometry(POINT, 4326),
  observed_at timestamptz,
  raw_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_disaster_events_incident_id ON disaster_events (incident_id);

CREATE TABLE IF NOT EXISTS weather_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_key varchar(80) NOT NULL UNIQUE,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  current jsonb NOT NULL,
  hourly jsonb NOT NULL DEFAULT '{}'::jsonb,
  daily jsonb NOT NULL DEFAULT '{}'::jsonb,
  source varchar(80) NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_weather_data_fetched_at ON weather_data (fetched_at);

CREATE TABLE IF NOT EXISTS earthquake_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id varchar(160) NOT NULL UNIQUE,
  source varchar(120) NOT NULL,
  magnitude double precision,
  depth_km double precision,
  location_text varchar(240),
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  geom geometry(POINT, 4326),
  occurred_at timestamptz,
  raw_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_earthquake_events_geom ON earthquake_events USING GIST (geom);
CREATE INDEX IF NOT EXISTS ix_earthquake_events_occurred_at ON earthquake_events (occurred_at);

CREATE TABLE IF NOT EXISTS risk_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(160) NOT NULL,
  hazard_type varchar(40) NOT NULL,
  severity varchar(16) NOT NULL,
  state varchar(100),
  district varchar(100),
  geom geometry(POLYGON, 4326) NOT NULL,
  source varchar(120) NOT NULL,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_risk_zones_state ON risk_zones (state);
CREATE INDEX IF NOT EXISTS ix_risk_zones_district ON risk_zones (district);
CREATE INDEX IF NOT EXISTS ix_risk_zones_geom ON risk_zones USING GIST (geom);

CREATE TABLE IF NOT EXISTS safe_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(160) NOT NULL,
  state varchar(100) NOT NULL,
  district varchar(100),
  status varchar(24) NOT NULL DEFAULT 'open',
  capacity integer,
  occupancy integer,
  geom geometry(POLYGON, 4326),
  source varchar(120) NOT NULL,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_safe_zones_state ON safe_zones (state);
CREATE INDEX IF NOT EXISTS ix_safe_zones_district ON safe_zones (district);
CREATE INDEX IF NOT EXISTS ix_safe_zones_geom ON safe_zones USING GIST (geom);

CREATE TABLE IF NOT EXISTS shelters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(160) NOT NULL,
  address varchar(240) NOT NULL,
  state varchar(100) NOT NULL,
  district varchar(100),
  latitude double precision,
  longitude double precision,
  geom geometry(POINT, 4326),
  capacity integer,
  occupancy integer,
  status varchar(24) NOT NULL DEFAULT 'standby',
  contact_phone varchar(40),
  medical_support boolean NOT NULL DEFAULT false,
  food_stock varchar(24),
  water_stock varchar(24),
  source varchar(120) NOT NULL DEFAULT 'BRG',
  updated_by varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_shelters_state ON shelters (state);
CREATE INDEX IF NOT EXISTS ix_shelters_district ON shelters (district);
CREATE INDEX IF NOT EXISTS ix_shelters_status ON shelters (status);
CREATE INDEX IF NOT EXISTS ix_shelters_geom ON shelters USING GIST (geom);

CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(160) NOT NULL,
  category varchar(40) NOT NULL,
  status varchar(24) NOT NULL DEFAULT 'available',
  quantity integer NOT NULL,
  available integer NOT NULL,
  state varchar(100) NOT NULL,
  district varchar(100),
  latitude double precision,
  longitude double precision,
  geom geometry(POINT, 4326),
  assigned_incident_id uuid REFERENCES incidents(id) ON DELETE SET NULL,
  updated_by varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_resources_status ON resources (status);
CREATE INDEX IF NOT EXISTS ix_resources_state ON resources (state);
CREATE INDEX IF NOT EXISTS ix_resources_district ON resources (district);
CREATE INDEX IF NOT EXISTS ix_resources_assigned_incident_id ON resources (assigned_incident_id);
CREATE INDEX IF NOT EXISTS ix_resources_geom ON resources USING GIST (geom);

CREATE TABLE IF NOT EXISTS citizen_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference varchar(24) NOT NULL UNIQUE,
  report_type varchar(40) NOT NULL,
  description text NOT NULL,
  location_text varchar(240) NOT NULL,
  state varchar(100),
  district varchar(100),
  latitude double precision,
  longitude double precision,
  geom geometry(POINT, 4326),
  status varchar(24) NOT NULL DEFAULT 'received',
  reported_by varchar(255) NOT NULL,
  email_verified boolean NOT NULL DEFAULT false,
  incident_id uuid REFERENCES incidents(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_citizen_reports_geom ON citizen_reports USING GIST (geom);
CREATE INDEX IF NOT EXISTS ix_citizen_reports_reference ON citizen_reports (reference);
CREATE INDEX IF NOT EXISTS ix_citizen_reports_status ON citizen_reports (status);
CREATE INDEX IF NOT EXISTS ix_citizen_reports_reported_by ON citizen_reports (reported_by);
CREATE INDEX IF NOT EXISTS ix_citizen_reports_state ON citizen_reports (state);
CREATE INDEX IF NOT EXISTS ix_citizen_reports_district ON citizen_reports (district);
CREATE INDEX IF NOT EXISTS ix_citizen_reports_incident_id ON citizen_reports (incident_id);
CREATE INDEX IF NOT EXISTS ix_citizen_reports_created_at ON citizen_reports (created_at);

CREATE TABLE IF NOT EXISTS missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  name varchar(160) NOT NULL,
  objective text NOT NULL,
  assigned_team varchar(160),
  assigned_user_id varchar(255),
  status varchar(24) NOT NULL DEFAULT 'planning',
  started_at timestamptz,
  completed_at timestamptz,
  created_by varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_missions_incident_id ON missions (incident_id);
CREATE INDEX IF NOT EXISTS ix_missions_status ON missions (status);

CREATE TABLE IF NOT EXISTS evacuation_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES incidents(id) ON DELETE SET NULL,
  source_latitude double precision NOT NULL,
  source_longitude double precision NOT NULL,
  destination_latitude double precision NOT NULL,
  destination_longitude double precision NOT NULL,
  geometry jsonb NOT NULL,
  geom geometry(LINESTRING, 4326),
  distance_meters double precision NOT NULL,
  duration_seconds double precision NOT NULL,
  hazard_status varchar(32) NOT NULL,
  source varchar(80) NOT NULL,
  created_by varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_evacuation_routes_incident_id ON evacuation_routes (incident_id);
CREATE INDEX IF NOT EXISTS ix_evacuation_routes_geom ON evacuation_routes USING GIST (geom);

CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(180) NOT NULL,
  message text NOT NULL,
  severity varchar(16) NOT NULL,
  audience varchar(80) NOT NULL,
  state_scope varchar(100),
  district_scope varchar(100),
  status varchar(24) NOT NULL DEFAULT 'active',
  created_by varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_alerts_state_scope ON alerts (state_scope);
CREATE INDEX IF NOT EXISTS ix_alerts_district_scope ON alerts (district_scope);
CREATE INDEX IF NOT EXISTS ix_alerts_status ON alerts (status);
CREATE INDEX IF NOT EXISTS ix_alerts_created_at ON alerts (created_at);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar(255) NOT NULL,
  title varchar(180) NOT NULL,
  message text NOT NULL,
  severity varchar(16) NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS ix_notifications_created_at ON notifications (created_at);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id varchar(255) NOT NULL,
  actor_role varchar(40) NOT NULL,
  action varchar(80) NOT NULL,
  entity_type varchar(80) NOT NULL,
  entity_id varchar(80),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_audit_logs_actor_user_id ON audit_logs (actor_user_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS ix_audit_logs_entity_id ON audit_logs (entity_id);
CREATE INDEX IF NOT EXISTS ix_audit_logs_created_at ON audit_logs (created_at);

CREATE TABLE IF NOT EXISTS model_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id uuid REFERENCES incidents(id) ON DELETE SET NULL,
  model_name varchar(120) NOT NULL,
  model_version varchar(80),
  prediction jsonb NOT NULL,
  ground_truth jsonb,
  metrics jsonb,
  status varchar(24) NOT NULL DEFAULT 'recorded',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_model_predictions_incident_id ON model_predictions (incident_id);
CREATE INDEX IF NOT EXISTS ix_model_predictions_created_at ON model_predictions (created_at);

CREATE TABLE IF NOT EXISTS simulation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id varchar(255) NOT NULL,
  scenario jsonb NOT NULL,
  result jsonb NOT NULL,
  status varchar(24) NOT NULL DEFAULT 'SIMULATION',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_simulation_runs_user_id ON simulation_runs (user_id);
CREATE INDEX IF NOT EXISTS ix_simulation_runs_created_at ON simulation_runs (created_at);
