import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Textarea } from '../../components/common/Textarea';
import {
  Vote,
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { createPoll } from '../../api/pollService';
import { validatePollInput } from '../../utils/pollCalculator';
import type { CreatePollInput } from '../../types/poll';

const POLL_CATEGORIES = [
  'Urban Mobility & Transportation',
  'Infrastructure & Capital Works',
  'Environment & Parks',
  'Public Health & Sanitation',
  'Smart City Technology',
  'Public Safety & Lighting',
  'Civic Amenities & Culture',
  'Municipal Budget Prioritization',
  'Other Civic Decision',
];

export const CreatePollPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(POLL_CATEGORIES[0]);
  const [targetArea, setTargetArea] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);

  // Date defaults: starts now, ends in 14 days (lazy initializers for React 19 purity)
  const [startsAt, setStartsAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [endsAt, setEndsAt] = useState(() => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16));
  const [publishImmediately, setPublishImmediately] = useState(true);

  // Status state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Option handlers
  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleAddOption = () => {
    if (options.length >= 8) return;
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) return;
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const inputData: CreatePollInput = {
      title,
      description,
      category,
      targetArea: targetArea.trim() || undefined,
      options: options.map((o) => o.trim()).filter((o) => o.length > 0),
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      publishImmediately,
    };

    const validation = validatePollInput(inputData);
    if (!validation.isValid) {
      setError(validation.error || 'Please correct errors in the poll form.');
      return;
    }

    const authUser = userProfile || {
      uid: currentUser?.uid || 'pm_default',
      email: currentUser?.email || 'pm@civicsight.org',
      username: currentUser?.displayName || 'Project Manager',
      displayName: currentUser?.displayName || 'Project Manager',
      role: 'project_manager' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };

    setIsSubmitting(true);

    try {
      const created = await createPoll(inputData, authUser);
      navigate(`/dashboard/project-manager/voting/${created.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create civic poll.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/dashboard/project-manager/voting')}
          className="flex items-center text-slate-600 dark:text-slate-300"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Polls
        </Button>
        <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
          <Link to="/dashboard/project-manager" className="hover:underline">Authority Portal</Link>
          <span>/</span>
          <Link to="/dashboard/project-manager/voting" className="hover:underline">Voting</Link>
          <span>/</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">New Poll</span>
        </div>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 rounded-xl">
              <Vote className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
                Create New Civic Decision Poll
              </CardTitle>
              <CardDescription className="text-xs">
                Launch a verified public deliberation vote. Citizens will vote on the proposed options within the designated window.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Poll Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Poll Question / Initiative Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ward 4 Community Solar Installation Priority vs Greenway Expansion"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Category & Ward */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Thematic Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                >
                  {POLL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Municipal Ward / Jurisdiction
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ward 4 - Central Sector (or leave blank for City-Wide)"
                  value={targetArea}
                  onChange={(e) => setTargetArea(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Background Context &amp; Public Information *
              </label>
              <Textarea
                rows={4}
                required
                placeholder="Provide sufficient background, budgetary bounds, and municipal rationale for why citizens are being asked to vote on this decision..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Options List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Voting Ballot Options (Min 2, Max 8) *
                </label>
                <span className="text-xs text-slate-400">
                  {options.length} / 8 options added
                </span>
              </div>

              <div className="space-y-3">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-6 text-center font-mono text-xs font-bold text-slate-400">
                      {idx + 1}.
                    </span>
                    <input
                      type="text"
                      required
                      placeholder={`Option ${idx + 1} text...`}
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      className="flex-1 px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Remove option"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {options.length < 8 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  className="mt-3 text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Another Option
                </Button>
              )}
            </div>

            {/* Voting Period Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Balloting Opens (Start Date &amp; Time) *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Balloting Closes (Deadline) *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            {/* Publish Immediately Toggle */}
            <div className="flex items-center gap-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <input
                type="checkbox"
                id="publishImmediately"
                checked={publishImmediately}
                onChange={(e) => setPublishImmediately(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
              />
              <label htmlFor="publishImmediately" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <strong>Publish Immediately</strong> — Make poll active and visible to citizens once the start date arrives (otherwise saved as draft).
              </label>
            </div>

            {/* Form Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/project-manager/voting')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                className="px-6"
              >
                Launch Civic Poll
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
