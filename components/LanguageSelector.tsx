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
        className="flex items-center gap-2.5 px-3 md:px-4 h-10 md:h-12 rounded-xl bg-white/70 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-white/10 hover:border-blue-300 dark:hover:border-slate-500 transition-all group shadow-sm text-slate-700 dark:text-slate-200"
      >
        <span className="text-xl leading-none shadow-sm drop-shadow-sm">{selectedLang.flag}</span>
        <span className="text-[11px] font-semibold uppercase tracking-wider hidden sm:inline-block">{selectedLang.id}</span>
        <ChevronDown size={14} className={`text-slate-400 group-hover:text-blue-500 transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -5 }}
            className="absolute top-full mt-2 right-0 w-52 bg-white/95 dark:bg-slate-900/95 border border-blue-100/50 dark:border-white/10 rounded-2xl shadow-lg z-40 overflow-hidden origin-top-right backdrop-blur-xl"
          >
            <div className="p-3 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/30">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Target Localization</span>
            </div>
            <div className="max-h-72 overflow-y-auto custom-scrollbar p-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    onChange(lang.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${value === lang.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg drop-shadow-sm shadow-sm">{lang.flag}</span>
                    <span className="text-xs tracking-tight">{lang.label}</span>
                  </div>
                  {value === lang.id && (
                    <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-sm">
                      <Check size={10} strokeWidth={4} />
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
