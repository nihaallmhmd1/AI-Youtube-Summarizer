'use client';

import { useEffect, useState } from 'react';
import { createClientComponent } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';
import DashboardContainer from '@/components/DashboardContainer';
import { 
  User, 
  Mail, 
  Shield, 
  Settings, 
  CheckCircle2, 
  Loader2,
  Camera
} from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponent();

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    fetchUser();
  }, [supabase]);

  const ProfileField = ({ label, value, icon: Icon }: { label: string, value: string | undefined | null, icon: React.ElementType }) => (
    <div className="flex items-center justify-between p-5 bg-white/60 dark:bg-slate-800/40 rounded-2xl border border-blue-100/50 dark:border-white/5 group transition-all duration-300 hover:border-blue-300 shadow-sm hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 shadow-sm">
          <Icon size={18} />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5">{label}</div>
          <div className="font-bold text-slate-800 dark:text-white break-all text-sm">{value}</div>
        </div>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <Settings size={16} className="text-slate-400 hover:text-blue-500 cursor-pointer" />
      </div>
    </div>
  );

  return (
    <DashboardContainer>
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-100/50 shadow-sm">
            <User size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">User Profile</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Manage your account identity and security.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="animate-spin w-10 h-10 mb-4 text-blue-500" />
            <p className="font-semibold uppercase tracking-wider text-[11px]">Accessing Profile...</p>
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="bg-white/80 dark:bg-slate-900/60 rounded-3xl p-10 flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-sm border border-blue-100/50 dark:border-white/5 backdrop-blur-xl hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-1000" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 bg-blue-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mb-6 border-2 border-white dark:border-slate-700 shadow-md relative group-hover:rotate-3 transition-transform duration-500 group-hover:shadow-lg">
                  <User size={40} className="text-blue-500 dark:text-blue-400" />
                  <button className="absolute bottom-[-8px] right-[-8px] p-2 bg-white dark:bg-slate-700 rounded-xl text-slate-700 dark:text-slate-200 shadow-md hover:scale-110 hover:text-blue-500 transition-all border border-slate-100 dark:border-slate-600">
                    <Camera size={14} />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight mb-2">
                  {user.email?.split('@')[0] || 'Member'}
                </h2>
                <div className="flex items-center gap-1.5 justify-center text-blue-600 dark:text-blue-400 text-[11px] font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800/30">
                  <CheckCircle2 size={12} />
                  Verified Intelligence Officer
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="grid grid-cols-1 gap-4">
              <ProfileField icon={Mail} label="Email Address" value={user.email} />
              <ProfileField icon={Shield} label="Account Level" value="Premium SaaS Plan" />
              <ProfileField icon={Settings} label="User ID" value={user.id} />
            </div>

            {/* Actions */}
            <div className="pt-4">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold uppercase tracking-wider text-xs hover:-translate-y-0.5 transition-all shadow-sm hover:shadow outline-none flex items-center justify-center gap-2 relative overflow-hidden group/btn">
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                <Settings size={14} />
                Update Identity Settings
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500">Not logged in.</div>
        )}
      </div>
    </DashboardContainer>
  );
}
