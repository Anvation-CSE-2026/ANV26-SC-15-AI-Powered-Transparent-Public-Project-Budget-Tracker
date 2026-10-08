import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Toast } from '../../components/common/Toast';
import { Bell, Globe, Moon, Shield, Info, CheckCircle2 } from 'lucide-react';

export const CitizenSettingsPage: React.FC = () => {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [language, setLanguage] = useState('English');
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSavePreferences = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl font-bold text-slate-900 font-heading">
          Citizen Portal Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your notification alerts, language options, and civic privacy preferences
        </p>
      </div>

      {savedNotice && (
        <Toast
          type="success"
          title="Preferences Saved"
          message="Your local preferences have been updated for this session."
          onClose={() => setSavedNotice(false)}
        />
      )}

      {/* 1. Notification Preferences */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Notification &amp; Alert Channels</CardTitle>
            <CardDescription>Control how you receive status updates on reported complaints</CardDescription>
          </div>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Bell className="w-5 h-5" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-800">Email Notifications</p>
              <p className="text-[11px] text-slate-500">
                Receive real-time email notifications when authorities update your complaint or when new voting proposals open.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-xs font-bold text-slate-800">SMS Alerts</p>
              <p className="text-[11px] text-slate-500">
                Receive urgent SMS updates on emergency public advisories and milestone delays.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={smsAlerts}
                onChange={(e) => setSmsAlerts(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* 2. Language & Display */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Regional Language &amp; Display</CardTitle>
            <CardDescription>Localized civic interface preferences</CardDescription>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Globe className="w-5 h-5" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-800">Interface Language</p>
              <p className="text-[11px] text-slate-500">
                Choose the preferred language for citizen dashboards, complaints, and notifications.
              </p>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="English">English</option>
              <option value="Hindi">हिन्दी (Hindi)</option>
              <option value="Marathi">मराठी (Marathi)</option>
            </select>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-xs font-bold text-slate-800">Display Theme</p>
              <p className="text-[11px] text-slate-500">
                Current theme is optimized for daylight accessibility and contrast.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              <Moon className="w-3.5 h-3.5" />
              <span>Light Civic Theme</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Privacy & Security */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Municipal Privacy &amp; Data Security</CardTitle>
            <CardDescription>Transparency policy and audit record integrity</CardDescription>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <Shield className="w-5 h-5" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 space-y-2">
            <p className="font-semibold flex items-center gap-1.5 text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Role-Based Access Guarantee
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Your personal contact numbers and emails are never published publicly. Only official complaint details, locations, and category summaries are made visible on the public transparency map.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Advanced multi-factor municipal authentication and biometric sign-in preferences will be activated in upcoming platform modules.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="primary" size="sm" onClick={handleSavePreferences}>
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CitizenSettingsPage;
