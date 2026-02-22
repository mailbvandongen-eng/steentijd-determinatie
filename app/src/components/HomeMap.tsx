import { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { Navigation, Search, X, Layers, Eye, EyeOff, Satellite, Plus, Trash2, ExternalLink, Check, Move } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DeterminationSession, SavedLocation, VondstLocatie } from '../types';
import { getAllSessions, getAllLocations, updateSession, updateLocation, deleteSession, deleteLocation } from '../lib/db';
import { formatTypeName } from '../lib/decisionTree';
import { AddLocationModal } from './AddLocationModal';

// Simple SVG icons (no background, just the shape)
// Lucide Stone icon voor determinaties (faceted stone)
const StoneIcon = (color: string, size: number) => `
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 3a8 8 0 0 0-7.52 5.27 8 8 0 0 0 1.74 8.51 8 8 0 0 0 8.51 1.74A8 8 0 0 0 19 11"/>
    <path d="M11 3v8h8"/>
    <path d="m3 11 8 8"/>
  </svg>
`;

// MapPin icon voor locaties
const PinIcon = (color: string, size: number) => `
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="2.5" fill="white" stroke="none"/>
  </svg>
`;

// Move icon voor edit mode (gekruisde pijlen)
const MoveIcon = (color: string, size: number) => `
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 9l-3 3 3 3"/>
    <path d="M9 5l3-3 3 3"/>
    <path d="M15 19l-3 3-3-3"/>
    <path d="M19 9l3 3-3 3"/>
    <path d="M2 12h20"/>
    <path d="M12 2v20"/>
  </svg>
`;

// Marker grootte op basis van zoom (groter dan voorheen)
const getMarkerSize = (zoom: number): number => {
  if (zoom >= 14) return 36;
  if (zoom >= 12) return 32;
  if (zoom >= 10) return 28;
  if (zoom >= 8) return 24;
  if (zoom >= 6) return 20;
  return 16;
};

// Icon factory
const createIcon = (svgFn: (color: string, size: number) => string, color: string, size: number): L.DivIcon => {
  return L.divIcon({
    html: svgFn(color, size),
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

// Icon cache
const iconCache: Record<string, L.DivIcon> = {};

const getStoneIcon = (color: string, zoom: number): L.DivIcon => {
  const size = getMarkerSize(zoom);
  const key = `stone-${color}-${size}`;
  if (!iconCache[key]) {
    iconCache[key] = createIcon(StoneIcon, color, size);
  }
  return iconCache[key];
};

const getPinIcon = (color: string, zoom: number): L.DivIcon => {
  const size = getMarkerSize(zoom);
  const key = `pin-${color}-${size}`;
  if (!iconCache[key]) {
    iconCache[key] = createIcon(PinIcon, color, size);
  }
  return iconCache[key];
};

const getMoveIcon = (zoom: number): L.DivIcon => {
  const size = getMarkerSize(zoom);
  const key = `move-${size}`;
  if (!iconCache[key]) {
    iconCache[key] = createIcon(MoveIcon, '#7c3aed', size);
  }
  return iconCache[key];
};

interface HomeMapProps {
  onSelectSession?: (session: DeterminationSession) => void;
  // Optional: For use as location picker in ImageCapture
  value?: VondstLocatie;
  onChange?: (location: VondstLocatie | undefined) => void;
}

// Zoom tracker
function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap();

  useMapEvents({
    zoomend: () => onZoomChange(map.getZoom()),
  });

  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);

  return null;
}

// Map click handler (for editing and picker mode)
function MapClickHandler({
  onLocationSelect,
  enabled
}: {
  onLocationSelect: (lat: number, lng: number) => void;
  enabled: boolean;
}) {
  useMapEvents({
    click: (e) => {
      if (enabled) {
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Fly to location
function FlyToLocation({ location }: { location: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], 14, { duration: 0.8 });
    }
  }, [location, map]);
  return null;
}

// Search component
function SearchControl({ onSearch }: { onSearch: (lat: number, lng: number) => void }) {
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
        onSearch(parseFloat(data[0].lat), parseFloat(data[0].lon));
        setQuery('');
        setShowInput(false);
      } else {
        alert('Locatie niet gevonden');
      }
    } catch {
      alert('Zoeken mislukt');
    } finally {
      setIsSearching(false);
    }
  };

  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className="p-2 rounded-lg shadow-md"
        style={{ backgroundColor: 'var(--bg-card)' }}
        title="Zoek"
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
        placeholder="Zoek..."
        className="w-28 px-2 py-1.5 text-xs rounded-lg"
        style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
        autoFocus
      />
      <button onClick={handleSearch} disabled={isSearching} className="p-1.5 rounded-lg bg-amber-500 text-white">
        <Search className={`w-3 h-3 ${isSearching ? 'animate-pulse' : ''}`} />
      </button>
      <button onClick={() => { setShowInput(false); setQuery(''); }} className="p-1.5" style={{ color: 'var(--text-muted)' }}>
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// Edit state
type EditState =
  | { type: 'none' }
  | { type: 'session'; session: DeterminationSession; newLocation: { lat: number; lng: number } }
  | { type: 'location'; location: SavedLocation; newLocation: { lat: number; lng: number } };

