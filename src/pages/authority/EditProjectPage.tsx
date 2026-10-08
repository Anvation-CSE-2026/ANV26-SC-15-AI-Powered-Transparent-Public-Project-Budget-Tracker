import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  ArrowLeft,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/formatters';
import { INITIAL_DEPARTMENTS } from '../../data/departmentsData';
import { getProjectById, updateProject } from '../../api/projectService';
import type { Project, ProjectCategory, ProjectStatus, UpdateProjectInput } from '../../types/project';

const CATEGORIES: ProjectCategory[] = [
  'Roads & Transport',
  'Drainage',
  'Water Supply',
  'Waste Management',
  'Street Lighting',
  'Public Buildings',
  'Parks & Public Spaces',
  'Traffic Infrastructure',
  'Sanitation',
  'Digital Infrastructure',
  'Environment',
  'Other',
];

const CONTRACTOR_PRESETS = [
  { id: 'cont-01', name: 'Apex Urban Infra Tech Ltd' },
  { id: 'cont-02', name: 'Varun Hydraulic Engineers Pvt Ltd' },
  { id: 'cont-03', name: 'JalShakti Infrastructure Corp' },
  { id: 'cont-04', name: 'Lumina Smart Grids Ltd' },
  { id: 'cont-05', name: 'Sahyadri Civil Builders & Contractors' },
];

const WARDS = [
  'Ward 1', 'Ward 2', 'Ward 3', 'Ward 4', 'Ward 5', 'Ward 6',
  'Ward 7', 'Ward 8', 'Ward 9', 'Ward 10', 'Ward 11', 'Ward 12',
  'Ward 13', 'Ward 14', 'Ward 15', 'Ward 16', 'Ward 17', 'Ward 18',
  'Ward 19', 'Ward 20', 'Ward 21', 'Ward 22', 'Ward 23', 'Ward 24',
];

