'use client';

import Sidebar from '@/components/Sidebar';
import ToolsDropdown from '@/components/ToolsDropdown';
import SearchDropdown from '@/components/SearchDropdown';
import NotificationDropdown from '@/components/NotificationDropdown';
import ProfileDropdown from '@/components/ProfileDropdown';
import SettingsPanel from '@/components/SettingsPanel';
import Link from 'next/link';
import { createClientComponent } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

export default function DashboardContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClientComponent();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#f8fbff] via-[#eef6ff] to-[#f5f9ff] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300 selection:bg-blue-500/20">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/40 dark:bg-blue-900/10 blur-3xl rounded-full mix-blend-multiply dark:mix-blend-lighten opacity-70 animate-pulse" />
        <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-indigo-100/40 dark:bg-indigo-900/10 blur-3xl rounded-full mix-blend-multiply dark:mix-blend-lighten opacity-70 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <Sidebar />
      
      <div className="flex-1 flex flex-col relative z-10 h-screen overflow-hidden">
        {/* Premium Top Navigation */}
        <header className="h-16 border-b border-blue-50/50 dark:border-white/5 backdrop-blur-md bg-white/30 dark:bg-slate-950/30 flex items-center justify-between px-8 flex-shrink-0 relative z-[100] transition-colors duration-300 shadow-sm">
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex items-center gap-6 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <Link href="/dashboard/contact" className="hover:text-blue-600 dark:hover:text-white transition-colors">Contact Support</Link>
            </div>
            <div className="w-[1px] h-6 bg-slate-200 dark:bg-white/10 hidden lg:block" />
            <SearchDropdown />
          </div>

          <div className="flex items-center gap-3">
            <ToolsDropdown />
            <div className="flex items-center gap-2">
              <NotificationDropdown />
              <SettingsPanel />
            </div>
            
            {user && (
              <>
                <div className="h-8 w-[1px] bg-slate-200 dark:bg-white/10 mx-1" />
                <ProfileDropdown user={user} />
              </>
            )}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-10 scrollbar-hide">
          <div className="max-w-6xl mx-auto pb-20">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
