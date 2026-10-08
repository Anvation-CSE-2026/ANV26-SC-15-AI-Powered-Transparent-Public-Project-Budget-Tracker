import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { UserCheck, LogOut, CheckCircle2 } from 'lucide-react';

export const CitizenDashboardShell: React.FC = () => {
  const { userProfile, logout } = useAuth();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="info" size="sm">Citizen Portal</Badge>
            <span className="text-xs text-blue-300">Phase 2 Role Verified</span>
          </div>
          <h1 className="text-2xl font-bold font-heading">
            Welcome, {userProfile?.displayName || userProfile?.username}!
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Authenticated via Cloud Firestore &bull; Access Level: Citizen
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
            <CardTitle>Authentication &amp; Profile Summary</CardTitle>
            <CardDescription>Verified Firestore document under users/{userProfile?.uid}</CardDescription>
          </div>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <UserCheck className="w-5 h-5" />
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
              <p className="font-bold text-blue-600 text-sm mt-1 uppercase">{userProfile?.role}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-slate-500 font-medium">Account Status</span>
              <div className="flex items-center gap-1.5 mt-1 text-emerald-600 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Active</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              Role Route Guard Active: Citizen Dashboard (/dashboard/citizen)
            </p>
            <p className="text-blue-800 text-[11px]">
              Full Citizen modules (Project Map, Complaints, Suggestions, Public Voting, and AI Assistant) will be implemented starting Phase 3 per project specifications.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
