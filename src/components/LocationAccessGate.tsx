import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LocateFixed, MapPin, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../store/appStore';

interface LocationAccessGateProps {
  children: React.ReactNode;
}

const getLocationError = (error: GeolocationPositionError) => {
  if (error.code === error.PERMISSION_DENIED) {
    return 'Location access is blocked. Allow it in your browser site settings, then try again.';
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return 'Your device could not determine a location. Check its location services and try again.';
  }
  return 'Finding your location timed out. Check your connection or GPS signal and retry.';
};

export const LocationAccessGate: React.FC<LocationAccessGateProps> = ({ children }) => {
  const setCurrentLocation = useAppStore((state) => state.setCurrentLocation);
  const [isReady, setIsReady] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const watchId = useRef<number | null>(null);

  useEffect(() => () => {
    if (watchId.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
    }
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('This browser does not support location access. Open the app in a supported browser.');
      return;
    }

    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    setErrorMessage('');
    setIsLocating(true);
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          updatedAt: new Date(position.timestamp).toISOString(),
        });
        setIsReady(true);
        setIsLocating(false);
      },
      (error) => {
        if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
        setErrorMessage(getLocationError(error));
        setIsLocating(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {isReady ? (
        <motion.div
          key="location-ready"
          className="min-h-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      ) : (
        <motion.main
          key="location-required"
          className="brg-location-gate"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.section
            className="brg-location-panel"
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.32, ease: [0.2, 0.7, 0.2, 1] }}
            aria-labelledby="location-gate-title"
          >
            <div className="brg-location-icon" aria-hidden="true"><LocateFixed size={24} /></div>
            <p className="brg-location-eyebrow">Bharat Response Grid</p>
            <h1 id="location-gate-title">Share your location to continue</h1>
            <p className="brg-location-copy">
              BRG uses your live position to show where you are on operational maps and to help you orient to nearby response information.
            </p>
            <div className="brg-location-privacy">
              <ShieldCheck size={16} aria-hidden="true" />
              <span>Your location stays in this browser and is not sent to the server.</span>
            </div>
            {errorMessage && <p className="brg-location-error" role="alert">{errorMessage}</p>}
            <button
              type="button"
              className="brg-location-button"
              onClick={requestLocation}
              disabled={isLocating}
            >
              <MapPin size={17} aria-hidden="true" />
              {isLocating ? 'Finding your location…' : errorMessage ? 'Try location access again' : 'Allow location and continue'}
            </button>
            <p className="brg-location-hint">Location permission is required to open the application.</p>
          </motion.section>
        </motion.main>
      )}
    </AnimatePresence>
  );
};
