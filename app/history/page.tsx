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
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-teal-500/10 rounded-2xl text-teal-600">
            <HistoryIcon size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#111827] dark:text-white italic tracking-tighter uppercase">Activity History</h1>
            <p className="text-[#646e5a] dark:text-slate-400 font-medium tracking-tight">Timeline of your intellectual processing.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="animate-spin w-12 h-12 mb-4 text-teal-500" />
            <p className="font-bold uppercase tracking-widest text-xs">Loading Timeline...</p>
          </div>
        ) : summaries.length > 0 ? (
          <div className="space-y-4">
            {summaries.map((summary) => (
              <Link 
                key={summary.id} 
                href={`/?id=${summary.id}`}
                className="group flex flex-col md:flex-row items-center gap-6 bg-white dark:bg-[#191e16]/40 p-4 rounded-[1.5rem] border border-emerald-100 dark:border-white/5 transition-all hover:bg-emerald-50 dark:hover:bg-white/5 shadow-sm"
              >
                <div className="w-full md:w-32 aspect-video relative rounded-xl overflow-hidden shrink-0">
                  <Image 
                    src={`https://img.youtube.com/vi/${summary.video_id}/maxresdefault.jpg`} 
                    alt={summary.video_title}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="flex-1">
                  <h3 className="font-black text-[#111827] dark:text-white mb-2 italic tracking-tight uppercase line-clamp-1">
                    {summary.video_title}
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#646e5a] dark:text-slate-400">
                      <Clock size={12} className="text-teal-500" />
                      {format(new Date(summary.created_at), 'MMM dd, yyyy · HH:mm')}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-white/5 rounded-xl text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                  <ArrowRight size={18} />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white/50 dark:bg-white/5 border border-emerald-100 dark:border-white/10 rounded-[3rem] p-20 text-center space-y-6">
             <div className="w-20 h-20 bg-teal-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-teal-600">
              <HistoryIcon size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#111827] dark:text-white italic uppercase tracking-tighter mb-2">No History Yet</h2>
              <p className="text-[#646e5a] dark:text-slate-400 font-medium max-w-sm mx-auto">Start your intelligence gathering journey today.</p>
            </div>
          </div>
        )}
      </div>
    </DashboardContainer>
  );
}
