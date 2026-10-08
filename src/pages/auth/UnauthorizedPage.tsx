import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowRight, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { getDashboardRouteForRole, ROLE_DISPLAY_NAMES } from '../../routes/routeConfig';

export const UnauthorizedPage: React.FC = () => {
  const { role, userProfile, logout } = useAuth();

  const authorizedRoute = role ? getDashboardRouteForRole(role) : '/login';
  const roleName = role ? ROLE_DISPLAY_NAMES[role] : 'Unassigned';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xl text-center space-y-5">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
            Access Restricted
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-3 font-heading">
            Unauthorized Portal Access
          </h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Your authenticated municipal role (<strong className="text-slate-800">{roleName}</strong>) does not have authorization to view this resource. Role-Based Access Control (RBAC) enforces strict separation between Citizen, Project Manager, and Contractor modules.
          </p>
        </div>

        {userProfile && (
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 text-left text-xs">
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Authenticated User:</span>
              <span className="font-semibold text-slate-800">{userProfile.username}</span>
            </div>
            <div className="flex justify-between py-1 border-t border-slate-200/60">
              <span className="text-slate-500">Official Email:</span>
              <span className="font-semibold text-slate-800">{userProfile.email}</span>
            </div>
            <div className="flex justify-between py-1 border-t border-slate-200/60">
              <span className="text-slate-500">Assigned Role:</span>
              <span className="font-bold text-blue-700 capitalize">{roleName}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Link to={authorizedRoute} className="w-full">
            <Button
              variant="primary"
              size="md"
              className="w-full"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Go to My {roleName} Portal
            </Button>
          </Link>

          <Button
            variant="outline"
            size="md"
            className="w-full"
            onClick={() => logout()}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};
