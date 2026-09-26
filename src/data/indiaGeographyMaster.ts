// ─── India Geographic Master Catalog (Bharat Response Grid) ───
// Designed for the entire Republic of India: All 28 States + All 8 Union Territories
// Supporting dynamic district & operational area loading, hierarchical drill-down, and RBAC scoping.

import type { JurisdictionScope, JurisdictionLevel } from '../types';

export type AdministrativeType = 'state' | 'union_territory';
export type DatasetStatus = 'VERIFIED_COMPLETE' | 'VERIFIED_PARTIAL';

export interface DistrictInfo {
  id: string;
  name: string;
  code?: string;
  center: [number, number];
  zoom: number;
  headquarters?: string;
  isVerified: boolean;
  totalBlocksOrTaluks?: number;
}

export interface OperationalAreaInfo {
  id: string;
  name: string;
  state: string;
  district: string;
  center: [number, number];
  zoom: number;
  description: string;
  hazardRiskTier?: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
}

export interface StateUTInfo {
  code: string; // ISO 3166-2:IN code (e.g. 'IN-AP', 'IN-MH', 'IN-DL')
  name: string;
  type: AdministrativeType;
  capital: string;
  center: [number, number];
  zoom: number;
  totalOfficialDistricts: number;
  districts: DistrictInfo[];
  operationalAreas: OperationalAreaInfo[];
  datasetStatus: DatasetStatus;
  datasetIncompleteNotice?: string;
}

