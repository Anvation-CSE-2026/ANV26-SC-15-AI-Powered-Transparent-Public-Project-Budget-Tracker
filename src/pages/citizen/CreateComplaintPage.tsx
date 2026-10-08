import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Textarea } from '../../components/common/Textarea';
import { Select } from '../../components/common/Select';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  ArrowLeft,
  MapPin,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  X,
  Send,
  Navigation,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { createComplaint } from '../../api/complaintService';
import { LocationPickerModal } from '../../components/map/LocationPickerModal';
import type {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintSeverity,
  CreateComplaintInput,
  Complaint,
} from '../../types/complaint';

const CATEGORY_OPTIONS: { value: ComplaintCategory; label: string }[] = [
  { value: 'Roads', label: 'Roads & Potholes (Potholes, broken asphalt, footpaths)' },
  { value: 'Drainage', label: 'Stormwater & Drainage (Waterlogging, clogged drains)' },
  { value: 'Garbage', label: 'Garbage & Waste (Uncollected waste, open dumping)' },
  { value: 'Street Lights', label: 'Street Lighting (Dark spots, non-functional lamps)' },
  { value: 'Water', label: 'Water Supply (Low pressure, contaminated water, pipe bursts)' },
  { value: 'Traffic', label: 'Traffic & Signals (Broken signals, missing signs, congestion)' },
  { value: 'Public Infrastructure', label: 'Public Infrastructure (Bridges, dividers, bus stops)' },
  { value: 'Parks', label: 'Parks & Greenery (Broken benches, overgrown vegetation)' },
  { value: 'Sanitation', label: 'Public Sanitation (Public toilet maintenance, hygiene)' },
  { value: 'Other', label: 'Other Civic Grievance' },
];

const PRIORITY_OPTIONS: { value: ComplaintPriority; label: string }[] = [
  { value: 'low', label: 'Low - Minor inconvenience, routine maintenance' },
  { value: 'medium', label: 'Medium - Moderate civic disruption (Standard SLA)' },
  { value: 'high', label: 'High - Serious blockage, safety risk, or contamination' },
  { value: 'emergency', label: 'Emergency - Immediate life safety or disaster hazard' },
];

const SEVERITY_OPTIONS: { value: ComplaintSeverity; label: string }[] = [
  { value: 'low', label: 'Low Severity' },
  { value: 'moderate', label: 'Moderate Severity' },
  { value: 'high', label: 'High Severity' },
  { value: 'critical', label: 'Critical Hazard' },
];

