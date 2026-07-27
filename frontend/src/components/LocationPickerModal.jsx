import { useState, useEffect } from 'react';
import { X, MapPin, Navigation, Search, Check, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { useLocation } from '../context/LocationContext';
import './LocationPickerModal.css';

const LocationPickerModal = ({ isOpen, onClose }) => {
  const { location, loading: geoLoading, error: geoError, detectLocation, updateLocation } = useLocation();

  const [coords, setCoords] = useState({ lat: -1.2921, lng: 36.8219 }); // Nairobi Default
  const [addressVal, setAddressVal] = useState('');
  const [landmarkVal, setLandmarkVal] = useState('');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Initialize coords when location context loads or modal opens
  useEffect(() => {
    if (isOpen && location.latitude && location.longitude) {
      setCoords({ lat: location.latitude, lng: location.longitude });
      setAddressVal(location.formattedAddress || '');
      setLandmarkVal(location.nearbyLandmark || '');
    }
  }, [isOpen, location]);

  // Keep the selected coordinates available for confirmation even without a map widget.
  useEffect(() => {
    if (!isOpen) return;

    if (location.latitude && location.longitude) {
      setCoords({ lat: location.latitude, lng: location.longitude });
      setAddressVal(location.formattedAddress || '');
    }
  }, [isOpen, location.latitude, location.longitude]);

  if (!isOpen) return null;

  // Detect location via GPS button handler
  const handleGPSDetect = async () => {
    const res = await detectLocation();
    if (res && res.success) {
      setCoords({ lat: res.latitude, lng: res.longitude });
      setAddressVal(res.address);
    }
  };

  // Autocomplete search suggestions handler
  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.trim().length > 3) {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const res = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&addressdetails=1&limit=5`
        );
        setSuggestions(res.data || []);
      } catch (err) {
        setSearchError('Search query failed');
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
    const label = item.display_name;

    setCoords({ lat, lng });
    setAddressVal(label);
    setSearchQuery('');
    setSuggestions([]);

  };

  // Confirm and Save Coordinates Selection
  const handleConfirmLocation = async () => {
    if (!addressVal) {
      alert('Please select or search a valid delivery address');
      return;
    }
    if (!landmarkVal || landmarkVal.trim().length < 3) {
      alert('Please enter your exact building details (e.g. room number, hostel name, house/apartment number) so the rider can find you.');
      return;
    }
    await updateLocation(coords.lat, coords.lng, addressVal, landmarkVal);
    onClose();
  };

  return (
    <div className="location-picker-overlay" onClick={onClose}>
      <div className="location-picker-modal" onClick={(e) => e.stopPropagation()}>
        
        <div className="location-picker-header">
          <h2>Select Delivery Location</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="location-picker-body">
          
          {/* GEOLOCATION DETECT BUTTON */}
          <div className="geolocation-btn-row">
            <button
              type="button"
              className="geolocation-detect-btn"
              onClick={handleGPSDetect}
              disabled={geoLoading}
            >
              <Navigation size={18} className={geoLoading ? 'animate-spin' : ''} />
              {geoLoading ? 'Finding your location...' : 'Use Current Location'}
            </button>
            {geoError && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', textAlign: 'center', fontWeight: '500' }}>
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
                    className="suggestion-row"
                    onClick={() => handleSelectSuggestion(item)}
                  >
                    <MapPin size={12} style={{ display: 'inline', marginRight: '6px', color: '#f97316' }} />
                    {item.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CURRENT COORDINATES PREVIEW */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>Selected Coordinates</label>
            <div className="map-view-frame" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', fontSize: '13px' }}>
              {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
            </div>
            <span style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic', marginTop: '2px' }}>
              Your selected location will be saved once you confirm it.
            </span>
          </div>

          {/* CURRENT ADDRESS PREVIEW */}
          <div className="landmark-input-group">
            <label>Selected Formatted Address</label>
            <textarea
              readOnly
              value={addressVal}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1.5px solid #e5e7eb',
                borderRadius: '8px',
                background: '#f9fafb',
                fontSize: '13px',
                color: '#4b5563',
                resize: 'none',
                height: '50px',
                outline: 'none'
              }}
            />
          </div>

          {/* NEARBY LANDMARK */}
          <div className="landmark-input-group">
            <label htmlFor="landmark">Nearby Landmark / Notes (Apartment, Flat No) *</label>
            <input
              type="text"
              id="landmark"
              placeholder="E.g., Opp. Equity Bank, Apt 4B"
              value={landmarkVal}
              onChange={(e) => setLandmarkVal(e.target.value)}
            />
          </div>

          {/* SAVE / CONFIRM BUTTON */}
          <button
            type="button"
            className="confirm-location-btn"
            onClick={handleConfirmLocation}
          >
            <Check size={18} /> Confirm Location
          </button>
        </div>

      </div>
    </div>
  );
};

export default LocationPickerModal;
