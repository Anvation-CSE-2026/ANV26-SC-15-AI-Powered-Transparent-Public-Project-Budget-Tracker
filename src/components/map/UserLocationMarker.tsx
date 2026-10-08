import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import type { UserLocation } from '../../types/map';
import { createUserLocationIcon } from './mapIcons';
import { Navigation } from 'lucide-react';

interface UserLocationMarkerProps {
  location: UserLocation;
}

export const UserLocationMarker: React.FC<UserLocationMarkerProps> = ({ location }) => {
  const icon = createUserLocationIcon();

  return (
    <Marker position={[location.latitude, location.longitude]} icon={icon}>
      <Popup className="civic-map-popup" minWidth={180}>
        <div className="p-1 space-y-1 text-slate-800 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-blue-700">
            <Navigation className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
            <span>Your Current Location</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
          </p>
          {location.accuracy && (
            <p className="text-[10px] text-slate-400">
              Accuracy: &plusmn;{Math.round(location.accuracy)} meters
            </p>
          )}
        </div>
      </Popup>
    </Marker>
  );
};

export default UserLocationMarker;
