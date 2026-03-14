'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';

export const LANGUAGES = [
  { id: 'English', label: 'English', flag: '🇺🇸' },
  { id: 'Spanish', label: 'Spanish', flag: '🇪🇸' },
  { id: 'French', label: 'French', flag: '🇫🇷' },
  { id: 'German', label: 'German', flag: '🇩🇪' },
  { id: 'Italian', label: 'Italian', flag: '🇮🇹' },
  { id: 'Portuguese', label: 'Portuguese', flag: '🇵🇹' },
  { id: 'Arabic', label: 'Arabic', flag: '🇸🇦' },
  { id: 'Chinese', label: 'Chinese', flag: '🇨🇳' },
  { id: 'Japanese', label: 'Japanese', flag: '🇯🇵' },
  { id: 'Korean', label: 'Korean', flag: '🇰🇷' },
  { id: 'Malayalam', label: 'Malayalam', flag: '🇮🇳' },
  { id: 'Hindi', label: 'Hindi', flag: '🇮🇳' }
];

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  variant?: 'inline' | 'compact';
}

export default function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedLang = LANGUAGES.find(l => l.id === value) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative h-full flex items-center" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-4 h-[46px] rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-500/30 transition-all group shadow-inner"
      >
        <span className="text-xl leading-none">{selectedLang.flag}</span>
        <span className="text-[11px] font-black uppercase tracking-widest text-[#646e5a] dark:text-slate-400">{selectedLang.id}</span>
        <ChevronDown size={14} className={`text-slate-400 group-hover:text-emerald-500 transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            className="absolute top-full mt-3 right-0 w-52 bg-white dark:bg-[#191e16] border border-emerald-100 dark:border-white/10 rounded-[1.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] z-40 overflow-hidden origin-top-right backdrop-blur-xl"
          >
            <div className="p-3 border-b border-slate-50 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.02]">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Target Localization</span>
            </div>
            <div className="max-h-72 overflow-y-auto custom-scrollbar p-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    onChange(lang.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${value === lang.id ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-[#646e5a] dark:text-slate-300'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{lang.flag}</span>
                    <span className="text-xs font-bold tracking-tight">{lang.label}</span>
                  </div>
                  {value === lang.id && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                      <Check size={12} strokeWidth={4} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
