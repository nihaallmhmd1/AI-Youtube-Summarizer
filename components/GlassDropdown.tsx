'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropdownOption {
  id: string;
  label: string;
  icon?: LucideIcon | string; // string for flags
}

interface GlassDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  icon?: LucideIcon;
  width?: string;
  label?: string;
}

export default function GlassDropdown({ 
  options, 
  value, 
  onChange, 
  placeholder,
  icon: Icon,
  width = 'w-64',
  label
}: GlassDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(o => o.id === value) || options[0];

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
    <div className={cn("relative", width)} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className={cn(
          "flex items-center justify-between w-full h-11 px-4 rounded-xl transition-all duration-300 group",
          "bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/50 dark:border-white/10",
          "hover:border-blue-300 dark:hover:border-blue-500/50 hover:shadow-md shadow-sm",
          isOpen ? "ring-2 ring-blue-500/20 border-blue-400" : ""
        )}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {Icon && <Icon size={14} className="text-blue-500 shrink-0" />}
          {typeof selectedOption.icon === 'string' && (
            <span className="text-lg leading-none shrink-0">{selectedOption.icon}</span>
          )}
          {typeof selectedOption.icon !== 'string' && selectedOption.icon && (
            <selectedOption.icon size={14} className="text-blue-500 shrink-0" />
          )}
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 truncate">
            {selectedOption.label || placeholder}
          </span>
        </div>
        <ChevronDown 
          size={14} 
          className={cn(
            "text-slate-400 group-hover:text-blue-500 transition-all duration-300 shrink-0",
            isOpen ? "rotate-180" : ""
          )} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={cn(
              "absolute top-full mt-2 left-0 right-0 p-1.5 z-[100] origin-top",
              "bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-blue-100/50 dark:border-white/10 rounded-2xl shadow-2xl"
            )}
          >
            {label && (
              <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 mb-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
              </div>
            )}
            <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-1">
              {options.map((option) => {
                const isActive = value === option.id;
                return (
                  <button
                    key={option.id}
                    onClick={() => {
                      onChange(option.id);
                      setIsOpen(false);
                    }}
                    type="button"
                    className={cn(
                      "w-full flex items-center justify-between p-2.5 rounded-xl transition-all duration-200 group/item",
                      isActive 
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" 
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {typeof option.icon === 'string' && (
                        <span className="text-lg leading-none shrink-0 drop-shadow-sm">{option.icon}</span>
                      )}
                      {typeof option.icon !== 'string' && option.icon && (
                        <option.icon size={14} className={cn("shrink-0", isActive ? "text-blue-600" : "text-slate-400 group-hover/item:text-blue-500")} />
                      )}
                      <span className={cn(
                        "text-[11px] font-bold uppercase tracking-wider truncate",
                        isActive ? "font-bold" : "font-semibold"
                      )}>
                        {option.label}
                      </span>
                    </div>
                    {isActive && (
                      <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-sm shrink-0">
                        <Check size={10} strokeWidth={4} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
