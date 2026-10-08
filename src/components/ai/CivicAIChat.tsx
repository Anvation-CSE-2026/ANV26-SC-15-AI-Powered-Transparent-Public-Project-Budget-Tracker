import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { useAuth } from '../../hooks/useAuth';
import { sendAiChatMessage } from '../../api/aiService';
import type { ChatMessage } from '../../types/ai';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Database,
} from 'lucide-react';

let messageSeq = 0;
function nextMsgId(prefix: string): string {
  messageSeq += 1;
  return `${prefix}_${messageSeq}`;
}

export interface CivicAIChatProps {
  mode: 'citizen' | 'project_manager';
  initialProjectId?: string;
  className?: string;
}

export const CivicAIChat: React.FC<CivicAIChatProps> = ({
  mode,
  initialProjectId,
  className = '',
}) => {
  const { userProfile } = useAuth();

  const welcomeName = userProfile?.displayName || userProfile?.username || (mode === 'project_manager' ? 'Municipal Officer' : 'Citizen');
  const welcomeGreeting =
    mode === 'project_manager'
      ? `Hello, ${welcomeName}. I am CivicSight AI (Municipal Governance Mode). I can assist you with capital telemetry, budget overrun breakdowns, worksite milestone delays, and multi-factor risk diagnostics.`
      : `Hello! I'm CivicSight AI. I can help you understand public projects, budgets, progress, and civic services.`;

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: welcomeGreeting,
      timestamp: 'Just now',
      grounding: {
        sources: ['CivicSight Governance System'],
        verifiedData: true,
        model: 'gemini-2.5-flash',
      },
    },
  ]);

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Suggested prompt chips based on role
  const citizenSuggestions = [
    'Explain the status of the FC Road Pathway project',
    'Why is the North Sector Drainage Canal marked delayed?',
    'Explain how budget deviation is calculated',
    'How do I submit a civic complaint for my ward?',
    'How can I participate in a public poll?',
    'Summarize city infrastructure analytics',
  ];

  const authoritySuggestions = [
    'Summarize high-attention projects with budget overruns',
    'Why does the North Sector Drainage project require attention?',
    'Explain the S-Curve progress deficit for active worksites',
    'Review unresolved complaints corridor density',
    'Explain the CivicSight Risk Indicator criteria',
    'Summarize municipal department capital allocations',
  ];

  const suggestedPrompts = mode === 'project_manager' ? authoritySuggestions : citizenSuggestions;

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: nextMsgId('user'),
      sender: 'user',
      text: trimmed,
      timestamp: 'Just now',
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await sendAiChatMessage({
        message: trimmed,
        conversationHistory: newHistory.map((m) => ({ sender: m.sender, text: m.text })),
        userProfile: userProfile || undefined,
        projectId: initialProjectId,
      });

      const aiMessage: ChatMessage = {
        id: nextMsgId('ai'),
        sender: 'ai',
        text: response.reply,
        timestamp: 'Just now',
        grounding: {
          sources: response.sources,
          verifiedData: response.verifiedData,
          model: response.model,
        },
        status: response.status,
        error: response.status === 'error',
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: unknown) {
      console.error('[CivicAIChat] Failed to send message:', err);
      const aiErrorMsg: ChatMessage = {
        id: nextMsgId('ai_err'),
        sender: 'ai',
        text: 'Sorry, I encountered a network error while reaching the CivicSight AI service. Please verify your connection or try again.',
        timestamp: 'Just now',
        error: true,
        status: 'error',
      };
      setMessages((prev) => [...prev, aiErrorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputText);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRetry = () => {
    // Find last user message
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === 'user') {
        handleSendMessage(messages[i].text);
        break;
      }
    }
  };

  const handleClearConversation = () => {
    setIsClearModalOpen(false);
    setMessages([
      {
        id: nextMsgId('msg_reset'),
        sender: 'ai',
        text: `Conversation cleared. Hello, ${welcomeName}! How can I help you explore CivicSight projects or services today?`,
        timestamp: 'Just now',
        grounding: {
          sources: ['CivicSight System'],
          verifiedData: true,
          model: 'gemini-2.5-flash',
        },
      },
    ]);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Chat Card Container */}
      <Card className="flex flex-col h-[700px] border-slate-200/90 shadow-md overflow-hidden bg-white">
        {/* Header Strip */}
        <CardHeader className="py-3.5 px-4 sm:px-6 border-b border-slate-100 bg-slate-50/70 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold text-slate-900">
                  CivicSight AI Assistant
                </CardTitle>
                <Badge
                  variant={mode === 'project_manager' ? 'warning' : 'primary'}
                  size="sm"
                >
                  {mode === 'project_manager' ? 'Authority Telemetry' : 'Citizen Transparency'}
                </Badge>
              </div>
              <CardDescription className="text-[11px] text-slate-500">
                Powered by Google Gemini 2.5 Flash • Grounded in Municipal Database
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsClearModalOpen(true)}
              className="text-xs text-slate-600 border-slate-200 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              title="Clear conversation history"
            >
              Clear
            </Button>
          </div>
        </CardHeader>

        {/* Message Log */}
        <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/30">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 text-xs ${
                  isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                    isUser
                      ? 'bg-blue-600 text-white'
                      : msg.error
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble Container */}
                <div
                  className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${
                    isUser ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`p-4 rounded-2xl leading-relaxed whitespace-pre-wrap break-words ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                        : msg.error
                        ? 'bg-rose-50 text-rose-900 border border-rose-200 rounded-tl-xs'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-2xs'
                    }`}
                  >
                    {/* Render text with basic markdown formatting */}
                    <div className="space-y-2">
                      {msg.text.split('\n\n').map((para, pIdx) => (
                        <p key={pIdx} className="leading-relaxed">
                          {para}
                        </p>
                      ))}
                    </div>

                    {/* Grounding Source Badge */}
                    {!isUser && msg.grounding && msg.grounding.sources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-500 flex flex-wrap items-center gap-1.5">
                        <span className="font-bold flex items-center gap-1 text-indigo-600">
                          <Database className="w-3 h-3" />
                          Grounded Data:
                        </span>
                        {msg.grounding.sources.map((src, sIdx) => (
                          <span
                            key={sIdx}
                            className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono"
                          >
                            {src}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Message Meta & Action Bar */}
                  <div className="flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-400">
                    <span>{msg.timestamp}</span>

                    {!isUser && (
                      <>
                        <span>•</span>
                        <button
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="hover:text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Copy text"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </>
                    )}

                    {msg.error && (
                      <>
                        <span>•</span>
                        <button
                          onClick={handleRetry}
                          className="hover:text-rose-700 text-rose-600 flex items-center gap-1 cursor-pointer transition-colors font-semibold"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Retry</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white p-3.5 rounded-2xl rounded-tl-xs border border-slate-200/80 shadow-2xs flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
                <span
                  className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                />
                <span className="ml-1 text-[11px] font-medium text-slate-600">
                  CivicSight AI is analyzing municipal data...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input Bar & Suggested Prompts Footer */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-100 space-y-3">
          {/* Functional Suggested Prompt Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
              Suggested:
            </span>
            {suggestedPrompts.map((chip, idx) => (
              <button
                key={idx}
                disabled={isLoading}
                onClick={() => handleSendMessage(chip)}
                className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100/80 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-slate-700 border border-slate-200/60 transition-all cursor-pointer font-medium disabled:opacity-50"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                rows={2}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask CivicSight AI a civic question... (Press Enter to send, Shift+Enter for new line)"
                className="w-full text-xs rounded-xl border border-slate-200 bg-white p-3 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <Button
              variant="primary"
              size="md"
              disabled={!inputText.trim() || isLoading}
              onClick={() => handleSendMessage(inputText)}
              className="bg-indigo-600 hover:bg-indigo-500 text-xs px-4 h-11 shrink-0"
              rightIcon={<Send className="w-3.5 h-3.5" />}
            >
              Send
            </Button>
          </div>
        </div>
      </Card>

      {/* Clear Confirmation Modal */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Clear Current Conversation?"
        description="This will clear your chat session history. This action cannot be undone."
        maxWidth="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsClearModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleClearConversation}
            >
              Clear Chat History
            </Button>
          </div>
        }
      >
        <p className="text-xs text-slate-600 leading-relaxed">
          Are you sure you want to reset this session? All questions and grounded responses from this session will be cleared.
        </p>
      </Modal>
    </div>
  );
};
export default CivicAIChat;