// ─── Complete Catalog of All 28 States & 8 Union Territories of India ───
export const INDIA_MASTER_GEOGRAPHY: StateUTInfo[] = [
  // ─── 28 STATES ───
  {
    code: 'IN-AP',
    name: 'Andhra Pradesh',
    type: 'state',
    capital: 'Amaravati',
    center: [15.9129, 79.7400],
    zoom: 7,
    totalOfficialDistricts: 26,
    districts: [
      { id: 'AP-VSP', name: 'Visakhapatnam', center: [17.6868, 83.2185], zoom: 12, isVerified: true, headquarters: 'Visakhapatnam' },
      { id: 'AP-VJA', name: 'Vijayawada (NTR)', center: [16.5062, 80.6480], zoom: 12, isVerified: true, headquarters: 'Vijayawada' },
      { id: 'AP-TPT', name: 'Tirupati', center: [13.6288, 79.4192], zoom: 12, isVerified: true, headquarters: 'Tirupati' },
      { id: 'AP-GNT', name: 'Guntur', center: [16.3067, 80.4365], zoom: 12, isVerified: true, headquarters: 'Guntur' },
      { id: 'AP-KKD', name: 'Kakinada', center: [16.9891, 82.2475], zoom: 12, isVerified: true, headquarters: 'Kakinada' },
      { id: 'AP-KNL', name: 'Kurnool', center: [15.8281, 78.0373], zoom: 12, isVerified: true, headquarters: 'Kurnool' },
      { id: 'AP-NLR', name: 'Nellore (SPSR)', center: [14.4426, 79.9865], zoom: 12, isVerified: true, headquarters: 'Nellore' },
      { id: 'AP-CDP', name: 'YSR Kadapa', center: [14.4673, 78.8242], zoom: 12, isVerified: true, headquarters: 'Kadapa' },
      { id: 'AP-ATP', name: 'Ananthapuramu', center: [14.6819, 77.6006], zoom: 12, isVerified: true, headquarters: 'Ananthapuramu' },
      { id: 'AP-VZM', name: 'Vizianagaram', center: [18.1067, 83.3956], zoom: 12, isVerified: true, headquarters: 'Vizianagaram' },
    ],
    operationalAreas: [
      {
        id: 'OPS-AP-VIZAG-COAST',
        name: 'Vizag Eastern Seaboard Cyclone Defense Zone',
        state: 'Andhra Pradesh',
        district: 'Visakhapatnam',
        center: [17.7500, 83.3500],
        zoom: 13,
        description: 'Coastal early warning, harbour storm surge protection & evacuation corridor',
        hazardRiskTier: 'CRITICAL',
      },
    ],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 10 of 26 districts verified. Additional districts dynamically loadable.',
  },
  {
    code: 'IN-AR',
    name: 'Arunachal Pradesh',
    type: 'state',
    capital: 'Itanagar',
    center: [28.2180, 94.7278],
    zoom: 7,
    totalOfficialDistricts: 26,
    districts: [
      { id: 'AR-ITA', name: 'Papum Pare (Itanagar)', center: [27.0844, 93.6053], zoom: 12, isVerified: true, headquarters: 'Yupia' },
      { id: 'AR-TWN', name: 'Tawang', center: [27.5861, 91.8594], zoom: 12, isVerified: true, headquarters: 'Tawang' },
      { id: 'AR-PAS', name: 'East Siang (Pasighat)', center: [28.0667, 95.3333], zoom: 12, isVerified: true, headquarters: 'Pasighat' },
      { id: 'AR-ZRO', name: 'Lower Subansiri (Ziro)', center: [27.5450, 93.8270], zoom: 12, isVerified: true, headquarters: 'Ziro' },
    ],
    operationalAreas: [],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 4 of 26 districts verified. Eastern Himalayan landslide & flash-flood monitoring active.',
  },
  {
    code: 'IN-AS',
    name: 'Assam',
    type: 'state',
    capital: 'Dispur',
    center: [26.2006, 92.9376],
    zoom: 7,
    totalOfficialDistricts: 35,
    districts: [
      { id: 'AS-GHY', name: 'Kamrup Metropolitan (Guwahati)', center: [26.1445, 91.7362], zoom: 12, isVerified: true, headquarters: 'Guwahati' },
      { id: 'AS-DBR', name: 'Dibrugarh', center: [27.4728, 94.9120], zoom: 12, isVerified: true, headquarters: 'Dibrugarh' },
      { id: 'AS-SIL', name: 'Cachar (Silchar)', center: [24.8333, 92.7789], zoom: 12, isVerified: true, headquarters: 'Silchar' },
      { id: 'AS-JOR', name: 'Jorhat', center: [26.7509, 94.2037], zoom: 12, isVerified: true, headquarters: 'Jorhat' },
      { id: 'AS-NGN', name: 'Nagaon', center: [26.3464, 92.6840], zoom: 12, isVerified: true, headquarters: 'Nagaon' },
      { id: 'AS-TZP', name: 'Sonitpur (Tezpur)', center: [26.6528, 92.7926], zoom: 12, isVerified: true, headquarters: 'Tezpur' },
    ],
    operationalAreas: [
      {
        id: 'OPS-AS-BRAHMAPUTRA',
        name: 'Brahmaputra River Basin Inundation Watch Sector',
        state: 'Assam',
        district: 'Kamrup Metropolitan (Guwahati)',
        center: [26.1800, 91.7500],
        zoom: 12,
        description: 'Annual monsoon flood early warning and embankment breach control',
        hazardRiskTier: 'HIGH',
      },
    ],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 6 of 35 districts verified. Brahmaputra basin telemetry operational.',
  },
  {
    code: 'IN-BR',
    name: 'Bihar',
    type: 'state',
    capital: 'Patna',
    center: [25.0961, 85.3131],
    zoom: 7,
    totalOfficialDistricts: 38,
    districts: [
      { id: 'BR-PAT', name: 'Patna', center: [25.5941, 85.1376], zoom: 12, isVerified: true, headquarters: 'Patna' },
      { id: 'BR-GAY', name: 'Gaya', center: [24.7914, 85.0002], zoom: 12, isVerified: true, headquarters: 'Gaya' },
      { id: 'BR-MZP', name: 'Muzaffarpur', center: [26.1209, 85.3647], zoom: 12, isVerified: true, headquarters: 'Muzaffarpur' },
      { id: 'BR-BGP', name: 'Bhagalpur', center: [25.2425, 86.9842], zoom: 12, isVerified: true, headquarters: 'Bhagalpur' },
      { id: 'BR-DAR', name: 'Darbhanga', center: [26.1542, 85.8918], zoom: 12, isVerified: true, headquarters: 'Darbhanga' },
      { id: 'BR-PUR', name: 'Purnia', center: [25.7771, 87.4753], zoom: 12, isVerified: true, headquarters: 'Purnia' },
    ],
    operationalAreas: [],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 6 of 38 districts verified. Kosi & Ganga flood management active.',
  },
  {
    code: 'IN-CT',
    name: 'Chhattisgarh',
    type: 'state',
    capital: 'Raipur',
    center: [21.2787, 81.8661],
    zoom: 7,
    totalOfficialDistricts: 33,
    districts: [
      { id: 'CT-RAI', name: 'Raipur', center: [21.2514, 81.6296], zoom: 12, isVerified: true, headquarters: 'Raipur' },
      { id: 'CT-BIL', name: 'Bilaspur', center: [22.0797, 82.1409], zoom: 12, isVerified: true, headquarters: 'Bilaspur' },
      { id: 'CT-DRG', name: 'Durg', center: [21.1904, 81.2849], zoom: 12, isVerified: true, headquarters: 'Durg' },
      { id: 'CT-JGD', name: 'Bastar (Jagdalpur)', center: [19.0734, 82.0286], zoom: 12, isVerified: true, headquarters: 'Jagdalpur' },
    ],
    operationalAreas: [],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 4 of 33 districts verified.',
  },
  {
    code: 'IN-GA',
    name: 'Goa',
    type: 'state',
    capital: 'Panaji',
    center: [15.2993, 74.1240],
    zoom: 9,
    totalOfficialDistricts: 2,
    districts: [
      { id: 'GA-NG', name: 'North Goa', center: [15.4989, 73.8278], zoom: 11, isVerified: true, headquarters: 'Panaji' },
      { id: 'GA-SG', name: 'South Goa', center: [15.2736, 73.9582], zoom: 11, isVerified: true, headquarters: 'Margao' },
    ],
    operationalAreas: [],
    datasetStatus: 'VERIFIED_COMPLETE',
  },
  {
    code: 'IN-GJ',
    name: 'Gujarat',
    type: 'state',
    capital: 'Gandhinagar',
    center: [22.2587, 71.1924],
    zoom: 7,
    totalOfficialDistricts: 33,
    districts: [
      { id: 'GJ-AHM', name: 'Ahmedabad', center: [23.0225, 72.5714], zoom: 12, isVerified: true, headquarters: 'Ahmedabad' },
      { id: 'GJ-SRT', name: 'Surat', center: [21.1702, 72.8311], zoom: 12, isVerified: true, headquarters: 'Surat' },
      { id: 'GJ-VAD', name: 'Vadodara', center: [22.3072, 73.1812], zoom: 12, isVerified: true, headquarters: 'Vadodara' },
      { id: 'GJ-RJK', name: 'Rajkot', center: [22.3039, 70.8022], zoom: 12, isVerified: true, headquarters: 'Rajkot' },
      { id: 'GJ-KCH', name: 'Kutch (Bhuj)', center: [23.2420, 69.6669], zoom: 11, isVerified: true, headquarters: 'Bhuj' },
      { id: 'GJ-JMN', name: 'Jamnagar', center: [22.4707, 70.0577], zoom: 12, isVerified: true, headquarters: 'Jamnagar' },
      { id: 'GJ-BHV', name: 'Bhavnagar', center: [21.7645, 72.1519], zoom: 12, isVerified: true, headquarters: 'Bhavnagar' },
    ],
    operationalAreas: [],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 7 of 33 districts verified. Arabian Sea cyclone grid active.',
  },
  {
    code: 'IN-HR',
    name: 'Haryana',
    type: 'state',
    capital: 'Chandigarh',
    center: [29.0588, 76.0856],
    zoom: 7,
    totalOfficialDistricts: 22,
    districts: [
      { id: 'HR-GUR', name: 'Gurugram', center: [28.4595, 77.0266], zoom: 12, isVerified: true, headquarters: 'Gurugram' },
      { id: 'HR-FAR', name: 'Faridabad', center: [28.4089, 77.3178], zoom: 12, isVerified: true, headquarters: 'Faridabad' },
      { id: 'HR-AMB', name: 'Ambala', center: [30.3782, 76.7767], zoom: 12, isVerified: true, headquarters: 'Ambala' },
      { id: 'HR-HIS', name: 'Hisar', center: [29.1492, 75.7217], zoom: 12, isVerified: true, headquarters: 'Hisar' },
      { id: 'HR-PAN', name: 'Panipat', center: [29.3909, 76.9635], zoom: 12, isVerified: true, headquarters: 'Panipat' },
    ],
    operationalAreas: [],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 5 of 22 districts verified.',
  },
  {
    code: 'IN-HP',
    name: 'Himachal Pradesh',
    type: 'state',
    capital: 'Shimla',
    center: [31.1048, 77.1734],
    zoom: 7,
    totalOfficialDistricts: 12,
    districts: [
      { id: 'HP-SML', name: 'Shimla', center: [31.1048, 77.1734], zoom: 12, isVerified: true, headquarters: 'Shimla' },
      { id: 'HP-KNG', name: 'Kangra (Dharamshala)', center: [32.0998, 76.2691], zoom: 12, isVerified: true, headquarters: 'Dharamshala' },
      { id: 'HP-KUL', name: 'Kullu', center: [31.9579, 77.1095], zoom: 12, isVerified: true, headquarters: 'Kullu' },
      { id: 'HP-MND', name: 'Mandi', center: [31.7087, 76.9320], zoom: 12, isVerified: true, headquarters: 'Mandi' },
      { id: 'HP-CHM', name: 'Chamba', center: [32.5534, 76.1258], zoom: 12, isVerified: true, headquarters: 'Chamba' },
      { id: 'HP-SOL', name: 'Solan', center: [30.9045, 77.0967], zoom: 12, isVerified: true, headquarters: 'Solan' },
    ],
    operationalAreas: [],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 6 of 12 districts verified. Cloudburst & seismic zone monitoring active.',
  },
  {
    code: 'IN-JH',
    name: 'Jharkhand',
    type: 'state',
    capital: 'Ranchi',
    center: [23.6102, 85.2799],
    zoom: 7,
    totalOfficialDistricts: 24,
    districts: [
      { id: 'JH-RNC', name: 'Ranchi', center: [23.3441, 85.3096], zoom: 12, isVerified: true, headquarters: 'Ranchi' },
      { id: 'JH-JSR', name: 'East Singhbhum (Jamshedpur)', center: [22.8046, 86.2029], zoom: 12, isVerified: true, headquarters: 'Jamshedpur' },
      { id: 'JH-DHN', name: 'Dhanbad', center: [23.7957, 86.4304], zoom: 12, isVerified: true, headquarters: 'Dhanbad' },
      { id: 'JH-BOK', name: 'Bokaro', center: [23.6693, 86.1511], zoom: 12, isVerified: true, headquarters: 'Bokaro Steel City' },
    ],
    operationalAreas: [],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 4 of 24 districts verified.',
  },
  {
    code: 'IN-KA',
    name: 'Karnataka',
    type: 'state',
    capital: 'Bengaluru',
    center: [15.3173, 75.7139],
    zoom: 7,
    totalOfficialDistricts: 31,
    districts: [
      { id: 'KA-BLR', name: 'Bengaluru Urban', center: [12.9716, 77.5946], zoom: 12, isVerified: true, headquarters: 'Bengaluru' },
      { id: 'KA-MYS', name: 'Mysuru', center: [12.2958, 76.6394], zoom: 12, isVerified: true, headquarters: 'Mysuru' },
      { id: 'KA-MNG', name: 'Dakshina Kannada (Mangaluru)', center: [12.9141, 74.8560], zoom: 12, isVerified: true, headquarters: 'Mangaluru' },
      { id: 'KA-BGM', name: 'Belagavi', center: [15.8497, 74.4977], zoom: 12, isVerified: true, headquarters: 'Belagavi' },
      { id: 'KA-HUB', name: 'Dharwad (Hubballi)', center: [15.4589, 75.0078], zoom: 12, isVerified: true, headquarters: 'Dharwad' },
      { id: 'KA-KLB', name: 'Kalaburagi', center: [17.3297, 76.8343], zoom: 12, isVerified: true, headquarters: 'Kalaburagi' },
    ],
    operationalAreas: [],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 6 of 31 districts verified.',
  },
  {
    code: 'IN-KL',
    name: 'Kerala',
    type: 'state',
    capital: 'Thiruvananthapuram',
    center: [10.8505, 76.2711],
    zoom: 7,
    totalOfficialDistricts: 14,
    districts: [
      { id: 'KL-TRV', name: 'Thiruvananthapuram', center: [8.5241, 76.9366], zoom: 12, isVerified: true, headquarters: 'Thiruvananthapuram' },
      { id: 'KL-EKM', name: 'Ernakulam (Kochi)', center: [9.9816, 76.2999], zoom: 12, isVerified: true, headquarters: 'Kochi' },
      { id: 'KL-KZK', name: 'Kozhikode', center: [11.2588, 75.7804], zoom: 12, isVerified: true, headquarters: 'Kozhikode' },
      { id: 'KL-WYD', name: 'Wayanad', center: [11.6854, 76.1320], zoom: 12, isVerified: true, headquarters: 'Kalpetta' },
      { id: 'KL-IDK', name: 'Idukki', center: [9.8494, 76.9806], zoom: 12, isVerified: true, headquarters: 'Painavu' },
      { id: 'KL-TSR', name: 'Thrissur', center: [10.5276, 76.2144], zoom: 12, isVerified: true, headquarters: 'Thrissur' },
      { id: 'KL-ALP', name: 'Alappuzha', center: [9.4981, 76.3388], zoom: 12, isVerified: true, headquarters: 'Alappuzha' },
    ],
    operationalAreas: [
      {
        id: 'OPS-KL-WAYANAD-LANDSLIDE',
        name: 'Wayanad Meppadi Debris Flow Corridor',
        state: 'Kerala',
        district: 'Wayanad',
        center: [11.5500, 76.1200],
        zoom: 13,
        description: 'Western Ghats slope stability, earth slippage and flash flood emergency zone',
        hazardRiskTier: 'CRITICAL',
      },
    ],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 7 of 14 districts verified. Western Ghats slope telemetry active.',
  },
  {
    code: 'IN-MP',
    name: 'Madhya Pradesh',
    type: 'state',
    capital: 'Bhopal',
    center: [22.9734, 78.6569],
    zoom: 6,
    totalOfficialDistricts: 55,
    districts: [
      { id: 'MP-BHO', name: 'Bhopal', center: [23.2599, 77.4126], zoom: 12, isVerified: true, headquarters: 'Bhopal' },
      { id: 'MP-IND', name: 'Indore', center: [22.7196, 75.8577], zoom: 12, isVerified: true, headquarters: 'Indore' },
      { id: 'MP-JBL', name: 'Jabalpur', center: [23.1815, 79.9864], zoom: 12, isVerified: true, headquarters: 'Jabalpur' },
      { id: 'MP-GWL', name: 'Gwalior', center: [26.2183, 78.1828], zoom: 12, isVerified: true, headquarters: 'Gwalior' },
      { id: 'MP-UJN', name: 'Ujjain', center: [23.1765, 75.7885], zoom: 12, isVerified: true, headquarters: 'Ujjain' },
    ],
    operationalAreas: [],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 5 of 55 districts verified.',
  },
  {
    code: 'IN-MH',
    name: 'Maharashtra',
    type: 'state',
    capital: 'Mumbai',
    center: [19.7515, 75.7139],
    zoom: 6,
    totalOfficialDistricts: 36,
    districts: [
      { id: 'MH-MUM', name: 'Mumbai City', center: [18.9388, 72.8354], zoom: 12, isVerified: true, headquarters: 'Mumbai' },
      { id: 'MH-MSU', name: 'Mumbai Suburban', center: [19.0760, 72.8777], zoom: 12, isVerified: true, headquarters: 'Bandra' },
      { id: 'MH-PUN', name: 'Pune', center: [18.5204, 73.8567], zoom: 12, isVerified: true, headquarters: 'Pune' },
      { id: 'MH-NGP', name: 'Nagpur', center: [21.1458, 79.0882], zoom: 12, isVerified: true, headquarters: 'Nagpur' },
      { id: 'MH-THN', name: 'Thane', center: [19.2183, 72.9781], zoom: 12, isVerified: true, headquarters: 'Thane' },
      { id: 'MH-NSK', name: 'Nashik', center: [19.9975, 73.7898], zoom: 12, isVerified: true, headquarters: 'Nashik' },
      { id: 'MH-AUR', name: 'Chhatrapati Sambhajinagar (Aurangabad)', center: [19.8762, 75.3433], zoom: 12, isVerified: true, headquarters: 'Aurangabad' },
      { id: 'MH-KOP', name: 'Kolhapur', center: [16.7050, 74.2433], zoom: 12, isVerified: true, headquarters: 'Kolhapur' },
    ],
    operationalAreas: [
      {
        id: 'OPS-MH-MUMBAI-COAST',
        name: 'Greater Mumbai Coastal Defense & Mithi River Basin',
        state: 'Maharashtra',
        district: 'Mumbai Suburban',
        center: [19.0600, 72.8600],
        zoom: 12,
        description: 'High-density urban monsoon waterlogging, tidal gate operations & coastal surge buffer',
        hazardRiskTier: 'CRITICAL',
      },
    ],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 8 of 36 districts verified. Konkan & Mithi river telemetry active.',
  },
  {
    code: 'IN-MN',
    name: 'Manipur',
    type: 'state',
    capital: 'Imphal',
    center: [24.6637, 93.9063],
    zoom: 8,
    totalOfficialDistricts: 16,
    districts: [
      { id: 'MN-IMP', name: 'Imphal West', center: [24.8170, 93.9368], zoom: 12, isVerified: true, headquarters: 'Lamphelpat' },
      { id: 'MN-IME', name: 'Imphal East', center: [24.8000, 94.0000], zoom: 12, isVerified: true, headquarters: 'Porompat' },
      { id: 'MN-CHR', name: 'Churachandpur', center: [24.3333, 93.6667], zoom: 12, isVerified: true, headquarters: 'Churachandpur' },
    ],
    operationalAreas: [],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 3 of 16 districts verified.',
  },
  {
    code: 'IN-ML',
    name: 'Meghalaya',
    type: 'state',
    capital: 'Shillong',
    center: [25.4670, 91.3662],
    zoom: 8,
    totalOfficialDistricts: 12,
    districts: [
      { id: 'ML-EKH', name: 'East Khasi Hills (Shillong)', center: [25.5788, 91.8933], zoom: 12, isVerified: true, headquarters: 'Shillong' },
      { id: 'ML-WGH', name: 'West Garo Hills (Tura)', center: [25.5138, 90.2201], zoom: 12, isVerified: true, headquarters: 'Tura' },
      { id: 'ML-SOH', name: 'Cherrapunji (Sohra Region)', center: [25.2702, 91.7323], zoom: 12, isVerified: true, headquarters: 'Sohra' },
    ],
    operationalAreas: [],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 3 of 12 districts verified. Extreme precipitation radar monitoring active.',
  },
  {
    code: 'IN-MZ',
    name: 'Mizoram',
    type: 'state',
    capital: 'Aizawl',
    center: [23.1645, 92.9376],
    zoom: 8,
    totalOfficialDistricts: 11,
    districts: [
      { id: 'MZ-AZL', name: 'Aizawl', center: [23.7271, 92.7176], zoom: 12, isVerified: true, headquarters: 'Aizawl' },
      { id: 'MZ-LGL', name: 'Lunglei', center: [22.8671, 92.7656], zoom: 12, isVerified: true, headquarters: 'Lunglei' },
      { id: 'MZ-CHP', name: 'Champhai', center: [23.4746, 93.3283], zoom: 12, isVerified: true, headquarters: 'Champhai' },
    ],
    operationalAreas: [],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 3 of 11 districts verified.',
  },
  {
    code: 'IN-NL',
    name: 'Nagaland',
    type: 'state',
    capital: 'Kohima',
    center: [26.1584, 94.5624],
    zoom: 8,
    totalOfficialDistricts: 16,
    districts: [
      { id: 'NL-KOH', name: 'Kohima', center: [25.6751, 94.1086], zoom: 12, isVerified: true, headquarters: 'Kohima' },
      { id: 'NL-DIM', name: 'Dimapur', center: [25.9060, 93.7270], zoom: 12, isVerified: true, headquarters: 'Dimapur' },
      { id: 'NL-MOK', name: 'Mokokchung', center: [26.3249, 94.5165], zoom: 12, isVerified: true, headquarters: 'Mokokchung' },
    ],
    operationalAreas: [],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 3 of 16 districts verified.',
  },
  {
    code: 'IN-OD',
    name: 'Odisha',
    type: 'state',
    capital: 'Bhubaneswar',
    center: [20.9517, 85.0985],
    zoom: 7,
    totalOfficialDistricts: 30,
    districts: [
      { id: 'OD-KHO', name: 'Khurda (Bhubaneswar)', center: [20.2961, 85.8245], zoom: 12, isVerified: true, headquarters: 'Bhubaneswar' },
      { id: 'OD-CTC', name: 'Cuttack', center: [20.4625, 85.8828], zoom: 12, isVerified: true, headquarters: 'Cuttack' },
      { id: 'OD-PUR', name: 'Puri', center: [19.8135, 85.8312], zoom: 12, isVerified: true, headquarters: 'Puri' },
      { id: 'OD-BLS', name: 'Balasore', center: [21.4934, 86.9135], zoom: 12, isVerified: true, headquarters: 'Balasore' },
      { id: 'OD-GNJ', name: 'Ganjam (Berhampur)', center: [19.3149, 84.7941], zoom: 12, isVerified: true, headquarters: 'Chatrapur' },
      { id: 'OD-KRP', name: 'Koraput', center: [18.8135, 82.7118], zoom: 12, isVerified: true, headquarters: 'Koraput' },
    ],
    operationalAreas: [
      {
        id: 'OPS-OD-PARADEEP-COAST',
        name: 'Paradeep - Chandipur Coastal Evacuation Corridor',
        state: 'Odisha',
        district: 'Puri',
        center: [20.3165, 86.6114],
        zoom: 12,
        description: 'Bay of Bengal cyclone shelter network & dynamic flood surge barrier',
        hazardRiskTier: 'CRITICAL',
      },
    ],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 6 of 30 districts verified. Bay of Bengal early warning active.',
  },
  {
    code: 'IN-PB',
    name: 'Punjab',
    type: 'state',
    capital: 'Chandigarh',
    center: [31.1471, 75.3412],
    zoom: 7,
    totalOfficialDistricts: 23,
    districts: [
      { id: 'PB-ASR', name: 'Amritsar', center: [31.6340, 74.8723], zoom: 12, isVerified: true, headquarters: 'Amritsar' },
      { id: 'PB-LDH', name: 'Ludhiana', center: [30.9010, 75.8573], zoom: 12, isVerified: true, headquarters: 'Ludhiana' },
      { id: 'PB-JAL', name: 'Jalandhar', center: [31.3260, 75.5762], zoom: 12, isVerified: true, headquarters: 'Jalandhar' },
      { id: 'PB-PTA', name: 'Patiala', center: [30.3398, 76.3869], zoom: 12, isVerified: true, headquarters: 'Patiala' },
      { id: 'PB-BTH', name: 'Bathinda', center: [30.2110, 74.9455], zoom: 12, isVerified: true, headquarters: 'Bathinda' },
    ],
    operationalAreas: [],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 5 of 23 districts verified.',
  },
  {
    code: 'IN-RJ',
    name: 'Rajasthan',
    type: 'state',
    capital: 'Jaipur',
    center: [27.0238, 74.2179],
    zoom: 6,
    totalOfficialDistricts: 50,
    districts: [
      { id: 'RJ-JAI', name: 'Jaipur', center: [26.9124, 75.7873], zoom: 12, isVerified: true, headquarters: 'Jaipur' },
      { id: 'RJ-JDH', name: 'Jodhpur', center: [26.2389, 73.0243], zoom: 12, isVerified: true, headquarters: 'Jodhpur' },
      { id: 'RJ-UDR', name: 'Udaipur', center: [24.5854, 73.7125], zoom: 12, isVerified: true, headquarters: 'Udaipur' },
      { id: 'RJ-KOT', name: 'Kota', center: [25.2138, 75.8648], zoom: 12, isVerified: true, headquarters: 'Kota' },
      { id: 'RJ-BKN', name: 'Bikaner', center: [28.0229, 73.3119], zoom: 12, isVerified: true, headquarters: 'Bikaner' },
      { id: 'RJ-JSL', name: 'Jaisalmer', center: [26.9157, 70.9083], zoom: 11, isVerified: true, headquarters: 'Jaisalmer' },
    ],
    operationalAreas: [],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 6 of 50 districts verified. Thar desert extreme heatwave telemetry active.',
  },
  {
    code: 'IN-SK',
    name: 'Sikkim',
    type: 'state',
    capital: 'Gangtok',
    center: [27.5330, 88.5122],
    zoom: 8,
    totalOfficialDistricts: 6,
    districts: [
      { id: 'SK-GTK', name: 'Gangtok (East Sikkim)', center: [27.3389, 88.6065], zoom: 12, isVerified: true, headquarters: 'Gangtok' },
      { id: 'SK-NMS', name: 'Namchi (South Sikkim)', center: [27.1667, 88.3500], zoom: 12, isVerified: true, headquarters: 'Namchi' },
      { id: 'SK-MNG', name: 'Mangan (North Sikkim)', center: [27.5000, 88.5333], zoom: 11, isVerified: true, headquarters: 'Mangan' },
      { id: 'SK-GYS', name: 'Gyalshing (West Sikkim)', center: [27.2833, 88.2333], zoom: 12, isVerified: true, headquarters: 'Gyalshing' },
    ],
    operationalAreas: [
      {
        id: 'OPS-SK-TEESTA-GLOF',
        name: 'Teesta River Basin Glacial Lake Outburst Flood (GLOF) Watch',
        state: 'Sikkim',
        district: 'Mangan (North Sikkim)',
        center: [27.6000, 88.6000],
        zoom: 12,
        description: 'High-altitude moraine lake sensor telemetry & downstream flash flood siren network',
        hazardRiskTier: 'CRITICAL',
      },
    ],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 4 of 6 districts verified. Teesta basin GLOF sensors operational.',
  },
  {
    code: 'IN-TN',
    name: 'Tamil Nadu',
    type: 'state',
    capital: 'Chennai',
    center: [11.1271, 78.6569],
    zoom: 7,
    totalOfficialDistricts: 38,
    districts: [
      { id: 'TN-CHN', name: 'Chennai', center: [13.0827, 80.2707], zoom: 12, isVerified: true, headquarters: 'Chennai' },
      { id: 'TN-CBE', name: 'Coimbatore', center: [11.0168, 76.9558], zoom: 12, isVerified: true, headquarters: 'Coimbatore' },
      { id: 'TN-MDU', name: 'Madurai', center: [9.9252, 78.1198], zoom: 12, isVerified: true, headquarters: 'Madurai' },
      { id: 'TN-TRZ', name: 'Tiruchirappalli', center: [10.7905, 78.7047], zoom: 12, isVerified: true, headquarters: 'Tiruchirappalli' },
      { id: 'TN-SLM', name: 'Salem', center: [11.6643, 78.1460], zoom: 12, isVerified: true, headquarters: 'Salem' },
      { id: 'TN-TIR', name: 'Tirunelveli', center: [8.7139, 77.7567], zoom: 12, isVerified: true, headquarters: 'Tirunelveli' },
      { id: 'TN-TPR', name: 'Tiruppur', center: [11.1085, 77.3411], zoom: 12, isVerified: true, headquarters: 'Tiruppur' },
      { id: 'TN-KKL', name: 'Kanniyakumari', center: [8.0883, 77.5385], zoom: 12, isVerified: true, headquarters: 'Nagercoil' },
      { id: 'TN-CUD', name: 'Cuddalore', center: [11.7480, 79.7714], zoom: 12, isVerified: true, headquarters: 'Cuddalore' },
    ],
    operationalAreas: [
      {
        id: 'OPS-TN-ADYAR-SURGE',
        name: 'Adyar - Marina Coastal Storm Surge Extraction Corridor',
        state: 'Tamil Nadu',
        district: 'Chennai',
        center: [13.0200, 80.2400],
        zoom: 13,
        description: 'Tactical search, rescue & boat extraction corridor for low-lying urban inundation zones',
        hazardRiskTier: 'CRITICAL',
      },
    ],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 9 of 38 districts verified. Additional districts dynamically loadable.',
  },
  {
    code: 'IN-TG',
    name: 'Telangana',
    type: 'state',
    capital: 'Hyderabad',
    center: [18.1124, 79.0193],
    zoom: 7,
    totalOfficialDistricts: 33,
    districts: [
      { id: 'TG-HYD', name: 'Hyderabad', center: [17.3850, 78.4867], zoom: 12, isVerified: true, headquarters: 'Hyderabad' },
      { id: 'TG-WAR', name: 'Warangal', center: [17.9689, 79.5941], zoom: 12, isVerified: true, headquarters: 'Warangal' },
      { id: 'TG-NZB', name: 'Nizamabad', center: [18.6725, 78.0941], zoom: 12, isVerified: true, headquarters: 'Nizamabad' },
      { id: 'TG-KHM', name: 'Khammam', center: [17.2473, 80.1514], zoom: 12, isVerified: true, headquarters: 'Khammam' },
      { id: 'TG-KRN', name: 'Karimnagar', center: [18.4386, 79.1288], zoom: 12, isVerified: true, headquarters: 'Karimnagar' },
      { id: 'TG-MBN', name: 'Mahabubnagar', center: [16.7488, 77.9856], zoom: 12, isVerified: true, headquarters: 'Mahabubnagar' },
      { id: 'TG-RRD', name: 'Ranga Reddy', center: [17.3100, 78.5200], zoom: 12, isVerified: true, headquarters: 'Shamshabad' },
    ],
    operationalAreas: [
      {
        id: 'OPS-TG-GHMC-DRAINAGE',
        name: 'GHMC Musi River Urban Basin & Inundation Grid',
        state: 'Telangana',
        district: 'Hyderabad',
        center: [17.3700, 78.4900],
        zoom: 13,
        description: 'Urban storm-water discharge & low-lying nalas emergency response sector',
        hazardRiskTier: 'HIGH',
      },
    ],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 7 of 33 districts verified.',
  },
  {
    code: 'IN-TR',
    name: 'Tripura',
    type: 'state',
    capital: 'Agartala',
    center: [23.9408, 91.9882],
    zoom: 8,
    totalOfficialDistricts: 8,
    districts: [
      { id: 'TR-WTR', name: 'West Tripura (Agartala)', center: [23.8315, 91.2868], zoom: 12, isVerified: true, headquarters: 'Agartala' },
      { id: 'TR-GOM', name: 'Gomati (Udaipur)', center: [23.5333, 91.4833], zoom: 12, isVerified: true, headquarters: 'Udaipur' },
      { id: 'TR-DHN', name: 'Dhalai (Ambassa)', center: [23.9167, 91.8500], zoom: 12, isVerified: true, headquarters: 'Ambassa' },
    ],
    operationalAreas: [],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 3 of 8 districts verified.',
  },
  {
    code: 'IN-UP',
    name: 'Uttar Pradesh',
    type: 'state',
    capital: 'Lucknow',
    center: [26.8467, 80.9462],
    zoom: 6,
    totalOfficialDistricts: 75,
    districts: [
      { id: 'UP-LKO', name: 'Lucknow', center: [26.8467, 80.9462], zoom: 12, isVerified: true, headquarters: 'Lucknow' },
      { id: 'UP-KNP', name: 'Kanpur Nagar', center: [26.4499, 80.3319], zoom: 12, isVerified: true, headquarters: 'Kanpur' },
      { id: 'UP-VNS', name: 'Varanasi', center: [25.3176, 82.9739], zoom: 12, isVerified: true, headquarters: 'Varanasi' },
      { id: 'UP-PRY', name: 'Prayagraj (Allahabad)', center: [25.4358, 81.8463], zoom: 12, isVerified: true, headquarters: 'Prayagraj' },
      { id: 'UP-AGR', name: 'Agra', center: [27.1767, 78.0081], zoom: 12, isVerified: true, headquarters: 'Agra' },
      { id: 'UP-GZB', name: 'Ghaziabad', center: [28.6692, 77.4538], zoom: 12, isVerified: true, headquarters: 'Ghaziabad' },
      { id: 'UP-NOI', name: 'Gautam Buddha Nagar (Noida)', center: [28.5355, 77.3910], zoom: 12, isVerified: true, headquarters: 'Greater Noida' },
      { id: 'UP-GKP', name: 'Gorakhpur', center: [26.7606, 83.3732], zoom: 12, isVerified: true, headquarters: 'Gorakhpur' },
      { id: 'UP-MRT', name: 'Meerut', center: [28.9845, 77.7064], zoom: 12, isVerified: true, headquarters: 'Meerut' },
    ],
    operationalAreas: [
      {
        id: 'OPS-UP-GANGA-BASIN',
        name: 'Ganga - Yamuna Sangam Basin Flood Corridor',
        state: 'Uttar Pradesh',
        district: 'Prayagraj (Allahabad)',
        center: [25.4200, 81.8800],
        zoom: 12,
        description: 'Monsoon discharge inundation buffer across low-lying Ghats and agricultural belts',
        hazardRiskTier: 'HIGH',
      },
    ],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 9 of 75 districts verified. Ganga-Yamuna basin sensors active.',
  },
  {
    code: 'IN-UT',
    name: 'Uttarakhand',
    type: 'state',
    capital: 'Dehradun',
    center: [30.0668, 79.0193],
    zoom: 7,
    totalOfficialDistricts: 13,
    districts: [
      { id: 'UT-DDN', name: 'Dehradun', center: [30.3165, 78.0322], zoom: 12, isVerified: true, headquarters: 'Dehradun' },
      { id: 'UT-HRD', name: 'Haridwar', center: [29.9457, 78.1642], zoom: 12, isVerified: true, headquarters: 'Haridwar' },
      { id: 'UT-CHM', name: 'Chamoli', center: [30.5560, 79.5670], zoom: 11, isVerified: true, headquarters: 'Gopeshwar' },
      { id: 'UT-RDR', name: 'Rudraprayag (Kedarnath Valley)', center: [30.2858, 78.9806], zoom: 11, isVerified: true, headquarters: 'Rudraprayag' },
      { id: 'UT-UTK', name: 'Uttarkashi', center: [30.7268, 78.4354], zoom: 11, isVerified: true, headquarters: 'Uttarkashi' },
      { id: 'UT-NTL', name: 'Nainital', center: [29.3919, 79.4542], zoom: 12, isVerified: true, headquarters: 'Nainital' },
      { id: 'UT-PTH', name: 'Pithoragarh', center: [29.5829, 80.2182], zoom: 11, isVerified: true, headquarters: 'Pithoragarh' },
    ],
    operationalAreas: [
      {
        id: 'OPS-UT-CHAMOLI-SLIDE',
        name: 'Chamoli NH-109 Slope Failure & Multi-Point Landslide Sector',
        state: 'Uttarakhand',
        district: 'Chamoli',
        center: [30.5560, 79.5670],
        zoom: 12,
        description: 'Seismic & slope-slip sensor grid covering high-altitude pilgrim and transport arteries',
        hazardRiskTier: 'CRITICAL',
      },
    ],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 7 of 13 districts verified. Himalayan seismic & cloudburst telemetry active.',
  },
  {
    code: 'IN-WB',
    name: 'West Bengal',
    type: 'state',
    capital: 'Kolkata',
    center: [22.9868, 87.8550],
    zoom: 7,
    totalOfficialDistricts: 23,
    districts: [
      { id: 'WB-KOL', name: 'Kolkata', center: [22.5726, 88.3639], zoom: 12, isVerified: true, headquarters: 'Kolkata' },
      { id: 'WB-HWH', name: 'Howrah', center: [22.5958, 88.2636], zoom: 12, isVerified: true, headquarters: 'Howrah' },
      { id: 'WB-24S', name: 'South 24 Parganas (Sundarbans)', center: [22.1667, 88.5000], zoom: 11, isVerified: true, headquarters: 'Alipore' },
      { id: 'WB-24N', name: 'North 24 Parganas', center: [22.7212, 88.4816], zoom: 12, isVerified: true, headquarters: 'Barasat' },
      { id: 'WB-DAR', name: 'Darjeeling', center: [27.0410, 88.2663], zoom: 12, isVerified: true, headquarters: 'Darjeeling' },
      { id: 'WB-SLG', name: 'Siliguri (Jalpaiguri Corridor)', center: [26.7271, 88.3953], zoom: 12, isVerified: true, headquarters: 'Jalpaiguri' },
      { id: 'WB-PAS', name: 'Paschim Medinipur', center: [22.4257, 87.3199], zoom: 12, isVerified: true, headquarters: 'Midnapore' },
    ],
    operationalAreas: [
      {
        id: 'OPS-WB-SUNDARBANS-SURGE',
        name: 'Sundarbans Mangrove Delta & Tidal Embankment Defense',
        state: 'West Bengal',
        district: 'South 24 Parganas (Sundarbans)',
        center: [21.9500, 88.8000],
        zoom: 11,
        description: 'Tidal surge, mangrove delta breaching and amphibious rescue battalion staging',
        hazardRiskTier: 'CRITICAL',
      },
    ],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 7 of 23 districts verified. Sundarbans tidal surge grid active.',
  },

  // ─── 8 UNION TERRITORIES ───
  {
    code: 'IN-AN',
    name: 'Andaman and Nicobar Islands',
    type: 'union_territory',
    capital: 'Port Blair',
    center: [11.7401, 92.6586],
    zoom: 7,
    totalOfficialDistricts: 3,
    districts: [
      { id: 'AN-SND', name: 'South Andaman (Port Blair)', center: [11.6234, 92.7265], zoom: 12, isVerified: true, headquarters: 'Port Blair' },
      { id: 'AN-NMD', name: 'North and Middle Andaman', center: [12.9167, 92.9167], zoom: 11, isVerified: true, headquarters: 'Mayabunder' },
      { id: 'AN-NIC', name: 'Nicobar', center: [9.1550, 92.7667], zoom: 10, isVerified: true, headquarters: 'Car Nicobar' },
    ],
    operationalAreas: [],
    datasetStatus: 'VERIFIED_COMPLETE',
  },
  {
    code: 'IN-CH',
    name: 'Chandigarh',
    type: 'union_territory',
    capital: 'Chandigarh',
    center: [30.7333, 76.7794],
    zoom: 11,
    totalOfficialDistricts: 1,
    districts: [
      { id: 'CH-CHD', name: 'Chandigarh District', center: [30.7333, 76.7794], zoom: 12, isVerified: true, headquarters: 'Chandigarh' },
    ],
    operationalAreas: [],
    datasetStatus: 'VERIFIED_COMPLETE',
  },
  {
    code: 'IN-DH',
    name: 'Dadra and Nagar Haveli and Daman and Diu',
    type: 'union_territory',
    capital: 'Daman',
    center: [20.4283, 72.8397],
    zoom: 9,
    totalOfficialDistricts: 3,
    districts: [
      { id: 'DH-DMN', name: 'Daman', center: [20.3974, 72.8328], zoom: 12, isVerified: true, headquarters: 'Daman' },
      { id: 'DH-DIU', name: 'Diu', center: [20.7144, 70.9874], zoom: 12, isVerified: true, headquarters: 'Diu' },
      { id: 'DH-DNH', name: 'Dadra and Nagar Haveli (Silvassa)', center: [20.2763, 73.0083], zoom: 12, isVerified: true, headquarters: 'Silvassa' },
    ],
    operationalAreas: [],
    datasetStatus: 'VERIFIED_COMPLETE',
  },
  {
    code: 'IN-DL',
    name: 'Delhi',
    type: 'union_territory',
    capital: 'New Delhi',
    center: [28.7041, 77.1025],
    zoom: 10,
    totalOfficialDistricts: 11,
    districts: [
      { id: 'DL-NDL', name: 'New Delhi', center: [28.6139, 77.2090], zoom: 12, isVerified: true, headquarters: 'Connaught Place' },
      { id: 'DL-CDL', name: 'Central Delhi', center: [28.6500, 77.2300], zoom: 12, isVerified: true, headquarters: 'Daryaganj' },
      { id: 'DL-SDL', name: 'South Delhi', center: [28.5355, 77.2410], zoom: 12, isVerified: true, headquarters: 'Saket' },
      { id: 'DL-EDL', name: 'East Delhi', center: [28.6280, 77.2950], zoom: 12, isVerified: true, headquarters: 'Preet Vihar' },
      { id: 'DL-NDD', name: 'North Delhi', center: [28.7100, 77.1600], zoom: 12, isVerified: true, headquarters: 'Alipur' },
      { id: 'DL-WDL', name: 'West Delhi', center: [28.6600, 77.1200], zoom: 12, isVerified: true, headquarters: 'Rajouri Garden' },
    ],
    operationalAreas: [
      {
        id: 'OPS-DL-YAMUNA-FLOOD',
        name: 'Yamuna Floodplain & Ring Road Embankment Defense',
        state: 'Delhi',
        district: 'Central Delhi',
        center: [28.6600, 77.2400],
        zoom: 13,
        description: 'Hathnikund barrage surplus discharge monitoring, Kashmere Gate & Civil Lines flood defense',
        hazardRiskTier: 'CRITICAL',
      },
    ],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 6 of 11 districts verified. Yamuna floodplain early warning active.',
  },
  {
    code: 'IN-JK',
    name: 'Jammu and Kashmir',
    type: 'union_territory',
    capital: 'Srinagar / Jammu',
    center: [33.7782, 76.5762],
    zoom: 7,
    totalOfficialDistricts: 20,
    districts: [
      { id: 'JK-SRI', name: 'Srinagar', center: [34.0837, 74.7973], zoom: 12, isVerified: true, headquarters: 'Srinagar' },
      { id: 'JK-JAM', name: 'Jammu', center: [32.7266, 74.8570], zoom: 12, isVerified: true, headquarters: 'Jammu' },
      { id: 'JK-ANT', name: 'Anantnag', center: [33.7311, 75.1522], zoom: 12, isVerified: true, headquarters: 'Anantnag' },
      { id: 'JK-BAR', name: 'Baramulla', center: [34.2000, 74.3500], zoom: 12, isVerified: true, headquarters: 'Baramulla' },
      { id: 'JK-UDH', name: 'Udhampur', center: [32.9250, 75.1417], zoom: 12, isVerified: true, headquarters: 'Udhampur' },
    ],
    operationalAreas: [],
    datasetStatus: 'VERIFIED_PARTIAL',
    datasetIncompleteNotice: 'GEOGRAPHIC DATASET INCOMPLETE — 5 of 20 districts verified. Jhelum basin and avalanche telemetry active.',
  },
  {
    code: 'IN-LA',
    name: 'Ladakh',
    type: 'union_territory',
    capital: 'Leh',
    center: [34.1526, 77.5771],
    zoom: 6,
    totalOfficialDistricts: 2,
    districts: [
      { id: 'LA-LEH', name: 'Leh', center: [34.1526, 77.5771], zoom: 11, isVerified: true, headquarters: 'Leh' },
      { id: 'LA-KRG', name: 'Kargil', center: [34.5539, 76.1349], zoom: 11, isVerified: true, headquarters: 'Kargil' },
    ],
    operationalAreas: [],
    datasetStatus: 'VERIFIED_COMPLETE',
  },
  {
    code: 'IN-LD',
    name: 'Lakshadweep',
    type: 'union_territory',
    capital: 'Kavaratti',
    center: [10.5667, 72.6417],
    zoom: 9,
    totalOfficialDistricts: 1,
    districts: [
      { id: 'LD-LAK', name: 'Lakshadweep District', center: [10.5667, 72.6417], zoom: 11, isVerified: true, headquarters: 'Kavaratti' },
    ],
    operationalAreas: [],
    datasetStatus: 'VERIFIED_COMPLETE',
  },
  {
    code: 'IN-PY',
    name: 'Puducherry',
    type: 'union_territory',
    capital: 'Puducherry',
    center: [11.9416, 79.8083],
    zoom: 10,
    totalOfficialDistricts: 4,
    districts: [
      { id: 'PY-PDY', name: 'Puducherry District', center: [11.9416, 79.8083], zoom: 12, isVerified: true, headquarters: 'Puducherry' },
      { id: 'PY-KRK', name: 'Karaikal', center: [10.9254, 79.8380], zoom: 12, isVerified: true, headquarters: 'Karaikal' },
      { id: 'PY-MAH', name: 'Mahe', center: [11.7003, 75.5342], zoom: 12, isVerified: true, headquarters: 'Mahe' },
      { id: 'PY-YAN', name: 'Yanam', center: [16.7333, 82.2167], zoom: 12, isVerified: true, headquarters: 'Yanam' },
    ],
    operationalAreas: [],
    datasetStatus: 'VERIFIED_COMPLETE',
  },
];

