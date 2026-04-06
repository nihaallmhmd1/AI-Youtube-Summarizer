'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  FileText, 
  ListOrdered, 
  Clock, 
  BookOpen, 
  ChevronDown 
} from 'lucide-react';

export type ToolMode = 'detailed_summary' | 'points_oriented' | 'timestamped_highlights' | 'reading_mode';

interface ToolOption {
  id: ToolMode;
  label: string;
  description: string;
  icon: typeof FileText;
  color: string;
}

const toolOptions: ToolOption[] = [
  {
    id: 'detailed_summary',
    label: 'Detailed Summary',
    description: 'Complete and deep explanation of the video content.',
    icon: FileText,
    color: 'text-blue-400'
  },
  {
    id: 'points_oriented',
    label: 'Points Oriented',
    description: 'Concise bullet-points for easy readability.',
    icon: ListOrdered,
    color: 'text-emerald-400'
  },
  {
    id: 'timestamped_highlights',
    label: 'Timestamped Highlights',
    description: 'Important moments with their exact timestamps.',
    icon: Clock,
    color: 'text-amber-400'
  },
  {
    id: 'reading_mode',
    label: 'Reading Mode',
    description: 'Convert video into a well-structured article.',
    icon: BookOpen,
    color: 'text-emerald-400'
  }
];

export default function ToolsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if tools should be visible (e.g. from local storage or session)
    const hasSummary = localStorage.getItem('hasGeneratedSummary') === 'true';
    if (hasSummary) setIsVisible(true);

    const handleShowTools = () => {
      setIsVisible(true);
      localStorage.setItem('hasGeneratedSummary', 'true');
    };

    window.addEventListener('show-tools', handleShowTools);
    return () => window.removeEventListener('show-tools', handleShowTools);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToolSelect = (mode: ToolMode) => {
    // Dispatch a custom event for the summariser page to listen to
    window.dispatchEvent(new CustomEvent('generate-tool-content', { detail: { mode } }));
    setIsOpen(false);
  };

  if (!isVisible) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-50/80 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors font-medium text-sm border border-blue-200/50 dark:border-white/5 shadow-sm"
      >
        <Sparkles size={14} className="text-blue-500 dark:text-blue-400" />
        AI Tools
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full right-0 mt-2 w-72 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-2 border border-blue-100/50 dark:border-white/10 rounded-2xl shadow-lg z-[150] overflow-hidden"
          >
            <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              AI Powered Tools
            </div>
            <div className="space-y-1">
              {toolOptions.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleToolSelect(tool.id)}
                  className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-all text-left group"
                >
                  <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 ${tool.color.replace('emerald', 'blue').replace('amber', 'indigo')} transition-colors shadow-sm`}>
                    <tool.icon size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {tool.label}
                    </div>
                    <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                      {tool.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
