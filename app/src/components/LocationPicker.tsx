import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Navigation, Maximize2, Minimize2, Search, X, MapPin } from 'lucide-react';
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
      map.flyTo([location.lat, location.lng], 14, { duration: 0.8 });
    }
  }, [location, map]);

  return null;
}

// Zoek component
function SearchControl({ onSearch, dark = false }: { onSearch: (lat: number, lng: number, name: string) => void; dark?: boolean }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showInput, setShowInput] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);

    try {
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
        className={`p-2 rounded-lg transition-colors ${dark ? 'bg-white/20 hover:bg-white/30' : ''}`}
        style={dark ? {} : { backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)' }}
        title="Zoek locatie"
      >
        <Search className={`w-4 h-4 ${dark ? 'text-white' : ''}`} />
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
        className="w-28 px-2 py-1.5 text-xs rounded-lg"
        style={dark
          ? { backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }
          : { backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }
        }
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
        style={{ color: dark ? 'white' : 'var(--text-muted)' }}
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

  // Nederland centrum als default
  const defaultCenter: [number, number] = [52.1326, 5.2913];
  const center: [number, number] = value ? [value.lat, value.lng] : defaultCenter;

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    onChange({ lat, lng });
    setFlyTo({ lat, lng });
  }, [onChange]);

  const handleClearLocation = useCallback(() => {
    onChange(undefined);
    setFlyTo(null);
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
        alert('Kon locatie niet bepalen. Tik op de kaart om handmatig te kiezen.');
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
      <MapClickHandler onLocationSelect={handleLocationSelect} />
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
            <span className="text-white text-sm font-medium">Locatie kiezen</span>
            {value && (
              <span className="text-white/60 text-xs">
                {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SearchControl onSearch={handleSearchResult} dark />
            <button
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
              title="Mijn locatie"
            >
              <Navigation className={`w-4 h-4 text-white ${isLocating ? 'animate-pulse' : ''}`} />
            </button>
            {value && (
              <button
                onClick={handleClearLocation}
                className="p-2 rounded-lg bg-red-500/80 hover:bg-red-500 transition-colors"
                title="Locatie wissen"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            )}
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
          <span className="text-white/80 text-xs">Tik op de kaart om locatie te markeren</span>
        </div>
      </div>
    );
  }

  // Normale weergave - kaart altijd zichtbaar
  return (
    <div className="h-full flex flex-col rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
      {/* Kaart - neemt alle ruimte */}
      <div className="flex-1 relative min-h-[200px]">
        <MapContainer
          center={center}
          zoom={value ? 12 : 7}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
        >
          {mapContent}
        </MapContainer>

        {/* Controls overlay */}
        <div className="absolute top-2 left-2 right-2 z-[1000] flex items-center justify-between">
          <SearchControl onSearch={handleSearchResult} />
          <div className="flex items-center gap-1">
            <button
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="p-2 rounded-lg shadow-md transition-colors"
              style={{ backgroundColor: 'var(--bg-card)' }}
              title="Mijn locatie"
            >
              <Navigation className={`w-4 h-4 ${isLocating ? 'animate-pulse' : ''}`} style={{ color: 'var(--accent)' }} />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg shadow-md transition-colors"
              style={{ backgroundColor: 'var(--bg-card)' }}
              title="Volledig scherm"
            >
              <Maximize2 className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>
        </div>

        {/* Locatie status badge */}
        <div className="absolute bottom-2 left-2 right-2 z-[1000] flex items-center justify-between">
          {value ? (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-md"
              style={{ backgroundColor: 'var(--accent)', color: 'white' }}
            >
              <MapPin className="w-4 h-4" />
              <span className="text-xs font-medium">
                {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
              </span>
              <button
                onClick={handleClearLocation}
                className="p-0.5 rounded hover:bg-white/20 transition-colors"
                title="Locatie wissen"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div
              className="px-3 py-1.5 rounded-lg shadow-md text-xs"
              style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)' }}
            >
              Tik om locatie te kiezen
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
