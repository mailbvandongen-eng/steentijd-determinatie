import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { MapPin, Navigation, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { VondstLocatie } from '../types';

// Fix voor Leaflet marker icons in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Custom amber marker
const amberIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'amber-marker',
});

// Fix default marker icon
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface LocationPickerProps {
  value?: VondstLocatie;
  onChange: (location: VondstLocatie | undefined) => void;
  compact?: boolean;
}

// Component om kaart events te handelen
function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component om naar locatie te vliegen
function FlyToLocation({ location }: { location: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], 13, { duration: 1 });
    }
  }, [location, map]);

  return null;
}

export function LocationPicker({ value, onChange, compact = false }: LocationPickerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);

  // Nederland centrum als default
  const defaultCenter: [number, number] = [52.1326, 5.2913];
  const center: [number, number] = value ? [value.lat, value.lng] : defaultCenter;

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    onChange({ lat, lng });
    setFlyTo({ lat, lng });
  }, [onChange]);

  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocatie wordt niet ondersteund door je browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onChange({ lat: latitude, lng: longitude });
        setFlyTo({ lat: latitude, lng: longitude });
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocatie fout:', error);
        setIsLocating(false);
        alert('Kon je locatie niet bepalen. Tik op de kaart om een locatie te kiezen.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onChange]);

  const handleClearLocation = useCallback(() => {
    onChange(undefined);
    setFlyTo(null);
  }, [onChange]);

  // Compacte weergave - alleen een knop om uit te klappen
  if (compact && !isExpanded) {
    return (
      <div
        className="rounded-xl border-2 border-dashed p-3 flex items-center justify-between cursor-pointer hover:border-amber-400 transition-colors"
        style={{ borderColor: value ? 'var(--accent)' : 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
        onClick={() => setIsExpanded(true)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: value ? 'rgb(251 191 36 / 0.2)' : 'var(--bg-secondary)' }}>
            <MapPin className="w-5 h-5" style={{ color: value ? 'var(--accent)' : 'var(--text-muted)' }} />
          </div>
          <div>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {value ? 'Vindplaats gekozen' : 'Vindplaats toevoegen'}
            </span>
            {value && (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
              </p>
            )}
          </div>
        </div>
        {value && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClearLocation();
            }}
            className="p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700"
          >
            <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
      {/* Header */}
      <div className="p-2 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Vindplaats</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
            title="Gebruik huidige locatie"
          >
            <Navigation className={`w-4 h-4 ${isLocating ? 'animate-pulse' : ''}`} style={{ color: 'var(--accent)' }} />
          </button>
          {value && (
            <button
              onClick={handleClearLocation}
              className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              title="Locatie wissen"
            >
              <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
          {compact && (
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors ml-1"
            >
              <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </div>
      </div>

      {/* Kaart */}
      <div className="h-40 lg:h-48">
        <MapContainer
          center={center}
          zoom={value ? 13 : 7}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationSelect={handleLocationSelect} />
          <FlyToLocation location={flyTo} />
          {value && (
            <Marker position={[value.lat, value.lng]} icon={amberIcon} />
          )}
        </MapContainer>
      </div>

      {/* Instructie */}
      <div className="px-2 py-1.5 text-center" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {value
            ? `${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}`
            : 'Tik op de kaart of gebruik je locatie'}
        </span>
      </div>
    </div>
  );
}
