import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import api from '../services/api';

const LocationContext = createContext();

const LOCATION_STORAGE_KEY = 'delivo_customer_location';

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    formattedAddress: '',
    nearbyLandmark: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Restore location on mount
  useEffect(() => {
    const restoreLocation = async () => {
      // 1. Try local storage first
      try {
        const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
        if (stored) {
          setLocation(JSON.parse(stored));
          return;
        }
      } catch (err) {
        console.error('Error reading location from storage:', err);
      }

      // 2. Fallback: If logged in, fetch last profile coordinates
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/users/profile');
          const profile = res.data.data || res.data.user || {};
          if (profile.lastLatitude && profile.lastLongitude) {
            const profileLoc = {
              latitude: profile.lastLatitude,
              longitude: profile.lastLongitude,
              formattedAddress: profile.lastAddress || profile.location || '',
              nearbyLandmark: '',
            };
            setLocation(profileLoc);
            localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(profileLoc));
          }
        } catch (err) {
          console.error('Error fetching profile location:', err);
        }
      }
    };

    restoreLocation();
  }, []);

  // Save/Update location coordinate values
  const updateLocation = async (lat, lng, address, landmark = '') => {
    const newLoc = {
      latitude: parseFloat(lat),
      longitude: parseFloat(lng),
      formattedAddress: address || '',
      nearbyLandmark: landmark || '',
    };

    setLocation(newLoc);
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(newLoc));

    // If authenticated, sync with the database profile
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await api.put('/users/location', {
          latitude: newLoc.latitude,
          longitude: newLoc.longitude,
          address: newLoc.formattedAddress,
        });
        console.log('✅ Coords synced to database profile.');
      } catch (err) {
        console.error('❌ Failed to sync profile coords:', err);
      }
    }
  };

  // Browser Geolocation API detection with high accuracy and retries
  const detectLocation = async (retries = 3) => {
    setLoading(true);
    setError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    const getGeo = () => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });
    };

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const position = await getGeo();
        const { latitude, longitude } = position.coords;

        // Perform reverse geocoding to address via OpenStreetMap Nominatim
        const geoRes = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
        );
        const address = geoRes.data.display_name || `Coordinates: ${latitude}, ${longitude}`;

        await updateLocation(latitude, longitude, address);
        setLoading(false);
        return { success: true, latitude, longitude, address };
      } catch (err) {
        console.warn(`Attempt ${attempt} to fetch Geolocation coordinates failed:`, err);
        if (attempt === retries) {
          let msg = 'Unable to get your location.';
          if (err.code === 1) {
            msg = 'Location permission denied. Please allow access in browser.';
          } else if (err.code === 2) {
            msg = 'Position unavailable. Check your GPS status.';
          } else if (err.code === 3) {
            msg = 'Detection timed out. Click retry to try again.';
          }
          setError(msg);
          setLoading(false);
          return { success: false, error: msg };
        }
        // Brief sleep before retry
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  };

  return (
    <LocationContext.Provider value={{ location, loading, error, detectLocation, updateLocation }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
