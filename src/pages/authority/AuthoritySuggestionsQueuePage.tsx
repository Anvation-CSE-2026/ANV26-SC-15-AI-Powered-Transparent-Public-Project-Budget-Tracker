import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge, type BadgeVariant } from '../../components/common/Badge';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Lightbulb,
  Search,
  ArrowRight,
  User,
} from 'lucide-react';
import { getAllSuggestionsForAuthority } from '../../api/suggestionService';
import type { Suggestion, SuggestionStatus } from '../../types/suggestion';
import { formatDate } from '../../utils/formatters';

const STATUS_CONFIG: Record<SuggestionStatus, { label: string; variant: BadgeVariant }> = {
  submitted: { label: 'Submitted', variant: 'warning' },
  under_review: { label: 'Under Review', variant: 'info' },
  accepted: { label: 'Accepted', variant: 'success' },
  in_progress: { label: 'In Progress', variant: 'info' },
  implemented: { label: 'Implemented', variant: 'primary' },
  rejected: { label: 'Rejected', variant: 'danger' },
  closed: { label: 'Closed', variant: 'neutral' },
};

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'infrastructure', label: 'Infrastructure & Roads' },
  { value: 'environment', label: 'Environment & Green Spaces' },
  { value: 'transportation', label: 'Public Transportation' },
  { value: 'health', label: 'Health & Sanitation' },
  { value: 'education', label: 'Education & Civic Facilities' },
  { value: 'technology', label: 'Smart City & Digital Services' },
  { value: 'safety', label: 'Public Safety & Lighting' },
  { value: 'governance', label: 'Civic Governance' },
  { value: 'other', label: 'Other Urban Improvement' },
];

export const AuthoritySuggestionsQueuePage: React.FC = () => {
  const navigate = useNavigate();

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    let ignore = false;
    getAllSuggestionsForAuthority({
      status: statusFilter,
      category: categoryFilter,
      searchQuery: searchQuery.trim() || undefined,
    })
      .then((data: Suggestion[]) => {
        if (!ignore) {
          setSuggestions(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        console.warn('[CivicSight] Error loading authority suggestions:', err);
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [statusFilter, categoryFilter, searchQuery]);

  // Derived metrics
  const totalCount = suggestions.length;
  const submittedCount = suggestions.filter((s) => s.status === 'submitted').length;
  const underReviewCount = suggestions.filter((s) => s.status === 'under_review').length;
  const acceptedCount = suggestions.filter((s) => s.status === 'accepted').length;
  const implementedCount = suggestions.filter((s) => s.status === 'implemented').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-lg border border-indigo-950">
        <div>
          <span className="text-xs font-semibold text-brand-300 uppercase tracking-wider">
            Municipal Oversight
          </span>
          <h1 className="text-2xl font-bold font-heading flex items-center gap-2.5 mt-1">
            <Lightbulb className="w-7 h-7 text-amber-400" />
            Citizen Suggestions &amp; Ideas Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Review, evaluate feasibility, provide official departmental determinations, and prioritize citizen-submitted public improvement ideas.
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs text-slate-300 block">Awaiting Initial Review</span>
          <span className="text-3xl font-bold text-amber-400 font-mono">
            {submittedCount}
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Logged
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {totalCount}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Awaiting Review
          </p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {submittedCount}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Under Evaluation
          </p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {underReviewCount}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            Accepted / Implemented
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {acceptedCount + implementedCount}
          </p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">All Lifecycle States</option>
            <option value="submitted">Submitted (New)</option>
            <option value="under_review">Under Review</option>
            <option value="accepted">Accepted</option>
            <option value="implemented">Implemented</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Category Select */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, title, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 focus:outline-hidden focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Suggestions Table / List */}
      {loading ? (
        <div className="space-y-3">
          <LoadingSkeleton className="h-16 w-full" />
          <LoadingSkeleton className="h-16 w-full" />
          <LoadingSkeleton className="h-16 w-full" />
          <LoadingSkeleton className="h-16 w-full" />
        </div>
      ) : suggestions.length === 0 ? (
        <Card className="text-center py-12 border-dashed border-2 border-slate-200 dark:border-slate-800">
          <CardContent className="space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Lightbulb className="w-6 h-6" />
            </div>
            <CardTitle className="text-lg">No Suggestions Found</CardTitle>
            <CardDescription className="max-w-md mx-auto text-xs">
              {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'No citizen suggestions match the active filters. Try modifying your criteria.'
                : 'There are currently no proposals logged in the municipal suggestion queue.'}
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-[11px] text-slate-500 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Tracking ID</th>
                <th className="py-3.5 px-4">Proposal Title &amp; Submitter</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Ward / Area</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Submitted</th>
                <th className="py-3.5 px-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {suggestions.map((item) => {
                const statusInfo = STATUS_CONFIG[item.status] || STATUS_CONFIG.submitted;
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-600 dark:text-brand-400 whitespace-nowrap">
                      {item.suggestionNumber}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{item.citizenName}</span>
                      </p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium text-slate-600 dark:text-slate-300">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                      {item.location?.ward ? `Ward: ${item.location.ward}` : item.location?.address || 'City-wide'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Badge variant={statusInfo.variant} className="text-[11px]">
                        {statusInfo.label}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => navigate(`/dashboard/project-manager/suggestions/${item.id}`)}
                        className="text-xs py-1 px-3"
                      >
                        Review
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
