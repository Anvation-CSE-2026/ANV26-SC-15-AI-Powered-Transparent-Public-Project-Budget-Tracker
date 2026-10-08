import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Toast } from '../../components/common/Toast';
import { ShieldCheck, UserCheck, Calendar, CheckCircle2, Lock } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export const CitizenProfilePage: React.FC = () => {
  const { userProfile } = useAuth();

  const [displayName, setDisplayName] = useState(userProfile?.displayName || userProfile?.username || '');
  const [phone, setPhone] = useState(userProfile?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate updating supported fields in profile
    await new Promise((res) => setTimeout(res, 600));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const citizenInitials = (userProfile?.displayName || userProfile?.username || 'C')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-lg font-heading shadow-md">
            {citizenInitials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold font-heading">
                {userProfile?.displayName || userProfile?.username}
              </h1>
              <Badge variant="info" size="sm">Verified Citizen</Badge>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Municipal Portal Citizen Profile &bull; UID: <span className="font-mono">{userProfile?.uid?.substring(0, 10)}...</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4" />
          <span>Role-Based Access Protected</span>
        </div>
      </div>

      {saveSuccess && (
        <Toast
          type="success"
          title="Profile Updated"
          message="Your personal preferences have been saved to your session."
          onClose={() => setSaveSuccess(false)}
        />
      )}

      {/* Profile Form Card */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Citizen Identity &amp; Contact Details</CardTitle>
            <CardDescription>Official municipal records tied to your registered UID</CardDescription>
          </div>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
        </CardHeader>

        <CardContent>
          <form className="space-y-5" onSubmit={handleSave}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Registered Username"
                value={userProfile?.username || ''}
                disabled
                helperText="Username is unique and permanent"
              />

              <Input
                label="Registered Email Address"
                value={userProfile?.email || ''}
                disabled
                helperText="Primary authentication address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Display Name"
                placeholder="Full official name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                helperText="Visible on citizen suggestions and discussions"
              />

              <Input
                label="Contact Phone Number (Optional)"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                helperText="Used for SMS alerts on complaint resolution"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Assigned Municipal Role
                </label>
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span className="font-bold text-blue-600 uppercase">Citizen</span>
                  <span className="text-[10px] text-slate-400 ml-auto">Role cannot be altered by client</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Registration Date
                </label>
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{formatDate(userProfile?.createdAt || new Date().toISOString())}</span>
                  <span className="text-emerald-600 font-semibold ml-auto flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSaving}
              >
                Save Profile Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CitizenProfilePage;
