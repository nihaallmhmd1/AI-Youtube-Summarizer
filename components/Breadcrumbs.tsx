'use client';

import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import ToolsDropdown from './ToolsDropdown';

export default function Breadcrumbs() {
  return (
    <nav className="flex items-center gap-2 md:gap-3 text-sm mb-6 animate-in fade-in slide-in-from-left-4 duration-500">
      <Link 
        href="/dashboard" 
        className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors font-medium border border-blue-100 dark:border-blue-800/30 shadow-sm text-xs md:text-sm"
      >
        <Home size={14} />
        <span className="hidden sm:inline">Home</span>
      </Link>
      <ChevronRight size={14} className="text-slate-400 dark:text-slate-600 shrink-0" />
      <div className="flex items-center gap-2">
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/50 dark:border-white/10 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap shadow-sm text-xs md:text-sm tracking-tight">
          Video Summarizer
        </div>
        <ToolsDropdown />
      </div>
    </nav>
  );
}
