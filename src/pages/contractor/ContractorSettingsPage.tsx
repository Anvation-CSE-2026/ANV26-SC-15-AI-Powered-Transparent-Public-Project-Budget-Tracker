import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Bell, Shield } from 'lucide-react';

export const ContractorSettingsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      <div className="p-6 bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-2xl shadow-xl">
        <Badge variant="warning" size="sm" className="bg-amber-400/20 text-amber-200 border border-amber-300/30 mb-2">
          Portal Settings
        </Badge>
        <h1 className="text-2xl font-bold font-heading">Contractor Preferences</h1>
        <p className="text-xs text-slate-300 mt-1">
          Configure notifications, security credentials, and municipal communication options.
        </p>
      </div>

      <div className="space-y-4">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              Municipal Review Notifications
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Notification preferences when project managers review your submissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 text-xs space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded accent-amber-600" />
              <span>Email alert when Project Manager approves a work submission</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded accent-amber-600" />
              <span>Immediate alert when Project Manager requests changes or revisions</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded accent-amber-600" />
              <span>Alert when a new capital works charter is assigned to your contractor ID</span>
            </label>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              Contractor Security &amp; Access Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 text-xs space-y-2 text-slate-600">
            <p>
              Your contractor account is authenticated via Firebase Authentication with RoleGuard authorization.
            </p>
            <p className="text-[11px] text-slate-500">
              Contractors have scoped access strictly to their assigned municipal projects and submitted progress records.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