export const EditProjectPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Editable Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('Roads & Transport');
  const [departmentId, setDepartmentId] = useState('dept_roads');

  // Location
  const [address, setAddress] = useState('');
  const [ward, setWard] = useState('Ward 12');
  const [city, setCity] = useState('Pune Metro');

  // Finances
  const [approvedBudget, setApprovedBudget] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [actualSpending, setActualSpending] = useState('');

  // Dates & Status
  const [plannedCompletionDate, setPlannedCompletionDate] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('Ongoing');
  const [progress, setProgress] = useState(0);

  // Contractor & Visibility
  const [contractorId, setContractorId] = useState('');
  const [contractorName, setContractorName] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;
    async function loadProject() {
      if (!projectId) return;
      try {
        const p = await getProjectById(projectId, true);
        if (p && isMounted) {
          setProject(p);
          setName(p.name);
          setDescription(p.description);
          setCategory(p.category);
          setDepartmentId(p.departmentId || 'dept_roads');
          setAddress(p.location.address || '');
          setWard(p.location.ward || 'Ward 12');
          setCity(p.location.city || 'Pune Metro');
          setApprovedBudget(p.approvedBudget.toString());
          setEstimatedCost(p.estimatedCost.toString());
          setActualSpending(p.actualSpending.toString());
          setPlannedCompletionDate(p.plannedCompletionDate);
          setStatus(p.status);
          setProgress(p.progress);
          setContractorId(p.contractorId || '');
          setContractorName(p.contractorName || '');
          setIsPublic(p.isPublic);
        }
      } catch {
        // handle
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadProject();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  const handleContractorChange = (cId: string) => {
    setContractorId(cId);
    const found = CONTRACTOR_PRESETS.find((c) => c.id === cId);
    if (found) {
      setContractorName(found.name);
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 5) {
      errs.name = 'Project title must be at least 5 characters long.';
    }
    if (!description.trim() || description.trim().length < 20) {
      errs.description = 'Project scope must be at least 20 characters long.';
    }
    const b = parseFloat(approvedBudget);
    if (isNaN(b) || b <= 0) {
      errs.approvedBudget = 'Approved budget must be a positive number in Crores.';
    }
    const e = parseFloat(estimatedCost);
    if (isNaN(e) || e <= 0) {
      errs.estimatedCost = 'Estimated cost must be a positive number in Crores.';
    }
    if (!plannedCompletionDate) {
      errs.plannedCompletionDate = 'Planned completion date is required.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!projectId || !userProfile || !project) return;

    try {
      setSubmitting(true);
      const selectedDept = INITIAL_DEPARTMENTS.find((d) => d.id === departmentId);

      const updates: UpdateProjectInput = {
        name: name.trim(),
        description: description.trim(),
        category,
        department: selectedDept ? selectedDept.name : project.department,
        departmentId,
        location: {
          ...project.location,
          address: address.trim(),
          ward,
          city,
        },
        approvedBudget: parseFloat(approvedBudget),
        estimatedCost: parseFloat(estimatedCost),
        actualSpending: parseFloat(actualSpending) || 0,
        plannedCompletionDate,
        status,
        progress: Number(progress) || 0,
        contractorId: contractorId || undefined,
        contractorName: contractorName || undefined,
        isPublic,
      };

      await updateProject(projectId, updates, userProfile);
      navigate(`/dashboard/project-manager/projects/${projectId}`);
    } catch {
      setErrors({ form: 'An error occurred while saving project changes.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-24 space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        <p className="text-xs text-slate-500">Loading project configuration...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-sm font-bold text-slate-800">Project Not Found</p>
        <Button variant="primary" size="sm" onClick={() => navigate('/dashboard/project-manager/projects')}>
          Return to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl shadow-lg">
        <button
          onClick={() => navigate(`/dashboard/project-manager/projects/${project.id}`)}
          className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white mb-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Project Detail</span>
        </button>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold font-heading">Edit Project Charter</h1>
          <span className="font-mono text-xs font-bold text-blue-200 bg-blue-900/60 px-2 py-0.5 rounded-md border border-blue-400/30">
            {project.projectNumber}
          </span>
        </div>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl">
          Update administrative parameters, adjusted budget allocations, or contractor designations. Core tracking identifiers remain permanent.
        </p>
      </div>

      {errors.form && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errors.form}</span>
        </div>
      )}

      {/* Immutable Identifiers Notice */}
      <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-500" />
          <span>
            Immutable Tracking ID: <strong className="font-mono text-slate-900">{project.projectNumber}</strong> (Sanctioned {formatDate(project.startDate)})
          </span>
        </div>
        <Badge variant="neutral" size="sm">Audited Record</Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Scope */}
        <Card className="border-slate-200/80">
          <CardHeader>
            <CardTitle>Scope &amp; Classification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-white ${
                  errors.name ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description &amp; Specifications *
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-white ${
                  errors.description ? 'border-red-500' : 'border-slate-200'
                }`}
              />
              {errors.description && (
                <p className="text-[11px] text-red-500 mt-1">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  {INITIAL_DEPARTMENTS.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financials & Progress */}
        <Card className="border-slate-200/80">
          <CardHeader>
            <CardTitle>Budget &amp; Physical Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Approved Budget (₹ Cr) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={approvedBudget}
                  onChange={(e) => setApprovedBudget(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
                {errors.approvedBudget && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.approvedBudget}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated DPR Cost (₹ Cr) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Actual Spending (₹ Cr)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={actualSpending}
                  onChange={(e) => setActualSpending(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Delayed">Delayed</option>
                  <option value="At Risk">At Risk</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Overall Progress (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Planned Completion Date *
                </label>
                <input
                  type="date"
                  value={plannedCompletionDate}
                  onChange={(e) => setPlannedCompletionDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location & Contractor */}
        <Card className="border-slate-200/80">
          <CardHeader>
            <CardTitle>Location &amp; Agency</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ward</label>
                <select
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  {WARDS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contractor</label>
                <select
                  value={contractorId}
                  onChange={(e) => handleContractorChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  {CONTRACTOR_PRESETS.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  <option value="custom">Other / Custom</option>
                </select>
              </div>

              {contractorId === 'custom' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contractor Name
                  </label>
                  <input
                    type="text"
                    value={contractorName}
                    onChange={(e) => setContractorName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              )}
            </div>

            {/* Visibility */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800">Public Citizen Transparency</span>
                <p className="text-[11px] text-slate-500">
                  Allow citizens to view this project on the public projects portal.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  isPublic ? 'bg-blue-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    isPublic ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => navigate(`/dashboard/project-manager/projects/${project.id}`)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={submitting}
            className="bg-blue-600 hover:bg-blue-500 text-white"
          >
            Save Changes &rarr;
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditProjectPage;
