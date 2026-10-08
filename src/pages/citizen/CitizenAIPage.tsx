import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Sparkles, ArrowLeft, Info, Send, Bot, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const CitizenAIPage: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'ai' | 'user'; text: string }>>([
    {
      sender: 'ai',
      text: `Hello ${userProfile?.displayName || userProfile?.username || 'Citizen'}! I am CivicSight AI. I can explain public project budgets, assist you in choosing the correct department for a complaint, or clarify civic regulations. How can I help you today?`,
    },
  ]);

  const promptSuggestions = [
    'How do I report a broken streetlight in Ward 12?',
    'Explain the budget deviation for the Urban Drainage project',
    'Which municipal department handles water contamination?',
    'What is the SLA deadline for emergency potholes?',
  ];

  const handleSend = (text: string) => {
    if (!text.trim()) return;

    const userText = text.trim();
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInputMessage('');

    // Responsive preliminary civic guidance
    setTimeout(() => {
      let aiResponse =
        'CivicSight AI will be connected to the live Google Gemini API in Phase 11 with deterministic data guardrails. In the meantime, you can navigate to the Complaints or Projects module to inspect verified municipal data.';
      if (userText.toLowerCase().includes('streetlight') || userText.toLowerCase().includes('light')) {
        aiResponse =
          'Street lighting issues fall under the Electrical & Public Lighting Department. Emergency lighting outages have a designated 48-hour municipal SLA resolution window.';
      } else if (userText.toLowerCase().includes('drainage') || userText.toLowerCase().includes('budget')) {
        aiResponse =
          'The Urban Drainage Upgrade project has an approved budget of ₹8.0 Cr and current spending of ₹10.1 Cr (+26.25% budget deviation). The CivicSight Risk Indicator has flagged it as Requires High Attention due to milestone delays.';
      }

      setMessages((prev) => [...prev, { sender: 'ai', text: aiResponse }]);
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl shadow-lg">
        <div>
          <button
            onClick={() => navigate('/dashboard/citizen')}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white mb-2 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Citizen Portal</span>
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-heading">
              CivicSight AI Assistant
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-[11px] font-semibold text-indigo-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-300" />
              Gemini Powered
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Explain civic data, understand public budgets, and receive guidance on filing complaints
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Phase 3 Foundation Active</p>
          <p className="text-indigo-800 text-[11px] mt-0.5 leading-relaxed">
            The full Gemini API client with deterministic civic risk explainers and department classification models will be connected in <strong>Phase 11: AI Assistant</strong>.
          </p>
        </div>
      </div>

      <Card className="flex flex-col h-[520px]">
        <CardHeader>
          <CardTitle>Civic Consultation Chat</CardTitle>
          <CardDescription>Ask questions in plain language regarding your city and projects</CardDescription>
        </CardHeader>

        {/* Message history */}
        <CardContent className="flex-1 overflow-y-auto space-y-4 p-5">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${
                m.sender === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-indigo-100 text-indigo-600'
                }`}
              >
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div
                className={`max-w-lg p-3.5 rounded-2xl text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-xs'
                    : 'bg-slate-100 text-slate-800 rounded-tl-xs'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </CardContent>

        {/* Prompt suggestion pills & input */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggested:</span>
            {promptSuggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s)}
                className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 hover:text-indigo-700 transition-colors cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputMessage);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask CivicSight AI a question about your ward or project..."
              className="flex-1 text-xs rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="bg-indigo-600 hover:bg-indigo-700"
              rightIcon={<Send className="w-3.5 h-3.5" />}
            >
              Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default CitizenAIPage;
