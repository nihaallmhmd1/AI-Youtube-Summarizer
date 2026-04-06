'use client';

import { 
  Mail, 
  MessageSquare, 
  Send, 
  Sparkles, 
  Phone,
  Clock,
  Globe
} from 'lucide-react';
import DashboardContainer from '@/components/DashboardContainer';
import { useState } from 'react';

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const contactMethods = [
    { 
      icon: Mail, 
      label: 'Email Support', 
      value: 'support@ai-ytsummariser.com',
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
    },
    { 
      icon: Globe, 
      label: 'Documentation', 
      value: 'docs.ai-ytsummariser.com',
      color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400'
    },
    { 
      icon: Clock, 
      label: 'Response Time', 
      value: '< 12 Hours',
      color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400'
    }
  ];

  return (
    <DashboardContainer>
      <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Header Section */}
        <header className="relative bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-blue-200/40 dark:border-white/10 rounded-[2.5rem] p-10 md:p-14 overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400/10 rounded-full blur-[80px] -mr-20 -mt-20" />
          
          <div className="relative z-10 text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border border-blue-100 dark:border-blue-800/30 text-blue-600 dark:text-blue-400">
              <Sparkles size={12} />
              <span>We're here to help</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-800 dark:text-white leading-tight">
              Get in touch with <br /> our <span className="text-blue-600 dark:text-blue-400">Intelligence Team.</span>
            </h1>
            <p className="max-w-xl mx-auto text-slate-500 dark:text-slate-400 font-medium text-sm md:text-base leading-relaxed">
              Have questions or feedback about your video processing? Our team is available to assist you 24/7.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Contact Info */}
          <div className="lg:col-span-1 space-y-4">
            {contactMethods.map((method, i) => (
              <div key={i} className="bg-white/60 dark:bg-slate-800/40 p-6 rounded-3xl border border-blue-100/50 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300">
                <div className={`p-2.5 rounded-xl w-fit mb-4 ${method.color} shadow-sm border border-white/20`}>
                  <method.icon size={20} />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{method.label}</div>
                <div className="text-sm font-bold text-slate-800 dark:text-white break-all leading-relaxed">{method.value}</div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-8 md:p-10 rounded-[2rem] border border-blue-100/50 dark:border-white/10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl -mr-32 -mt-32" />
              
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight mb-8 relative z-10 flex items-center gap-3">
                <MessageSquare className="text-blue-500" size={24} />
                Send us a Message
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="John Doe"
                      className="w-full bg-white/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="john@example.com"
                      className="w-full bg-white/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium transition-all"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Subject</label>
                  <select className="w-full bg-white/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium transition-all appearance-none cursor-pointer">
                    <option>Technical Support</option>
                    <option>Billing Question</option>
                    <option>Feature Request</option>
                    <option>General Feedback</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Message</label>
                  <textarea 
                    placeholder="Tell us what you need..."
                    rows={4}
                    className="w-full bg-white/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium transition-all resize-none"
                    required
                  ></textarea>
                </div>

                <button 
                  type="submit"
                  disabled={submitted}
                  className={`w-full py-4 rounded-xl font-bold uppercase tracking-[0.1em] text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${submitted ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5 active:scale-95'}`}
                >
                  {submitted ? (
                    <>Sent Successfully! <Sparkles size={16} /></>
                  ) : (
                    <>Send Message <Send size={14} /></>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center py-6 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-t border-slate-100 dark:border-white/5">
          Intelligence gathering powered by next-gen AI systems.
        </div>
      </div>
    </DashboardContainer>
  );
}
