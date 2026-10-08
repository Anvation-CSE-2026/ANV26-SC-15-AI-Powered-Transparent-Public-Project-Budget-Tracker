import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import type { Complaint } from '../../../types/complaint';
import { calculateOverdueDuration } from '../../../api/authorityDashboardService';
import {
  AlertOctagon,
  Clock,
  MapPin,
  Building,
  User,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export interface EmergencyAndOverdueSectionProps {
  emergencyComplaints: Complaint[];
  overdueComplaints: Complaint[];
}

export const EmergencyAndOverdueSection: React.FC<EmergencyAndOverdueSectionProps> = ({
  emergencyComplaints,
  overdueComplaints,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'emergency' | 'overdue'>(
    emergencyComplaints.length > 0 ? 'emergency' : 'overdue'
  );

  return (
    <Card className="border-slate-200 shadow-xs">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="p-1 rounded-md bg-rose-50 text-rose-600">
              <AlertOctagon className="w-4 h-4" />
            </span>
            Emergency &amp; Overdue Complaints Monitor
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Real-time tracking of critical safety escalations and municipal SLA deadline breaches.
          </CardDescription>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            onClick={() => setActiveTab('emergency')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'emergency'
                ? 'bg-white text-red-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            Emergency Grievances
            <span className="px-1.5 py-0.2 bg-red-100 text-red-700 rounded-full text-[10px] font-bold">
              {emergencyComplaints.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('overdue')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'overdue'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-rose-600" />
            Overdue SLAs
            <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded-full text-[10px] font-bold">
              {overdueComplaints.length}
            </span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        {activeTab === 'emergency' && (
          <div>
            {emergencyComplaints.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800">No Active Emergency Grievances</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  All critical municipal safety complaints have been addressed or resolved. No emergency dispatch required at this time.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {emergencyComplaints.map((c) => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl border border-red-200 bg-red-50/20 hover:bg-red-50/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {c.complaintNumber}
                        </span>
                        <Badge variant="danger" size="sm" className="bg-red-600 text-white">
                          EMERGENCY
                        </Badge>
                        <span className="text-[11px] text-slate-500 capitalize bg-white px-2 py-0.5 rounded border border-slate-200">
                          Status: {c.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-slate-900">{c.title}</h4>

                      <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {c.departmentName || 'Unassigned Dept'}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {c.location.ward || 'Ward'}, {c.location.address || 'Location'}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {c.citizenName || 'Citizen'}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 w-full sm:w-auto">
                      <Button
                        variant="danger"
                        size="sm"
                        className="text-xs w-full sm:w-auto"
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        onClick={() => navigate(`/dashboard/project-manager/complaints/${c.id}`)}
                      >
                        Dispatch Resolution
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'overdue' && (
          <div>
            {overdueComplaints.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-800">All SLAs Within Targets</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  No active civic complaints have exceeded their statutory SLA resolution time limits.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {overdueComplaints.map((c) => {
                  const overdueDuration = c.sla?.deadline
                    ? calculateOverdueDuration(c.sla.deadline)
                    : 'Overdue';

                  return (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/20 hover:bg-rose-50/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {c.complaintNumber}
                          </span>
                          <span className="text-[11px] font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {overdueDuration}
                          </span>
                          <span className="text-[11px] text-slate-500 capitalize bg-white px-2 py-0.5 rounded border border-slate-200">
                            Status: {c.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <h4 className="text-sm font-semibold text-slate-900">{c.title}</h4>

                        <div className="flex items-center gap-4 flex-wrap text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            {c.departmentName || 'Unassigned Dept'}
                          </span>
                          {c.assignedOfficerName && (
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              Officer: {c.assignedOfficerName}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Target Deadline:{' '}
                            {c.sla?.deadline
                              ? new Date(c.sla.deadline).toLocaleDateString('en-IN')
                              : 'Not set'}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs border-rose-300 text-rose-700 hover:bg-rose-50 w-full sm:w-auto"
                          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                          onClick={() => navigate(`/dashboard/project-manager/complaints/${c.id}`)}
                        >
                          Review SLA Breach
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
