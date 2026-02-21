import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DeterminationSession } from '../types';
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
  onSelectSession: (session: DeterminationSession) => void;
}

export function HistoryMap({ sessions, onSelectSession }: HistoryMapProps) {
  // Filter sessies met locatie
  const sessionsWithLocation = useMemo(() => {
    return sessions.filter(
      (s) => s.status === 'completed' && s.input.locatie && s.result
    );
  }, [sessions]);

  // Bereken centrum van alle markers
  const center = useMemo<[number, number]>(() => {
    if (sessionsWithLocation.length === 0) {
      return [52.1326, 5.2913]; // Nederland centrum
    }

    const lats = sessionsWithLocation.map((s) => s.input.locatie!.lat);
    const lngs = sessionsWithLocation.map((s) => s.input.locatie!.lng);
    const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

    return [avgLat, avgLng];
  }, [sessionsWithLocation]);

  // Bereken zoom level
  const zoom = useMemo(() => {
    if (sessionsWithLocation.length === 0) return 7;
    if (sessionsWithLocation.length === 1) return 12;
    return 8;
  }, [sessionsWithLocation.length]);

  if (sessionsWithLocation.length === 0) {
    return (
      <div
        className="rounded-xl border-2 border-dashed p-4 text-center"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Nog geen vondsten met locatie
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          Voeg een vindplaats toe bij je volgende determinatie
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden border"
      style={{ borderColor: 'var(--border-color)' }}
    >
      <div className="h-48 lg:h-64">
        <MapContainer
          center={center}
          zoom={zoom}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {sessionsWithLocation.map((session) => {
            const confidence = session.result?.confidence || 'default';
            const icon = markerIcons[confidence as keyof typeof markerIcons] || markerIcons.default;
            return (
            <Marker
              key={session.id}
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
        </MapContainer>
      </div>
      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {sessionsWithLocation.length} vondst{sessionsWithLocation.length !== 1 ? 'en' : ''}
        </span>
        <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" /> hoog
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> gemiddeld
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" /> laag
          </span>
        </div>
      </div>
    </div>
  );
}
