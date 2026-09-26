# BRG — Bharat Response Grid
> **AI-Powered Disaster Decision Intelligence & Emergency Response Platform**

Bharat Response Grid (BRG) is a national multi-hazard disaster-management command, decision-intelligence, and emergency coordination platform designed for the Indian subcontinent. It connects:

$$\text{Citizens} \longrightarrow \text{District EOCs} \longrightarrow \text{State SDMAs} \longrightarrow \text{National Command (NDMA)}$$

---

## 1. Problem Statement & Core Purpose

Conventional disaster dashboards merely visualize alerts or display *"DISASTER DETECTED"* after catastrophe has struck. They rarely provide actionable operational answers to the most critical life-safety question:

> **"What should the authority or citizen do next based on the currently available telemetry?"**

BRG bridges the critical operational gap between raw spatial observation and field execution through automated decision intelligence:

$$\text{DATA} \longrightarrow \text{RISK ANALYSIS} \longrightarrow \text{HAZARD ESTIMATION} \longrightarrow \text{AFFECTED AREA} \longrightarrow \text{LOWER-RISK AREA} \longrightarrow \text{SAFE DIRECTION} \longrightarrow \text{EVACUATION ROUTE} \longrightarrow \text{SHELTER} \longrightarrow \text{ALERT} \longrightarrow \text{RESPONSE ACTION}$$

---

## 2. Research Contribution

1. **Kinematic Hazard Vector Estimation**:
   Uses numerical atmospheric winds, barometric pressure gradients, and hydraulic flow telemetry to model hazard translation velocity ($v_{\text{hazard}}$) and dispersion azimuth ($\theta_{\text{trajectory}}$).
2. **Dynamic Risk-Aware Evacuation Routing**:
   Graph routing engine optimizing:
   $$\text{Cost}(e) = \text{Distance}(e) + w_{\text{time}} \cdot \Delta t(e) + w_{\text{risk}} \cdot \text{RiskExposure}(e) + \text{Penalty}_{\text{inundation}}$$
   Provides **Recommended Route** + **Alternative 1** + **Alternative 2** avoiding lateral advance vectors of the disaster.
3. **Capacity-Balanced Shelter Load Balancing**:
   Prevents catastrophic single-shelter bottlenecking by penalizing shelters over 85% occupancy and routing evacuees to verified elevated safe refuges.
4. **Explainable AI Reasoning Tree**:
   Audit-proof step-by-step rationales behind every evacuation direction, shelter selection, and Common Alerting Protocol (CAP v1.2) alert.

---

## 3. System Architecture

```
                       EXTERNAL TELEMETRY FEEDS
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
     Open-Meteo Weather       USGS Earthquakes    OpenStreetMap GIS
        (WMO Models)           (Seismic GSN)         (Road Graph)
              │                    │                    │
              └──────────────┬─────┴────────────────────┘
                             ▼
                   LIVE INGESTION LAYER
                  (Caching, Normalization)
                             │
                             ▼
              DATABASE & SCHEMA ENGINE (PostgreSQL)
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
         RISK ENGINE                 DECISION ENGINE
      (Multi-Factor Model)        (Hazard Trajectory, Safe Vector)
              │                             │
              ▼                             ▼
       Impact Envelopes             Evacuation Routing
                                    (Recommended + 2 Alts)
              │                             │
              └──────────────┬──────────────┘
                             ▼
                 SHELTER & RESOURCE DISPATCH
                 (Capacity Load Balancing)
                             │
                             ▼
                 CAP v1.2 ALERT GENERATOR
                             │
                             ▼
                 REAL-TIME WEBSOCKET (ws://)
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
      COMMAND CENTER EOC             CITIZEN PORTAL
   (National / State / District)      (Mobile-First SOS)
```

---

## 4. Key Modules & Pages

| Route | Module | Description |
| :--- | :--- | :--- |
| `/` | **Command Overview** | Centerpiece tactical map, live incident queue, agency readiness, active CAP banners |
| `/decision-support` | **Decision Intelligence** | Core research engine: hazard kinematics, safe vectors, evacuation corridors, explainable reasoning |
| `/maps` | **Live GIS Command Map** | Multi-layer Leaflet GIS: Incidents, Threat buffers, Shelters, Teams, NDRF tracking, measurement |
| `/weather` | **Weather Intelligence** | Live Open-Meteo telemetry (temp, gusts, rain, hourly/7-day forecast) across 9 Indian hubs |
| `/earthquakes` | **Earthquake Observations** | Live USGS seismographic feed (magnitudes, depths, epicenters). *Notice: No prediction claimed* |
| `/simulation` | **Threat Simulation** | Scenario modeling (Cyclone, Flood, Landslide, Fire) with impact zones and timeline |
| `/resources` | **Resources & Shelters** | Capacity meters, food/water stocks, medical staffing, NDRF/SDRF equipment fleet |
| `/communications` | **Command Channels** | Secure multi-echelon channels (Central, State, District, Medical, Rescue) |
| `/analytics` | **Analytics Center** | Resolution times, incident frequency by disaster type, shelter occupancy curves |
| `/research` | **Research Evaluation** | Experimental benchmarking: Baseline static shortest path vs. BRG dynamic risk routing |
| `/system-status` | **System Health & Audit** | Real-time diagnostic probes of Backend, DB, WebSocket, Open-Meteo, USGS, OSM |
| `/citizen` | **Citizen Safety Portal** | Mobile-first distress reporter, live risk advisory, nearest safe shelter, speed dials (112, 1078) |
| `/login` | **EOC Command Login** | Role-based presets (Central, State, District, Responder), 256-bit encrypted session |

---

## 5. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Leaflet, Framer Motion, Chart.js, Lucide Icons, Zustand, i18next (English, Hindi, Tamil, Telugu).
- **Backend**: Express & Node.js 22 full-stack integration (`server.ts`) with WebSocket (`ws`), plus Python FastAPI modular architecture (`backend/`).
- **Database**: PostgreSQL schema specification + high-performance In-Memory Repository with persistence.
- **External Feeds**: Open-Meteo API, USGS Global Seismographic Network, OpenStreetMap Cartography.

---

## 6. Research Safety & Scientific Transparency Rules

- **No Earthquake Prediction**: BRG displays observed seismic telemetry only. Earthquakes cannot be predicted scientifically.
- **Decision Support, Not Guaranteed Safety**: All evacuation routes are marked as *"model-estimated lower-risk corridors"*.
- **Data Status Transparency**: Every component clearly indicates its operational mode:
  - `LIVE`: Telemetry fetched in real time with timestamp.
  - `CACHED`: Fresh data from in-memory cache within TTL.
  - `SIMULATION`: Explicitly labeled synthetic what-if scenario.
  - `OFFLINE`: Fallback mode when upstream APIs are unreachable.

---

## 7. Installation & Local Development

```bash
# Clone the repository
git clone https://github.com/Bharadwajweb/Bharat-Response-Grid.git
cd Bharat-Response-Grid

# Install dependencies
npm install

# Start full-stack server (Port 3000)
npm run dev

# Build for production
npm run build
npm run start
```

---

## 8. License & Attribution

- **Cartography**: © [OpenStreetMap](https://www.openstreetmap.org/) contributors (ODbL).
- **Atmospheric Data**: [Open-Meteo](https://open-meteo.com/) (CC BY 4.0).
- **Seismic Telemetry**: [USGS Earthquake Hazards Program](https://earthquake.usgs.gov/) (Public Domain).
- **Guidelines**: Compliant with NDMA National Disaster Management Guidelines and Sendai Framework Priority 4.
