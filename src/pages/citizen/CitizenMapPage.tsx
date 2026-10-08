import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { MapPin, ArrowLeft, Info, Layers, Compass } from 'lucide-react';

export const CitizenMapPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-2xl shadow-lg">
        <div>
          <button
            onClick={() => navigate('/dashboard/citizen')}
            className="inline-flex items-center gap-1.5 text-xs text-sky-300 hover:text-white mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Citizen Portal</span>
          </button>
          <h1 className="text-2xl font-bold font-heading">
            Interactive City GIS Map
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Geographic visualization of public infrastructure projects, ward boundaries, and reported civic issues
          </p>
        </div>

        <div className="flex items-center gap-2 bg-sky-900/60 border border-sky-400/30 px-3.5 py-2 rounded-xl text-xs text-sky-200">
          <Compass className="w-4 h-4 text-sky-300" />
          <span>Leaflet + OpenStreetMap Engine</span>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Phase 3 Foundation Active</p>
          <p className="text-sky-800 text-[11px] mt-0.5 leading-relaxed">
            Full GIS spatial layers (dynamic Leaflet markers, emergency complaint pins 🔴, priority badges 🟠, resolved issues 🟢, and project polygons 🔵) will be activated in <strong>Phase 9: Maps + Location Intelligence</strong>.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Municipal Map Canvas</CardTitle>
            <CardDescription>Prepared for Leaflet raster/vector map integration</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" leftIcon={<Layers className="w-3.5 h-3.5" />}>
              Map Layers
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Visual placeholder preparing for Phase 9 full map */}
          <div className="w-full h-96 rounded-xl bg-gradient-to-br from-slate-100 via-sky-50 to-slate-100 border-2 border-dashed border-sky-200 flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="p-4 bg-sky-100 rounded-2xl text-sky-600">
              <MapPin className="w-10 h-10 animate-bounce" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 font-heading">
                City Spatial Layers Initialized
              </h4>
              <p className="text-xs text-slate-500 max-w-md mt-1 leading-relaxed">
                Leaflet, React-Leaflet, and OpenStreetMap dependencies are loaded and ready. Interactive tile rendering and custom geo-coordinate markers will mount in Phase 9.
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-semibold">🔴 Emergency</span>
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 font-semibold">🟠 High Priority</span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-semibold">🟢 Resolved</span>
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">🔵 Public Project</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CitizenMapPage;
