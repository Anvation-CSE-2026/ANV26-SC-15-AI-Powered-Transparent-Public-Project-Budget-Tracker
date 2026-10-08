import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { createProjectMarkerIcon, createComplaintMarkerIcon } from './mapIcons';
import { isValidCoordinate } from '../../utils/mapUtils';
import { MapPin, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface WorksiteMapPreviewProps {
  latitude?: number;
  longitude?: number;
  title: string;
  address: string;
  ward?: string;
  city?: string;
  type?: 'project' | 'complaint';
  status?: string;
  priority?: string;
  heightClass?: string;
}

export const WorksiteMapPreview: React.FC<WorksiteMapPreviewProps> = ({
  latitude,
  longitude,
  title,
  address,
  ward,
  city,
  type = 'project',
  status,
  priority,
  heightClass = 'h-52',
}) => {
  if (!isValidCoordinate(latitude, longitude)) {
    return (
      <div
        className={`w-full ${heightClass} rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-4 text-center`}
      >
        <MapPin className="w-8 h-8 text-slate-400 mb-1" />
        <p className="text-xs font-semibold text-slate-700">GPS Coordinates Not Specified</p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          {address} {ward ? `(${ward})` : ''} {city ? `• ${city}` : ''}
        </p>
      </div>
    );
  }

  const lat = latitude!;
  const lng = longitude!;

  const markerIcon =
    type === 'project'
      ? createProjectMarkerIcon(status)
      : createComplaintMarkerIcon(priority || 'medium', status || 'submitted');

  const fullMapUrl = `/dashboard/citizen/map?focusLat=${lat}&focusLng=${lng}`;

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-xs group">
      <div className={`w-full ${heightClass}`}>
        <MapContainer
          center={[lat, lng]}
          zoom={15}
          scrollWheelZoom={false}
          dragging={true}
          className="w-full h-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <Marker position={[lat, lng]} icon={markerIcon}>
            <Popup minWidth={200}>
              <div className="p-1 text-xs">
                <p className="font-bold text-slate-900 line-clamp-1">{title}</p>
                <p className="text-slate-600 text-[11px] mt-0.5">{address}</p>
                <p className="text-slate-400 text-[10px] font-mono mt-1">
                  {lat.toFixed(5)}, {lng.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Floating Header Overlay */}
      <div className="absolute top-2.5 right-2.5 z-10">
        <Link
          to={fullMapUrl}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 backdrop-blur-xs text-[11px] font-semibold text-blue-700 hover:bg-white border border-slate-200/80 shadow-xs transition-colors"
        >
          <span>Open Full GIS Map</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-xs flex items-center justify-between text-slate-600">
        <div className="flex items-center gap-1.5 truncate">
          <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="truncate">{address}{ward ? ` (${ward})` : ''}</span>
        </div>
        <span className="text-[10px] font-mono text-slate-500 shrink-0 pl-2">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </span>
      </div>
    </div>
  );
};

export default WorksiteMapPreview;
