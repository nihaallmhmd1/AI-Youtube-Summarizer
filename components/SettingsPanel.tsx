'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  X, 
  Moon, 
  Globe, 
  Download, 
  Check, 
  Palette
} from 'lucide-react';
import LanguageSelector from './LanguageSelector';

export default function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [language, setLanguage] = useState('English');
  const [exportFormat, setExportFormat] = useState('pdf');
  
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load preferences from localStorage
    const savedLanguage = localStorage.getItem('language') || 'English';
    setLanguage(savedLanguage);
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
    // Custom event to notify other components if needed
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: newLang } }));
  };

  const configOptions = [
    {
      id: 'theme',
      label: 'Theme Preference',
      icon: Palette,
      options: [
        { id: 'dark', label: 'Dark Mode', icon: Moon }
      ],
      current: theme,
      setter: handleThemeChange
    },
    {
      id: 'language',
      label: 'System Language',
      icon: Globe,
      type: 'custom',
      render: () => (
        <LanguageSelector value={language} onChange={handleLanguageChange} variant="compact" />
      ),
      current: language,
      setter: handleLanguageChange
    },
    {
      id: 'format',
      label: 'Export Format',
      icon: Download,
      options: [
        { id: 'pdf', label: 'PDF Document' },
        { id: 'txt', label: 'Text File' }
      ],
      current: exportFormat,
      setter: setExportFormat
    }
  ];

  return (
    <div className="relative" ref={panelRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 transition-all group rounded-xl ${isOpen ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'}`}
      >
        <Settings size={20} className={`${isOpen ? 'rotate-90' : 'group-hover:rotate-45'} transition-transform duration-500`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 15, scale: 0.95, filter: 'blur(10px)' }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="absolute top-full right-0 mt-3 w-96 h-[600px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-blue-100/50 dark:border-white/10 shadow-xl z-[155] rounded-3xl flex flex-col overflow-hidden origin-top-right"
          >
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-transparent">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 shadow-sm">
                  <Settings size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">System Settings</h2>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Personalize Experience</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all shadow-sm"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              {configOptions.map((section) => (
                <div key={section.id} className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-500">
                    <section.icon size={16} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider">{section.label}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {section.type === 'custom' ? (
                      section.render()
                    ) : (
                      section.options?.map((option: { id: string; label: string; icon?: React.ElementType }) => (
                        <button
                          key={option.id}
                          onClick={() => section.setter(option.id)}
                          className={`
                            relative p-4 rounded-xl transition-all text-left flex items-center gap-4 group shadow-sm backdrop-blur-md border border-slate-100 dark:border-slate-800
                            ${section.current === option.id 
                              ? 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-800/30 text-blue-700 dark:text-blue-400' 
                              : 'bg-white/80 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-blue-200/50 hover:bg-slate-50 dark:hover:bg-slate-800/80'}
                          `}
                        >
                          {'icon' in option && option.icon && (
                            <div className={`p-2.5 rounded-xl transition-colors ${section.current === option.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 group-hover:text-blue-500'}`}>
                              <option.icon size={18} />
                            </div>
                          )}
                          <span className="text-sm font-semibold tracking-tight flex-1">{option.label}</span>
                          {section.current === option.id && (
                            <div className="text-blue-600 dark:text-blue-400 pr-2">
                              <Check size={18} strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-md">
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm hover:shadow hover:-translate-y-0.5 outline-none flex items-center justify-center uppercase tracking-wider relative overflow-hidden group/btn"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                Save Preferences
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
