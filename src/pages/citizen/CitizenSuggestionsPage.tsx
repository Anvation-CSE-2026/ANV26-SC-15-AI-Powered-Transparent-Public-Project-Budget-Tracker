import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';
import { Lightbulb, PlusCircle, ArrowLeft, Info } from 'lucide-react';

export const CitizenSuggestionsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-2xl shadow-lg">
        <div>
          <button
            onClick={() => navigate('/dashboard/citizen')}
            className="inline-flex items-center gap-1.5 text-xs text-amber-300 hover:text-white mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Citizen Portal</span>
          </button>
          <h1 className="text-2xl font-bold font-heading">
            Citizen Suggestions &amp; Ideas
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Propose ideas for neighborhood improvements, parks, transport, and public amenities
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<PlusCircle className="w-4 h-4" />}
          className="bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-500/20 text-white"
          onClick={() => alert('Suggestion workflow will be connected in Phase 5.')}
        >
          Submit Suggestion
        </Button>
      </div>

      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Phase 3 Foundation Active</p>
          <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
            Public suggestion lifecycle (citizen idea submission, authority review, community upvoting, and status updates) will be fully implemented in <strong>Phase 5: Suggestions + Voting</strong>.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Submitted Suggestions</CardTitle>
          <CardDescription>Ideas under review by the municipal planning commission</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No suggestions submitted yet."
            description="Have a great idea to make your ward cleaner, greener, or better connected? Share it with the municipal team."
            icon={<Lightbulb className="w-10 h-10 text-slate-400" />}
            actionLabel="Propose an Idea"
            onAction={() => alert('Phase 5 Suggestion Form will open here.')}
            className="py-12"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CitizenSuggestionsPage;
