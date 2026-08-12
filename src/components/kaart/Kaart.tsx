// src/components/kaart/Kaart.tsx
//
// Kaart op basis van Leaflet met tegels van OpenStreetMap. Bewust een eigen
// wrapper, zodat de rest van de app niets van Leaflet hoeft te weten en de
// styling op één plek staat.

import React from 'react';
import { MapContainer, TileLayer, Marker, Circle, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Punt } from '../../utils/geo';

/** Genummerde speld in de accentkleur van de app. */
function speld(nummer: number | string, kleur: string) {
  return L.divIcon({
    className: '',
    html: `<span style="display:flex;align-items:center;justify-content:center;
      width:28px;height:28px;border-radius:999px;background:${kleur};color:#fff;
      font-weight:700;font-size:13px;font-family:'Poppins',sans-serif;
      box-shadow:0 2px 6px rgba(20,24,31,.35);border:2px solid #fff">${nummer}</span>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export interface KaartMarkering {
  punt: Punt;
  label: number | string;
  kleur?: string;
}

export interface KaartCirkel {
  punt: Punt;
  straalMeters: number;
  kleur?: string;
}

interface KaartProps {
  midden: Punt;
  zoom?: number;
  markeringen?: KaartMarkering[];
  cirkels?: KaartCirkel[];
  lijn?: Punt[];
  hoogte?: string;
  /** Wordt aangeroepen als er op de kaart wordt getikt. */
  onKlik?: (punt: Punt) => void;
}

const KlikVanger: React.FC<{ onKlik: (punt: Punt) => void }> = ({ onKlik }) => {
  useMapEvents({
    click(e) {
      onKlik({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return null;
};

const Kaart: React.FC<KaartProps> = ({
  midden,
  zoom = 14,
  markeringen = [],
  cirkels = [],
  lijn,
  hoogte = '22rem',
  onKlik,
}) => (
  <div
    style={{
      height: hoogte,
      borderRadius: 'var(--cmt-radius-lg)',
      overflow: 'hidden',
      border: '1px solid var(--cmt-border)',
    }}
  >
    <MapContainer
      center={[midden.lat, midden.lon]}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {onKlik && <KlikVanger onKlik={onKlik} />}

      {cirkels.map((c, i) => (
        <Circle
          key={`c-${i}`}
          center={[c.punt.lat, c.punt.lon]}
          radius={c.straalMeters}
          pathOptions={{
            color: c.kleur ?? '#C0392B',
            fillColor: c.kleur ?? '#C0392B',
            fillOpacity: 0.18,
            weight: 2,
          }}
        />
      ))}

      {lijn && lijn.length > 1 && (
        <Polyline
          positions={lijn.map((p) => [p.lat, p.lon] as [number, number])}
          pathOptions={{ color: '#0E8F6C', weight: 5, opacity: 0.85 }}
        />
      )}

      {markeringen.map((m, i) => (
        <Marker
          key={`m-${i}`}
          position={[m.punt.lat, m.punt.lon]}
          icon={speld(m.label, m.kleur ?? '#0E8F6C')}
        />
      ))}
    </MapContainer>
  </div>
);

export default Kaart;
