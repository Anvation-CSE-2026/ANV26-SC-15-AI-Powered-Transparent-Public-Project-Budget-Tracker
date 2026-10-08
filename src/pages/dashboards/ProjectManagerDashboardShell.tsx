import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Building2, LogOut, CheckCircle2 } from 'lucide-react';

export const ProjectManagerDashboardShell: React.FC = () => {
  const { userProfile, logout } = useAuth();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="warning" size="sm">Authority Command Center</Badge>
            <span className="text-xs text-amber-300">Phase 2 Role Verified</span>
          </div>
          <h1 className="text-2xl font-bold font-heading">
            Welcome, {userProfile?.displayName || userProfile?.username}!
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Authenticated Authority &bull; Access Level: Project Manager / High Authority
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => logout()}
          leftIcon={<LogOut className="w-4 h-4" />}
          className="bg-white/10 text-white border-white/20 hover:bg-white/20"
        >
          Sign Out
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Authority Credentials &amp; Profile Summary</CardTitle>
            <CardDescription>Verified Firestore document under users/{userProfile?.uid}</CardDescription>
          </div>
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
            <Building2 className="w-5 h-5" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-slate-500 font-medium">Username</span>
              <p className="font-bold text-slate-900 text-sm mt-1">{userProfile?.username}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-slate-500 font-medium">Email Address</span>
              <p className="font-bold text-slate-900 text-sm mt-1">{userProfile?.email}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-slate-500 font-medium">Assigned Role</span>
              <p className="font-bold text-amber-600 text-sm mt-1 uppercase">{userProfile?.role}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-slate-500 font-medium">Account Status</span>
              <div className="flex items-center gap-1.5 mt-1 text-emerald-600 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Authorized</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-700" />
              Role Route Guard Active: Project Manager Dashboard (/dashboard/project-manager)
            </p>
            <p className="text-amber-800 text-[11px]">
              Complete Authority Command Center (Budget Monitoring, Contractor Review Queue, and Audit Trail) will be activated in Phase 7 per project specifications.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* PHASE 4: COMPLAINTS & GRIEVANCE DISPATCH MODULE */}
      <Card className="border-blue-200 bg-gradient-to-br from-white to-blue-50/30">
        <CardHeader>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="info" size="sm">Phase 4 Active Module</Badge>
              <Badge variant="success" size="sm">Live Municipal Dispatch</Badge>
            </div>
            <CardTitle>Citizen Grievance &amp; Complaints Management</CardTitle>
            <CardDescription>
              Review city-wide citizen reports, assign responsible departments and officers, enforce SLA countdowns, and verify resolution proof.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800">Available Authority Actions:</p>
            <ul className="list-disc list-inside text-slate-500 space-y-0.5">
              <li>Acknowledge &amp; verify incoming civic complaints</li>
              <li>Dispatch to Roads, Drainage, Water, Electrical, Sanitation &amp; Traffic depts</li>
              <li>Schedule resolution SLA deadlines and monitor overdue timers</li>
              <li>Post public updates &amp; record confidential internal memos</li>
              <li>Upload official resolution proof and receive citizen satisfaction ratings</li>
            </ul>
          </div>

          <Button
            variant="primary"
            size="md"
            className="bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 shrink-0"
            onClick={() => window.location.assign('/dashboard/project-manager/complaints')}
          >
            Open Complaints Queue &rarr;
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
