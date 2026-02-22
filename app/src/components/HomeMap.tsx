import { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { Navigation, Search, X, MapPin, Layers, Eye, EyeOff, Gem, Check, Move } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { VondstLocatie, DeterminationSession, SavedLocation } from '../types';
import { getAllSessions, getAllLocations, updateSession, updateLocation } from '../lib/db';
import { formatTypeName } from '../lib/decisionTree';

// Marker grootte (consistent voor alle markers)
const MARKER_SIZE = 32;

// Maak een Lucide icon marker
const createLucideIcon = (
  IconComponent: React.ComponentType<{ className?: string; style?: React.CSSProperties }>,
  bgColor: string,
  iconColor: string = 'white'
) => {
  const iconHtml = renderToStaticMarkup(
    <div
      style={{
        width: MARKER_SIZE,
        height: MARKER_SIZE,
        backgroundColor: bgColor,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        border: '2px solid white',
      }}
    >
      <IconComponent style={{ width: 18, height: 18, color: iconColor }} />
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: 'lucide-marker',
    iconSize: [MARKER_SIZE, MARKER_SIZE],
    iconAnchor: [MARKER_SIZE / 2, MARKER_SIZE / 2],
    popupAnchor: [0, -MARKER_SIZE / 2],
  });
};

// Pre-built icons
const markerIcons = {
  // Determinaties op basis van vertrouwen
  hoog: createLucideIcon(Gem, '#16a34a'), // green-600
  gemiddeld: createLucideIcon(Gem, '#d97706'), // amber-600
  laag: createLucideIcon(Gem, '#ea580c'), // orange-600
  default: createLucideIcon(Gem, '#d97706'),
  // Standalone locaties
  location: createLucideIcon(MapPin, '#2563eb'), // blue-600
  // Nieuwe/geselecteerde locatie
  selected: createLucideIcon(MapPin, '#d97706'), // amber-600
  // Edit mode marker
  editing: createLucideIcon(Move, '#7c3aed'), // violet-600
};

interface HomeMapProps {
  value?: VondstLocatie;
  onChange: (location: VondstLocatie | undefined) => void;
  onSelectSession?: (session: DeterminationSession) => void;
}

// Component om kaart events te handelen
function MapClickHandler({
  onLocationSelect,
  disabled
}: {
  onLocationSelect: (lat: number, lng: number) => void;
  disabled?: boolean;
}) {
  useMapEvents({
    click: (e) => {
      if (!disabled) {
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
      // Normale modus: selecteer locatie voor nieuwe capture
      onChange({ lat, lng });
    }
    setFlyTo({ lat, lng });
  }, [editState, onChange]);

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
        if (editState.type !== 'none') {
          if (editState.type === 'session') {
            setEditState({ ...editState, newLocation: { lat: latitude, lng: longitude } });
          } else {
            setEditState({ ...editState, newLocation: { lat: latitude, lng: longitude } });
          }
        } else {
          onChange({ lat: latitude, lng: longitude });
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
  }, [editState, onChange]);

  const handleSearchResult = useCallback((lat: number, lng: number, _name: string) => {
    handleLocationSelect(lat, lng);
  }, [handleLocationSelect]);

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
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler onLocationSelect={handleLocationSelect} />
          <FlyToLocation location={flyTo} />

          {/* Nieuwe locatie marker (voor capture, alleen als niet in edit mode) */}
          {value && !isEditing && (
            <Marker position={[value.lat, value.lng]} icon={markerIcons.selected} />
          )}

          {/* Edit mode marker */}
          {isEditing && (
            <Marker
              position={[editState.newLocation.lat, editState.newLocation.lng]}
              icon={markerIcons.editing}
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

            const confidence = session.result?.confidence || 'default';
            const icon = markerIcons[confidence as keyof typeof markerIcons] || markerIcons.default;
            return (
              <Marker
                key={`session-${session.id}`}
                position={[session.input.locatie!.lat, session.input.locatie!.lng]}
                icon={icon}
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
                icon={markerIcons.location}
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

        {/* Normale status badge - alleen als niet in edit mode */}
        {!isEditing && (
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
        )}
      </div>
    </div>
  );
}
