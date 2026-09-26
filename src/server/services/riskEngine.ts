// ─── BRG Mathematical Risk Engine ───
// Calculates configurable multi-factor composite risk indices for spatial disaster cells.
// IMPORTANT: Model outputs represent algorithmic decision support, not official government thresholds.

import type { Severity, DisasterType } from '../../types';

export interface RiskWeights {
  hazardSeverity: number;     // default: 0.35
  proximityToHazard: number;  // default: 0.25
  populationExposure: number; // default: 0.15
  weatherAggravation: number; // default: 0.15
  infrastructureVulnerability: number; // default: 0.10
}

export const DEFAULT_RISK_WEIGHTS: RiskWeights = {
  hazardSeverity: 0.35,
  proximityToHazard: 0.25,
  populationExposure: 0.15,
  weatherAggravation: 0.15,
  infrastructureVulnerability: 0.10,
};

export interface RiskInputParams {
  disasterType: DisasterType;
  hazardSeverity: Severity; // critical, high, medium, low
  distanceKm: number;       // distance from hazard epicenter or eye
  hazardRadiusKm: number;   // active radius of hazard
  populationDensityPerSqKm: number;
  windSpeedKmh: number;
  rainfallMm: number;
  terrainElevationMeters?: number;
  drainageCapacityRating?: number; // 0-1 (1 is excellent, 0 is blocked)
  customWeights?: Partial<RiskWeights>;
}

export interface RiskEvaluationResult {
  riskScore: number; // Normalized 0 - 100
  riskLevel: Severity;
  label: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  breakdown: {
    hazardFactor: number;
    proximityFactor: number;
    populationFactor: number;
    weatherFactor: number;
    vulnerabilityFactor: number;
  };
  weightsUsed: RiskWeights;
  calculatedAt: string;
  disclaimer: string;
}

export function evaluateRisk(params: RiskInputParams): RiskEvaluationResult {
  const weights: RiskWeights = {
    ...DEFAULT_RISK_WEIGHTS,
    ...params.customWeights,
  };

  // 1. Hazard Factor (0 - 100)
  const severityMap: Record<Severity, number> = {
    critical: 100,
    high: 75,
    medium: 50,
    low: 25,
  };
  const hazardFactor = severityMap[params.hazardSeverity] || 50;

  // 2. Proximity Factor (0 - 100)
  // Inside hazard radius -> 100, then decays exponentially with distance
  let proximityFactor = 0;
  if (params.distanceKm <= params.hazardRadiusKm) {
    proximityFactor = 100 - (params.distanceKm / Math.max(params.hazardRadiusKm, 1)) * 20;
  } else {
    const excess = params.distanceKm - params.hazardRadiusKm;
    proximityFactor = Math.max(0, 80 * Math.exp(-excess / (params.hazardRadiusKm * 0.8)));
  }

  // 3. Population Exposure Factor (0 - 100)
  // Indian urban densities range from 2,000 to 25,000+ / sq.km
  const popFactor = Math.min(100, (params.populationDensityPerSqKm / 12000) * 100);

  // 4. Weather Aggravation Factor (0 - 100)
  let weatherFactor = 0;
  if (params.disasterType === 'flood') {
    weatherFactor = Math.min(100, (params.rainfallMm / 150) * 100);
  } else if (params.disasterType === 'cyclone') {
    weatherFactor = Math.min(100, (params.windSpeedKmh / 140) * 60 + (params.rainfallMm / 100) * 40);
  } else if (params.disasterType === 'fire') {
    weatherFactor = Math.min(100, (params.windSpeedKmh / 60) * 80 + (params.rainfallMm < 5 ? 20 : 0));
  } else {
    weatherFactor = Math.min(100, (params.windSpeedKmh / 80) * 50 + (params.rainfallMm / 80) * 50);
  }

  // 5. Vulnerability Factor (0 - 100)
  // Low elevation + poor drainage = higher vulnerability
  const elevation = params.terrainElevationMeters ?? 10;
  const drainage = params.drainageCapacityRating ?? 0.5;
  const elevVuln = Math.max(0, 100 - elevation * 2.5);
  const drainVuln = (1 - drainage) * 100;
  const vulnerabilityFactor = elevVuln * 0.6 + drainVuln * 0.4;

  // Composite Weighted Sum
  const totalWeight =
    weights.hazardSeverity +
    weights.proximityToHazard +
    weights.populationExposure +
    weights.weatherAggravation +
    weights.infrastructureVulnerability;

  const rawScore =
    (hazardFactor * weights.hazardSeverity +
      proximityFactor * weights.proximityToHazard +
      popFactor * weights.populationExposure +
      weatherFactor * weights.weatherAggravation +
      vulnerabilityFactor * weights.infrastructureVulnerability) /
    (totalWeight || 1);

  const riskScore = Math.round(Math.min(100, Math.max(0, rawScore)) * 10) / 10;

  let riskLevel: Severity = 'low';
  let label: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';

  if (riskScore >= 75) {
    riskLevel = 'critical';
    label = 'CRITICAL';
  } else if (riskScore >= 55) {
    riskLevel = 'high';
    label = 'HIGH';
  } else if (riskScore >= 35) {
    riskLevel = 'medium';
    label = 'MODERATE';
  } else {
    riskLevel = 'low';
    label = 'LOW';
  }

  return {
    riskScore,
    riskLevel,
    label,
    breakdown: {
      hazardFactor: Math.round(hazardFactor * 10) / 10,
      proximityFactor: Math.round(proximityFactor * 10) / 10,
      populationFactor: Math.round(popFactor * 10) / 10,
      weatherFactor: Math.round(weatherFactor * 10) / 10,
      vulnerabilityFactor: Math.round(vulnerabilityFactor * 10) / 10,
    },
    weightsUsed: weights,
    calculatedAt: new Date().toISOString(),
    disclaimer:
      'Algorithmic decision-support risk index generated using multi-factor spatial weightings. Not an official statutory disaster declaration.',
  };
}
