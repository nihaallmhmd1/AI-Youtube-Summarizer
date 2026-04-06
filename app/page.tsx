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
    <div className="h-screen w-full bg-gradient-to-br from-[#f8fbff] via-[#eef6ff] to-[#f5f9ff] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-200 overflow-hidden flex flex-col font-sans selection:bg-blue-500/20">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[60rem] h-[60rem] bg-blue-100/40 dark:bg-blue-900/10 blur-3xl rounded-full mix-blend-multiply dark:mix-blend-lighten opacity-70 animate-pulse" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[50rem] h-[50rem] bg-indigo-100/40 dark:bg-indigo-900/10 blur-3xl rounded-full mix-blend-multiply dark:mix-blend-lighten opacity-70 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 md:px-12 py-4 shadow-sm backdrop-blur-md bg-white/30 dark:bg-slate-950/30 shrink-0 border-b border-blue-50/50 dark:border-white/5">
        <div className="flex items-center gap-2.5 group cursor-pointer">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-all duration-300 ease-out">
            <Youtube size={18} />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">AI YT Summariser</span>
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-white/50 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-blue-100/50 dark:border-white/5">
          <button 
            onClick={() => setView('login')}
            className={`px-4 py-1.5 rounded-xl text-[11px] font-semibold transition-all duration-300 ease-out uppercase tracking-widest ${view === 'login' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
          >
            Login
          </button>
          <button 
            onClick={() => setView('signup')}
            className={`px-4 py-1.5 rounded-xl text-[11px] font-semibold transition-all duration-300 ease-out uppercase tracking-widest ${view === 'signup' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
          >
            Sign Up
          </button>
        </div>
      </nav>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 md:px-12 min-h-0 w-full max-w-6xl mx-auto py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 w-full items-center">
          
          {/* Left Side: Copy */}
          <div className="space-y-6 lg:space-y-8 order-2 lg:order-1 flex flex-col justify-center max-w-lg mx-auto lg:mx-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/60 dark:bg-white/5 backdrop-blur-md rounded-full text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-500/20 shadow-sm mb-2 hover:shadow-md transition-all">
                <Sparkles size={12} className="animate-pulse" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Next-Gen Intelligence</span>
              </div>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-slate-800 dark:text-white leading-[1.05]">
                Unlock the core <br />
                <span className="text-blue-600 dark:text-blue-400">of any video.</span>
              </h1>
              <p className="text-sm lg:text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Stop wasting hours watching. Get instant, structured insights from any YouTube video in seconds. Powered by state-of-the-art AI.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
              {features.map((f, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-center gap-3 p-3 bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-xl border border-blue-50 border-[rgba(120,170,255,0.1)] dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 hover:-translate-y-0.5 hover:border-[rgba(120,170,255,0.3)] shadow-sm hover:shadow-md transition-all duration-300 ease-out group"
                >
                  <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <f.icon size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-800 dark:text-white mb-0.5">{f.title}</h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center gap-6 opacity-60 pt-2 lg:pt-4">
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">Trusted by</span>
                <div className="flex items-center gap-3 grayscale opacity-70">
                  <div className="h-3 w-10 bg-slate-400 rounded" />
                  <div className="h-3 w-14 bg-slate-400 rounded" />
                  <div className="h-3 w-12 bg-slate-400 rounded" />
                </div>
              </div>
              <div className="h-6 w-[1px] bg-slate-300 dark:bg-slate-700" />
              <div className="flex flex-col">
                <span className="text-lg font-bold text-slate-700 dark:text-slate-300">50k+</span>
                <span className="text-[8px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Videos Processed</span>
              </div>
            </div>
          </div>

          {/* Right Side: Auth Card */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="w-full max-w-[360px] relative group"
            >
              <div className="bg-white/55 dark:bg-slate-900/80 backdrop-blur-xl border border-[rgba(120,170,255,0.22)] dark:border-white/10 rounded-3xl p-6 lg:p-top-8 lg:p-7 shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-none hover:border-[rgba(120,170,255,0.4)] transition-colors duration-500">
                
                <div className="mb-5 text-center">
                  <h2 className="text-xl lg:text-2xl font-bold text-slate-800 dark:text-white mb-1">
                    {view === 'login' ? 'Welcome Back' : 'Create Account'}
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                    {view === 'login' ? 'Sign in to access your dashboard.' : 'Start analyzing videos instantly.'}
                  </p>
                </div>

                {/* Google Auth Button */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 py-2.5 px-4 rounded-xl flex items-center justify-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:shadow hover:-translate-y-0.5 hover:bg-blue-50 dark:hover:bg-white/10 transition-all duration-300 ease-out disabled:opacity-50"
                >
                  {googleLoading ? (
                    <Loader2 className="animate-spin w-4 h-4 text-blue-600" />
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                <div className="my-5 flex items-center gap-3">
                  <div className="h-[1px] flex-1 bg-slate-200 dark:bg-white/10" />
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">or</span>
                  <div className="h-[1px] flex-1 bg-slate-200 dark:bg-white/10" />
                </div>

                {/* Traditional Form */}
                <form onSubmit={view === 'login' ? handleLogin : handleSignUp} className="space-y-4">
                  <div className="space-y-3">
                    <div className="relative group/input">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-600 transition-colors" />
                      <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/70 dark:bg-white/5 border border-[rgba(120,170,255,0.15)] dark:border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                        required
                      />
                    </div>
                    <div className="relative group/input">
                      <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-blue-600 transition-colors" />
                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/70 dark:bg-white/5 border border-[rgba(120,170,255,0.15)] dark:border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 transition-all duration-300 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-red-50/50 border border-red-100 rounded-xl flex items-start gap-2"
                    >
                      <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-600 font-medium">{error}</p>
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 ease-out disabled:opacity-70 flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                      <>
                        {view === 'login' ? 'Sign In' : 'Create Account'}
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-5 text-center space-y-3">
                  <button 
                    onClick={() => setView(view === 'login' ? 'signup' : 'login')}
                    className="text-[10px] uppercase tracking-widest text-slate-500 hover:text-blue-600 transition-colors font-medium outline-none"
                  >
                    {view === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                  </button>
                  <div className="flex items-center justify-center gap-1.5 text-[9px] uppercase tracking-wider text-slate-400 font-medium">
                    <ShieldCheck size={12} className="text-blue-500" /> Secure Encryption
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-4 shrink-0 flex items-center justify-center sm:justify-between flex-wrap gap-4 text-[11px] text-slate-500 dark:text-slate-400 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Youtube size={14} />
          <span className="font-semibold uppercase tracking-wider">AI YT Summariser</span>
        </div>
        <div className="flex items-center gap-5 uppercase tracking-wider font-medium">
          <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Support</a>
        </div>
        <div className="hidden sm:block">
          © 2026 Intelligence Systems.
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
