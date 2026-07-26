import { useState, useEffect, useRef } from 'react';
import { X, MapPin, Navigation, Search, Check, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocation } from '../context/LocationContext';
import './LocationPickerModal.css';

// WORKAROUND: Resolve default marker assets inside bundler environment
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const LocationPickerModal = ({ isOpen, onClose }) => {
  const { location, loading: geoLoading, error: geoError, detectLocation, updateLocation } = useLocation();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);

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

  // Leaflet map initialization
  useEffect(() => {
    if (!isOpen) return;

    // Wait for the DOM container to be fully rendered
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      // 1. Create Map Instance if it doesn't exist
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapContainerRef.current).setView([coords.lat, coords.lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(mapInstanceRef.current);

        // 2. Add Draggable Marker Pin
        markerInstanceRef.current = L.marker([coords.lat, coords.lng], { draggable: true }).addTo(mapInstanceRef.current);

        // 3. Bind Marker Drag Stop Events
        markerInstanceRef.current.on('dragend', async (event) => {
          const marker = event.target;
          const position = marker.getLatLng();
          const lat = position.lat;
          const lng = position.lng;
          setCoords({ lat, lng });
          
          // Reverse geocode new coordinate drag pin location
          try {
            const geoRes = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
            );
            setAddressVal(geoRes.data.display_name || `${lat}, ${lng}`);
          } catch (err) {
            console.error('Error reverse geocoding drag coordinates:', err);
          }
        });
      } else {
        // Map already exists, update view and marker
        mapInstanceRef.current.setView([coords.lat, coords.lng], 15);
        markerInstanceRef.current.setLatLng([coords.lat, coords.lng]);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, coords.lat, coords.lng]);

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

    if (mapInstanceRef.current && markerInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15);
      markerInstanceRef.current.setLatLng([lat, lng]);
    }
  };

  // Confirm and Save Coordinates Selection
  const handleConfirmLocation = async () => {
    if (!addressVal) {
      alert('Please select or search a valid delivery address');
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

          {/* PICK / DRAG PIN ON MAP */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>Pick / Drag Pin on Map</label>
            <div ref={mapContainerRef} className="map-view-frame" />
            <span style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic', marginTop: '2px' }}>
              Drag the marker on the map to fine-tune your exact coordinates.
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
