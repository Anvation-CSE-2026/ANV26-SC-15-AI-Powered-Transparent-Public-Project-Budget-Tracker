import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { AlertCircle, PlusCircle, ArrowLeft, Info, Filter } from 'lucide-react';

export const CitizenComplaintsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl shadow-lg">
        <div>
          <button
            onClick={() => navigate('/dashboard/citizen')}
            className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Citizen Portal</span>
          </button>
          <h1 className="text-2xl font-bold font-heading">
            Citizen Complaints &amp; Issues
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Report local grievances, attach evidence, and track municipal SLA progress
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<PlusCircle className="w-4 h-4" />}
          className="bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20"
          onClick={() => alert('Complaint creation form will be fully connected to Firestore in Phase 4.')}
        >
          Submit New Complaint
        </Button>
      </div>

      {/* Module Stage Notice */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Phase 3 Foundation Active</p>
          <p className="text-blue-800 text-[11px] mt-0.5 leading-relaxed">
            Full complaint lifecycle (photo/video uploads, SLA countdowns, officer assignments, and resolution proof ratings) will be implemented in <strong>Phase 4: Citizen Complaint System</strong>.
          </p>
        </div>
      </div>

      {/* Complaints List Container */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>My Registered Complaints</CardTitle>
            <CardDescription>Real-time status updates from assigned municipal departments</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" leftIcon={<Filter className="w-3.5 h-3.5" />}>
              Filter by Status
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="You haven't reported any civic issues yet."
            description="Notice road damage, street lighting outages, or sanitation issues? Report them directly to municipal authorities."
            icon={<AlertCircle className="w-10 h-10 text-slate-400" />}
            actionLabel="Report an Issue"
            onAction={() => alert('Phase 4 Complaint Form will open here.')}
            className="py-12"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CitizenComplaintsPage;
