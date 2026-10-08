export type SuggestionCategory =
  | 'Roads & Transport'
  | 'Water'
  | 'Drainage'
  | 'Garbage & Waste'
  | 'Street Lighting'
  | 'Parks & Public Spaces'
  | 'Safety'
  | 'Traffic'
  | 'Environment'
  | 'Public Infrastructure'
  | 'Digital Services'
  | 'Education'
  | 'Healthcare'
  | 'Accessibility'
  | 'Other'
  | 'infrastructure'
  | 'environment'
  | 'transportation'
  | 'health'
  | 'education'
  | 'technology'
  | 'safety'
  | 'governance'
  | 'other';

export type SuggestionStatus =
  | 'submitted'
  | 'under_review'
  | 'accepted'
  | 'in_progress'
  | 'implemented'
  | 'rejected'
  | 'closed';

export interface SuggestionAttachment {
  id: string;
  fileName: string;
  storagePath: string;
  downloadURL: string;
  contentType: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
}

export interface SuggestionLocation {
  address?: string;
  ward?: string;
  city?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}

export interface SuggestionAuthorityResponse {
  message: string;
  respondedBy: string;
  department?: string;
  respondedAt: string;
}

export interface Suggestion {
  id: string; // Firestore doc ID
  suggestionNumber: string; // Format: SGG-YYYY-XXXXX
  citizenId: string;
  citizenName: string;
  citizenEmail?: string;

  title: string;
  description: string;
  expectedImpact?: string;
  category: SuggestionCategory;

  location?: SuggestionLocation;
  attachments?: SuggestionAttachment[];

  status: SuggestionStatus;
  authorityResponse?: SuggestionAuthorityResponse;

  createdAt: string;
  updatedAt: string;
}

export interface SuggestionUpdate {
  id: string;
  suggestionId: string;
  actorId: string;
  actorName: string;
  actorRole: 'citizen' | 'project_manager' | 'contractor';
  action: string;
  status?: SuggestionStatus;
  message: string;
  isInternal: boolean; // TRUE for authority-only notes; FALSE for public citizen updates
  createdAt: string;
}

export interface CreateSuggestionInput {
  title: string;
  description: string;
  expectedImpact?: string;
  category: SuggestionCategory;
  location?: SuggestionLocation;
}
