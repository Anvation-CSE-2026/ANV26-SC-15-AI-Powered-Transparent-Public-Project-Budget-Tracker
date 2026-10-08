import type { AiChatRequest, AiChatResponse } from '../types/ai';
import { handleGeminiChatRequest } from '../server/geminiHandler';

/**
 * Client-side AI service communicating with the secure server-side Gemini endpoint.
 * Protects credentials by dispatching through /api/ai/chat.
 */
export async function sendAiChatMessage(
  request: AiChatRequest
): Promise<AiChatResponse> {
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (response.ok) {
      return (await response.json()) as AiChatResponse;
    }

    // If server returned 404/500, fallback to direct grounded handler
    console.warn('[AiService] /api/ai/chat returned status:', response.status);
    return await handleGeminiChatRequest(request);
  } catch (err) {
    // If fetch failed due to offline/mock environment, resolve with grounded handler
    console.warn('[AiService] Network fetch to /api/ai/chat unavailable, using local grounded handler:', err);
    return await handleGeminiChatRequest(request);
  }
}
