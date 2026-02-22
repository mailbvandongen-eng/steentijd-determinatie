import { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import { Plus, MapPin, Satellite } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { DeterminationSession, SavedLocation } from '../types';
import { formatTypeName } from '../lib/decisionTree';

// Arrowhead SVG (steentijd pijlpunt)
const ArrowheadSvg = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4 14h5v8h6v-8h5L12 2z"/></svg>`;

// MapPin SVG
const MapPinSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

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
const iconCache: Record<string, L.DivIcon> = {};

const getIcon = (type: string, bgColor: string, zoom: number, svg: string = ArrowheadSvg): L.DivIcon => {
  const size = getMarkerSize(zoom);
  const key = `${type}-${size}`;

  if (!iconCache[key]) {
    iconCache[key] = createScaledIcon(svg, bgColor, size);
  }

  return iconCache[key];
};

interface HistoryMapProps {
  sessions: DeterminationSession[];
  locations: SavedLocation[];
  onSelectSession: (session: DeterminationSession) => void;
  onSelectLocation: (location: SavedLocation) => void;
  onAddLocation: () => void;
}

// Zoom tracker component
function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMap();

  useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });

  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);

  return null;
}

export function HistoryMap({ sessions, locations, onSelectSession, onSelectLocation, onAddLocation }: HistoryMapProps) {
  const [useSatellite, setUseSatellite] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(8);

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
  const initialZoom = useMemo(() => {
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
          zoom={initialZoom}
          className="h-full w-full"
          zoomControl={false}
          attributionControl={false}
        >
          {useSatellite ? (
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          ) : (
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          )}

          <ZoomTracker onZoomChange={setZoomLevel} />

          {/* Session markers */}
          {sessionsWithLocation.map((session) => {
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
              icon={getIcon('location', '#2563eb', zoomLevel, MapPinSvg)}
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

        {/* Control buttons overlay */}
        <div className="absolute top-2 right-2 z-[500] flex gap-1">
          <button
            onClick={() => setUseSatellite(!useSatellite)}
            className={`p-2 rounded-lg shadow-md transition-colors ${useSatellite ? 'bg-blue-600' : 'bg-white hover:bg-stone-100'}`}
            title={useSatellite ? 'Kaart weergave' : 'Satelliet weergave'}
          >
            <Satellite className={`w-5 h-5 ${useSatellite ? 'text-white' : 'text-stone-600'}`} />
          </button>
          <button
            onClick={onAddLocation}
            className="p-2 rounded-lg shadow-md bg-blue-500 hover:bg-blue-600 text-white transition-colors"
            title="Locatie toevoegen"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
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
