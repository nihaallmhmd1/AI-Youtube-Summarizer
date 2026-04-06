'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Globe } from 'lucide-react';
import GlassDropdown from './GlassDropdown';

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

  const dropdownOptions = LANGUAGES.map(lang => ({
    id: lang.id,
    label: lang.label,
    icon: lang.flag
  }));

  return (
    <GlassDropdown
      options={dropdownOptions}
      value={value}
      onChange={onChange}
      icon={Globe}
      width="w-full sm:w-44"
      label="Target Localization"
    />
  );
}
