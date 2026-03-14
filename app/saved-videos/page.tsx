'use client';

import { useEffect, useState } from 'react';
import { createClientComponent } from '@/lib/supabase';
import { Summary } from '@/types';
import DashboardContainer from '@/components/DashboardContainer';
import { 
  Star, 
  ArrowRight, 
  Youtube, 
  Loader2
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function SavedVideosPage() {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponent();

  useEffect(() => {
    const fetchSaved = async () => {
      setLoading(true);
      // For now, since we don't have is_starred, we show all (effectively "Saved")
      const { data, error } = await supabase
        .from('summaries')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setSummaries(data);
      }
      setLoading(false);
    };

    fetchSaved();
  }, [supabase]);

  return (
    <DashboardContainer>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
            <Star size={24} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#111827] dark:text-white italic tracking-tighter uppercase">Saved Videos</h1>
            <p className="text-[#646e5a] dark:text-slate-400 font-medium tracking-tight">Your curated gallery of video intelligence.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="animate-spin w-12 h-12 mb-4 text-amber-500" />
            <p className="font-bold uppercase tracking-widest text-xs">Loading Favorites...</p>
          </div>
        ) : summaries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {summaries.map((summary) => (
              <Link 
                key={summary.id} 
                href={`/summarise?id=${summary.id}`}
                className="group bg-white dark:bg-[#191e16]/40 rounded-[2.5rem] border border-emerald-100 dark:border-white/5 overflow-hidden transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-500/10 shadow-sm relative"
              >
                <div className="aspect-video relative overflow-hidden">
                  <Image 
                    src={`https://img.youtube.com/vi/${summary.video_id}/maxresdefault.jpg`} 
                    alt={summary.video_title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 right-4 z-10 p-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/20 text-amber-400">
                    <Star size={16} fill="currentColor" />
                  </div>
                </div>

                <div className="p-8">
                  <h3 className="text-lg font-black text-[#111827] dark:text-white mb-4 italic tracking-tighter leading-tight line-clamp-2">
                    {summary.video_title}
                  </h3>
                  <div className="flex items-center gap-2 text-red-500 font-black uppercase tracking-widest text-[10px]">
                    <Youtube size={14} /> Open Summary
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white/50 dark:bg-white/5 border border-emerald-100 dark:border-white/10 rounded-[3rem] p-20 text-center space-y-6">
            <div className="w-20 h-20 bg-amber-500/10 rounded-[2rem] flex items-center justify-center mx-auto text-amber-500">
              <Star size={40} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#111827] dark:text-white italic uppercase tracking-tighter mb-2">No Saved Intelligence</h2>
              <p className="text-[#646e5a] dark:text-slate-400 font-medium max-w-sm mx-auto">Start starring your favorite summaries to see them here.</p>
            </div>
            <Link 
              href="/summarise"
              className="inline-flex items-center gap-2 bg-[#111827] dark:bg-amber-500 text-white dark:text-[#0a0a0a] px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs"
            >
              Browse Summarizer <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </DashboardContainer>
  );
}
