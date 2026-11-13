import React from 'react';
import L from 'leaflet';
import { LocateFixed } from 'lucide-react';
import { Circle, Marker, Popup, useMap } from 'react-leaflet';
import { useAppStore } from '../../store/appStore';

const CURRENT_LOCATION_ICON = L.divIcon({
  className: 'brg-current-location-icon',
  html: '<span class="brg-location-pulse"><span class="brg-location-dot"></span></span>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

export const CurrentLocationMarker: React.FC = () => {
  const location = useAppStore((state) => state.currentLocation);
  const map = useMap();
  if (!location) return null;

  const position: [number, number] = [location.latitude, location.longitude];

  return (
    <>
      <div className="leaflet-bottom leaflet-right brg-locate-control">
        <div className="leaflet-control">
          <button
            type="button"
            title="Show your current location"
            aria-label="Show your current location"
            onClick={(event) => {
              event.stopPropagation();
              map.flyTo(position, Math.max(map.getZoom(), 12), { duration: 0.8 });
            }}
          >
            <LocateFixed size={17} />
          </button>
        </div>
      </div>
      <Circle
        center={position}
        radius={location.accuracy}
        pathOptions={{ color: '#38bdf8', fillColor: '#38bdf8', fillOpacity: 0.06, weight: 1, opacity: 0.45 }}
        interactive={false}
      />
      <Marker position={position} icon={CURRENT_LOCATION_ICON} zIndexOffset={1200} title="Your current location">
        <Popup>
          <div className="p-1 text-xs text-slate-800">
            <strong className="block text-slate-900">Your current location</strong>
            <span>{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</span>
            <span className="block text-slate-500">Accuracy ±{Math.round(location.accuracy)} m</span>
          </div>
        </Popup>
      </Marker>
    </>
  );
};
