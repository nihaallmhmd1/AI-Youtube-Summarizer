'use client';

import { 
  LayoutDashboard, 
  Youtube, 
  History, 
  User, 
  LogOut,
  ChevronRight,
  Sparkles,
  Star
} from 'lucide-react';
import { createClientComponent } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Youtube, label: 'YouTube Summariser', href: '/summarise' },
  { icon: Star, label: 'Saved Videos', href: '/saved-videos' },
  { icon: History, label: 'History', href: '/history' },
  { icon: User, label: 'Profile', href: '/profile' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponent();

  const handleLogout = async () => {
    try {
      // First, sign out on the client
      await supabase.auth.signOut();
      
      // Then, call the server-side logout to clear cookies
      await fetch('/auth/logout', { method: 'POST' });
      
      // Force a full page reload to the home page to clear all state
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: just redirect
      window.location.href = '/';
    }
  };

  return (
    <aside className="w-80 border-r border-[#d4e6b5] dark:border-white/5 bg-[#fdfcf0]/80 dark:bg-[#0f140c]/60 backdrop-blur-2xl relative z-20 flex flex-col h-screen flex-shrink-0 transition-colors duration-300 shadow-xl shadow-emerald-900/5">
      <div className="p-10">
        <div className="flex items-center gap-3 mb-10 group">
          <div className="bg-gradient-to-tr from-emerald-500 to-teal-600 p-2.5 rounded-xl text-white shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-500">
            <Youtube size={26} />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-[#141e0f] dark:text-white block italic">AI Summariser</span>
            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 tracking-[0.2em] uppercase">Premium SaaS</span>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group relative border",
                  isActive 
                    ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:bg-white/5 dark:text-white dark:border-white/10 shadow-lg shadow-emerald-500/5 dark:shadow-[0_0_20px_rgba(255,255,255,0.05)]" 
                    : "text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-white hover:bg-emerald-50/50 dark:hover:bg-white/5 border-transparent"
                )}
              >
                <div className="flex items-center gap-4">
                  <item.icon size={20} className={cn("transition-colors duration-300", isActive ? "text-emerald-600 dark:text-emerald-400" : "group-hover:text-emerald-600 dark:group-hover:text-emerald-400")} />
                  <span className="font-bold text-sm">{item.label}</span>
                </div>
                {isActive && (
                  <div className="absolute left-[-2.5rem] w-1.5 h-8 bg-emerald-500 rounded-full blur-[2px]" />
                )}
                <ChevronRight 
                  size={16} 
                  className={cn(
                    "transition-all duration-300", 
                    isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                  )} 
                />
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-8 space-y-6">
        <div className="bg-gradient-to-br from-emerald-600/[0.05] to-teal-600/[0.05] dark:from-emerald-600/5 dark:to-teal-600/5 border border-emerald-500/10 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 blur-[40px] rounded-full group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10 flex items-center gap-3 mb-4">
            <Sparkles size={18} className="text-amber-500 dark:text-amber-400" />
            <span className="text-xs font-black text-[#111827] dark:text-white uppercase tracking-wider">Upgrade Pro</span>
          </div>
          <p className="text-[11px] font-medium text-slate-500 mb-5 relative z-10 leading-relaxed">Get unlimited summaries & 4K processing.</p>
          <Link href="/dashboard/pricing" className="w-full block">
            <button className="w-full bg-emerald-700 hover:bg-emerald-600 dark:bg-white/5 dark:hover:bg-white/10 border border-emerald-500/20 dark:border-white/10 text-white text-[11px] font-black py-3 rounded-xl transition-all relative z-10 uppercase tracking-widest shadow-xl shadow-emerald-600/20 dark:shadow-none">
              View Pricing
            </button>
          </Link>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 p-4 text-slate-500 dark:text-slate-400 hover:text-rose-500 rounded-2xl transition-all duration-300 hover:bg-rose-500/5 group"
        >
          <div className="bg-slate-100 dark:bg-white/5 p-2.5 rounded-xl group-hover:bg-rose-500/10 transition-colors">
            <LogOut size={18} />
          </div>
          <span className="font-bold text-xs uppercase tracking-widest">Logout Session</span>
        </button>
      </div>
    </aside>
  );
}
