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
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-[#646e5a] group-focus-within:text-emerald-500 transition-colors">
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
        className="bg-[#f0f4e6]/50 dark:bg-white/5 border border-emerald-100/50 dark:border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm w-full focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-[#141e0f] dark:text-white"
      />

      <AnimatePresence>
        {isOpen && (query.trim() || loading) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-[#191e16] border border-emerald-100 dark:border-white/10 rounded-2xl p-2 shadow-2xl z-[150] overflow-hidden"
          >
            {loading ? (
              <div className="px-4 py-8 text-center text-xs text-[#646e5a] flex flex-col items-center gap-2">
                <Loader2 size={24} className="animate-spin text-emerald-500" />
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
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f0f4e6] dark:hover:bg-white/5 transition-all group"
                  >
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                      <Youtube size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[#141e0f] dark:text-white truncate group-hover:text-emerald-700 transition-colors">
                        {result.video_title}
                      </div>
                      <div className="text-[10px] text-[#646e5a] dark:text-slate-500 truncate mt-0.5">
                        {result.summary}
                      </div>
                    </div>
                    <ArrowRight size={12} className="text-slate-600 group-hover:text-white transition-colors self-center" />
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
