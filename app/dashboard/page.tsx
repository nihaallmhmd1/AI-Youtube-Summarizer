'use client';

import { useEffect, useState } from 'react';
import { createClientComponent } from '@/lib/supabase';
import { Summary } from '@/types';
import DashboardContainer from '@/components/DashboardContainer';
import { 
  LayoutDashboard, 
  Sparkles, 
  Clock, 
  TrendingUp, 
  Youtube, 
  ChevronRight,
  Zap,
  Star as StarIcon,
  ArrowRight
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    starred: 0,
    totalTime: 0
  });
  const [recentSummaries, setRecentSummaries] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponent();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('summaries')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRecentSummaries(data.slice(0, 5));
        
        // Calculate stats
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        setStats({
          total: data.length,
          thisMonth: data.filter((s: Summary) => new Date(s.created_at) >= firstDayOfMonth).length,
          starred: data.filter((s: Summary & { is_starred?: boolean }) => s.is_starred).length, // Typed check
          totalTime: data.length * 15 // Mock time saved
        });
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, [supabase]);

  const StatCard = ({ icon: Icon, label, value, color }: { icon: React.ElementType, label: string, value: string | number, color: string }) => (
    <div className="bg-white/60 dark:bg-slate-800/40 p-6 rounded-3xl border border-blue-100/50 dark:border-white/5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-10 blur-3xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700`} />
      <div className="relative z-10">
        <div className={`p-2.5 rounded-xl w-fit mb-4 ${color.replace('bg-', 'text-')} bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-white/5`}>
          <Icon size={20} />
        </div>
        <div className="text-2xl font-bold text-slate-800 dark:text-white mb-1 tracking-tight">{value}</div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</div>
      </div>
    </div>
  );

  return (
    <DashboardContainer>
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Welcome Section */}
        <div className="relative bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-blue-200/40 dark:border-white/10 rounded-3xl p-8 md:p-12 overflow-hidden group shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400/10 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-1000" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/10 rounded-full blur-[80px] -ml-20 -mb-20" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-4 border border-blue-100 dark:border-blue-800/30 text-blue-600 dark:text-blue-400">
                <Sparkles size={12} className="text-blue-500" />
                <span>AI Insights Dashboard</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-800 dark:text-white mb-3">
                Elevate your <span className="text-blue-600 dark:text-blue-400">Knowledge.</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm md:text-base leading-relaxed mb-8">
                You've saved over <span className="text-slate-800 dark:text-white font-semibold">{stats.totalTime} minutes</span> of watch time this month. Keep up the efficiency!
              </p>
              <Link 
                href="/summarise"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                New Summary <Zap size={16} />
              </Link>
            </div>

            <div className="hidden lg:block relative">
              <div className="w-48 h-48 bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-blue-100/50 dark:border-white/10 flex items-center justify-center backdrop-blur-md shadow-sm transform rotate-3 group-hover:rotate-6 transition-transform duration-500">
                <Youtube size={64} className="text-blue-500/80" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard icon={LayoutDashboard} label="Total Intelligence" value={stats.total} color="bg-blue-500 text-blue-500" />
          <StatCard icon={TrendingUp} label="This Month" value={`+${stats.thisMonth}`} color="bg-indigo-500 text-indigo-500" />
          <StatCard icon={StarIcon} label="Starred Reports" value={stats.starred} color="bg-cyan-500 text-cyan-500" />
          <StatCard icon={Clock} label="Time Saved (Min)" value={stats.totalTime} color="bg-blue-400 text-blue-400" />
        </div>

        {/* Recent Activity */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Recent Intelligence</h2>
            <Link href="/history" className="group flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold text-xs hover:text-blue-700 transition-all">
              View All <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-48 bg-white/60 dark:bg-slate-800/40 border border-blue-100/50 dark:border-white/5 rounded-2xl animate-pulse" />
              ))
            ) : recentSummaries.length > 0 ? (
              recentSummaries.map((summary) => (
                <Link 
                  key={summary.id} 
                  href={`/summarise?id=${summary.id}`}
                  className="group bg-white/60 dark:bg-slate-800/40 p-5 rounded-2xl border border-blue-100/50 dark:border-white/5 transition-all hover:-translate-y-1 hover:shadow-md shadow-sm"
                >
                  <div className="aspect-video relative rounded-xl overflow-hidden mb-4 shadow-sm border border-slate-100/50 dark:border-white/5">
                    <Image 
                      src={`https://img.youtube.com/vi/${summary.video_id}/maxresdefault.jpg`} 
                      alt={summary.video_title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <div className="p-2.5 bg-blue-600 rounded-full text-white transform scale-0 group-hover:scale-100 transition-transform duration-500 shadow-lg">
                        <ArrowRight size={18} />
                      </div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-white mb-1.5 line-clamp-1 tracking-tight text-sm">
                    {summary.video_title}
                  </h3>
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    {format(new Date(summary.created_at), 'MMM dd, yyyy')}
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-10 text-center text-slate-400 text-sm">No activity yet.</div>
            )}
          </div>
        </div>
      </div>
    </DashboardContainer>
  );
}
