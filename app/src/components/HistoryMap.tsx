import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Plus, MapPin, Gem } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DeterminationSession, SavedLocation } from '../types';
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
  hoog: createLucideIcon(Gem, '#16a34a'), // green-600
  gemiddeld: createLucideIcon(Gem, '#d97706'), // amber-600
  laag: createLucideIcon(Gem, '#ea580c'), // orange-600
  location: createLucideIcon(MapPin, '#2563eb'), // blue-600
  default: createLucideIcon(Gem, '#d97706'),
};

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

          {/* Location markers */}
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
                  <p className="font-medium text-sm text-stone-900">
                    {location.naam || 'Zoeklocatie'}
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
