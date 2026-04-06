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
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-100/50 shadow-sm">
            <Star size={20} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Saved Videos</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Your curated gallery of video intelligence.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="animate-spin w-10 h-10 mb-4 text-blue-500" />
            <p className="font-semibold uppercase tracking-wider text-[11px]">Loading Favorites...</p>
          </div>
        ) : summaries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {summaries.map((summary) => (
              <Link 
                key={summary.id} 
                href={`/summarise?id=${summary.id}`}
                className="group bg-white/60 dark:bg-slate-800/40 p-4 rounded-3xl border border-blue-100/50 dark:border-white/5 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-md shadow-sm relative backdrop-blur-xl"
              >
                <div className="aspect-video relative overflow-hidden rounded-2xl shadow-sm border border-slate-100/50 dark:border-white/5 mb-4 group-hover:scale-[1.02] transition-transform duration-500">
                  <Image 
                    src={`https://img.youtube.com/vi/${summary.video_id}/maxresdefault.jpg`} 
                    alt={summary.video_title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 right-3 z-10 p-1.5 bg-white/30 dark:bg-black/30 backdrop-blur-md rounded-lg border border-white/20 text-orange-400">
                    <Star size={14} fill="currentColor" />
                  </div>
                </div>

                <div className="px-2 pb-2">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2 tracking-tight leading-snug line-clamp-2">
                    {summary.video_title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider text-[11px]">
                    <Youtube size={14} /> Open Summary
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white/50 dark:bg-slate-800/40 border border-blue-100/50 dark:border-white/5 rounded-3xl p-16 text-center space-y-5 shadow-sm backdrop-blur-md">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto text-blue-500 border border-blue-100 dark:border-white/5 shadow-sm">
              <Star size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight mb-2">No Saved Intelligence</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm max-w-sm mx-auto">Start starring your favorite summaries to see them here.</p>
            </div>
            <Link 
              href="/summarise"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium text-sm shadow-sm hover:shadow hover:-translate-y-0.5 transition-all"
            >
              Browse Summarizer <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </DashboardContainer>
  );
}
