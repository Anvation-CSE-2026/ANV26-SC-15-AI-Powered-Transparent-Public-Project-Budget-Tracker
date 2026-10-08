import { GoogleGenAI } from '@google/genai';
import type { AiChatRequest, AiChatResponse } from '../types/ai';
import type { Project } from '../types/project';
import type { Complaint } from '../types/complaint';
import { buildGroundedContext, sanitizeQuery } from '../utils/aiContextBuilder';
import { getProjects } from '../api/projectService';
import { getAllComplaints } from '../api/complaintService';

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/**
 * Server-side handler for CivicSight Gemini AI Assistant requests.
 * Evaluates role permissions, grounds responses in verified municipal database data,
 * defends against prompt injections, and calls the Google Gemini API securely.
 */
export async function handleGeminiChatRequest(
  request: AiChatRequest
): Promise<AiChatResponse> {
  const sanitizedMessage = sanitizeQuery(request.message);

  if (!sanitizedMessage) {
    return {
      reply: 'Please provide a civic query or select one of the suggested prompts.',
      sources: [],
      verifiedData: false,
      model: GEMINI_MODEL,
      status: 'error',
      errorMessage: 'Empty message provided',
    };
  }

  const role = request.userProfile?.role || 'citizen';

  // 1. Load application data for grounding using authorized services
  let projects: Project[] = [];
  let complaints: Complaint[] = [];
  try {
    const isAuthority = role === 'project_manager';
    const [fetchedProjects, fetchedComplaints] = await Promise.all([
      getProjects({ isAuthority }),
      getAllComplaints(),
    ]);
    projects = fetchedProjects;
    complaints = fetchedComplaints;
  } catch (err) {
    console.warn('[GeminiHandler] Error fetching application context:', err);
  }

  // 2. Build grounded context adhering to role boundaries & injection defenses
  const groundedContext = buildGroundedContext({
    query: sanitizedMessage,
    role,
    userProfile: request.userProfile ? (request.userProfile as unknown as import('../types').UserProfile) : null,
    projects,
    complaints,
    conversationHistory: request.conversationHistory,
  });

  // 3. Check for Prompt Injection violations
  if (groundedContext.isPromptInjection) {
    return {
      reply:
        'I am designed strictly to assist with verified civic infrastructure, public budgets, and municipal services in Pune Metro. System overrides, administrative bypasses, or requests to reveal credentials cannot be processed.',
      sources: ['CivicSight Security Policy'],
      verifiedData: false,
      model: GEMINI_MODEL,
      status: 'safety_blocked',
      errorMessage: groundedContext.injectionReason,
    };
  }

  // 4. Check for unauthorized resource requests (e.g. citizen querying other citizens' complaints)
  if (!groundedContext.isAuthorized) {
    return {
      reply:
        'To protect citizen privacy, individual grievance records of other residents cannot be disclosed. You can inspect public project progress, ward-level investment summaries, or view your own personal complaints under the "Complaints & Issues" module.',
      sources: ['CivicSight Privacy Policy'],
      verifiedData: true,
      model: GEMINI_MODEL,
      status: 'safety_blocked',
      errorMessage: groundedContext.authorizationReason,
    };
  }

  // 5. Check if server-side GEMINI_API_KEY is configured
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    // Generate deterministic grounded fallback response based on real data
    const project = groundedContext.matchedProject;
    const dev = project ? ((project.actualSpending - project.approvedBudget) / project.approvedBudget) * 100 : 0;
    const groundedResponse = project
      ? `### ${project.projectNumber}: ${project.name}
**Department**: ${project.department} | **Ward**: ${project.location.ward || 'General'}
- **Sanctioned Budget**: ₹${project.approvedBudget.toFixed(2)} Cr
- **Actual Spending**: ₹${project.actualSpending.toFixed(2)} Cr (${dev > 0 ? `+${dev.toFixed(1)}% overrun` : `${dev.toFixed(1)}% variance`})
- **Physical Progress**: ${project.progress}% (Expected: ${project.expectedProgress ?? project.progress}%)
- **Delivery Status**: ${project.status} (${project.delayDays ?? 0} calendar days delay)

**CivicSight Risk Indicator**: Flagged as **${project.riskLabel || 'Normal'}**.
*Note: The CivicSight Risk Indicator is an internal administrative monitoring heuristic evaluating financial deviations and milestone slippages. It does not represent an audit finding, judicial determination, or allegation of fraud.*

*Navigation tip: You can inspect the complete milestone ledger at \`/dashboard/citizen/projects/${project.id}\`.*`
      : `CivicSight monitors **${projects.length} municipal infrastructure projects** across Pune Metro with a combined capital outlay of **₹${projects.reduce((s, p) => s + p.approvedBudget, 0).toFixed(2)} Cr**.

Available Civic Guidance:
1. **Filing Complaints**: Visit \`/dashboard/citizen/complaints/new\` to report road potholes, water leaks, or streetlights.
2. **Public Voting & Polls**: Visit \`/dashboard/citizen/voting\` to vote on ward priorities.
3. **Interactive Map**: Visit \`/dashboard/citizen/map\` to inspect geotagged worksites.
4. **City Analytics**: Visit \`/dashboard/citizen/analytics\` to view capital spending transparency.`;

    return {
      reply: `${groundedResponse}\n\n> ℹ️ *Notice: Live Google Gemini API is currently in offline/unconfigured mode (server-side \`GEMINI_API_KEY\` is not set). Responses are grounded directly in CivicSight's verified database.*`,
      sources: groundedContext.sources,
      verifiedData: true,
      model: GEMINI_MODEL,
      status: 'unconfigured',
    };
  }

  // 6. Execute Live Gemini API Call
  try {
    const ai = new GoogleGenAI({ apiKey });

    // Format chat contents
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    // System prompt as first turn or system instruction
    contents.push({
      role: 'user',
      parts: [{ text: `${groundedContext.systemPrompt}\n\nUser Question: ${sanitizedMessage}` }],
    });

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
    });

    const replyText = response.text || 'I evaluated the civic records, but no text response was generated.';

    return {
      reply: replyText,
      sources: groundedContext.sources,
      verifiedData: true,
      model: GEMINI_MODEL,
      status: 'success',
    };
  } catch (err: unknown) {
    console.error('[GeminiHandler] Live API Error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown Gemini error';

    return {
      reply:
        'CivicSight AI encountered a temporary communication issue with the Gemini service. Please verify your connection or try again in a moment.',
      sources: groundedContext.sources,
      verifiedData: false,
      model: GEMINI_MODEL,
      status: 'error',
      errorMessage,
    };
  }
}
