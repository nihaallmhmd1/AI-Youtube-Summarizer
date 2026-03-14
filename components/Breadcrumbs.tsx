'use client';

import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import ToolsDropdown from './ToolsDropdown';

export default function Breadcrumbs() {
  return (
    <nav className="flex items-center gap-4 text-sm mb-8 animate-in fade-in slide-in-from-left-4 duration-500">
      <Link 
        href="/dashboard" 
        className="bg-emerald-500/10 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-emerald-500/20 dark:hover:bg-emerald-600/30 transition-all font-medium"
      >
        <Home size={14} />
        Home
      </Link>
      <ChevronRight size={16} className="text-slate-400 dark:text-slate-600" />
      <div className="flex items-center gap-2">
        <div className="bg-emerald-500/10 dark:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-lg font-medium whitespace-nowrap">
          Video Summarizer
        </div>
        <ToolsDropdown />
      </div>
    </nav>
  );
}
