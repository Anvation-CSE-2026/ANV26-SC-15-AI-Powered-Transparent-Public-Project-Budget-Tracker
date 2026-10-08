import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import type { LeafletMouseEvent } from 'leaflet';
import { createPickerMarkerIcon } from './mapIcons';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, isValidCoordinate } from '../../utils/mapUtils';
import { Button } from '../common/Button';
import { MapPin, Navigation, X, Check, Info } from 'lucide-react';

interface LocationPickerProps {
  initialLatitude?: number;
  initialLongitude?: number;
  initialAddress?: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (coords: { latitude: number; longitude: number }) => void;
  title?: string;
  description?: string;
}

// Inner helper component to capture click events on the Leaflet map
const ClickListener: React.FC<{
  onLocationSelect: (lat: number, lng: number) => void;
}> = ({ onLocationSelect }) => {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onLocationSelect(
        parseFloat(e.latlng.lat.toFixed(6)),
        parseFloat(e.latlng.lng.toFixed(6))
      );
    },
  });
  return null;
};

// Inner helper to fly to coordinates when GPS is triggered
const FlyToCoords: React.FC<{ target?: [number, number] }> = ({ target }) => {
  const map = useMap();
  React.useEffect(() => {
    if (target && target[0] && target[1]) {
      map.flyTo(target, 16, { duration: 1 });
    }
  }, [target, map]);
  return null;
};

export const LocationPickerModal: React.FC<LocationPickerProps> = ({
  initialLatitude,
  initialLongitude,
  initialAddress,
  isOpen,
  onClose,
  onConfirm,
  title = 'Pinpoint Exact Location',
  description = 'Click anywhere on the map to drop a pin at the exact worksite or grievance coordinate.',
}) => {
  const defaultPos: [number, number] =
    isValidCoordinate(initialLatitude, initialLongitude)
      ? [initialLatitude!, initialLongitude!]
      : DEFAULT_MAP_CENTER;

  const [position, setPosition] = useState<[number, number]>(defaultPos);
  const [hasPinned, setHasPinned] = useState<boolean>(
    isValidCoordinate(initialLatitude, initialLongitude)
  );
  const [flyTarget, setFlyTarget] = useState<[number, number] | undefined>(undefined);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  if (!isOpen) return null;

  const pickerIcon = createPickerMarkerIcon();

  const handleMapClick = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    setHasPinned(true);
    setGpsError(null);
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Browser geolocation is not supported.');
      return;
    }
    setIsLocating(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setPosition([lat, lng]);
        setHasPinned(true);
        setFlyTarget([lat, lng]);
        setIsLocating(false);
      },
      (err) => {
        setGpsError(`Could not detect GPS location: ${err.message}`);
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleConfirm = () => {
    onConfirm({
      latitude: position[0],
      longitude: position[1],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-500" />
              {title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Banner */}
        <div className="px-4 py-2.5 bg-amber-50/70 border-b border-amber-100 text-xs text-amber-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {hasPinned
                ? `Pinned at Lat: ${position[0]}, Lng: ${position[1]}`
                : 'Click anywhere on the map below to position the pin.'}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUseGps}
            isLoading={isLocating}
            leftIcon={<Navigation className="w-3.5 h-3.5 text-blue-600" />}
            className="text-xs bg-white border-amber-200 text-amber-900 hover:bg-amber-100 shrink-0"
          >
            Detect GPS
          </Button>
        </div>

        {gpsError && (
          <div className="px-4 py-1.5 bg-rose-50 text-rose-700 text-xs font-semibold">
            {gpsError}
          </div>
        )}

        {/* Map Container */}
        <div className="relative flex-1 min-h-[380px] w-full bg-slate-100">
          <MapContainer
            center={position}
            zoom={hasPinned ? 15 : DEFAULT_MAP_ZOOM}
            scrollWheelZoom={true}
            className="w-full h-full z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
            <ClickListener onLocationSelect={handleMapClick} />
            <FlyToCoords target={flyTarget} />
            {hasPinned && (
              <Marker
                position={position}
                icon={pickerIcon}
                draggable={true}
                eventHandlers={{
                  dragend(e) {
                    const marker = e.target;
                    const latlng = marker.getLatLng();
                    setPosition([
                      parseFloat(latlng.lat.toFixed(6)),
                      parseFloat(latlng.lng.toFixed(6)),
                    ]);
                  },
                }}
              />
            )}
          </MapContainer>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-600 font-mono">
            {initialAddress && (
              <span className="font-sans block text-slate-500 text-[11px] truncate max-w-sm">
                Target Address: {initialAddress}
              </span>
            )}
            <span>Coordinates: {position[0]}, {position[1]}</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirm}
              disabled={!hasPinned}
              leftIcon={<Check className="w-4 h-4" />}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white"
            >
              Confirm Location
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerModal;
