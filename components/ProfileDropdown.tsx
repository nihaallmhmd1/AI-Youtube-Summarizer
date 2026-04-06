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
        <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 ring-2 ring-blue-500/20 group-hover:ring-blue-500/50 transition-all shadow-sm">
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
            className="absolute top-full right-0 mt-3 w-64 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-blue-100/50 dark:border-white/10 rounded-2xl shadow-lg z-[150] overflow-hidden"
          >
            <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.user_metadata?.full_name || user.email?.split('@')[0]}</div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">{user.email}</div>
              <div className="mt-3 flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[8px] font-bold uppercase tracking-widest rounded border border-blue-200 dark:border-blue-800/50">Pro Member</span>
                <span className="text-[10px] text-slate-500 font-medium tracking-tight">ID: #4829</span>
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
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-blue-600 transition-colors shadow-sm">
                      <item.icon size={16} />
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">{item.label}</span>
                  </div>
                  <ChevronRight size={12} className="text-slate-400 group-hover:text-blue-500 transition-all group-hover:translate-x-0.5" />
                </button>
              ))}
            </div>

            <div className="p-2 border-t border-slate-100 dark:border-white/5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 group-hover:text-red-600 shadow-sm">
                    <LogOut size={16} />
                  </div>
                  <span className="text-xs font-semibold text-red-500 group-hover:text-red-600">Logout Session</span>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
