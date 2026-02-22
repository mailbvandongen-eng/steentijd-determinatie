import { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { Navigation, Search, X, MapPin, Layers, Eye, EyeOff } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { VondstLocatie, DeterminationSession, SavedLocation } from '../types';
import { getAllSessions, getAllLocations } from '../lib/db';
import { formatTypeName } from '../lib/decisionTree';

// Fix voor Leaflet marker icons in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Custom amber marker (voor nieuwe locatie selectie)
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

// Marker kleuren op basis van type
const createColoredIcon = (className: string) => new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [20, 33], // Iets kleiner voor achtergrond markers
  iconAnchor: [10, 33],
  popupAnchor: [1, -28],
  shadowSize: [33, 33],
  className,
});

const markerIcons = {
  hoog: createColoredIcon('marker-green'),
  gemiddeld: createColoredIcon('marker-amber'),
  laag: createColoredIcon('marker-orange'),
  location: createColoredIcon('marker-blue'),
  default: createColoredIcon('marker-amber'),
};

// Fix default marker icon
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface HomeMapProps {
  value?: VondstLocatie;
  onChange: (location: VondstLocatie | undefined) => void;
  onSelectSession?: (session: DeterminationSession) => void;
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
function SearchControl({ onSearch }: { onSearch: (lat: number, lng: number, name: string) => void }) {
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
        className="p-2 rounded-lg shadow-md transition-colors"
        style={{ backgroundColor: 'var(--bg-card)' }}
        title="Zoek locatie"
      >
        <Search className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
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

export function HomeMap({ value, onChange, onSelectSession }: HomeMapProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);
  const [sessions, setSessions] = useState<DeterminationSession[]>([]);
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeterminations, setShowDeterminations] = useState(true);
  const [showLocations, setShowLocations] = useState(true);

  // Laad bestaande sessies en locaties
  useEffect(() => {
    const loadData = async () => {
      const [allSessions, allLocations] = await Promise.all([
        getAllSessions(),
        getAllLocations(),
      ]);
      setSessions(allSessions);
      setLocations(allLocations);
    };
    loadData();
  }, []);

  // Filter sessies met locatie
  const sessionsWithLocation = useMemo(() => {
    return sessions.filter(
      (s) => s.status === 'completed' && s.input.locatie && s.result
    );
  }, [sessions]);

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

  // Bereken totaal aantal markers
  const totalMarkers = (showDeterminations ? sessionsWithLocation.length : 0) + (showLocations ? locations.length : 0);

  return (
    <div className="h-full flex flex-col rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
      {/* Kaart */}
      <div className="flex-1 relative min-h-[200px]">
        <MapContainer
          center={center}
          zoom={value ? 12 : 7}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler onLocationSelect={handleLocationSelect} />
          <FlyToLocation location={flyTo} />

          {/* Nieuwe locatie marker (geselecteerd) */}
          {value && (
            <Marker position={[value.lat, value.lng]} icon={amberIcon} />
          )}

          {/* Bestaande determinaties */}
          {showDeterminations && sessionsWithLocation.map((session) => {
            const confidence = session.result?.confidence || 'default';
            const icon = markerIcons[confidence as keyof typeof markerIcons] || markerIcons.default;
            return (
              <Marker
                key={`session-${session.id}`}
                position={[session.input.locatie!.lat, session.input.locatie!.lng]}
                icon={icon}
              >
                <Popup>
                  <div className="text-center min-w-[120px]">
                    {session.input.thumbnail && (
                      <img
                        src={session.input.thumbnail}
                        alt="Vondst"
                        className="w-16 h-16 object-cover rounded mx-auto mb-2"
                      />
                    )}
                    <p className="font-medium text-sm text-stone-900">
                      {formatTypeName(session.result?.type || '')}
                    </p>
                    {session.result?.period && (
                      <p className="text-xs text-stone-500">{session.result.period}</p>
                    )}
                    {onSelectSession && (
                      <button
                        onClick={() => onSelectSession(session)}
                        className="mt-2 text-xs text-amber-600 hover:underline"
                      >
                        Bekijk details →
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Standalone locaties */}
          {showLocations && locations.map((location) => (
            <Marker
              key={`location-${location.id}`}
              position={[location.lat, location.lng]}
              icon={markerIcons.location}
            >
              <Popup>
                <div className="text-center min-w-[100px]">
                  <MapPin className="w-6 h-6 mx-auto mb-1 text-blue-500" />
                  <p className="font-medium text-sm text-stone-900">
                    {location.naam || 'Zoeklocatie'}
                  </p>
                  {location.notitie && (
                    <p className="text-xs text-stone-500 mt-1">{location.notitie}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Controls overlay - top */}
        <div className="absolute top-2 left-2 right-2 z-[1000] flex items-center justify-between">
          <SearchControl onSearch={handleSearchResult} />
          <div className="flex items-center gap-1">
            {/* Filter toggle */}
            {(sessionsWithLocation.length > 0 || locations.length > 0) && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg shadow-md transition-colors ${showFilters ? 'ring-2 ring-amber-500' : ''}`}
                style={{ backgroundColor: 'var(--bg-card)' }}
                title="Filter lagen"
              >
                <Layers className="w-4 h-4" style={{ color: showFilters ? 'var(--accent)' : 'var(--text-muted)' }} />
              </button>
            )}
            <button
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
              className="p-2 rounded-lg shadow-md transition-colors"
              style={{ backgroundColor: 'var(--bg-card)' }}
              title="Mijn locatie"
            >
              <Navigation className={`w-4 h-4 ${isLocating ? 'animate-pulse' : ''}`} style={{ color: 'var(--accent)' }} />
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div
            className="absolute top-12 right-2 z-[1000] p-2 rounded-lg shadow-lg text-xs"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <p className="font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Toon op kaart:</p>
            <label className="flex items-center gap-2 cursor-pointer mb-1">
              <input
                type="checkbox"
                checked={showDeterminations}
                onChange={(e) => setShowDeterminations(e.target.checked)}
                className="rounded"
              />
              <span className="flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                {showDeterminations ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                Determinaties ({sessionsWithLocation.length})
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showLocations}
                onChange={(e) => setShowLocations(e.target.checked)}
                className="rounded"
              />
              <span className="flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                {showLocations ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                Zoeklocaties ({locations.length})
              </span>
            </label>
          </div>
        )}

        {/* Locatie status badge - bottom */}
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

          {/* Totaal markers indicator */}
          {totalMarkers > 0 && (
            <div
              className="px-2 py-1 rounded-lg shadow-md text-xs"
              style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)' }}
            >
              {totalMarkers} op kaart
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
