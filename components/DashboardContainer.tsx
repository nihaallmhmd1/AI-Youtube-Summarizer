'use client';

import Sidebar from '@/components/Sidebar';
import ToolsDropdown from '@/components/ToolsDropdown';
import SearchDropdown from '@/components/SearchDropdown';
import NotificationDropdown from '@/components/NotificationDropdown';
import ProfileDropdown from '@/components/ProfileDropdown';
import SettingsPanel from '@/components/SettingsPanel';
import AIAgent from '@/components/AIAgent';
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
    <div className="flex min-h-screen bg-[#fdfcf0] dark:bg-[#0f140c] text-[#141e0f] dark:text-white transition-colors duration-300 selection:bg-emerald-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/[0.02] dark:bg-emerald-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-teal-600/[0.02] dark:bg-teal-600/10 blur-[120px] rounded-full" />
      </div>

      <Sidebar />
      
      <div className="flex-1 flex flex-col relative z-10 h-screen overflow-hidden">
        {/* Premium Top Navigation */}
        <header className="h-20 border-b border-slate-100 dark:border-white/5 backdrop-blur-xl bg-white/90 dark:bg-black/40 flex items-center justify-between px-10 flex-shrink-0 relative z-[100] transition-colors duration-300 shadow-sm">
          <div className="flex items-center gap-12">
            <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-[#646e5a] dark:text-slate-400">
              <Link href="/dashboard/resources" className="hover:text-emerald-700 dark:hover:text-white transition-colors">Resources</Link>
              <Link href="/dashboard/pricing" className="hover:text-emerald-700 dark:hover:text-white transition-colors">Pricing</Link>
              <Link href="/dashboard/api" className="hover:text-emerald-700 dark:hover:text-white transition-colors">API</Link>
              <Link href="/dashboard/contact" className="hover:text-emerald-700 dark:hover:text-white transition-colors">Contact Us</Link>
            </div>
            
            <SearchDropdown />
          </div>

          <div className="flex items-center gap-4">
            <ToolsDropdown />
            <NotificationDropdown />
            <SettingsPanel />
            
            {user && (
              <>
                <div className="h-8 w-[1px] bg-slate-200 dark:bg-white/10 mx-2" />
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

      {/* Interactive AI Agent */}
      <AIAgent />
    </div>
  );
}
