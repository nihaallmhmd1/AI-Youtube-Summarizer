'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Sparkles, AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'summary' | 'update' | 'system';
  unread: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Summary Completed',
    message: 'Your summary for "Advanced Next.js Patterns" is ready to view.',
    time: '2m ago',
    type: 'summary',
    unread: true
  },
  {
    id: '2',
    title: 'New Feature Update',
    message: 'Check out the new Reading Mode in the AI Tools dropdown!',
    time: '1h ago',
    type: 'update',
    unread: true
  },
  {
    id: '3',
    title: 'System Maintenance',
    message: 'Scheduled maintenance on March 15th at 02:00 UTC.',
    time: '5h ago',
    type: 'system',
    unread: false
  }
];

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(mockNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const getTypeStyles = (type: Notification['type']) => {
    switch (type) {
      case 'summary': return { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
      case 'update': return { icon: Sparkles, color: 'text-teal-400', bg: 'bg-teal-500/10' };
      case 'system': return { icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10' };
      default: return { icon: Info, color: 'text-slate-400', bg: 'bg-slate-500/10' };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 hover:text-white transition-colors relative group"
      >
        <Bell size={20} className="group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-black animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-[#191e16] border border-emerald-100 dark:border-white/10 rounded-2xl shadow-xl z-[150] overflow-hidden"
          >
            <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#141e0f] dark:text-white">Notifications</h3>
              <button 
                onClick={markAllRead}
                className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors uppercase tracking-wider"
              >
                Mark all as read
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto overflow-x-hidden scrollbar-hide py-2">
              {notifications.length > 0 ? (
                notifications.map((notif) => {
                  const styles = getTypeStyles(notif.type);
                  return (
                    <div 
                      key={notif.id}
                      className={`p-4 hover:bg-[#f0f4e6] dark:hover:bg-white/5 transition-all cursor-pointer relative ${notif.unread ? 'bg-emerald-500/[0.02]' : ''}`}
                    >
                      <div className="flex gap-4">
                        <div className={`mt-0.5 p-2 rounded-lg ${styles.bg} ${styles.color} flex-shrink-0 h-fit`}>
                          <styles.icon size={16} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className={`text-xs font-bold ${notif.unread ? 'text-[#111827] dark:text-white' : 'text-slate-500 dark:text-slate-300'}`}>
                              {notif.title}
                            </h4>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">{notif.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                      {notif.unread && (
                        <div className="absolute top-1/2 -translate-y-1/2 right-1 w-1 h-8 bg-emerald-500 rounded-full blur-[1px]" />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-12 text-center text-xs text-slate-500">
                  No new notifications
                </div>
              )}
            </div>

            <button className="w-full p-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white border-t border-slate-100 dark:border-white/5 transition-colors uppercase tracking-widest text-center">
              View all activities
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
