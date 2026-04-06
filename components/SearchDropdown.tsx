'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Youtube, ArrowRight, Loader2 } from 'lucide-react';
import { createClientComponent } from '@/lib/supabase';
import { Summary } from '@/types';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchDropdown() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const supabase = createClientComponent();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSearch = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('summaries')
        .select('*')
        .or(`video_title.ilike.%${query}%,summary.ilike.%${query}%`)
        .limit(5);

      if (error) {
        console.error('Search error:', error);
      } else {
        setResults(data || []);
      }
      setLoading(false);
    };

    const timeoutId = setTimeout(handleSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [query, supabase]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative group w-64 md:w-80" ref={dropdownRef}>
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
      </div>
      <input 
        type="text" 
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Search summaries..." 
        className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all shadow-inner text-slate-800 dark:text-white placeholder:text-slate-400"
      />

      <AnimatePresence>
        {isOpen && (query.trim() || loading) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-blue-100/50 dark:border-white/10 rounded-2xl p-2 shadow-lg z-[150] overflow-hidden"
          >
            {loading ? (
              <div className="px-4 py-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                <Loader2 size={24} className="animate-spin text-blue-500" />
                Searching...
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-1">
                <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                  Top Matches
                </div>
                {results.map((result) => (
                  <Link
                    key={result.id}
                    href={`/summarise?id=${result.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-all group"
                  >
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-slate-800 text-blue-600 shadow-sm">
                      <Youtube size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-slate-800 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                        {result.video_title}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {result.summary}
                      </div>
                    </div>
                    <ArrowRight size={12} className="text-slate-400 group-hover:text-blue-500 transition-colors self-center" />
                  </Link>
                ))}
              </div>
            ) : query.trim() ? (
              <div className="px-4 py-8 text-center text-xs text-slate-500">
                No summaries found for &quot;{query}&quot;
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
