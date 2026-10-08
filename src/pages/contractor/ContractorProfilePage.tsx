import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { HardHat, CheckCircle2, Mail, User, Shield } from 'lucide-react';

export const ContractorProfilePage: React.FC = () => {
  const { userProfile } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      <div className="p-6 bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-2xl shadow-xl">
        <Badge variant="warning" size="sm" className="bg-amber-400/20 text-amber-200 border border-amber-300/30 mb-2">
          Contractor Profile
        </Badge>
        <h1 className="text-2xl font-bold font-heading">Contractor Account &amp; Charter</h1>
        <p className="text-xs text-slate-300 mt-1">
          Registered municipal contractor credentials and authorized access level.
        </p>
      </div>

      <Card className="border-slate-200 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HardHat className="w-5 h-5 text-amber-600" />
              Contractor Identity Summary
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Verified Firestore document under users/{userProfile?.uid}
            </CardDescription>
          </div>
          <Badge variant="success" size="sm">Verified Contractor</Badge>
        </CardHeader>

        <CardContent className="pt-4 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Contractor Name / Username
              </span>
              <p className="font-bold text-slate-900 text-sm mt-1">
                {userProfile?.displayName || userProfile?.username}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Official Email Address
              </span>
              <p className="font-bold text-slate-900 text-sm mt-1">
                {userProfile?.email}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <Shield className="w-3.5 h-3.5 text-slate-400" />
                Assigned Platform Role
              </span>
              <p className="font-bold text-amber-700 text-sm mt-1 uppercase">
                {userProfile?.role}
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Charter Status
              </span>
              <p className="font-bold text-emerald-700 text-sm mt-1">
                Active Municipal Charter
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
