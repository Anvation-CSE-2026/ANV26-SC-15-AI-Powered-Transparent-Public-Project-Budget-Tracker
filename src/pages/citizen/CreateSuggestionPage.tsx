import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Textarea } from '../../components/common/Textarea';
import { Select } from '../../components/common/Select';
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
  Lightbulb,
  ExternalLink,
} from 'lucide-react';
import { createSuggestion } from '../../api/suggestionService';
import type {
  SuggestionCategory,
  CreateSuggestionInput,
  Suggestion,
} from '../../types/suggestion';

const CATEGORY_OPTIONS: { value: SuggestionCategory; label: string }[] = [
  { value: 'Roads & Transport', label: 'Roads & Transport' },
  { value: 'Water', label: 'Water Supply' },
  { value: 'Drainage', label: 'Stormwater & Drainage' },
  { value: 'Garbage & Waste', label: 'Garbage & Waste Management' },
  { value: 'Street Lighting', label: 'Street Lighting' },
  { value: 'Parks & Public Spaces', label: 'Parks & Public Spaces' },
  { value: 'Safety', label: 'Civic Safety & Surveillance' },
  { value: 'Traffic', label: 'Traffic & Urban Mobility' },
  { value: 'Environment', label: 'Environment & Urban Greening' },
  { value: 'Public Infrastructure', label: 'Public Infrastructure & Amenities' },
  { value: 'Digital Services', label: 'Digital City Services' },
  { value: 'Education', label: 'Public Education & Libraries' },
  { value: 'Healthcare', label: 'Public Healthcare & Clinics' },
  { value: 'Accessibility', label: 'Urban Accessibility & Ramps' },
  { value: 'Other', label: 'Other Citizen Suggestion' },
];

export const CreateSuggestionPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile, currentUser } = useAuth();

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SuggestionCategory>('Roads & Transport');
  const [description, setDescription] = useState('');

  // Location State (Optional)
  const [address, setAddress] = useState('');
  const [ward, setWard] = useState('');
  const [city, setCity] = useState('Smart City Municipal Corp');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Attachments State (Optional)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ name: string; size: string; url: string }[]>([]);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submittedSuggestion, setSubmittedSuggestion] = useState<Suggestion | null>(null);

  // Manual GPS detection
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
        setGpsError(`Could not detect location: ${err.message}. You can enter the street address manually.`);
        setDetectingGps(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // File handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const combined = [...selectedFiles, ...filesArray].slice(0, 3); // Max 3 files for suggestion
      setSelectedFiles(combined);

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

  const isFormValid = title.trim().length >= 5 && description.trim().length >= 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    if (!userProfile && !currentUser) {
      setSubmissionError('User session expired. Please sign in again.');
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

      const payload: CreateSuggestionInput = {
        title: title.trim(),
        description: description.trim(),
        category,
        location: address.trim()
          ? {
              address: address.trim(),
              ward: ward.trim() || undefined,
              city: city.trim(),
              latitude,
              longitude,
            }
          : undefined,
      };

      const result = await createSuggestion(payload, authUser, selectedFiles);
      setSubmittedSuggestion(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit suggestion.';
      setSubmissionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl shadow-lg">
        <button
          onClick={() => navigate('/dashboard/citizen/suggestions')}
          className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white mb-3 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Suggestions</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading">
              Propose a Civic Suggestion
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Have an idea to improve city roads, public spaces, or digital services? Submit it directly to municipal planners.
            </p>
          </div>
        </div>
      </div>

      {submissionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="font-semibold">{submissionError}</p>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Suggestion Details</CardTitle>
              <CardDescription>
                Categorize your idea and describe the community benefit
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <Select
              label="Civic Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as SuggestionCategory)}
              options={CATEGORY_OPTIONS}
              required
            />

            <Input
              label="Suggestion Title"
              placeholder="e.g. Add dedicated cycling track along Riverside Promenade"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              helperText="Minimum 5 characters. Be clear and specific."
              required
            />

            <Textarea
              label="Detailed Proposal &amp; Expected Impact"
              placeholder="Explain the problem this solves, how citizens will benefit, and any specific ideas for implementation..."
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              helperText="Minimum 10 characters. Provide helpful details for authority review."
              required
            />
          </CardContent>
        </Card>

        {/* Optional Location Card */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Relevant Location (Optional)</CardTitle>
              <CardDescription>
                If your suggestion is tied to a specific street, neighborhood, or landmark
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Street Address / Landmark"
              placeholder="e.g. Near Central Library, 4th Cross Road"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Ward / Sector"
                placeholder="e.g. Ward 9"
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
            <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  GPS Pinpoint (Optional)
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  isLoading={detectingGps}
                  onClick={handleDetectLocation}
                  className="bg-white text-blue-700 border-blue-300 hover:bg-blue-100"
                >
                  Detect My Location
                </Button>
              </div>

              {gpsError && (
                <p className="text-xs text-rose-600 font-medium">{gpsError}</p>
              )}

              {latitude !== undefined && longitude !== undefined && (
                <p className="text-[11px] text-slate-600 font-mono">
                  Coordinates: {latitude}, {longitude}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Optional Attachments Card */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Supporting Sketches or Photos (Optional)</CardTitle>
              <CardDescription>
                Upload reference photos, sketches, or diagrams (max 3 files)
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/70 p-6 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors">
              <UploadCloud className="w-6 h-6 text-slate-400 mb-2" />
              <p className="text-xs font-bold text-slate-700">Click to attach supporting image</p>
              <p className="text-[11px] text-slate-400">JPG, PNG, PDF up to 10MB each</p>
              <input
                type="file"
                multiple
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {filePreviews.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Attached Files ({filePreviews.length}/3)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {filePreviews.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                    >
                      <span className="truncate font-medium text-slate-800">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex justify-between items-center pt-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => navigate('/dashboard/citizen/suggestions')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            disabled={!isFormValid || isSubmitting}
            leftIcon={<Send className="w-4 h-4" />}
            className="bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20"
          >
            Submit Suggestion
          </Button>
        </div>
      </form>

      {/* Success Modal */}
      {submittedSuggestion && (
        <Modal
          isOpen={true}
          onClose={() => navigate(`/dashboard/citizen/suggestions/${submittedSuggestion.id}`)}
          title="Civic Suggestion Registered"
          maxWidth="md"
        >
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Suggestion Submitted
              </h3>
              <p className="text-xl font-mono font-bold text-blue-600 mt-1">
                {submittedSuggestion.suggestionNumber}
              </p>
              <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                Thank you for contributing to your city! The suggestion will be reviewed by the responsible authority.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-amber-600 uppercase">SUBMITTED</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Category:</span>
                <span className="font-semibold text-slate-800">{submittedSuggestion.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Title:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[200px]">{submittedSuggestion.title}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={() => navigate('/dashboard/citizen/suggestions')}
              >
                Back to Suggestions
              </Button>
              <Button
                variant="primary"
                size="md"
                className="flex-1 bg-blue-600 hover:bg-blue-500"
                onClick={() => navigate(`/dashboard/citizen/suggestions/${submittedSuggestion.id}`)}
                rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                View Suggestion
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CreateSuggestionPage;
