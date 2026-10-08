import type { UserRole } from './index';

export interface GroundingMetadata {
  sources: string[];
  verifiedData: boolean;
  model: string;
  projectId?: string;
  projectNumber?: string;
  riskLevelExplained?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  grounding?: GroundingMetadata;
  error?: boolean;
  status?: 'success' | 'unconfigured' | 'error' | 'safety_blocked';
}

export interface AiChatRequest {
  message: string;
  conversationHistory: Array<{ sender: 'user' | 'ai'; text: string }>;
  userProfile?: {
    uid: string;
    role: UserRole;
    displayName?: string;
    username: string;
  };
  projectId?: string;
}

export interface AiChatResponse {
  reply: string;
  sources: string[];
  verifiedData: boolean;
  model: string;
  status: 'success' | 'unconfigured' | 'error' | 'safety_blocked';
  errorMessage?: string;
}
