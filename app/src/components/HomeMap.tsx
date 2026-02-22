import { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { Navigation, Search, X, MapPin, Layers, Eye, EyeOff, Check, Move, Satellite } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { VondstLocatie, DeterminationSession, SavedLocation } from '../types';
import { getAllSessions, getAllLocations, updateSession, updateLocation } from '../lib/db';
import { formatTypeName } from '../lib/decisionTree';

// Arrowhead SVG (steentijd pijlpunt)
const ArrowheadSvg = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4 14h5v8h6v-8h5L12 2z"/></svg>`;

// Maak een marker met schaalbare grootte
const createScaledIcon = (
  svgContent: string,
  bgColor: string,
  size: number,
  iconColor: string = 'white'
) => {
  const iconHtml = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      background-color: ${bgColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      border: 2px solid white;
      color: ${iconColor};
    ">
      <div style="width: ${size * 0.55}px; height: ${size * 0.55}px;">
        ${svgContent}
      </div>
    </div>
  `;

  return L.divIcon({
    html: iconHtml,
    className: 'lucide-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
};

// MapPin SVG
const MapPinSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

// Move SVG
const MoveSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/></svg>`;

// Functie om icons te maken op basis van zoom
const getMarkerSize = (zoom: number): number => {
  if (zoom >= 14) return 32;
  if (zoom >= 12) return 28;
  if (zoom >= 10) return 24;
  if (zoom >= 8) return 20;
  if (zoom >= 6) return 16;
  return 12;
};

// Icon cache per zoom level
const iconCache: Record<string, Record<number, L.DivIcon>> = {};

const getIcon = (type: string, bgColor: string, zoom: number, svg: string = ArrowheadSvg): L.DivIcon => {
  const size = getMarkerSize(zoom);
  const key = `${type}-${size}`;

  if (!iconCache[key]) {
    iconCache[key] = {};
  }

  if (!iconCache[key][size]) {
    iconCache[key][size] = createScaledIcon(svg, bgColor, size);
  }

  return iconCache[key][size];
};

interface HomeMapProps {
  value?: VondstLocatie;
  onChange: (location: VondstLocatie | undefined) => void;
  onSelectSession?: (session: DeterminationSession) => void;
}

// Component om kaart events te handelen
function MapClickHandler({
  onLocationSelect,
  onZoomChange,
  disabled
}: {
  onLocationSelect: (lat: number, lng: number) => void;
  onZoomChange: (zoom: number) => void;
  disabled?: boolean;
}) {
  const map = useMap();

  useMapEvents({
    click: (e) => {
      if (!disabled) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });

  // Initial zoom
  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);

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

// Edit state type
type EditState =
  | { type: 'none' }
  | { type: 'session'; session: DeterminationSession; newLocation: VondstLocatie }
  | { type: 'location'; location: SavedLocation; newLocation: VondstLocatie };

export function HomeMap({ value, onChange, onSelectSession }: HomeMapProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);
  const [sessions, setSessions] = useState<DeterminationSession[]>([]);
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeterminations, setShowDeterminations] = useState(true);
  const [showLocations, setShowLocations] = useState(true);
  const [editState, setEditState] = useState<EditState>({ type: 'none' });
  const [isSaving, setIsSaving] = useState(false);
  const [useSatellite, setUseSatellite] = useState(false);
  // Pending location: geselecteerd maar nog niet bevestigd
  const [pendingLocation, setPendingLocation] = useState<VondstLocatie | null>(null);
  // Zoom level voor marker scaling
  const [zoomLevel, setZoomLevel] = useState(7);

  // Laad bestaande sessies en locaties
  const loadData = useCallback(async () => {
    const [allSessions, allLocations] = await Promise.all([
      getAllSessions(),
      getAllLocations(),
    ]);
    setSessions(allSessions);
    setLocations(allLocations);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter sessies met locatie
  const sessionsWithLocation = useMemo(() => {
    return sessions.filter(
      (s) => s.status === 'completed' && s.input.locatie && s.result
    );
  }, [sessions]);

  // Nederland centrum als default
  const defaultCenter: [number, number] = [52.1326, 5.2913];
  const center: [number, number] = value ? [value.lat, value.lng] : defaultCenter;

  // Check of we in edit mode zijn
  const isEditing = editState.type !== 'none';

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    if (editState.type !== 'none') {
      // In edit mode: update de nieuwe locatie
      if (editState.type === 'session') {
        setEditState({ ...editState, newLocation: { lat, lng } });
      } else {
        setEditState({ ...editState, newLocation: { lat, lng } });
      }
    } else {
      // Normale modus: zet als pending (nog niet opgeslagen)
      setPendingLocation({ lat, lng });
    }
    setFlyTo({ lat, lng });
  }, [editState]);

  const handleConfirmLocation = useCallback(() => {
    if (pendingLocation) {
      onChange(pendingLocation);
      setPendingLocation(null);
    }
  }, [pendingLocation, onChange]);

  const handleClearPending = useCallback(() => {
    setPendingLocation(null);
  }, []);

  const handleClearLocation = useCallback(() => {
    onChange(undefined);
    setPendingLocation(null);
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
        if (editState.type !== 'none') {
          if (editState.type === 'session') {
            setEditState({ ...editState, newLocation: { lat: latitude, lng: longitude } });
          } else {
            setEditState({ ...editState, newLocation: { lat: latitude, lng: longitude } });
          }
        } else {
          // Zet als pending, niet direct opslaan
          setPendingLocation({ lat: latitude, lng: longitude });
        }
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
  }, [editState]);

  const handleSearchResult = useCallback((lat: number, lng: number, _name: string) => {
    if (editState.type !== 'none') {
      handleLocationSelect(lat, lng);
    } else {
      setPendingLocation({ lat, lng });
      setFlyTo({ lat, lng });
    }
  }, [editState, handleLocationSelect]);

  // Start editing a session
  const handleEditSession = useCallback((session: DeterminationSession) => {
    if (session.input.locatie) {
      setEditState({
        type: 'session',
        session,
        newLocation: { ...session.input.locatie },
      });
    }
  }, []);

  // Start editing a location
  const handleEditLocation = useCallback((location: SavedLocation) => {
    setEditState({
      type: 'location',
      location,
      newLocation: { lat: location.lat, lng: location.lng },
    });
  }, []);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditState({ type: 'none' });
  }, []);

  // Save edited location
  const handleSaveEdit = useCallback(async () => {
    if (editState.type === 'none') return;

    setIsSaving(true);
    try {
      if (editState.type === 'session' && editState.session.id) {
        await updateSession(editState.session.id, {
          input: {
            ...editState.session.input,
            locatie: editState.newLocation,
          },
        });
      } else if (editState.type === 'location' && editState.location.id) {
        await updateLocation(editState.location.id, {
          lat: editState.newLocation.lat,
          lng: editState.newLocation.lng,
        });
      }
      await loadData();
      setEditState({ type: 'none' });
    } catch (error) {
      console.error('Opslaan mislukt:', error);
      alert('Kon locatie niet opslaan. Probeer opnieuw.');
    } finally {
      setIsSaving(false);
    }
  }, [editState, loadData]);

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
          {/* Kaartlagen */}
          {useSatellite ? (
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          ) : (
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          )}
          <MapClickHandler onLocationSelect={handleLocationSelect} onZoomChange={setZoomLevel} />
          <FlyToLocation location={flyTo} />

          {/* Opgeslagen locatie marker */}
          {value && !isEditing && !pendingLocation && (
            <Marker position={[value.lat, value.lng]} icon={getIcon('selected', '#d97706', zoomLevel, MapPinSvg)} />
          )}

          {/* Pending locatie marker (nog niet opgeslagen) */}
          {pendingLocation && !isEditing && (
            <Marker position={[pendingLocation.lat, pendingLocation.lng]} icon={getIcon('pending', '#d97706', zoomLevel, MapPinSvg)} />
          )}

          {/* Edit mode marker */}
          {isEditing && (
            <Marker
              position={[editState.newLocation.lat, editState.newLocation.lng]}
              icon={getIcon('editing', '#7c3aed', zoomLevel, MoveSvg)}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const pos = marker.getLatLng();
                  if (editState.type === 'session') {
                    setEditState({ ...editState, newLocation: { lat: pos.lat, lng: pos.lng } });
                  } else if (editState.type === 'location') {
                    setEditState({ ...editState, newLocation: { lat: pos.lat, lng: pos.lng } });
                  }
                },
              }}
            />
          )}

          {/* Bestaande determinaties */}
          {showDeterminations && sessionsWithLocation.map((session) => {
            // Verberg de originele marker als deze wordt geëdit
            if (editState.type === 'session' && editState.session.id === session.id) {
              return null;
            }

            const confidence = session.result?.confidence || 'gemiddeld';
            const colors: Record<string, string> = {
              hoog: '#16a34a',
              gemiddeld: '#d97706',
              laag: '#ea580c',
            };
            const bgColor = colors[confidence] || colors.gemiddeld;

            return (
              <Marker
                key={`session-${session.id}`}
                position={[session.input.locatie!.lat, session.input.locatie!.lng]}
                icon={getIcon(`session-${confidence}`, bgColor, zoomLevel, ArrowheadSvg)}
              >
                <Popup>
                  <div className="text-center min-w-[140px]">
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
                    <div className="flex gap-2 mt-2 justify-center">
                      <button
                        onClick={() => handleEditSession(session)}
                        className="text-xs px-2 py-1 bg-violet-100 text-violet-700 rounded hover:bg-violet-200"
                      >
                        Wijzig locatie
                      </button>
                      {onSelectSession && (
                        <button
                          onClick={() => onSelectSession(session)}
                          className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded hover:bg-amber-200"
                        >
                          Details
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Standalone locaties */}
          {showLocations && locations.map((location) => {
            // Verberg de originele marker als deze wordt geëdit
            if (editState.type === 'location' && editState.location.id === location.id) {
              return null;
            }

            return (
              <Marker
                key={`location-${location.id}`}
                position={[location.lat, location.lng]}
                icon={getIcon('location', '#2563eb', zoomLevel, MapPinSvg)}
              >
                <Popup>
                  <div className="text-center min-w-[120px]">
                    <p className="font-medium text-sm text-stone-900">
                      {location.naam || 'Zoeklocatie'}
                    </p>
                    {location.notitie && (
                      <p className="text-xs text-stone-500 mt-1">{location.notitie}</p>
                    )}
                    <button
                      onClick={() => handleEditLocation(location)}
                      className="mt-2 text-xs px-2 py-1 bg-violet-100 text-violet-700 rounded hover:bg-violet-200"
                    >
                      Wijzig locatie
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Controls overlay - top */}
        <div className="absolute top-2 left-2 right-2 z-[1000] flex items-center justify-between">
          <SearchControl onSearch={handleSearchResult} />
          <div className="flex items-center gap-1">
            {/* Satelliet toggle */}
            <button
              onClick={() => setUseSatellite(!useSatellite)}
              className={`p-2 rounded-lg shadow-md transition-colors ${useSatellite ? 'ring-2 ring-blue-500' : ''}`}
              style={{ backgroundColor: 'var(--bg-card)' }}
              title={useSatellite ? 'Kaart weergave' : 'Satelliet weergave'}
            >
              <Satellite className="w-4 h-4" style={{ color: useSatellite ? '#2563eb' : 'var(--text-muted)' }} />
            </button>
            {/* Filter toggle */}
            {(sessionsWithLocation.length > 0 || locations.length > 0) && !isEditing && (
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
        {showFilters && !isEditing && (
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

        {/* Edit mode panel */}
        {isEditing && (
          <div
            className="absolute bottom-2 left-2 right-2 z-[1000] p-3 rounded-lg shadow-lg"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              <Move className="w-4 h-4 inline mr-1" style={{ color: '#7c3aed' }} />
              {editState.type === 'session' ? 'Determinatie locatie wijzigen' : 'Zoeklocatie wijzigen'}
            </p>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
              Tik op de kaart of sleep de marker naar de nieuwe locatie
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCancelEdit}
                className="flex-1 px-3 py-2 text-sm rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              >
                Annuleren
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="flex-1 px-3 py-2 text-sm rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors flex items-center justify-center gap-1"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Opslaan
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Pending locatie panel - toon opslaan knop */}
        {!isEditing && pendingLocation && (
          <div
            className="absolute bottom-2 left-2 right-2 z-[1000] p-3 rounded-lg shadow-lg"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <MapPin className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                <span className="text-sm">
                  {pendingLocation.lat.toFixed(5)}, {pendingLocation.lng.toFixed(5)}
                </span>
                <button
                  onClick={handleClearPending}
                  className="p-1 rounded transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  title="Annuleren"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleConfirmLocation}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <Check className="w-4 h-4" />
                <span>Locatie opslaan</span>
              </button>
            </div>
          </div>
        )}

        {/* Normale status badge - alleen als niet in edit mode en geen pending */}
        {!isEditing && !pendingLocation && (
          <div className="absolute bottom-2 left-2 right-2 z-[1000] flex items-center justify-between">
            {value ? (
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-md"
                style={{ backgroundColor: '#16a34a', color: 'white' }}
              >
                <Check className="w-4 h-4" />
                <span className="text-xs font-medium">
                  Locatie opgeslagen: {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
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
                Tik op de kaart om locatie te kiezen
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
        )}
      </div>
    </div>
  );
}
