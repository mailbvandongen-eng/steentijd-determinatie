import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Plus, MapPin } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DeterminationSession, SavedLocation } from '../types';
import { formatTypeName } from '../lib/decisionTree';

// Fix voor Leaflet marker icons in Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Marker kleuren op basis van vertrouwen
const createColoredIcon = (className: string) => new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
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

interface HistoryMapProps {
  sessions: DeterminationSession[];
  locations: SavedLocation[];
  onSelectSession: (session: DeterminationSession) => void;
  onSelectLocation: (location: SavedLocation) => void;
  onAddLocation: () => void;
}

export function HistoryMap({ sessions, locations, onSelectSession, onSelectLocation, onAddLocation }: HistoryMapProps) {
  // Filter sessies met locatie
  const sessionsWithLocation = useMemo(() => {
    return sessions.filter(
      (s) => s.status === 'completed' && s.input.locatie && s.result
    );
  }, [sessions]);

  // Bereken centrum van alle markers (sessies + locaties)
  const center = useMemo<[number, number]>(() => {
    const allLats: number[] = [];
    const allLngs: number[] = [];

    sessionsWithLocation.forEach((s) => {
      allLats.push(s.input.locatie!.lat);
      allLngs.push(s.input.locatie!.lng);
    });

    locations.forEach((l) => {
      allLats.push(l.lat);
      allLngs.push(l.lng);
    });

    if (allLats.length === 0) {
      return [52.1326, 5.2913]; // Nederland centrum
    }

    const avgLat = allLats.reduce((a, b) => a + b, 0) / allLats.length;
    const avgLng = allLngs.reduce((a, b) => a + b, 0) / allLngs.length;

    return [avgLat, avgLng];
  }, [sessionsWithLocation, locations]);

  // Bereken zoom level
  const totalMarkers = sessionsWithLocation.length + locations.length;
  const zoom = useMemo(() => {
    if (totalMarkers === 0) return 7;
    if (totalMarkers === 1) return 12;
    return 8;
  }, [totalMarkers]);

  // Toon lege staat als er geen markers zijn
  if (totalMarkers === 0) {
    return (
      <div
        className="rounded-xl border-2 border-dashed p-4 text-center"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <MapPin className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Nog geen locaties op de kaart
        </p>
        <button
          onClick={onAddLocation}
          className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Locatie toevoegen
        </button>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden border"
      style={{ borderColor: 'var(--border-color)' }}
    >
      <div className="h-48 lg:h-64 relative">
        <MapContainer
          center={center}
          zoom={zoom}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* Session markers */}
          {sessionsWithLocation.map((session) => {
            const confidence = session.result?.confidence || 'default';
            const icon = markerIcons[confidence as keyof typeof markerIcons] || markerIcons.default;
            return (
              <Marker
                key={`session-${session.id}`}
                position={[session.input.locatie!.lat, session.input.locatie!.lng]}
                icon={icon}
                eventHandlers={{
                  click: () => onSelectSession(session),
                }}
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
                    <button
                      onClick={() => onSelectSession(session)}
                      className="mt-2 text-xs text-amber-600 hover:underline"
                    >
                      Bekijk details →
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Location markers (blauw) */}
          {locations.map((location) => (
            <Marker
              key={`location-${location.id}`}
              position={[location.lat, location.lng]}
              icon={markerIcons.location}
              eventHandlers={{
                click: () => onSelectLocation(location),
              }}
            >
              <Popup>
                <div className="text-center min-w-[120px]">
                  <MapPin className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <p className="font-medium text-sm text-stone-900">
                    {location.naam || 'Locatie'}
                  </p>
                  {location.notitie && (
                    <p className="text-xs text-stone-500 mt-1">{location.notitie}</p>
                  )}
                  <p className="text-xs text-stone-400 mt-1">
                    {location.linkedSessionIds.length > 0
                      ? `${location.linkedSessionIds.length} determinatie(s)`
                      : 'Geen determinaties'}
                  </p>
                  <button
                    onClick={() => onSelectLocation(location)}
                    className="mt-2 text-xs text-blue-600 hover:underline"
                  >
                    Bekijk details →
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Add location button overlay */}
        <button
          onClick={onAddLocation}
          className="absolute top-2 right-2 z-[500] p-2 rounded-lg shadow-md bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          title="Locatie toevoegen"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {sessionsWithLocation.length} vondst{sessionsWithLocation.length !== 1 ? 'en' : ''}
          {locations.length > 0 && ` · ${locations.length} locatie${locations.length !== 1 ? 's' : ''}`}
        </span>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> locatie
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" /> hoog
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> gem.
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" /> laag
          </span>
        </div>
      </div>
    </div>
  );
}
