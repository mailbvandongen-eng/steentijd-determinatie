import { useState, useCallback, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { X, Navigation, Search, MapPin, Save } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix voor Leaflet marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Blauw icoon voor nieuwe locatie
const blueIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'marker-blue',
});

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { lat: number; lng: number; naam?: string; notitie?: string }) => void;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToLocation({ location }: { location: { lat: number; lng: number } | null }) {
  const map = useMap();

  useEffect(() => {
    if (location) {
      map.flyTo([location.lat, location.lng], 14, { duration: 0.8 });
    }
  }, [location, map]);

  return null;
}

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
        className="w-28 px-2 py-1.5 text-xs rounded-lg bg-white/20 text-white border-none"
        style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
        autoFocus
      />
      <button
        onClick={handleSearch}
        disabled={isSearching}
        className="p-1.5 rounded-lg bg-amber-500 text-white"
      >
        <Search className={`w-3 h-3 ${isSearching ? 'animate-pulse' : ''}`} />
      </button>
      <button
        onClick={() => { setShowInput(false); setQuery(''); }}
        className="p-1.5 rounded-lg text-white"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export function AddLocationModal({ isOpen, onClose, onSave }: AddLocationModalProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [flyTo, setFlyTo] = useState<{ lat: number; lng: number } | null>(null);
  const [notitie, setNotitie] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const defaultCenter: [number, number] = [52.1326, 5.2913];

  const handleLocationSelect = useCallback((lat: number, lng: number) => {
    setLocation({ lat, lng });
    setFlyTo({ lat, lng });
  }, []);

  const handleGetCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocatie wordt niet ondersteund');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setFlyTo({ lat: latitude, lng: longitude });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        alert('Kon locatie niet bepalen');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleSearchResult = useCallback((lat: number, lng: number, _name: string) => {
    setLocation({ lat, lng });
    setFlyTo({ lat, lng });
  }, []);

  const handleSave = () => {
    if (!location) return;
    onSave({
      lat: location.lat,
      lng: location.lng,
      notitie: notitie.trim() || undefined,
    });
    setLocation(null);
    setNotitie('');
    onClose();
  };

  // ESC om te sluiten
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Reset bij openen
  useEffect(() => {
    if (isOpen) {
      setLocation(null);
      setNotitie('');
      setFlyTo(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div
        className="absolute top-0 left-0 right-0 z-[1000] p-3 flex items-center justify-between"
        style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-400" />
          <span className="text-white text-sm font-medium">Nieuwe locatie</span>
          {location && (
            <span className="text-white/60 text-xs">
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
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
            onClick={onClose}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
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
        {location && (
          <Marker position={[location.lat, location.lng]} icon={blueIcon} />
        )}
      </MapContainer>

      {/* Footer met notitie en opslaan */}
      <div
        className="absolute bottom-0 left-0 right-0 z-[1000] p-3"
        style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
      >
        {!location ? (
          <p className="text-white/80 text-sm text-center">
            Tik op de kaart om een locatie te markeren
          </p>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={notitie}
              onChange={(e) => setNotitie(e.target.value)}
              placeholder="Notitie (optioneel, bijv. 'veel vuursteen gevonden')"
              className="w-full px-3 py-2 rounded-lg text-sm bg-white/10 text-white placeholder-white/50 border border-white/20 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
            >
              <Save className="w-5 h-5" />
              Locatie opslaan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
