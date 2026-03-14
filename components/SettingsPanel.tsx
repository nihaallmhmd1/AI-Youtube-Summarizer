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
        className={`p-2 transition-all group rounded-xl ${isOpen ? 'bg-emerald-500/10 text-emerald-600' : 'text-[#646e5a] hover:text-[#141e0f] dark:text-slate-400 dark:hover:text-white'}`}
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
            className="absolute top-full right-0 mt-3 w-96 h-[600px] bg-white/95 dark:bg-[#191e16]/90 backdrop-blur-2xl border border-emerald-100 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[155] rounded-[2rem] flex flex-col overflow-hidden origin-top-right"
          >
            <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-transparent">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <Settings size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">System Settings</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Personalize Experience</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-400 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
              {configOptions.map((section) => (
                <div key={section.id} className="space-y-6">
                  <div className="flex items-center gap-3 text-[#646e5a] dark:text-slate-500">
                    <section.icon size={16} className="text-emerald-600" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{section.label}</span>
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
                            relative p-5 rounded-2xl border transition-all text-left flex items-center gap-4 group
                            ${section.current === option.id 
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-white shadow-lg shadow-emerald-500/5' 
                              : 'bg-slate-50 dark:bg-white/[0.02] border-slate-100 dark:border-white/5 text-[#646e5a] dark:text-slate-400 hover:border-emerald-500/20 hover:bg-slate-100 dark:hover:bg-white/5'}
                          `}
                        >
                          {'icon' in option && option.icon && (
                            <div className={`p-2.5 rounded-xl transition-colors ${section.current === option.id ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-200 dark:bg-white/5 text-slate-400'}`}>
                              <option.icon size={18} />
                            </div>
                          )}
                          <span className="text-xs font-bold tracking-tight flex-1">{option.label}</span>
                          {section.current === option.id && (
                            <div className="text-emerald-700 dark:text-emerald-400">
                              <Check size={16} strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01]">
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-xl shadow-emerald-500/20 active:scale-95 uppercase tracking-widest"
              >
                Save Preferences
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
