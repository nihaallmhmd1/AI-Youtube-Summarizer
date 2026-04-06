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
    <aside className="w-64 border-r border-blue-50/50 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md relative z-20 flex flex-col h-screen flex-shrink-0 transition-colors duration-300 shadow-[2px_0_8px_rgba(0,0,0,0.02)] dark:shadow-none">
      <div className="p-6">
        <div className="flex items-center gap-2.5 mb-8 group cursor-pointer">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300 ease-out">
            <Youtube size={20} />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-800 dark:text-white block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">AI Summariser</span>
          </div>
        </div>

        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl transition-all duration-300 group relative border",
                  isActive 
                    ? "bg-white/60 text-blue-600 border-blue-100/50 dark:bg-white/10 dark:text-blue-400 dark:border-white/10 shadow-sm" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white/40 dark:hover:bg-white/5 border-transparent"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} className={cn("transition-colors duration-300", isActive ? "text-blue-600 dark:text-blue-400" : "group-hover:text-blue-500 dark:group-hover:text-blue-400")} />
                  <span className="font-semibold text-[13px]">{item.label}</span>
                </div>
                <ChevronRight 
                  size={14} 
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

      <div className="mt-auto p-6 space-y-4">
        <div className="bg-white/60 dark:bg-slate-800/50 border border-blue-100/50 dark:border-white/10 rounded-2xl p-4 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-100/50 dark:bg-blue-900/20 blur-2xl rounded-full group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10 flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-blue-600 dark:text-blue-400" />
            <span className="text-[11px] font-bold text-slate-800 dark:text-white uppercase tracking-wider">Upgrade Pro</span>
          </div>
          <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-4 relative z-10 leading-relaxed">Unlimited summaries & 4K processing.</p>
          <Link href="/dashboard/pricing" className="w-full block">
            <button className="w-full bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-semibold py-2 rounded-xl transition-all relative z-10 tracking-widest shadow-sm hover:shadow hover:-translate-y-0.5">
              VIEW PRICING
            </button>
          </Link>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-3 text-slate-500 dark:text-slate-400 hover:text-red-600 rounded-xl transition-all duration-300 hover:bg-white/60 dark:hover:bg-red-500/10 group border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
        >
          <div className="bg-white/50 dark:bg-slate-800 p-2 rounded-lg group-hover:bg-red-50 dark:group-hover:bg-red-500/20 transition-colors shadow-sm">
            <LogOut size={16} />
          </div>
          <span className="font-semibold text-[11px] uppercase tracking-wider">Logout</span>
        </button>
      </div>
    </aside>
  );
}
