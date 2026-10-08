import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Lightbulb,
  PlusCircle,
  ArrowLeft,
  Search,
  MapPin,
  Calendar,
  ArrowRight,
  MessageSquare,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { getCitizenSuggestions } from '../../api/suggestionService';
import type { Suggestion, SuggestionStatus } from '../../types/suggestion';
import { formatDate } from '../../utils/formatters';

export const CitizenSuggestionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'latest' | 'oldest'>('latest');

  const userId = currentUser?.uid || userProfile?.uid || '';

  const handleManualRefresh = () => {
    setLoading(true);
    getCitizenSuggestions(userId, {
      status: statusFilter,
      category: categoryFilter,
      searchQuery,
      sortBy,
    }).then((data) => {
      setSuggestions(data);
      setLoading(false);
    }).catch((err) => {
      console.warn('[CivicSight] Error loading citizen suggestions:', err);
      setLoading(false);
    });
  };

  useEffect(() => {
    let ignore = false;
    getCitizenSuggestions(userId, {
      status: statusFilter,
      category: categoryFilter,
      searchQuery,
      sortBy,
    }).then((data) => {
      if (!ignore) {
        setSuggestions(data);
        setLoading(false);
      }
    }).catch((err) => {
      console.warn('[CivicSight] Error loading suggestions:', err);
      if (!ignore) setLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [userId, statusFilter, categoryFilter, searchQuery, sortBy]);

  // Derived KPI metrics
  const metrics = useMemo(() => {
    const total = suggestions.length;
    const underReview = suggestions.filter(
      (s) => s.status === 'submitted' || s.status === 'under_review'
    ).length;
    const accepted = suggestions.filter(
      (s) => s.status === 'accepted' || s.status === 'in_progress'
    ).length;
    const implemented = suggestions.filter((s) => s.status === 'implemented').length;

    return { total, underReview, accepted, implemented };
  }, [suggestions]);

  // Status Badge Mapper
  const getStatusBadge = (status: SuggestionStatus) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="neutral" size="sm" dot>Submitted</Badge>;
      case 'under_review':
        return <Badge variant="warning" size="sm" dot>Under Review</Badge>;
      case 'accepted':
        return <Badge variant="info" size="sm" dot>Accepted</Badge>;
      case 'in_progress':
        return <Badge variant="info" size="sm" dot>In Progress</Badge>;
      case 'implemented':
        return <Badge variant="success" size="sm">Implemented</Badge>;
      case 'rejected':
        return <Badge variant="danger" size="sm">Rejected</Badge>;
      case 'closed':
        return <Badge variant="neutral" size="sm">Closed</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

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
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-semibold">
              Civic Participation
            </span>
          </div>
          <h1 className="text-2xl font-bold font-heading">
            My Civic Suggestions &amp; Ideas
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Propose local community improvements and track official municipal reviews and acceptance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            className="bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20"
            onClick={() => navigate('/dashboard/citizen/suggestions/new')}
          >
            Submit a Suggestion
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Proposed</p>
          <h4 className="text-2xl font-bold text-slate-900 mt-1">{metrics.total}</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Submitted by you</p>
        </div>
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Under Review</p>
          <h4 className="text-2xl font-bold text-amber-600 mt-1">{metrics.underReview}</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Authority evaluation</p>
        </div>
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Accepted &amp; Active</p>
          <h4 className="text-2xl font-bold text-blue-600 mt-1">{metrics.accepted}</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Approved for action</p>
        </div>
        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Implemented</p>
          <h4 className="text-2xl font-bold text-emerald-600 mt-1">{metrics.implemented}</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">Delivered for city</p>
        </div>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="lg:col-span-2">
              <Input
                placeholder="Search by title, SGG #, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'submitted', label: 'Submitted' },
                { value: 'under_review', label: 'Under Review' },
                { value: 'accepted', label: 'Accepted' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'implemented', label: 'Implemented' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'closed', label: 'Closed' },
              ]}
            />

            {/* Category Filter */}
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Categories' },
                { value: 'Roads & Transport', label: 'Roads & Transport' },
                { value: 'Water', label: 'Water Supply' },
                { value: 'Drainage', label: 'Stormwater & Drainage' },
                { value: 'Garbage & Waste', label: 'Garbage & Waste' },
                { value: 'Street Lighting', label: 'Street Lighting' },
                { value: 'Parks & Public Spaces', label: 'Parks & Public Spaces' },
                { value: 'Safety', label: 'Safety & Surveillance' },
                { value: 'Traffic', label: 'Traffic & Mobility' },
                { value: 'Environment', label: 'Environment' },
                { value: 'Public Infrastructure', label: 'Public Infrastructure' },
                { value: 'Digital Services', label: 'Digital Services' },
                { value: 'Education', label: 'Education' },
                { value: 'Healthcare', label: 'Healthcare' },
                { value: 'Accessibility', label: 'Accessibility' },
                { value: 'Other', label: 'Other Ideas' },
              ]}
            />

            {/* Sort */}
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'latest' | 'oldest')}
              options={[
                { value: 'latest', label: 'Sort: Newest First' },
                { value: 'oldest', label: 'Sort: Oldest First' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Suggestions List */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>My Submitted Suggestions ({suggestions.length})</CardTitle>
            <CardDescription>Click any suggestion to view official authority remarks &amp; status history</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {loading ? (
            <div className="space-y-4">
              <LoadingSkeleton className="h-24" />
              <LoadingSkeleton className="h-24" />
              <LoadingSkeleton className="h-24" />
            </div>
          ) : suggestions.length === 0 ? (
            <EmptyState
              title="No suggestions yet."
              description="Have an idea for local road improvements, new parks, or street lighting? Propose it directly to municipal planners."
              icon={<Lightbulb className="w-10 h-10 text-slate-400" />}
              actionLabel="Submit a Suggestion"
              onAction={() => navigate('/dashboard/citizen/suggestions/new')}
              className="py-12"
            />
          ) : (
            <div className="space-y-3.5">
              {suggestions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/dashboard/citizen/suggestions/${item.id}`)}
                  className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-blue-400 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Left Column */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                        {item.suggestionNumber}
                      </span>
                      {getStatusBadge(item.status)}
                      <Badge variant="neutral" size="sm">
                        {item.category}
                      </Badge>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                      {item.location?.address && (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.location.address}</span>
                        </span>
                      )}

                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Submitted {formatDate(item.createdAt)}</span>
                      </span>

                      {item.authorityResponse && (
                        <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <MessageSquare className="w-3 h-3 text-emerald-600" />
                          <span>Authority Responded</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column Action */}
                  <div className="flex items-center justify-between md:flex-col md:items-end gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    {item.status === 'implemented' ? (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Implemented</span>
                      </span>
                    ) : null}

                    <div className="flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                      <span>View Progress</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CitizenSuggestionsPage;