export const CreateComplaintPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, currentUser } = useAuth();

  // Form State
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('Roads');
  const [priority, setPriority] = useState<ComplaintPriority>('medium');
  const [severity, setSeverity] = useState<ComplaintSeverity>('moderate');
  const [description, setDescription] = useState('');

  // Location State
  const [address, setAddress] = useState('');
  const [ward, setWard] = useState('Ward 14 (Central Zone)');
  const [city, setCity] = useState('Smart City Municipal Corp');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Attachments State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ name: string; size: string; url: string }[]>([]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submittedComplaint, setSubmittedComplaint] = useState<Complaint | null>(null);
  const [declaredHonest, setDeclaredHonest] = useState(false);

  // GPS auto-detect handler
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setDetectingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(parseFloat(position.coords.latitude.toFixed(6)));
        setLongitude(parseFloat(position.coords.longitude.toFixed(6)));
        setDetectingGps(false);
      },
      (err) => {
        setGpsError(`Could not retrieve location: ${err.message}. You can still enter the address manually.`);
        setDetectingGps(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // File selection handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const combined = [...selectedFiles, ...filesArray].slice(0, 5); // Limit max 5 files
      setSelectedFiles(combined);

      // Generate local object previews
      const previews = combined.map((f) => ({
        name: f.name,
        size: `${(f.size / (1024 * 1024)).toFixed(2)} MB`,
        url: URL.createObjectURL(f),
      }));
      setFilePreviews(previews);
    }
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    const updatedPreviews = filePreviews.filter((_, i) => i !== index);
    setFilePreviews(updatedPreviews);
  };

  // Validation
  const isStep1Valid = title.trim().length >= 8 && description.trim().length >= 15;
  const isStep2Valid = address.trim().length >= 5;

  const handleSubmit = async () => {
    if (!isStep1Valid || !isStep2Valid || !declaredHonest) {
      setSubmissionError('Please complete all required fields and accept the citizen declaration.');
      return;
    }

    if (!userProfile && !currentUser) {
      setSubmissionError('User session expired. Please log in again.');
      return;
    }

    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const authUser = userProfile || {
        uid: currentUser?.uid || 'local_user',
        email: currentUser?.email || 'citizen@civicsight.org',
        username: currentUser?.displayName || 'Citizen',
        displayName: currentUser?.displayName || 'Citizen',
        role: 'citizen' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      };

      const payload: CreateComplaintInput = {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        severity,
        location: {
          address: address.trim(),
          ward: ward.trim(),
          city: city.trim(),
          latitude,
          longitude,
        },
      };

      const created = await createComplaint(payload, authUser, selectedFiles);
      setSubmittedComplaint(created);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit complaint';
      setSubmissionError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl shadow-lg">
        <button
          onClick={() => navigate('/dashboard/citizen/complaints')}
          className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white mb-3 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Complaints List</span>
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold font-heading">
              Report a Civic Issue or Grievance
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Submit your report directly to the Municipal Corporation with photographic evidence &amp; track official SLA resolution.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full font-semibold">
              Step {step} of 4
            </span>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 gap-2 mt-6">
          {[
            { num: 1, label: 'Issue Details' },
            { num: 2, label: 'Location' },
            { num: 3, label: 'Evidence' },
            { num: 4, label: 'Review & Submit' },
          ].map((s) => (
            <div
              key={s.num}
              onClick={() => {
                if (s.num < step || (s.num === 2 && isStep1Valid) || (s.num === 3 && isStep1Valid && isStep2Valid)) {
                  setStep(s.num as 1 | 2 | 3 | 4);
                }
              }}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                step === s.num
                  ? 'bg-blue-600 text-white shadow-xs'
                  : step > s.num
                  ? 'bg-blue-900/60 text-blue-200 hover:bg-blue-900'
                  : 'bg-slate-800/60 text-slate-400 opacity-60'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step === s.num
                    ? 'bg-white text-blue-600'
                    : step > s.num
                    ? 'bg-emerald-400 text-slate-900'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {step > s.num ? '✓' : s.num}
              </div>
              <span className="hidden sm:inline truncate">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {submissionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="font-semibold">{submissionError}</p>
        </div>
      )}

      {/* STEP 1: ISSUE DETAILS */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>1. Civic Grievance Details</CardTitle>
              <CardDescription>
                Provide concise and accurate details of the problem observed
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <Input
              label="Grievance Title / Short Summary"
              placeholder="e.g. Major pothole causing severe traffic disruption on Main Road"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              helperText="Minimum 8 characters. Be clear and specific."
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Municipal Category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
                options={CATEGORY_OPTIONS}
                required
              />

              <Select
                label="Priority Assessment"
                value={priority}
                onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                options={PRIORITY_OPTIONS}
                helperText="Emergency is reserved for hazardous life-safety issues."
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Perceived Severity"
                value={severity}
                onChange={(e) => setSeverity(e.target.value as ComplaintSeverity)}
                options={SEVERITY_OPTIONS}
              />

              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1">
                <span className="font-semibold text-slate-700">Estimated Municipal SLA</span>
                <p className="text-slate-500">
                  Standard municipal response time for {category} is{' '}
                  <span className="font-bold text-blue-700">24 – 48 business hours</span> after verification.
                </p>
              </div>
            </div>

            <Textarea
              label="Detailed Description"
              placeholder="Describe the exact issue, nearby landmarks, duration of the problem, and how it impacts citizens or commuters..."
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              helperText="Minimum 15 characters. Provide as much relevant context as possible."
              required
            />

            <div className="flex justify-end pt-2">
              <Button
                variant="primary"
                size="md"
                disabled={!isStep1Valid}
                onClick={() => setStep(2)}
              >
                Continue to Location &rarr;
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: LOCATION */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>2. Location &amp; Ward Information</CardTitle>
              <CardDescription>
                Specify the exact street or intersection where the civic issue is located
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <Input
              label="Street Address / Exact Landmark"
              placeholder="e.g. Opposite City Central Bank, North Avenue, Sector 9"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
              helperText="Include building numbers or landmarks for swift field team dispatch."
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Ward / Sector"
                placeholder="e.g. Ward 14 - Central Zone"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
              />
              <Input
                label="City / Municipality"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            {/* GPS Pinpoint Box */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    GPS Coordinates (Optional Pinpoint)
                  </h4>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Helps municipal engineers locate the exact pothole or outage on city maps.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => setShowMapPicker(true)}
                    leftIcon={<MapPin className="w-3.5 h-3.5 text-blue-600" />}
                    className="bg-white text-blue-700 border-blue-300 hover:bg-blue-100"
                  >
                    Pick on Map
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    isLoading={detectingGps}
                    onClick={handleDetectLocation}
                    className="bg-white text-blue-700 border-blue-300 hover:bg-blue-100"
                  >
                    Detect Current Location
                  </Button>
                </div>
              </div>

              {gpsError && (
                <p className="text-xs text-rose-600 font-medium">{gpsError}</p>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Latitude"
                  placeholder="e.g. 18.520430"
                  type="number"
                  step="any"
                  value={latitude !== undefined ? latitude : ''}
                  onChange={(e) => setLatitude(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
                <Input
                  label="Longitude"
                  placeholder="e.g. 73.856743"
                  type="number"
                  step="any"
                  value={longitude !== undefined ? longitude : ''}
                  onChange={(e) => setLongitude(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" size="md" onClick={() => setStep(1)}>
                &larr; Back
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={!isStep2Valid}
                onClick={() => setStep(3)}
              >
                Continue to Evidence &rarr;
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: EVIDENCE & ATTACHMENTS */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>3. Photographic Evidence &amp; Attachments</CardTitle>
              <CardDescription>
                Photographs significantly speed up municipal verification and dispatch
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Upload Zone */}
            <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                Click to browse or drop images here
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports JPG, PNG, WEBP, or PDF up to 10MB each (max 5 files).
              </p>
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {/* Selected File Previews */}
            {filePreviews.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Attached Files ({filePreviews.length}/5)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filePreviews.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-xs"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                          onError={(e) => {
                            // If preview fails (e.g. PDF), hide img
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <div className="truncate text-xs">
                          <p className="font-semibold text-slate-900 truncate">{file.name}</p>
                          <p className="text-slate-400 text-[11px]">{file.size}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                <strong>Tip:</strong> Clear photos showing surrounding street signs or buildings help field officers locate issues faster during peak inspection hours.
              </p>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" size="md" onClick={() => setStep(2)}>
                &larr; Back
              </Button>
              <Button variant="primary" size="md" onClick={() => setStep(4)}>
                Review &amp; Submit &rarr;
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: REVIEW & SUBMIT */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>4. Review &amp; Official Submission</CardTitle>
              <CardDescription>
                Confirm information accuracy before routing to municipal authorities
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Issue Overview
                </span>
                <p className="text-sm font-bold text-slate-900">{title}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Badge variant="info" size="sm">{category}</Badge>
                  <Badge
                    variant={priority === 'emergency' ? 'emergency' : priority === 'high' ? 'danger' : 'warning'}
                    size="sm"
                  >
                    Priority: {priority.toUpperCase()}
                  </Badge>
                  <Badge variant="neutral" size="sm">Severity: {severity}</Badge>
                </div>
                <p className="text-slate-600 text-xs pt-2 line-clamp-3 leading-relaxed">
                  {description}
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  Location &amp; Evidence
                </span>
                <div className="flex items-start gap-2 text-slate-800 font-medium">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>{address}, {ward}, {city}</span>
                </div>
                {latitude && longitude && (
                  <p className="text-[11px] text-slate-500 font-mono">
                    GPS: {latitude}, {longitude}
                  </p>
                )}
                <div className="pt-2 text-slate-600">
                  <span className="font-semibold">Evidence Uploads:</span>{' '}
                  {selectedFiles.length > 0 ? (
                    <span className="text-emerald-700 font-medium">
                      {selectedFiles.length} file(s) attached
                    </span>
                  ) : (
                    <span className="text-slate-400">No photos attached</span>
                  )}
                </div>
              </div>
            </div>

            {/* Declaration Checkbox */}
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-3">
              <input
                id="declaration"
                type="checkbox"
                checked={declaredHonest}
                onChange={(e) => setDeclaredHonest(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="declaration" className="text-xs text-blue-950 cursor-pointer leading-relaxed">
                <span className="font-bold">Citizen Truthfulness Declaration:</span> I hereby confirm that this civic report is accurate, submitted in good faith, and represents a genuine municipal issue requiring intervention.
              </label>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" size="md" onClick={() => setStep(3)} disabled={isSubmitting}>
                &larr; Back
              </Button>
              <Button
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                disabled={!declaredHonest || isSubmitting}
                onClick={handleSubmit}
                leftIcon={<Send className="w-4 h-4" />}
                className="bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20"
              >
                Submit Grievance to Municipality
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Modal */}
      {submittedComplaint && (
        <Modal
          isOpen={true}
          onClose={() => navigate(`/dashboard/citizen/complaints/${submittedComplaint.id}`)}
          title="Grievance Registered Successfully"
          maxWidth="md"
        >
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Tracking Number Issued
              </h3>
              <p className="text-xl font-mono font-bold text-blue-600 mt-1">
                {submittedComplaint.complaintNumber}
              </p>
              <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                Your report has been received and added to the Municipal Corporation dispatch queue. You will receive updates as the department reviews and assigns an inspection team.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-amber-600 uppercase">SUBMITTED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="font-semibold text-slate-800">{submittedComplaint.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target SLA:</span>
                <span className="font-semibold text-slate-800">24 – 48 Hours</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={() => navigate('/dashboard/citizen/complaints')}
              >
                All Complaints
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1 bg-blue-600 hover:bg-blue-500"
                onClick={() => navigate(`/dashboard/citizen/complaints/${submittedComplaint.id}`)}
                rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                Track This Complaint
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Interactive Location Picker Modal */}
      <LocationPickerModal
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        initialLatitude={latitude}
        initialLongitude={longitude}
        initialAddress={address}
        title="Pinpoint Grievance Location"
        description="Drop a pin on the exact location of the civic issue on the map."
        onConfirm={(coords) => {
          setLatitude(coords.latitude);
          setLongitude(coords.longitude);
        }}
      />
    </div>
  );
};

export default CreateComplaintPage;
