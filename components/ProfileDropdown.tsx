'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  History, 
  Bookmark, 
  Settings, 
  LogOut, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClientComponent } from '@/lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

export default function ProfileDropdown({ user }: { user: SupabaseUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClientComponent();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const menuItems: { icon: React.ElementType; label: string; href: string }[] = [
    { icon: User, label: 'My Profile', href: '/profile' },
    { icon: History, label: 'Activity History', href: '/history' },
    { icon: Bookmark, label: 'Saved Videos', href: '/saved-videos' },
    { icon: ShieldCheck, label: 'Privacy & Security', href: '/profile' },
    { icon: Settings, label: 'Account Settings', href: '/profile' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 group outline-none"
      >
        <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 ring-2 ring-emerald-500/20 group-hover:ring-emerald-500/50 transition-all">
          <Image 
            src={user.user_metadata?.avatar_url || 'https://ui-avatars.com/api/?name=' + user.email} 
            alt="User" 
            width={36}
            height={36}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-3 w-64 bg-white dark:bg-[#191e16]/90 backdrop-blur-xl border border-emerald-100 dark:border-white/10 rounded-2xl shadow-2xl z-[150] overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="text-sm font-bold text-[#111827] dark:text-white truncate">{user.user_metadata?.full_name || user.email?.split('@')[0]}</div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">{user.email}</div>
              <div className="mt-3 flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[8px] font-bold uppercase tracking-widest rounded border border-emerald-500/20 dark:border-emerald-500/30">Pro Member</span>
                <span className="text-[10px] text-[#646e5a] dark:text-slate-600 font-medium tracking-tight">ID: #4829</span>
              </div>
            </div>

            <div className="p-2">
              {menuItems.map((item, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (item.href !== '#') router.push(item.href);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#F3F4F6] dark:hover:bg-white/5 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-[#646e5a] dark:text-slate-400 group-hover:text-emerald-700 dark:group-hover:text-white transition-colors">
                      <item.icon size={16} />
                    </div>
                    <span className="text-xs font-medium text-[#646e5a] dark:text-slate-300 group-hover:text-[#141e0f] dark:group-hover:text-white transition-colors">{item.label}</span>
                  </div>
                  <ChevronRight size={12} className="text-[#646e5a] dark:text-slate-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-all group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>

            <div className="p-2 border-t border-slate-100 dark:border-white/5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-500/10 transition-all text-left group"
              >
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 group-hover:text-rose-400">
                  <LogOut size={16} />
                </div>
                <span className="text-xs font-semibold text-rose-400/80 group-hover:text-rose-400">Logout Session</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