export function HomeMap({ onSelectSession, value, onChange }: HomeMapProps) {
  const [sessions, setSessions] = useState<DeterminationSession[]>([]);
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [zoomLevel, setZoomLevel] = useState(7);
  const [useSatellite, setUseSatellite] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeterminations, setShowDeterminations] = useState(true);
  const [showLocations, setShowLocations] = useState(true);
  const [editState, setEditState] = useState<EditState>({ type: 'none' });
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check if we're in picker mode (for ImageCapture)
  const isPickerMode = onChange !== undefined;

  // Load data
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

  // Filter sessions with location
  const sessionsWithLocation = useMemo(() => {
    return sessions.filter((s) => s.status === 'completed' && s.input.locatie && s.result);
  }, [sessions]);

  const isEditing = editState.type !== 'none';

  // Picker mode handler
  const handlePickerClick = useCallback((lat: number, lng: number) => {
    if (isPickerMode && onChange) {
      onChange({ lat, lng });
      setFlyTo({ lat, lng });
    }
  }, [isPickerMode, onChange]);

  // Handlers
  const handleEditLocationSelect = useCallback((lat: number, lng: number) => {
    if (editState.type === 'session') {
      setEditState({ ...editState, newLocation: { lat, lng } });
    } else if (editState.type === 'location') {
      setEditState({ ...editState, newLocation: { lat, lng } });
    }
    setFlyTo({ lat, lng });
  }, [editState]);

  const handleStartEditSession = useCallback((session: DeterminationSession) => {
    if (session.input.locatie) {
      setEditState({ type: 'session', session, newLocation: { ...session.input.locatie } });
    }
  }, []);

  const handleStartEditLocation = useCallback((location: SavedLocation) => {
    setEditState({ type: 'location', location, newLocation: { lat: location.lat, lng: location.lng } });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditState({ type: 'none' });
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (editState.type === 'none') return;
    setIsSaving(true);
    try {
      if (editState.type === 'session' && editState.session.id) {
        await updateSession(editState.session.id, {
          input: { ...editState.session.input, locatie: editState.newLocation },
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
      console.error('Save failed:', error);
      alert('Opslaan mislukt');
    } finally {
      setIsSaving(false);
    }
  }, [editState, loadData]);

  const handleDeleteSession = useCallback(async (session: DeterminationSession) => {
    if (!session.id) return;
    if (!confirm(`Weet je zeker dat je deze determinatie wilt verwijderen?\n\n${formatTypeName(session.result?.type || 'Onbekend')}`)) return;
    try {
      await deleteSession(session.id);
      await loadData();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Verwijderen mislukt');
    }
  }, [loadData]);

  const handleDeleteLocation = useCallback(async (location: SavedLocation) => {
    if (!location.id) return;
    if (!confirm(`Weet je zeker dat je deze locatie wilt verwijderen?\n\n${location.naam || 'Zoeklocatie'}`)) return;
    try {
      await deleteLocation(location.id);
      await loadData();
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Verwijderen mislukt');
    }
  }, [loadData]);

  const handleLocationAdded = useCallback(() => {
    setShowAddModal(false);
    loadData();
  }, [loadData]);

  const defaultCenter: [number, number] = [52.1326, 5.2913];
  const totalMarkers = (showDeterminations ? sessionsWithLocation.length : 0) + (showLocations ? locations.length : 0);

  return (
    <div className="h-full flex flex-col rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border-color)' }}>
      <div className="flex-1 relative min-h-[200px]">
        <MapContainer
          center={defaultCenter}
          zoom={7}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
        >
          {useSatellite ? (
            <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxZoom={19} />
          ) : (
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          )}

          <ZoomTracker onZoomChange={setZoomLevel} />
          <MapClickHandler onLocationSelect={isPickerMode ? handlePickerClick : handleEditLocationSelect} enabled={isEditing || isPickerMode} />
          <FlyToLocation location={flyTo} />

          {/* Edit mode marker */}
          {isEditing && (
            <Marker
              position={[editState.newLocation.lat, editState.newLocation.lng]}
              icon={getMoveIcon(zoomLevel)}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const pos = e.target.getLatLng();
                  if (editState.type === 'session') {
                    setEditState({ ...editState, newLocation: { lat: pos.lat, lng: pos.lng } });
                  } else if (editState.type === 'location') {
                    setEditState({ ...editState, newLocation: { lat: pos.lat, lng: pos.lng } });
                  }
                },
              }}
            />
          )}

          {/* Picker mode marker */}
          {isPickerMode && value && (
            <Marker
              position={[value.lat, value.lng]}
              icon={getPinIcon('#d97706', zoomLevel)}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const pos = e.target.getLatLng();
                  onChange?.({ lat: pos.lat, lng: pos.lng });
                },
              }}
            />
          )}

          {/* Session markers (stone icon) */}
          {showDeterminations && sessionsWithLocation.map((session) => {
            if (editState.type === 'session' && editState.session.id === session.id) return null;

            const confidence = session.result?.confidence || 'gemiddeld';
            const colors: Record<string, string> = { hoog: '#16a34a', gemiddeld: '#d97706', laag: '#ea580c' };
            const color = colors[confidence] || colors.gemiddeld;

            return (
              <Marker
                key={`session-${session.id}`}
                position={[session.input.locatie!.lat, session.input.locatie!.lng]}
                icon={getStoneIcon(color, zoomLevel)}
              >
                <Popup>
                  <div className="min-w-[140px] relative">
                    {/* Action icons in top-right corner */}
                    <div className="absolute top-0 right-0 flex gap-1">
                      <button
                        onClick={() => handleStartEditSession(session)}
                        className="p-1 rounded hover:bg-stone-100"
                        title="Wijzig locatie"
                      >
                        <Move className="w-4 h-4 text-stone-500 hover:text-violet-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session)}
                        className="p-1 rounded hover:bg-stone-100"
                        title="Verwijder"
                      >
                        <Trash2 className="w-4 h-4 text-stone-500 hover:text-red-600" />
                      </button>
                    </div>
                    {session.input.thumbnail && (
                      <img src={session.input.thumbnail} alt="Vondst" className="w-full h-20 object-cover rounded mb-2" />
                    )}
                    <p className="font-medium text-sm text-stone-900 pr-12">{formatTypeName(session.result?.type || '')}</p>
                    {session.result?.period && <p className="text-xs text-stone-500">{session.result.period}</p>}
                    {onSelectSession && (
                      <button
                        onClick={() => onSelectSession(session)}
                        className="mt-2 flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" /> Bekijk determinatie
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Location markers (pin icon) */}
          {showLocations && locations.map((location) => {
            if (editState.type === 'location' && editState.location.id === location.id) return null;

            return (
              <Marker
                key={`location-${location.id}`}
                position={[location.lat, location.lng]}
                icon={getPinIcon('#2563eb', zoomLevel)}
              >
                <Popup>
                  <div className="min-w-[140px] relative">
                    {/* Action icons in top-right corner */}
                    <div className="absolute top-0 right-0 flex gap-1">
                      <button
                        onClick={() => handleStartEditLocation(location)}
                        className="p-1 rounded hover:bg-stone-100"
                        title="Wijzig locatie"
                      >
                        <Move className="w-4 h-4 text-stone-500 hover:text-violet-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteLocation(location)}
                        className="p-1 rounded hover:bg-stone-100"
                        title="Verwijder"
                      >
                        <Trash2 className="w-4 h-4 text-stone-500 hover:text-red-600" />
                      </button>
                    </div>
                    <p className="font-medium text-sm text-stone-900 pr-12">{location.naam || 'Zoeklocatie'}</p>
                    {location.notitie && <p className="text-xs text-stone-500 mt-1">{location.notitie}</p>}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Controls - top */}
        <div className="absolute top-2 left-2 right-2 z-[1000] flex items-center justify-between">
          <SearchControl onSearch={(lat, lng) => setFlyTo({ lat, lng })} />
          <div className="flex items-center gap-1">
            <button
              onClick={() => setUseSatellite(!useSatellite)}
              className={`p-2 rounded-lg shadow-md ${useSatellite ? 'ring-2 ring-blue-500' : ''}`}
              style={{ backgroundColor: 'var(--bg-card)' }}
              title={useSatellite ? 'Kaart' : 'Satelliet'}
            >
              <Satellite className="w-4 h-4" style={{ color: useSatellite ? '#2563eb' : 'var(--text-muted)' }} />
            </button>
            {(sessionsWithLocation.length > 0 || locations.length > 0) && !isEditing && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg shadow-md ${showFilters ? 'ring-2 ring-amber-500' : ''}`}
                style={{ backgroundColor: 'var(--bg-card)' }}
                title="Filter"
              >
                <Layers className="w-4 h-4" style={{ color: showFilters ? 'var(--accent)' : 'var(--text-muted)' }} />
              </button>
            )}
            <button
              onClick={() => navigator.geolocation?.getCurrentPosition(
                (pos) => setFlyTo({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => alert('Locatie niet beschikbaar')
              )}
              className="p-2 rounded-lg shadow-md"
              style={{ backgroundColor: 'var(--bg-card)' }}
              title="Mijn locatie"
            >
              <Navigation className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && !isEditing && (
          <div className="absolute top-12 right-2 z-[1000] p-2 rounded-lg shadow-lg text-xs" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <p className="font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Toon:</p>
            <label className="flex items-center gap-2 cursor-pointer mb-1">
              <input type="checkbox" checked={showDeterminations} onChange={(e) => setShowDeterminations(e.target.checked)} className="rounded" />
              <span style={{ color: 'var(--text-primary)' }}>
                {showDeterminations ? <Eye className="w-3 h-3 inline" /> : <EyeOff className="w-3 h-3 inline" />} Determinaties ({sessionsWithLocation.length})
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showLocations} onChange={(e) => setShowLocations(e.target.checked)} className="rounded" />
              <span style={{ color: 'var(--text-primary)' }}>
                {showLocations ? <Eye className="w-3 h-3 inline" /> : <EyeOff className="w-3 h-3 inline" />} Zoeklocaties ({locations.length})
              </span>
            </label>
          </div>
        )}

        {/* Edit panel */}
        {isEditing && (
          <div className="absolute bottom-2 left-2 right-2 z-[1000] p-3 rounded-lg shadow-lg" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              {editState.type === 'session' ? 'Determinatie locatie wijzigen' : 'Zoeklocatie wijzigen'}
            </p>
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Tik of sleep de marker</p>
            <div className="flex gap-2">
              <button onClick={handleCancelEdit} className="flex-1 px-3 py-2 text-sm rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                Annuleren
              </button>
              <button onClick={handleSaveEdit} disabled={isSaving} className="flex-1 px-3 py-2 text-sm rounded-lg bg-violet-600 text-white hover:bg-violet-700">
                {isSaving ? '...' : 'Opslaan'}
              </button>
            </div>
          </div>
        )}

        {/* Bottom bar */}
        {!isEditing && (
          <div className="absolute bottom-2 left-2 right-2 z-[1000] flex items-center justify-between">
            {isPickerMode ? (
              // Picker mode: show selected location info or pick button
              value ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-md text-sm" style={{ backgroundColor: 'var(--bg-card)' }}>
                  <Check className="w-4 h-4 text-green-600" />
                  <span style={{ color: 'var(--text-primary)' }}>
                    {value.lat.toFixed(4)}, {value.lng.toFixed(4)}
                  </span>
                  <button
                    onClick={() => onChange?.(undefined)}
                    className="p-1 ml-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700"
                    title="Wis locatie"
                  >
                    <X className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
                  </button>
                </div>
              ) : (
                <div className="px-3 py-2 rounded-lg shadow-md text-xs" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)' }}>
                  Tik op kaart
                </div>
              )
            ) : (
              // Normal mode: add location button
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-md bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Voeg locatie toe
              </button>
            )}
            {!isPickerMode && totalMarkers > 0 && (
              <div className="px-2 py-1 rounded-lg shadow-md text-xs" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-muted)' }}>
                {totalMarkers} op kaart
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Location Modal - only in normal mode */}
      {showAddModal && !isPickerMode && (
        <AddLocationModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleLocationAdded}
        />
      )}
    </div>
  );
}
