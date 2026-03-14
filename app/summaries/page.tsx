'use client';

import { useEffect, useState } from 'react';
import { createClientComponent } from '@/lib/supabase';
import { Summary } from '@/types';
import DashboardContainer from '@/components/DashboardContainer';
import { 
  FileText, 
  Search, 
  Calendar, 
  ArrowRight, 
  Youtube, 
  Sparkles,
  Loader2,
  Trash2
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';

export default function SummariesPage() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const supabase = createClientComponent();

  useEffect(() => {
    const fetchSummaries = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('summaries')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setSummaries(data);
      }
      setLoading(false);
    };

    fetchSummaries();
  }, [supabase]);

  const filteredSummaries = summaries.filter((s: Summary) => 
    (s.video_title || s.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm('Are you sure you want to delete this summary?')) {
      const { error } = await supabase
        .from('summaries')
        .delete()
        .eq('id', id);

      if (!error) {
        setSummaries(summaries.filter(s => s.id !== id));
      }
    }
  };

  return (
    <DashboardContainer>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600">
                <FileText size={18} />
              </div>
              <h1 className="text-3xl font-black text-[#111827] dark:text-white italic tracking-tighter uppercase">My Summaries</h1>
            </div>
            <p className="text-[#646e5a] dark:text-slate-400 font-medium tracking-tight">Access your library of processed intelligence.</p>
          </div>

          <div className="relative group w-full md:w-80">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/50 dark:bg-white/5 border border-emerald-100 dark:border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="animate-spin w-12 h-12 mb-4 text-emerald-500" />
            <p className="font-bold uppercase tracking-widest text-xs">Accessing Vault...</p>
          </div>
        ) : filteredSummaries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSummaries.map((summary) => (
              <Link 
                key={summary.id} 
                href={`/?id=${summary.id}`}
                className="group bg-white dark:bg-[#191e16]/40 rounded-[2rem] border border-emerald-100 dark:border-white/5 overflow-hidden transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-emerald-900/10 shadow-sm relative"
              >
                <div className="aspect-video relative overflow-hidden">
                  <Image 
                    src={`https://img.youtube.com/vi/${summary.video_id}/maxresdefault.jpg`} 
                    alt={summary.video_title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white/90">
                    <Youtube size={14} className="text-red-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">YouTube Insight</span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-lg font-black text-[#111827] dark:text-white mb-4 italic tracking-tighter leading-tight line-clamp-2 h-14">
                    {summary.video_title}
                  </h3>
                  
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                      <Calendar size={12} className="text-emerald-500" />
                      {format(new Date(summary.created_at), 'MMM dd, yyyy')}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => handleDelete(summary.id, e)}
                        className="p-2 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white/50 dark:bg-white/5 border border-emerald-100 dark:border-white/10 rounded-[3rem] p-20 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-emerald-500">
              <Sparkles size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#111827] dark:text-white italic uppercase tracking-tighter mb-2">No Intelligence found</h2>
              <p className="text-[#646e5a] dark:text-slate-400 font-medium max-w-sm mx-auto">You haven&apos;t processed any videos yet. Start by pasting a YouTube link on the home page.</p>
            </div>
            <Link 
              href="/"
              className="inline-flex items-center gap-2 bg-[#111827] dark:bg-emerald-500 text-white dark:text-[#0a0a0a] px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl shadow-emerald-500/20"
            >
              Start Summarising <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </DashboardContainer>
  );
}