// ─── Default India-Wide National Command Scope ───
export const INDIA_NATIONAL_SCOPE: JurisdictionScope = {
  id: 'SCOPE-INDIA',
  level: 'central',
  label: 'COMMAND SCOPE: INDIA',
  shortLabel: 'INDIA',
  center: [22.0000, 79.5000],
  zoom: 5,
  description: 'National EOC Grid — All 28 States & 8 Union Territories of India',
};

// ─── Dynamic In-Memory Registry for Custom Districts & Operational Areas ───
// This allows additional districts & operational areas to be registered or loaded
// from API/Database without changing frontend code.
const dynamicCustomDistricts: Record<string, DistrictInfo[]> = {};
const dynamicCustomOperationalAreas: Record<string, OperationalAreaInfo[]> = {};

export function registerCustomDistrict(stateName: string, district: DistrictInfo): void {
  const normState = stateName.trim();
  if (!dynamicCustomDistricts[normState]) {
    dynamicCustomDistricts[normState] = [];
  }
  // Deduplicate by name
  dynamicCustomDistricts[normState] = dynamicCustomDistricts[normState].filter(
    (d) => d.name.toLowerCase() !== district.name.toLowerCase()
  );
  dynamicCustomDistricts[normState].push(district);
}

export function registerCustomOperationalArea(stateName: string, operationalArea: OperationalAreaInfo): void {
  const normState = stateName.trim();
  if (!dynamicCustomOperationalAreas[normState]) {
    dynamicCustomOperationalAreas[normState] = [];
  }
  dynamicCustomOperationalAreas[normState] = dynamicCustomOperationalAreas[normState].filter(
    (a) => a.id !== operationalArea.id
  );
  dynamicCustomOperationalAreas[normState].push(operationalArea);
}

