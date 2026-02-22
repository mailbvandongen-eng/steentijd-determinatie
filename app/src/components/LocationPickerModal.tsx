import { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Navigation, Search, X, MapPin, Check } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { VondstLocatie } from '../types';

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

// Selected location marker
const selectedIcon = createLucideIcon(MapPin, '#d97706'); // amber-600

interface LocationPickerModalProps {
  onClose: () => void;
  onSave: (location: VondstLocatie) => void;
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
        className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
        title="Zoek locatie"
      >
        <Search className="w-4 h-4 text-white" />
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
        className="w-32 px-2 py-1.5 text-xs rounded-lg bg-white/20 text-white border-none placeholder-white/60"
        autoFocus
      />
      <button
        onClick={handleSearch}
        disabled={isSearching}
        className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 transition-colors"
      >
        <Search className={`w-3 h-3 text-white ${isSearching ? 'animate-pulse' : ''}`} />
      </button>
      <button
        onClick={() => { setShowInput(false); setQuery(''); }}
        className="p-1.5 rounded-lg text-white/80 hover:text-white transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export function LocationPickerModal({ onClose, onSave }: LocationPickerModalProps) {
  const [selectedLocation, setSelectedLocation] = useState<VondstLocatie | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);

  // Nederland centrum als default
  const defaultCenter: [number, number] = [52.1326, 5.2913];

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setFlyTo({ lat, lng });
  }, []);

  const handleClearLocation = useCallback(() => {
    setSelectedLocation(null);
    setFlyTo(null);
  }, []);

  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocatie wordt niet ondersteund door je browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setSelectedLocation({ lat: latitude, lng: longitude });
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
  }, []);

  const handleSearchResult = useCallback((lat: number, lng: number, _name: string) => {
    setSelectedLocation({ lat, lng });
    setFlyTo({ lat, lng });
  }, []);

  const handleSave = useCallback(() => {
    if (selectedLocation) {
      onSave(selectedLocation);
    }
  }, [selectedLocation, onSave]);

  // ESC om te sluiten
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div
        className="absolute top-0 left-0 right-0 z-[1000] p-3 flex items-center justify-between"
        style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-amber-500" />
          <span className="text-white text-sm font-medium">Kies locatie op de kaart</span>
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
            onClick={onClose}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            title="Annuleren"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={defaultCenter}
        zoom={8}
        className="h-full w-full"
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapClickHandler onLocationSelect={handleLocationSelect} />
        <FlyToLocation location={flyTo} />
        {selectedLocation && (
          <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={selectedIcon} />
        )}
      </MapContainer>

      {/* Footer - instructie of bevestiging */}
      <div
        className="absolute bottom-0 left-0 right-0 z-[1000] p-3"
        style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
      >
        {selectedLocation ? (
          // Locatie geselecteerd - toon bevestigingsopties
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-white/80">
              <MapPin className="w-4 h-4 text-amber-500" />
              <span className="text-sm">
                {selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)}
              </span>
              <button
                onClick={handleClearLocation}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                title="Locatie wissen"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Locatie opslaan</span>
            </button>
          </div>
        ) : (
          // Geen locatie - toon instructie
          <div className="text-center">
            <p className="text-white/90 text-sm font-medium">Tik op de kaart om een locatie te kiezen</p>
            <p className="text-white/50 text-xs mt-1">Of gebruik de zoekfunctie / GPS knop hierboven</p>
          </div>
        )}
      </div>
    </div>
  );
}
