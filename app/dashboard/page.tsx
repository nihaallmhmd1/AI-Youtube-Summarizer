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
    <div className="bg-white dark:bg-[#191e16]/40 p-8 rounded-[2.5rem] border border-emerald-100 dark:border-white/5 shadow-sm relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-5 blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700`} />
      <div className="relative z-10">
        <div className={`p-3 rounded-2xl w-fit mb-6 ${color.replace('bg-', 'text-').replace('-500', '')} bg-emerald-500/10`}>
          <Icon size={24} />
        </div>
        <div className="text-3xl font-black text-[#111827] dark:text-white italic tracking-tighter mb-1">{value}</div>
        <div className="text-[10px] font-black uppercase tracking-widest text-[#646e5a] dark:text-slate-400">{label}</div>
      </div>
    </div>
  );

  return (
    <DashboardContainer>
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Welcome Section */}
        <div className="relative bg-[#111827] dark:bg-black rounded-[3rem] p-10 md:p-16 text-white overflow-hidden group shadow-2xl shadow-emerald-900/20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:scale-125 transition-transform duration-1000" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] -ml-32 -mb-32" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-6 border border-white/10">
                <Sparkles size={12} className="text-amber-400" />
                <span>AI Insights Dashboard</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase mb-6 leading-none">
                Elevate your <br />
                <span className="text-emerald-400">Knowledge.</span>
              </h1>
              <p className="text-slate-400 font-medium text-lg leading-relaxed mb-10">
                You&apos;ve saved over <span className="text-white font-black">{stats.totalTime} minutes</span> of watch time this month. Keep up the efficiency!
              </p>
              <Link 
                href="/"
                className="inline-flex items-center gap-3 bg-white text-black px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl shadow-white/10"
              >
                New Summary <Zap size={16} fill="currentColor" />
              </Link>
            </div>

            <div className="hidden lg:block relative">
              <div className="w-64 h-64 bg-emerald-500/20 rounded-[3rem] border border-white/10 flex items-center justify-center backdrop-blur-3xl transform rotate-6 animate-pulse">
                <Youtube size={80} className="text-emerald-400 opacity-50" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={LayoutDashboard} label="Total Intelligence" value={stats.total} color="bg-emerald-500" />
          <StatCard icon={TrendingUp} label="This Month" value={`+${stats.thisMonth}`} color="bg-teal-500" />
          <StatCard icon={StarIcon} label="Starred Reports" value={stats.starred} color="bg-amber-500" />
          <StatCard icon={Clock} label="Time Saved (Min)" value={stats.totalTime} color="bg-blue-500" />
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-[#111827] dark:text-white italic uppercase tracking-tighter">Recent Intelligence</h2>
            <Link href="/summaries" className="group flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest text-[10px] hover:text-emerald-500 transition-all">
              View All <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-64 bg-white/50 dark:bg-white/5 border border-emerald-100 rounded-[2rem] animate-pulse" />
              ))
            ) : recentSummaries.length > 0 ? (
              recentSummaries.map((summary) => (
                <Link 
                  key={summary.id} 
                  href={`/?id=${summary.id}`}
                  className="group bg-white dark:bg-[#191e16]/40 p-6 rounded-[2.5rem] border border-emerald-100 dark:border-white/5 transition-all hover:scale-[1.02] hover:shadow-2xl shadow-sm"
                >
                  <div className="aspect-video relative rounded-2xl overflow-hidden mb-6">
                    <Image 
                      src={`https://img.youtube.com/vi/${summary.video_id}/maxresdefault.jpg`} 
                      alt={summary.video_title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="p-3 bg-white rounded-full text-black transform scale-0 group-hover:scale-100 transition-transform duration-500">
                        <ArrowRight size={20} />
                      </div>
                    </div>
                  </div>
                  <h3 className="font-black text-[#111827] dark:text-white mb-2 line-clamp-1 italic tracking-tight uppercase text-sm">
                    {summary.video_title}
                  </h3>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {format(new Date(summary.created_at), 'MMM dd, yyyy')}
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-10 text-center text-slate-400">No activity yet.</div>
            )}
          </div>
        </div>
      </div>
    </DashboardContainer>
  );
}