// ─── Helper Query Functions ───

export function getAllStatesAndUTs(): StateUTInfo[] {
  return INDIA_MASTER_GEOGRAPHY;
}

export function getStateOrUT(nameOrCode: string): StateUTInfo | undefined {
  if (!nameOrCode) return undefined;
  const q = nameOrCode.trim().toLowerCase();
  return INDIA_MASTER_GEOGRAPHY.find(
    (item) => item.name.toLowerCase() === q || item.code.toLowerCase() === q
  );
}

export function getDistrictsForState(stateName: string): DistrictInfo[] {
  const state = getStateOrUT(stateName);
  const base = state?.districts || [];
  const custom = dynamicCustomDistricts[stateName.trim()] || [];
  return [...base, ...custom];
}

export function getOperationalAreasForState(stateName: string): OperationalAreaInfo[] {
  const state = getStateOrUT(stateName);
  const base = state?.operationalAreas || [];
  const custom = dynamicCustomOperationalAreas[stateName.trim()] || [];
  return [...base, ...custom];
}

/**
 * Builds a dynamic, accurate JurisdictionScope for ANY administrative unit in India
 */
export function buildJurisdictionScope(params: {
  level: JurisdictionLevel;
  state?: string;
  district?: string;
  operationalArea?: string;
}): JurisdictionScope {
  // 1. National
  if (params.level === 'central' || (!params.state && !params.district)) {
    return INDIA_NATIONAL_SCOPE;
  }

  // 2. State / Union Territory Level
  if (params.level === 'state' && params.state) {
    const s = getStateOrUT(params.state);
    if (s) {
      return {
        id: `SCOPE-STATE-${s.code}`,
        level: 'state',
        label: `COMMAND SCOPE: ${s.name.toUpperCase()}`,
        shortLabel: s.name.toUpperCase(),
        state: s.name,
        center: s.center,
        zoom: s.zoom,
        description: `${s.type === 'state' ? 'State' : 'Union Territory'} Disaster Management Authority — ${s.capital}`,
      };
    }
  }

  // 3. District Level
  if (params.level === 'district' && params.state && params.district) {
    const s = getStateOrUT(params.state);
    const districts = getDistrictsForState(params.state);
    const d = districts.find(
      (item) => item.name.toLowerCase() === params.district?.toLowerCase()
    );

    const center = d ? d.center : (s ? s.center : [20.5937, 78.9629]);
    const zoom = d ? d.zoom : 12;

    return {
      id: `SCOPE-DISTRICT-${d?.id || params.district.toUpperCase().replace(/\s+/g, '-')}`,
      level: 'district',
      label: `COMMAND SCOPE: ${params.district.toUpperCase()} DISTRICT`,
      shortLabel: `${params.district.toUpperCase()} DISTRICT`,
      state: params.state,
      district: params.district,
      center,
      zoom,
      description: `District Emergency Operations Center — ${params.district}, ${params.state}`,
    };
  }

  // 4. Operational Area Level
  if (params.level === 'operational_area' && params.state) {
    const opAreas = getOperationalAreasForState(params.state);
    const op = opAreas.find(
      (a) => a.name.toLowerCase() === params.operationalArea?.toLowerCase() || a.id === params.operationalArea
    );
    if (op) {
      return {
        id: `SCOPE-OPS-${op.id}`,
        level: 'operational_area',
        label: `COMMAND SCOPE: ${op.name.toUpperCase()}`,
        shortLabel: op.name.toUpperCase(),
        state: op.state,
        district: op.district,
        center: op.center,
        zoom: op.zoom,
        description: op.description,
      };
    }
  }

  // 5. Citizen Public Safety Scope
  if (params.level === 'citizen') {
    return {
      id: 'SCOPE-CITIZEN',
      level: 'citizen',
      label: 'COMMAND SCOPE: CITIZEN SAFETY GUIDANCE',
      shortLabel: 'CITIZEN',
      state: params.state || 'National',
      center: [20.5937, 78.9629],
      zoom: 6,
      description: 'Public Safety Warnings, Safe Havens & Evacuation Guidance',
    };
  }

  // Fallback to National
  return INDIA_NATIONAL_SCOPE;
}

