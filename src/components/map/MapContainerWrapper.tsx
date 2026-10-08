import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../../utils/mapUtils';

interface RecenterProps {
  center: [number, number];
  zoom?: number;
}

const MapRecenter: React.FC<RecenterProps> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || map.getZoom(), {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [center, zoom, map]);

  return null;
};

interface MapContainerWrapperProps {
  center?: [number, number];
  zoom?: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const MapContainerWrapper: React.FC<MapContainerWrapperProps> = ({
  center = DEFAULT_MAP_CENTER,
  zoom = DEFAULT_MAP_ZOOM,
  className = 'w-full h-full min-h-[480px] rounded-xl',
  style,
  children,
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <MapRecenter center={center} zoom={zoom} />
        {children}
      </MapContainer>
    </div>
  );
};

export default MapContainerWrapper;
