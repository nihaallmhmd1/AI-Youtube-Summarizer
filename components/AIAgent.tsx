'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Sparkles,
  ChevronDown,
  Maximize2,
  Minimize2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAgent() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Listen for transcript updates from the summarizer page
    const handleTranscriptUpdate = (e: any) => {
      if (e.detail?.transcript) {
        setTranscript(e.detail.transcript);
        setVideoTitle(e.detail.videoTitle || 'Current Video');
        // Clear previous messages when a new video is loaded
        setMessages([
          { role: 'assistant', content: `Hi! I've analyzed "${e.detail.videoTitle || 'the video'}". How can I help you understand it better?` }
        ]);
      }
    };

    window.addEventListener('update-video-context', handleTranscriptUpdate);
    return () => window.removeEventListener('update-video-context', handleTranscriptUpdate);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading || !transcript) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          transcript,
          videoTitle,
          history: messages
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to get AI response');

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  if (!transcript) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[200]">
      <AnimatePresence>
        {!isOpen ? (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 bg-emerald-600 dark:bg-emerald-500 text-white rounded-full shadow-2xl shadow-emerald-600/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/20 group-hover:opacity-100 opacity-0 transition-opacity" />
            <MessageSquare size={24} />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-[#0f140c] animate-bounce" />
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? '64px' : '500px',
              width: '380px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-white dark:bg-[#191e16] border border-emerald-100 dark:border-white/10 rounded-3xl shadow-[0_30px_90px_-15px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-emerald-600/[0.03] dark:bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-600/20">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#141e0f] dark:text-white uppercase tracking-tight">Video Agent</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Always Active</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 text-slate-400 hover:text-[#141e0f] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all"
                >
                  {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-full transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Container */}
                <div 
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/30 dark:bg-transparent"
                >
                  {messages.map((msg, idx) => (
                    <motion.div
                      initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-emerald-600 text-white rounded-tr-none' 
                          : 'bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 text-[#646e5a] dark:text-slate-300 rounded-tl-none'
                      }`}>
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest text-[9px]">
                            <Sparkles size={10} />
                            Insight Agent
                          </div>
                        )}
                        <div className="prose prose-sm dark:prose-invert prose-emerald max-w-none">
                          <ReactMarkdown>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 p-3.5 rounded-2xl rounded-tl-none text-slate-400 flex items-center gap-2 shadow-sm">
                        <Loader2 size={14} className="animate-spin text-emerald-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Thinking...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <form 
                  onSubmit={handleSend}
                  className="p-4 border-t border-slate-100 dark:border-white/5 bg-white/50 dark:bg-transparent"
                >
                  <div className="relative">
                    <input 
                      type="text" 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask AI about this video..." 
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-3.5 pl-4 pr-12 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all font-bold text-[#141e0f] dark:text-white"
                      disabled={loading}
                    />
                    <button 
                      type="submit"
                      disabled={!input.trim() || loading}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${
                        input.trim() && !loading 
                          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                          : 'text-slate-300 cursor-not-allowed'
                      }`}
                    >
                      <Send size={16} />
                    </button>
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Context: {videoTitle?.substring(0, 30)}...</p>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