// ─── Presets array initialized with All-India, Sample States & Districts ───
// Kept for backward compatibility and fast selection
export const CORE_JURISDICTION_PRESETS: JurisdictionScope[] = [
  INDIA_NATIONAL_SCOPE,
  buildJurisdictionScope({ level: 'state', state: 'Tamil Nadu' }),
  buildJurisdictionScope({ level: 'state', state: 'Andhra Pradesh' }),
  buildJurisdictionScope({ level: 'state', state: 'Telangana' }),
  buildJurisdictionScope({ level: 'state', state: 'Maharashtra' }),
  buildJurisdictionScope({ level: 'state', state: 'Odisha' }),
  buildJurisdictionScope({ level: 'state', state: 'Delhi' }),
  buildJurisdictionScope({ level: 'state', state: 'Uttarakhand' }),
  buildJurisdictionScope({ level: 'district', state: 'Tamil Nadu', district: 'Chennai' }),
  buildJurisdictionScope({ level: 'district', state: 'Andhra Pradesh', district: 'Visakhapatnam' }),
  buildJurisdictionScope({ level: 'district', state: 'Telangana', district: 'Hyderabad' }),
  buildJurisdictionScope({ level: 'district', state: 'Maharashtra', district: 'Mumbai City' }),
  buildJurisdictionScope({ level: 'district', state: 'Uttarakhand', district: 'Chamoli' }),
  {
    id: 'SCOPE-OPS-AREAS',
    level: 'operational_area',
    label: 'COMMAND SCOPE: OPERATIONAL AREA (COASTAL CORRIDOR)',
    shortLabel: 'OPS AREA',
    state: 'Tamil Nadu',
    district: 'Chennai',
    center: [13.02, 80.24],
    zoom: 13,
    description: 'Tactical Search, Rescue & Boat Extraction Corridor',
  },
  {
    id: 'SCOPE-CITIZEN',
    level: 'citizen',
    label: 'COMMAND SCOPE: CITIZEN SAFETY GUIDANCE',
    shortLabel: 'CITIZEN',
    center: [20.5937, 78.9629],
    zoom: 6,
    description: 'Public Safety Warnings, Safe Havens & Evacuation Corridors',
  },
];
