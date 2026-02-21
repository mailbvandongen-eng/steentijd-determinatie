import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Navigation, Maximize2, Minimize2, Search, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { VondstLocatie } from '../types';

// Fix voor Leaflet marker icons in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Custom amber marker (actief)
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
}

// Component om kaart events te handelen
function MapClickHandler({ onLocationSelect, enabled }: { onLocationSelect: (lat: number, lng: number) => void; enabled: boolean }) {
  useMapEvents({
    click: (e) => {
      if (enabled) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Component om naar locatie te vliegen
function FlyToLocation({ location }: { location: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], 14, { duration: 0.8 });
    }
  }, [location, map]);

  return null;
}

// Zoek component
function SearchControl({ onSearch }: { onSearch: (lat: number, lng: number, name: string) => void }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);

    try {
      // Gebruik Nominatim (OpenStreetMap) voor geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=nl&limit=1`
      );
      const data = await response.json();

      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        onSearch(parseFloat(lat), parseFloat(lon), display_name);
        setQuery('');
        setShowInput(false);
      } else {
        alert('Locatie niet gevonden. Probeer een andere zoekterm.');
      }
    } catch {
      alert('Zoeken mislukt. Controleer je internetverbinding.');
    } finally {
      setIsSearching(false);
    }
  };

  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className="p-1.5 rounded-lg transition-colors"
        style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)' }}
        title="Zoek locatie"
      >
        <Search className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        placeholder="Zoek plaats..."
        className="w-32 px-2 py-1 text-xs rounded-lg"
        style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
        autoFocus
      />
      <button
        onClick={handleSearch}
        disabled={isSearching}
        className="p-1.5 rounded-lg transition-colors"
        style={{ backgroundColor: 'var(--accent)', color: 'white' }}
      >
        <Search className={`w-3 h-3 ${isSearching ? 'animate-pulse' : ''}`} />
      </button>
      <button
        onClick={() => { setShowInput(false); setQuery(''); }}
        className="p-1.5 rounded-lg transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Nederland centrum als default
  const defaultCenter: [number, number] = [52.1326, 5.2913];
  const center: [number, number] = value ? [value.lat, value.lng] : defaultCenter;

  const isEnabled = !!value;

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    onChange({ lat, lng });
    setFlyTo({ lat, lng });
  }, [onChange]);

  const handleToggleLocation = useCallback(() => {
    if (value) {
      // Uit zetten
      onChange(undefined);
      setFlyTo(null);
    } else {
      // Aan zetten met GPS
      handleGetCurrentLocation();
    }
  }, [value, onChange]);

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
        // Bij fout toch locatie mode inschakelen met default
        onChange({ lat: 52.1326, lng: 5.2913 });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onChange]);

  const handleSearchResult = useCallback((lat: number, lng: number, _name: string) => {
    onChange({ lat, lng });
    setFlyTo({ lat, lng });
  }, [onChange]);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // ESC om fullscreen te sluiten
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFullscreen]);

  const mapContent = (
    <>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <MapClickHandler onLocationSelect={handleLocationSelect} enabled={true} />
      <FlyToLocation location={flyTo} />
      {value && (
        <Marker position={[value.lat, value.lng]} icon={amberIcon} />
      )}
    </>
  );

  // Fullscreen overlay
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-[1000] p-3 flex items-center justify-between" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">Vindplaats kiezen</span>
            {value && (
              <span className="text-white/60 text-xs">
                {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SearchControl onSearch={handleSearchResult} />
            <button
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              title="Mijn locatie"
            >
              <Navigation className={`w-4 h-4 text-white ${isLocating ? 'animate-pulse' : ''}`} />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              <Minimize2 className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Map */}
        <MapContainer
          center={center}
          zoom={value ? 14 : 8}
          className="h-full w-full"
          zoomControl={true}
          attributionControl={false}
        >
          {mapContent}
        </MapContainer>

        {/* Footer hint */}
        <div className="absolute bottom-0 left-0 right-0 z-[1000] p-2 text-center" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <span className="text-white/80 text-xs">Tik op de kaart om vindplaats te markeren</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="rounded-xl overflow-hidden border transition-all"
      style={{
        borderColor: isEnabled ? 'var(--accent)' : 'var(--border-color)',
        backgroundColor: 'var(--bg-card)',
        borderWidth: isEnabled ? '2px' : '1px',
      }}
    >
      {/* Header met toggle */}
      <div
        className="px-3 py-2 flex items-center justify-between cursor-pointer"
        style={{ backgroundColor: isEnabled ? 'rgb(251 191 36 / 0.1)' : 'transparent' }}
        onClick={handleToggleLocation}
      >
        <div className="flex items-center gap-2">
          {/* Toggle indicator */}
          <div
            className="w-8 h-4 rounded-full relative transition-colors"
            style={{ backgroundColor: isEnabled ? 'var(--accent)' : 'var(--border-color)' }}
          >
            <div
              className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all"
              style={{ left: isEnabled ? '18px' : '2px' }}
            />
          </div>
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
            Vindplaats
          </span>
          {value && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              ({value.lat.toFixed(4)}, {value.lng.toFixed(4)})
            </span>
          )}
        </div>
        {isLocating && (
          <span className="text-xs" style={{ color: 'var(--accent)' }}>Locatie bepalen...</span>
        )}
      </div>

      {/* Kaart - alleen tonen als enabled */}
      {isEnabled && (
        <>
          {/* Toolbar */}
          <div
            className="px-2 py-1.5 flex items-center justify-between"
            style={{ borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}
          >
            <SearchControl onSearch={handleSearchResult} />
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); handleGetCurrentLocation(); }}
                disabled={isLocating}
                className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                title="Mijn locatie"
              >
                <Navigation className={`w-4 h-4 ${isLocating ? 'animate-pulse' : ''}`} style={{ color: 'var(--accent)' }} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                className="p-1.5 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                title="Volledig scherm"
              >
                <Maximize2 className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
          </div>

          {/* Map */}
          <div className="h-32 lg:h-40">
            <MapContainer
              center={center}
              zoom={value ? 13 : 7}
              className="h-full w-full"
              zoomControl={false}
              attributionControl={false}
            >
              {mapContent}
            </MapContainer>
          </div>
        </>
      )}
    </div>
  );
}
