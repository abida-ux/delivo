import { useState, useEffect, useCallback } from 'react';
import { X, MapPin, Navigation, Search, Check, AlertTriangle } from 'lucide-react';
import { useLocation } from '../context/LocationContext';
import './LocationPickerModal.css';

const LocationPickerModal = ({ isOpen, onClose }) => {
  const { location, updateLocation } = useLocation();

  const [coords, setCoords] = useState({
    lat: location.latitude || -1.2921,
    lng: location.longitude || 36.8219,
  });

  const [addressVal, setAddressVal] = useState(location.formattedAddress || '');
  const [landmarkVal, setLandmarkVal] = useState(location.nearbyLandmark || '');

  // Geolocation detection state
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Synchronize state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCoords({
        lat: location.latitude || -1.2921,
        lng: location.longitude || 36.8219,
      });
      setAddressVal(location.formattedAddress || '');
      setLandmarkVal(location.nearbyLandmark || '');
      setSearchQuery('');
      setSuggestions([]);
      setGeoError(null);
    }
  }, [isOpen, location]);

  // Reverse geocoding helper (OpenStreetMap Nominatim)
  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      if (data && data.display_name) {
        setAddressVal(data.display_name);
      } else {
        setAddressVal(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      }
    } catch {
      setAddressVal(`Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    }
  }, []);

  // Autocomplete search suggestions handler
  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (val.trim().length > 2) {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&addressdetails=1&limit=5`
        );
        const data = await res.json();
        setSuggestions(data || []);
      } catch {
        setSuggestions([]);
      } finally {
        setSearchLoading(false);
      }
    } else {
      setSuggestions([]);
    }
  };

  // Select Search Autocomplete Row
  const handleSelectSuggestion = (item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setCoords({ lat, lng });
    setAddressVal(item.display_name);
    setSuggestions([]);
    setSearchQuery('');
  };

  // Geolocation trigger
  const handleGPSDetect = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoords({ lat, lng });
        reverseGeocode(lat, lng);
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        setGeoError(err.message || 'Unable to retrieve location.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Confirm Location Handler
  const handleConfirmLocation = () => {
    const finalAddress = addressVal || '';
    const landmark = landmarkVal.trim();

    if (!landmark) {
      alert('Please specify your hostel, room, house number, or apartment details in the "Nearby Landmark / Notes" field so the rider can find you.');
      return;
    }

    if (landmark.length < 3) {
      alert('Please provide a slightly more descriptive delivery detail (at least 3 characters) in the landmark field.');
      return;
    }

    updateLocation(coords.lat, coords.lng, finalAddress, landmark);
    if (onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="location-picker-overlay" onClick={onClose}>
      <div className="location-picker-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="location-picker-header">
          <h2>Select Delivery Location</h2>
          <button className="close-btn" onClick={onClose} title="Close location picker">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="location-picker-body">
          
          {/* GEOLOCATION DETECT BUTTON */}
          <div className="geolocation-btn-row">
            <button
              type="button"
              className="use-gps-btn"
              onClick={handleGPSDetect}
              disabled={geoLoading}
            >
              <Navigation size={18} className={geoLoading ? 'spinner' : ''} />
              <span>{geoLoading ? 'Finding your location...' : 'Use Current Location'}</span>
            </button>
            {geoError && (
              <p className="field-error" style={{ textAlign: 'center', marginTop: '6px' }}>
                <AlertTriangle size={12} style={{ display: 'inline', marginRight: '4px' }} />
                {geoError}
              </p>
            )}
          </div>

          {/* MANUAL ADDRESS SEARCH */}
          <div className="location-search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              className="location-search-input"
              placeholder="Search building, street, hotel, landmark..."
              value={searchQuery}
              onChange={handleSearchChange}
            />

            {searchLoading && (
              <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#9ca3af' }}>
                Searching...
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="suggestions-list">
                {suggestions.map((item) => (
                  <div
                    key={item.place_id}
                    className="suggestion-item"
                    onClick={() => handleSelectSuggestion(item)}
                  >
                    <MapPin size={14} style={{ color: '#ff6b00', flexShrink: 0 }} />
                    <span>{item.display_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CURRENT COORDINATES PREVIEW */}
          <div className="manual-address-group">
            <label>Selected Coordinates</label>
            <div style={{ padding: '10px 14px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', color: '#475467', textAlign: 'center', fontWeight: '600' }}>
              {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
            </div>
            <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', marginTop: '2px' }}>
              Your selected location will be saved once you confirm it.
            </span>
          </div>

          {/* CURRENT ADDRESS PREVIEW */}
          <div className="manual-address-group">
            <label>Selected Formatted Address</label>
            <textarea
              readOnly
              value={addressVal}
              className="manual-address-input"
              style={{
                background: '#f8fafc',
                color: '#475467',
                resize: 'none',
                height: '54px'
              }}
            />
          </div>

          {/* NEARBY LANDMARK */}
          <div className="manual-address-group">
            <label htmlFor="landmark">Nearby Landmark / Notes (Apartment, Flat No) *</label>
            <input
              type="text"
              id="landmark"
              className="manual-address-input"
              placeholder="E.g., Opp. Equity Bank, Apt 4B"
              value={landmarkVal}
              onChange={(e) => setLandmarkVal(e.target.value)}
            />
          </div>

          {/* SAVE / CONFIRM BUTTON */}
          <div className="location-picker-footer" style={{ padding: 0, border: 'none', marginTop: '8px' }}>
            <button
              type="button"
              className="confirm-btn"
              onClick={handleConfirmLocation}
              style={{ width: '100%' }}
            >
              <Check size={18} />
              <span>Confirm Location</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LocationPickerModal;
