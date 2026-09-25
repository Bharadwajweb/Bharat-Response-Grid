import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      'nav.overview': 'Command Overview',
      'nav.incidents': 'Incidents',
      'nav.operations': 'Emergency Operations',
      'nav.maps': 'Maps & Tracking',
      'nav.weather': 'Weather Intelligence',
      'nav.simulation': 'Threat Simulation',
      'nav.resources': 'Resources',
      'nav.communications': 'Communications',
      'nav.analytics': 'Analytics',
      'nav.users': 'User Management',
      'nav.profile': 'Profile',
      'nav.settings': 'Settings',
      'nav.citizen': 'Citizen Portal',

      // Auth
      'auth.title': 'BRG COMMAND GATEWAY',
      'auth.subtitle': 'Bharat Response Grid',
      'auth.email': 'Email Address',
      'auth.password': 'Password',
      'auth.login': 'Sign In to Command',
      'auth.citizen': 'Continue as Citizen',
      'auth.forgot': 'Forgot password?',
      'auth.status': 'COMMAND NETWORK OPERATIONAL',

      // Dashboard
      'dashboard.title': 'National Command Overview',
      'dashboard.subtitle': 'Real-time disaster response and coordination',
      'dashboard.activeIncidents': 'Active Incidents',
      'dashboard.criticalIncidents': 'Critical Incidents',
      'dashboard.respondersDeployed': 'Responders Deployed',
      'dashboard.sheltersActive': 'Shelters Active',
      'dashboard.resourcesAllocated': 'Resources Allocated',
      'dashboard.avgResponse': 'Avg. Response Time',

      // Severity
      'severity.critical': 'CRITICAL',
      'severity.high': 'HIGH',
      'severity.medium': 'MEDIUM',
      'severity.low': 'LOW',

      // Status
      'status.reported': 'Reported',
      'status.verified': 'Verified',
      'status.responding': 'Responding',
      'status.contained': 'Contained',
      'status.resolved': 'Resolved',

      // Disaster Types
      'type.flood': 'Flood',
      'type.cyclone': 'Cyclone',
      'type.earthquake': 'Earthquake',
      'type.fire': 'Fire',
      'type.landslide': 'Landslide',
      'type.drought': 'Drought',
      'type.heatwave': 'Heatwave',
      'type.tsunami': 'Tsunami',
      'type.industrial': 'Industrial',
      'type.other': 'Other',

      // Citizen Portal
      'citizen.title': 'Report an Emergency',
      'citizen.subtitle': 'Submit an emergency report. Anonymous reporting is allowed.',
      'citizen.type': 'Emergency Type',
      'citizen.location': 'Your Location',
      'citizen.description': 'Describe the Emergency',
      'citizen.submit': 'Submit Emergency Report',
      'citizen.submitted': 'Emergency Report Submitted',
      'citizen.trackingId': 'Your Tracking ID',
      'citizen.emergency': '112 — National Emergency',
      'citizen.ndma': '1078 — NDMA Helpline',
      'citizen.ambulance': '108 — Ambulance',
      'citizen.fire': '101 — Fire Emergency',

      // Connection
      'connection.lost': 'Connection interrupted — attempting to reconnect',
      'connection.restored': 'Connection restored',

      // Common
      'common.minutes': 'min',
      'common.updatedAt': 'Updated',
      'common.reportedAt': 'Reported',
      'common.search': 'Search',
      'common.filter': 'Filter',
      'common.export': 'Export',
      'common.create': 'Create',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.confirm': 'Confirm',
      'common.loading': 'Loading...',
      'common.noData': 'No data available',
      'common.viewAll': 'View All',
      'common.close': 'Close',
      'common.details': 'Details',
      'common.assign': 'Assign',
      'common.download': 'Download',
      'common.refresh': 'Refresh',
      'common.liveData': 'LIVE DATA',
      'common.simulatedData': 'SIMULATED DATA',
    },
  },
  te: {
    translation: {
      // Navigation
      'nav.overview': 'కమాండ్ అవలోకనం',
      'nav.incidents': 'సంఘటనలు',
      'nav.operations': 'అత్యవసర కార్యకలాపాలు',
      'nav.maps': 'మ్యాప్‌లు & ట్రాకింగ్',
      'nav.weather': 'వాతావరణ నిఘా',
      'nav.simulation': 'ముప్పు అనుకరణ',
      'nav.resources': 'వనరులు',
      'nav.communications': 'కమ్యూనికేషన్లు',
      'nav.analytics': 'విశ్లేషణలు',
      'nav.users': 'వినియోగదారు నిర్వహణ',
      'nav.profile': 'ప్రొఫైల్',
      'nav.settings': 'సెట్టింగ్‌లు',
      'nav.citizen': 'పౌర పోర్టల్',

      // Auth
      'auth.title': 'BRG కమాండ్ గేట్‌వే',
      'auth.subtitle': 'భారత రెస్పాన్స్ గ్రిడ్',
      'auth.email': 'ఇమెయిల్ చిరునామా',
      'auth.password': 'పాస్‌వర్డ్',
      'auth.login': 'కమాండ్‌లోకి సైన్ ఇన్',
      'auth.citizen': 'పౌరుడిగా కొనసాగించు',
      'auth.forgot': 'పాస్‌వర్డ్ మర్చిపోయారా?',
      'auth.status': 'కమాండ్ నెట్‌వర్క్ పనిచేస్తోంది',

      // Dashboard
      'dashboard.title': 'జాతీయ కమాండ్ అవలోకనం',
      'dashboard.subtitle': 'రియల్-టైమ్ విపత్తు ప్రతిస్పందన మరియు సమన్వయం',
      'dashboard.activeIncidents': 'సక్రియ సంఘటనలు',
      'dashboard.criticalIncidents': 'క్రిటికల్ సంఘటనలు',
      'dashboard.respondersDeployed': 'మోహరించిన రెస్పాండర్లు',
      'dashboard.sheltersActive': 'సక్రియ ఆశ్రయాలు',
      'dashboard.resourcesAllocated': 'కేటాయించిన వనరులు',
      'dashboard.avgResponse': 'సగటు ప్రతిస్పందన సమయం',

      // Severity
      'severity.critical': 'క్రిటికల్',
      'severity.high': 'హై',
      'severity.medium': 'మీడియం',
      'severity.low': 'లో',

      // Status
      'status.reported': 'నివేదించబడింది',
      'status.verified': 'ధృవీకరించబడింది',
      'status.responding': 'ప్రతిస్పందిస్తోంది',
      'status.contained': 'నియంత్రించబడింది',
      'status.resolved': 'పరిష్కరించబడింది',

      // Disaster Types
      'type.flood': 'వరద',
      'type.cyclone': 'తుఫాను',
      'type.earthquake': 'భూకంపం',
      'type.fire': 'అగ్ని',
      'type.landslide': 'కొండచరియ',
      'type.drought': 'కరువు',
      'type.heatwave': 'వేడి అలల',
      'type.tsunami': 'సునామీ',
      'type.industrial': 'పారిశ్రామిక',
      'type.other': 'ఇతర',

      // Citizen Portal
      'citizen.title': 'అత్యవసరాన్ని నివేదించండి',
      'citizen.subtitle': 'అత్యవసర నివేదికను సమర్పించండి. అనామక నివేదన అనుమతించబడింది.',
      'citizen.type': 'అత్యవసర రకం',
      'citizen.location': 'మీ స్థానం',
      'citizen.description': 'అత్యవసరాన్ని వివరించండి',
      'citizen.submit': 'అత్యవసర నివేదిక సమర్పించు',
      'citizen.submitted': 'అత్యవసర నివేదిక సమర్పించబడింది',
      'citizen.trackingId': 'మీ ట్రాకింగ్ ID',
      'citizen.emergency': '112 — జాతీయ అత్యవసర',
      'citizen.ndma': '1078 — NDMA హెల్ప్‌లైన్',
      'citizen.ambulance': '108 — అంబులెన్స్',
      'citizen.fire': '101 — అగ్ని అత్యవసర',

      // Connection
      'connection.lost': 'కనెక్షన్ తెగిపోయింది — తిరిగి కనెక్ట్ చేయడానికి ప్రయత్నిస్తోంది',
      'connection.restored': 'కనెక్షన్ పునరుద్ధరించబడింది',

      // Common
      'common.minutes': 'నిమి',
      'common.updatedAt': 'నవీకరించబడింది',
      'common.reportedAt': 'నివేదించబడింది',
      'common.search': 'శోధన',
      'common.filter': 'ఫిల్టర్',
      'common.export': 'ఎగుమతి',
      'common.create': 'సృష్టించు',
      'common.save': 'సేవ్',
      'common.cancel': 'రద్దు',
      'common.confirm': 'నిర్ధారించు',
      'common.loading': 'లోడ్ అవుతోంది...',
      'common.noData': 'డేటా అందుబాటులో లేదు',
      'common.viewAll': 'అన్నీ చూడు',
      'common.close': 'మూసివేయి',
      'common.details': 'వివరాలు',
      'common.assign': 'కేటాయించు',
      'common.download': 'డౌన్‌లోడ్',
      'common.refresh': 'రిఫ్రెష్',
      'common.liveData': 'లైవ్ డేటా',
      'common.simulatedData': 'అనుకరణ డేటా',
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
