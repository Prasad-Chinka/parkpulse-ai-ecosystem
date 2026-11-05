import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, RotateCcw, Sparkles, User, MapPin, Zap, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'welcome-1',
    role: 'assistant',
    content: "👋 Hello! I'm **ParkPulse AI Assistant**, your smart city parking concierge.\n\nI have real-time access to **20 parking facilities** across **Vijayawada, Guntur, Mangalagiri, Tadepalle & Tenali**.\n\nAsk me about live slot availability, hourly tariffs, QR tickets, demo payments, or role elevation codes!",
    timestamp: new Date(),
  },
];

const SUGGESTIONS = [
  'Where can I park?',
  'How many slots free in Vijayawada?',
  'Tenali & Guntur stations',
  'How does QR entry work?',
  'How do I cancel a booking?',
  'Operator & Admin access codes',
  'Cheapest parking rates',
];

export const AIChatbot: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('parkpulse_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      }
    } catch {
      // Ignore
    }
    return INITIAL_MESSAGES;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('parkpulse_chat_history', JSON.stringify(messages));
    } catch {
      // Ignore
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('parkpulse_token')
            ? { Authorization: `Bearer ${localStorage.getItem('parkpulse_token')}` }
            : {}),
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          userContext: user ? { name: user.name, role: user.role, email: user.email } : undefined,
        }),
      });

      const data = await res.json();
      const replyContent = data.reply || "I'm experiencing a brief network hiccup, but you can explore all 20 stations on the 'Find Parking' map!";

      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: replyContent,
          timestamp: new Date(),
        },
      ]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ Unable to connect to PulseAI services. Please verify your connection or try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages(INITIAL_MESSAGES);
    localStorage.removeItem('parkpulse_chat_history');
  };

  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, i) => {
      let formattedLine = line;
      formattedLine = formattedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formattedLine = formattedLine.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-black/40 text-cyan-300 font-mono text-[11px]">$1</code>');

      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        return (
          <div key={i} className="flex items-start gap-1.5 my-1">
            <span className="text-cyan-400 shrink-0 mt-0.5">●</span>
            <span dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[-•]\s*/, '') }} />
          </div>
        );
      }

      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }

      return (
        <p key={i} className="my-0.5" dangerouslySetInnerHTML={{ __html: formattedLine }} />
      );
    });
  };

  return (
    <>
      {/* Floating Action Button with Neon City Glow */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative group p-3.5 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-cyan-500 text-white shadow-2xl neon-glow-purple hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2.5 cursor-pointer border border-white/20"
          aria-label="Toggle AI Concierge"
        >
          <Bot className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline font-bold text-xs tracking-wide">
            PulseAI
          </span>
          <span className="absolute -top-2 -left-2 px-1.5 py-0.5 bg-black/80 text-cyan-300 border border-cyan-400/50 text-[9px] rounded-full font-bold shadow-md flex items-center gap-0.5 font-mono">
            <Sparkles className="w-2.5 h-2.5 text-cyan-400" /> Gemini
          </span>
        </button>
      </div>

      {/* Floating Chat Window Modal with Neon City Glassmorphism */}
      {isOpen && (
        <div className="fixed bottom-22 right-4 sm:right-6 z-50 w-[92vw] sm:w-[420px] h-[550px] max-h-[82vh] rounded-3xl glass-panel neon-border-purple shadow-2xl flex flex-col overflow-hidden animate-fadeIn backdrop-blur-2xl">
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 text-white flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-sm text-white leading-none">ParkPulse AI Assistant</h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-400/30">
                    Gemini 3.8 Flash
                  </span>
                </div>
                <p className="text-[11px] text-cyan-400 mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  Live Regional Network Connected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                title="Reset Chat"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs sm:text-sm bg-black/20">
            {messages.map(m => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-purple-900/40 border border-purple-500/40 text-purple-300 shrink-0 flex items-center justify-center mt-1">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-xs shadow-md font-medium border border-purple-400/30'
                      : 'glass-card border border-white/10 text-slate-100 rounded-tl-xs shadow-md'
                  }`}
                >
                  {renderFormattedText(m.content)}
                  <div
                    className={`text-[9px] mt-1.5 font-mono text-right ${
                      m.role === 'user' ? 'text-purple-200' : 'text-slate-400'
                    }`}
                  >
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {m.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-600/80 text-white shrink-0 flex items-center justify-center mt-1 font-bold text-xs shadow-xs">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-lg bg-purple-900/40 border border-purple-500/40 text-purple-300 shrink-0 flex items-center justify-center mt-1">
                  <Bot className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                </div>
                <div className="glass-card border border-white/10 rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-slate-300 flex items-center gap-2">
                  <span>PulseAI is consulting regional sensors</span>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 typing-dot-1" />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 typing-dot-2" />
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 typing-dot-3" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Quick Prompt Chips */}
          <div className="px-3 py-2 border-t border-white/5 bg-black/40 overflow-x-auto flex gap-1.5 scrollbar-none">
            {SUGGESTIONS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                className="px-2.5 py-1 text-[11px] rounded-lg glass-card text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 whitespace-nowrap transition-colors shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input & Send Form */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-black/60 border-t border-white/10 flex gap-2 items-center"
          >
            <input
              type="text"
              placeholder="Ask about 20 stations, slots, tariffs, QR..."
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              className="flex-1 px-3.5 py-2.5 text-xs rounded-xl glass-input placeholder-slate-400 focus:neon-border-purple"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2.5 rounded-xl btn-neon-gradient disabled:opacity-40 disabled:cursor-not-allowed shadow-md transition-all"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
