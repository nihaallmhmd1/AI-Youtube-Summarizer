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
    <div className="flex items-center justify-between p-6 bg-white dark:bg-[#191e16]/40 rounded-3xl border border-emerald-100 dark:border-white/5 group transition-all hover:border-emerald-500/30">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600">
          <Icon size={20} />
        </div>
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-[#646e5a] dark:text-slate-400 mb-1">{label}</div>
          <div className="font-bold text-[#111827] dark:text-white break-all">{value}</div>
        </div>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <Settings size={16} className="text-slate-400" />
      </div>
    </div>
  );

  return (
    <DashboardContainer>
      <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
            <User size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#111827] dark:text-white italic tracking-tighter uppercase">User Profile</h1>
            <p className="text-[#646e5a] dark:text-slate-400 font-medium tracking-tight">Manage your account identity and security.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="animate-spin w-12 h-12 mb-4 text-emerald-500" />
            <p className="font-bold uppercase tracking-widest text-xs">Accessing Profile...</p>
          </div>
        ) : user ? (
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="bg-[#111827] dark:bg-black rounded-[3rem] p-10 flex flex-col items-center justify-center text-center relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-50" />
              <div className="relative z-10">
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border-4 border-emerald-500/20 relative">
                  <User size={48} className="text-emerald-400" />
                  <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full text-black shadow-lg transform translate-x-2 translate-y-2 hover:scale-110 transition-transform">
                    <Camera size={14} />
                  </button>
                </div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-1">
                  {user.email?.split('@')[0] || 'Member'}
                </h2>
                <div className="flex items-center gap-2 justify-center text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">
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
            <div className="pt-6">
              <button className="w-full bg-[#111827] dark:bg-emerald-500 text-white dark:text-[#0a0a0a] py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all shadow-xl shadow-emerald-500/20">
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
