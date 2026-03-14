'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClientComponent } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Youtube, 
  Sparkles, 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Globe,
  MessageSquare,
  PlayCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { getURL } from '@/lib/utils';

function HomeContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'login' | 'signup'>('login');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponent();

  useEffect(() => {
    // If user is already logged in, redirect to summarise
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/summarise');
      }
    };
    checkUser();

    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(errorParam);
    }
  }, [searchParams, supabase.auth, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/summarise');
      router.refresh();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getURL()}/auth/callback?next=/summarise`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      alert('Check your email for the confirmation link.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${getURL()}/auth/callback?next=/summarise`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  const features = [
    { icon: Zap, title: 'Instant Insights', desc: 'Convert hours of video into minutes of reading.' },
    { icon: Globe, title: 'Multi-Language', desc: 'Native summaries in over 20+ languages.' },
    { icon: MessageSquare, title: 'AI Agent Chat', desc: 'Ask specific questions directly to the video.' },
    { icon: PlayCircle, title: 'Visual Highlights', desc: 'Timestamps linked to key visual moments.' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#020202] text-slate-900 dark:text-white font-sans selection:bg-emerald-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-emerald-500/5 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[1000px] h-[1000px] bg-teal-500/5 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-8 md:px-16 py-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-500/20">
            <Youtube size={22} />
          </div>
          <span className="text-xl font-black italic tracking-tighter uppercase">AI YT Summariser</span>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setView('login')}
            className="text-xs font-black uppercase tracking-widest text-[#646e5a] dark:text-slate-400 hover:text-emerald-500 transition-colors hidden sm:block outline-none"
          >
            Login
          </button>
          <button 
            onClick={() => setView('signup')}
            className="bg-[#111827] dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-all outline-none"
          >
            Get Started
          </button>
        </div>
      </nav>

      <main className="relative z-10 px-8 md:px-16 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center max-w-7xl mx-auto">
        
        {/* Left Side: Copy */}
        <div className="space-y-10 order-2 lg:order-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-full text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-6 font-bold">
              <Sparkles size={14} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Next-Gen Intelligence</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.9] mb-8">
              Unlock the core <br />
              <span className="text-emerald-500">of any video.</span>
            </h1>
            <p className="text-lg md:text-xl text-[#374151] dark:text-slate-400 font-medium tracking-tight max-w-xl leading-relaxed">
              Stop wasting hours watching. Get instant, structured insights from any YouTube video in seconds. Powered by state-of-the-art AI.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
              >
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <f.icon size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight italic mb-1">{f.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="pt-8 flex items-center gap-10 opacity-40">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest font-bold">Trusted by</span>
              <div className="flex items-center gap-4 grayscale">
                <div className="h-4 w-12 bg-slate-400 rounded-sm" />
                <div className="h-4 w-16 bg-slate-400 rounded-sm" />
                <div className="h-4 w-14 bg-slate-400 rounded-sm" />
              </div>
            </div>
            <div className="h-8 w-[1px] bg-slate-200 dark:bg-white/10" />
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-black italic">50k+</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500">Videos Processed</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card */}
        <div className="order-1 lg:order-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: 'spring' }}
            className="w-full max-w-md mx-auto relative group"
          >
            {/* Aesthetic Glow Behind Card */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            
            <div className="bg-white dark:bg-[#191e16]/80 backdrop-blur-3xl border border-emerald-100 dark:border-white/10 rounded-[3.5rem] p-10 md:p-12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] dark:shadow-none relative z-10">
              
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-black text-[#111827] dark:text-white italic tracking-tighter uppercase mb-2">
                  {view === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-[#646e5a] dark:text-slate-400 text-xs font-bold tracking-widest uppercase">
                  {view === 'login' ? 'Access your intelligence vault.' : 'Start your journey today.'}
                </p>
              </div>

              {/* Google Auth Button */}
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full bg-white dark:bg-white/5 border border-emerald-100 dark:border-white/10 py-4 px-6 rounded-2xl flex items-center justify-center gap-4 text-sm font-bold shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-white/10 transition-all disabled:opacity-50 group outline-none"
              >
                {googleLoading ? (
                  <Loader2 className="animate-spin w-5 h-5 text-emerald-500" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="text-[#111827] dark:text-white uppercase tracking-widest text-[10px] font-black group-hover:translate-x-1 transition-transform">Continue with Google</span>
                  </>
                )}
              </button>

              <div className="my-8 flex items-center gap-4 opacity-30">
                <div className="h-[1px] flex-1 bg-slate-300 dark:bg-white/20" />
                <span className="text-[10px] font-black uppercase tracking-widest">or</span>
                <div className="h-[1px] flex-1 bg-slate-300 dark:bg-white/20" />
              </div>

              {/* Traditional Form */}
              <form onSubmit={view === 'login' ? handleLogin : handleSignUp} className="space-y-5">
                <div className="space-y-3">
                  <div className="relative group/input">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors" />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-emerald-50 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-[#111827] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner"
                      required
                    />
                  </div>
                  <div className="relative group/input">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-500 transition-colors" />
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-emerald-50 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-[#111827] dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all shadow-inner"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3"
                  >
                    <AlertCircle size={14} className="text-rose-500 shrink-0" />
                    <p className="text-[10px] font-black uppercase tracking-tight text-rose-500">{error}</p>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#111827] dark:bg-emerald-500 text-white dark:text-[#0a0a0a] font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[10px] h-[56px] outline-none"
                >
                  {loading ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    <>
                      {view === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center space-y-4">
                <button 
                  onClick={() => setView(view === 'login' ? 'signup' : 'login')}
                  className="text-[10px] font-black uppercase tracking-widest text-[#646e5a] dark:text-slate-400 hover:text-emerald-500 transition-colors outline-none"
                >
                  {view === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                </button>
                <div className="flex items-center justify-center gap-2 text-[8px] font-black uppercase tracking-[0.3em] text-slate-300 dark:text-slate-600">
                  <ShieldCheck size={12} className="text-emerald-500" /> Secure Encryption
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Aesthetic Footer */}
      <footer className="relative z-10 px-8 py-12 border-t border-slate-100 dark:border-white/5 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3 opacity-50">
            <Youtube size={18} />
            <span className="text-sm font-black italic uppercase tracking-tighter">AI YT</span>
          </div>
          <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-[#646e5a] dark:text-slate-400">
            <a href="#" className="hover:text-emerald-500 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-emerald-500 transition-colors">Contact Support</a>
          </div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            © 2026 Intelligence Systems. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function LandingRootPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#020202]">
        <Loader2 className="animate-spin text-emerald-500 w-10 h-10" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
