'use client';

import { useEffect, useState } from 'react';
import { createClientComponent } from '@/lib/supabase';
import { Summary } from '@/types';
import DashboardContainer from '@/components/DashboardContainer';
import { 
  History as HistoryIcon, 
  ArrowRight, 
  Loader2,
  Clock
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';

export default function HistoryPage() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponent();

  useEffect(() => {
    const fetchHistory = async () => {
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

    fetchHistory();
  }, [supabase]);

  return (
    <DashboardContainer>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-100/50 shadow-sm">
            <HistoryIcon size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Activity History</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Timeline of your intellectual processing.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="animate-spin w-10 h-10 mb-4 text-blue-500" />
            <p className="font-semibold uppercase tracking-wider text-[11px]">Loading Timeline...</p>
          </div>
        ) : summaries.length > 0 ? (
          <div className="space-y-4">
            {summaries.map((summary) => (
              <Link 
                key={summary.id} 
                href={`/summarise?id=${summary.id}`}
                className="group flex flex-col md:flex-row items-center gap-5 bg-white/60 dark:bg-slate-800/40 p-4 rounded-3xl border border-blue-100/50 dark:border-white/5 transition-all hover:-translate-y-0.5 hover:shadow-md shadow-sm backdrop-blur-xl"
              >
                <div className="w-full md:w-36 aspect-video relative rounded-2xl overflow-hidden shrink-0 shadow-sm border border-slate-100/50 dark:border-white/5 group-hover:scale-[1.02] transition-transform duration-500">
                  <Image 
                    src={`https://img.youtube.com/vi/${summary.video_id}/maxresdefault.jpg`} 
                    alt={summary.video_title}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 pr-2">
                  <h3 className="font-bold text-slate-800 dark:text-white mb-1.5 tracking-tight line-clamp-1">
                    {summary.video_title}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <Clock size={12} className="text-blue-500" />
                      {format(new Date(summary.created_at), 'MMM dd, yyyy · HH:mm')}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-slate-700/50 rounded-xl text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm mr-2">
                  <ArrowRight size={16} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white/50 dark:bg-slate-800/40 border border-blue-100/50 dark:border-white/5 rounded-3xl p-16 text-center space-y-5 shadow-sm backdrop-blur-md">
             <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto text-blue-500 border border-blue-100 dark:border-white/5 shadow-sm">
              <HistoryIcon size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight mb-2">No History Yet</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm max-w-sm mx-auto">Start your intelligence gathering journey today.</p>
            </div>
          </div>
        )}
      </div>
    </DashboardContainer>
  );
}
