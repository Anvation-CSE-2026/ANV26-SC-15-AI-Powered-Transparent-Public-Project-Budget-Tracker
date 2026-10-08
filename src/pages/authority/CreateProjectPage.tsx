import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { INITIAL_DEPARTMENTS } from '../../data/departmentsData';
import { createProject } from '../../api/projectService';
import type { ProjectCategory, CreateProjectInput } from '../../types/project';

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

interface InitialMilestoneRow {
  title: string;
  description: string;
  targetDate: string;
  weight: number;
}

export const CreateProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('Roads & Transport');
  const [departmentId, setDepartmentId] = useState(INITIAL_DEPARTMENTS[0]?.id || 'dept_roads');

  // Location
  const [address, setAddress] = useState('');
  const [ward, setWard] = useState('Ward 12');
  const [city, setCity] = useState('Pune Metro');
  const [latitude, setLatitude] = useState('18.5204');
  const [longitude, setLongitude] = useState('73.8567');

  // Finances
  const [approvedBudget, setApprovedBudget] = useState('10.0');
  const [estimatedCost, setEstimatedCost] = useState('9.8');
  const [actualSpending, setActualSpending] = useState('0');

  // Dates
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [plannedCompletionDate, setPlannedCompletionDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 9);
    return d.toISOString().split('T')[0];
  });

  // Contractor & Visibility
  const [contractorId, setContractorId] = useState(CONTRACTOR_PRESETS[0].id);
  const [contractorName, setContractorName] = useState(CONTRACTOR_PRESETS[0].name);
  const [isPublic, setIsPublic] = useState(true);

  // Initial milestones
  const [milestones, setMilestones] = useState<InitialMilestoneRow[]>([
    {
      title: 'Geotechnical Site Survey & Clearances',
      description: 'Soil test core sampling and tree preservation clearances.',
      targetDate: '',
      weight: 25,
    },
    {
      title: 'Foundation & Civil Framework Execution',
      description: 'Structural base concrete work and drainage conduits.',
      targetDate: '',
      weight: 50,
    },
    {
      title: 'Final Commissioning & Quality Audit',
      description: 'Third-party engineering stress inspection and hand-off.',
      targetDate: '',
      weight: 25,
    },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleContractorChange = (cId: string) => {
    setContractorId(cId);
    const found = CONTRACTOR_PRESETS.find((c) => c.id === cId);
    if (found) {
      setContractorName(found.name);
    }
  };

  const handleAddMilestone = () => {
    setMilestones([
      ...milestones,
      {
        title: '',
        description: '',
        targetDate: plannedCompletionDate,
        weight: 20,
      },
    ]);
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleMilestoneChange = (
    index: number,
    field: keyof InitialMilestoneRow,
    value: string | number
  ) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    setMilestones(updated);
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 5) {
      errs.name = 'Project title must be at least 5 characters long.';
    }

    if (!description.trim() || description.trim().length < 20) {
      errs.description = 'Please provide a descriptive scope of at least 20 characters.';
    }

    if (!address.trim()) {
      errs.address = 'Worksite address or location description is required.';
    }

    const budgetNum = parseFloat(approvedBudget);
    if (isNaN(budgetNum) || budgetNum <= 0) {
      errs.approvedBudget = 'Approved budget must be a positive number in Crores.';
    }

    const estNum = parseFloat(estimatedCost);
    if (isNaN(estNum) || estNum <= 0) {
      errs.estimatedCost = 'Estimated cost must be a positive number in Crores.';
    }

    if (!startDate) {
      errs.startDate = 'Project sanction start date is required.';
    }

    if (!plannedCompletionDate) {
      errs.plannedCompletionDate = 'Planned completion date is required.';
    } else if (startDate && new Date(plannedCompletionDate) < new Date(startDate)) {
      errs.plannedCompletionDate = 'Completion date cannot precede the project start date.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!userProfile) return;

    try {
      setSubmitting(true);
      const selectedDept = INITIAL_DEPARTMENTS.find((d) => d.id === departmentId);

      const input: CreateProjectInput = {
        name,
        description,
        category,
        department: selectedDept ? selectedDept.name : 'General Public Works',
        departmentId,
        contractorId: contractorId || undefined,
        contractorName: contractorName || undefined,
        location: {
          address,
          ward,
          city,
          latitude: parseFloat(latitude) || 18.5204,
          longitude: parseFloat(longitude) || 73.8567,
        },
        startDate,
        plannedCompletionDate,
        approvedBudget: parseFloat(approvedBudget),
        estimatedCost: parseFloat(estimatedCost),
        actualSpending: parseFloat(actualSpending) || 0,
        progress: 0,
        status: 'Upcoming',
        isPublic,
        initialMilestones: milestones
          .filter((m) => m.title.trim())
          .map((m) => ({
            title: m.title.trim(),
            description: m.description.trim(),
            targetDate: m.targetDate || plannedCompletionDate,
            weight: Number(m.weight) || 20,
          })),
      };

      const created = await createProject(input, userProfile);
      navigate(`/dashboard/project-manager/projects/${created.id}`);
    } catch {
      setErrors({ form: 'An unexpected error occurred while creating project. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl shadow-lg">
        <button
          onClick={() => navigate('/dashboard/project-manager/projects')}
          className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white mb-2 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects List</span>
        </button>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold font-heading">Sanction New Capital Project</h1>
          <Badge variant="warning" size="sm">Authority Protocol</Badge>
        </div>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl">
          Create an official municipal project charter. A unique municipal tracking number (PRJ-YYYY-XXXXX) will be automatically assigned.
        </p>
      </div>

      {errors.form && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errors.form}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Scope */}
        <Card className="border-slate-200/80">
          <CardHeader>
            <div>
              <CardTitle>1. Project Title &amp; Scope of Work</CardTitle>
              <CardDescription>Official administrative title and engineering description</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. North Ward Stormwater Drainage &amp; Flood Mitigation Canal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                  errors.name ? 'border-red-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Engineering Scope &amp; Deliverables <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Provide detailed description of the physical construction, materials, expected impact, and specifications..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                  errors.description ? 'border-red-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {errors.description && (
                <p className="text-[11px] text-red-500 mt-1">{errors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Responsible Municipal Department <span className="text-red-500">*</span>
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {INITIAL_DEPARTMENTS.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Location & Ward */}
        <Card className="border-slate-200/80">
          <CardHeader>
            <div>
              <CardTitle>2. Worksite Location &amp; Ward</CardTitle>
              <CardDescription>Geographic jurisdiction and physical street coordinates</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Street Address / Worksite Demarcation <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Outer Ring Road, Sector 4 to 12 Corridor"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                  errors.address ? 'border-red-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {errors.address && <p className="text-[11px] text-red-500 mt-1">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ward</label>
                <select
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                >
                  {WARDS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City / Region</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Latitude</label>
                <input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Longitude</label>
                <input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Financial Sanction & Budget */}
        <Card className="border-slate-200/80">
          <CardHeader>
            <div>
              <CardTitle>3. Financial Sanction &amp; Budget (in ₹ Crores)</CardTitle>
              <CardDescription>Capital allocation approved by municipal corporation</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Approved Budget (₹ Cr) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="10.0"
                    value={approvedBudget}
                    onChange={(e) => setApprovedBudget(e.target.value)}
                    className={`w-full pl-7 pr-3 py-2 text-xs rounded-xl border bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                      errors.approvedBudget ? 'border-red-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.approvedBudget && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.approvedBudget}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated DPR Cost (₹ Cr) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="9.8"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    className={`w-full pl-7 pr-3 py-2 text-xs rounded-xl border bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 ${
                      errors.estimatedCost ? 'border-red-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                </div>
                {errors.estimatedCost && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.estimatedCost}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Actual Spent (₹ Cr)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={actualSpending}
                    onChange={(e) => setActualSpending(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Default is ₹0 for newly sanctioned works</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Schedule & Timeline */}
        <Card className="border-slate-200/80">
          <CardHeader>
            <div>
              <CardTitle>4. Schedule &amp; Execution Dates</CardTitle>
              <CardDescription>Sanction date and contractual deadline</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Start / Sanction Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Planned Completion Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={plannedCompletionDate}
                  onChange={(e) => setPlannedCompletionDate(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-white text-slate-700 ${
                    errors.plannedCompletionDate ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {errors.plannedCompletionDate && (
                  <p className="text-[11px] text-red-500 mt-1">{errors.plannedCompletionDate}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Contractor Assignment & Visibility */}
        <Card className="border-slate-200/80">
          <CardHeader>
            <div>
              <CardTitle>5. Contractor &amp; Transparency Policy</CardTitle>
              <CardDescription>Assign verified construction agency and citizen visibility</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Contractor
                </label>
                <select
                  value={contractorId}
                  onChange={(e) => handleContractorChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                >
                  {CONTRACTOR_PRESETS.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  <option value="custom">Other / Custom Contractor</option>
                </select>
              </div>

              {contractorId === 'custom' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Custom Contractor Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter agency legal name"
                    value={contractorName}
                    onChange={(e) => setContractorName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              )}
            </div>

            {/* Visibility Toggle */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">Publish for Public Transparency</span>
                  {isPublic ? (
                    <Badge variant="success" size="sm">Public</Badge>
                  ) : (
                    <Badge variant="neutral" size="sm">Internal Draft</Badge>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  When enabled, verified citizens can inspect approved budgets, timelines, and progress updates on the citizen portal.
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

        {/* Section 6: Initial Milestones */}
        <Card className="border-slate-200/80">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>6. Initial Project Milestones ({milestones.length})</CardTitle>
              <CardDescription>Major delivery phases agreed upon for stage-gate tracking</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMilestone}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Add Milestone
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {milestones.map((ms, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700">Milestone #{idx + 1}</span>
                  {milestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMilestone(idx)}
                      className="text-slate-400 hover:text-red-500 p-1 rounded-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Milestone title (e.g. Subgrade excavation)"
                      value={ms.title}
                      onChange={(e) => handleMilestoneChange(idx, 'title', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      value={ms.targetDate || plannedCompletionDate}
                      onChange={(e) => handleMilestoneChange(idx, 'targetDate', e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Milestone technical scope summary..."
                  value={ms.description}
                  onChange={(e) => handleMilestoneChange(idx, 'description', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => navigate('/dashboard/project-manager/projects')}
            disabled={submitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={submitting}
            className="bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 text-white"
          >
            Sanction &amp; Issue Project Charter &rarr;
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateProjectPage;
