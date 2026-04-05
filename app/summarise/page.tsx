'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import {
  Youtube,
  Sparkles,
  CheckCircle2,
  Lightbulb,
  Star,
  Loader2,
  AlertCircle,
  FileText,
  ListOrdered,
  Clock,
  BookOpen,
  ChevronRight,
  Copy,
  Download,
  Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { createClientComponent } from '@/lib/supabase';
import { Summary } from '@/types';
import DashboardContainer from '@/components/DashboardContainer';
import LanguageSelector from '@/components/LanguageSelector';
import TTSButton from '@/components/TTSButton';

export default function SummarisePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-32 text-slate-500">
        <Loader2 className="animate-spin w-10 h-10 mb-4 text-emerald-500" />
        <p>Loading summariser...</p>
      </div>
    }>
      <SummariserContent />
    </Suspense>
  );
}

interface ToolResult {
  title?: string;
  summary?: string;
  introduction?: string;
  sections?: { heading?: string; title?: string; content?: string; text?: string }[];
  conclusion?: string;
  detailed_summary?: string;
  points_oriented?: string[];
  timestamped_highlights?: string[];
  text?: string;
  content?: string;
}

function SummariserContent() {
  const [url, setUrl] = useState('');
  const [previewInfo, setPreviewInfo] = useState<{title: string, author_name: string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<Summary | null>(null);
  const [toolLoading, setToolLoading] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [toolResults, setToolResults] = useState<Record<string, ToolResult>>({});
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [lastProcessedLanguage, setLastProcessedLanguage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const searchParams = useSearchParams();
  const summaryId = searchParams.get('id');
  const supabase = createClientComponent();

  const nonLatinLanguages = ['Malayalam', 'Hindi', 'Arabic', 'Chinese', 'Japanese', 'Korean'];
  const isNonLatin = nonLatinLanguages.includes(selectedLanguage);

  const getStringContent = (data: unknown) => {
    if (typeof data === 'string') return data;
    if (!data) return '';
    const d = data as ToolResult;
    return d.detailed_summary || d.text || d.content || d.summary || JSON.stringify(data, null, 2);
  };

  const generateToolContent = useCallback(async (mode: string) => {
    if (!url) return;
    setToolLoading(mode);
    setError(null);
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, mode, language: selectedLanguage }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Tool generation failed');
      setToolResults(prev => ({ ...prev, [mode]: data[mode] as ToolResult }));
      setActiveTool(mode);
      setLastProcessedLanguage(selectedLanguage);
      setTimeout(() => {
        const element = document.getElementById(`tool-${mode}`);
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setToolLoading(null);
    }
  }, [url, selectedLanguage]);

  const handleGenerate = useCallback(async (e?: React.FormEvent, keepResult = false) => {
    if (e) e.preventDefault();
    if (!url) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    if (!keepResult) {
      setResult(null);
      setToolResults({});
      setActiveTool(null);
    }
    try {
      let response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, language: selectedLanguage }),
      });
      let data = await response.json();
      
      if (!response.ok && (data.status === 'no_captions' || data.status === 'transcript_blocked')) {
        setNotice('Transcript unavailable. Summary generated using AI understanding.');
        
        response = await fetch('/api/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, language: selectedLanguage, useFallback: true }),
        });
        data = await response.json();
      }

      if (!response.ok) throw new Error(data.message || 'Something went wrong');
      
      setNotice(null);
      setResult(data);
      setLastProcessedLanguage(selectedLanguage);
      
      // Notify AI Agent about new context
      if (data.transcript || data.summary) {
        window.dispatchEvent(new CustomEvent('update-video-context', {
          detail: {
            transcript: data.transcript || data.summary, // Fallback to summary if transcript not separate
            videoTitle: data.title
          }
        }));
      }

      window.dispatchEvent(new CustomEvent('show-tools'));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [url, selectedLanguage]);

  const fetchSummaryById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('summaries')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      if (data) {
        setResult(data);
        setUrl(data.video_url);
        setLastProcessedLanguage('English');
        
        // Notify AI Agent about existing context
        window.dispatchEvent(new CustomEvent('update-video-context', {
          detail: {
            transcript: data.summary, // History summaries currently store summary as context
            videoTitle: data.video_title
          }
        }));

        window.dispatchEvent(new CustomEvent('show-tools'));
      }
    } catch (err: unknown) {
      console.error('Error fetching summary:', err);
      setError('Could not load the requested summary.');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const savedLang = localStorage.getItem('language') || 'English';
    setSelectedLanguage(savedLang);
    const handleLanguageChange = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.language) setSelectedLanguage(detail.language);
    };
    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  useEffect(() => {
    if (url && (result || activeTool) && selectedLanguage !== lastProcessedLanguage) {
      if (activeTool) {
        generateToolContent(activeTool);
      } else {
        handleGenerate(undefined, true);
      }
    }
  }, [selectedLanguage, lastProcessedLanguage, url, result, activeTool, generateToolContent, handleGenerate]);

  const urlMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  const currentVideoId = urlMatch ? urlMatch[1] : null;

  useEffect(() => {
    if (!currentVideoId) {
      setPreviewInfo(null);
      return;
    }
    const fetchPreview = async () => {
      try {
        const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${currentVideoId}`);
        const data = await res.json();
        if (!data.error) {
          setPreviewInfo(data);
        } else {
          setPreviewInfo(null);
        }
      } catch {
        setPreviewInfo(null);
      }
    };
    fetchPreview();
  }, [currentVideoId]);

  useEffect(() => {
    if (summaryId) {
      fetchSummaryById(summaryId);
    }
  }, [summaryId, fetchSummaryById]);

  useEffect(() => {
    const handleToolEvent = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if ((result || url) && detail?.mode) {
        generateToolContent(detail.mode);
      }
    };
    window.addEventListener('generate-tool-content', handleToolEvent);
    return () => window.removeEventListener('generate-tool-content', handleToolEvent);
  }, [result, url, generateToolContent]);

  const handleCopy = () => {
    let text = '';
    const title = result?.video_title || result?.title || 'Video Summary';

    if (activeTool && toolResults[activeTool]) {
      const toolData = toolResults[activeTool];
      if (activeTool === 'detailed_summary') {
        text = `# ${title} - Detailed Summary\n\n${getStringContent(toolData)}`;
      } else if (activeTool === 'points_oriented') {
        text = `# ${title} - Key Points\n\n${(toolData.points_oriented || []).map((p, i) => `${i + 1}. ${p}`).join('\n')}`;
      } else if (activeTool === 'timestamped_highlights') {
        text = `# ${title} - Highlights\n\n${(toolData.timestamped_highlights || []).join('\n')}`;
      } else if (activeTool === 'reading_mode') {
        const rm = toolData;
        text = `# ${rm.title || title}\n\n${rm.introduction || ''}\n\n${(rm.sections || []).map((sec) => `## ${sec.heading || sec.title}\n${sec.content || sec.text}`).join('\n\n')}\n\n${rm.conclusion || ''}`;
      }
    } else if (result) {
      text = `
${title}
Summary:
${result.summary}

Key Points:
${result.key_points.join('\n')}

Highlights:
${result.highlights.join('\n')}
      `.trim();
    }

    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    let text = '';
    const title = result?.video_title || result?.title || 'Video';
    let filenameSuffix = 'summary';

    if (activeTool && toolResults[activeTool]) {
      filenameSuffix = activeTool.replace('_', '-');
      const toolData = toolResults[activeTool];
      if (activeTool === 'detailed_summary') {
        text = `# ${title} - Detailed Summary\n\n${getStringContent(toolData)}`;
      } else if (activeTool === 'points_oriented') {
        text = `# ${title} - Key Points\n\n${(toolData.points_oriented || []).map((p) => `- ${p}`).join('\n')}`;
      } else if (activeTool === 'timestamped_highlights') {
        text = `# ${title} - Highlights\n\n${(toolData.timestamped_highlights || []).join('\n')}`;
      } else if (activeTool === 'reading_mode') {
        const rm = toolData;
        text = `# ${rm.title || title}\n\n${rm.introduction || ''}\n\n${(rm.sections || []).map((sec) => `## ${sec.heading || sec.title}\n${sec.content || sec.text}`).join('\n\n')}\n\n${rm.conclusion || ''}`;
      }
    } else if (result) {
      text = `
# ${title}
## Summary
${result.summary}

## Key Points
${result.key_points.map(p => `- ${p}`).join('\n')}

## Highlights
${result.highlights.map(h => `- ${h}`).join('\n')}

Generated by AI YT Summariser
      `.trim();
    }

    if (!text) return;
    const blob = new Blob([text], { type: 'text/markdown' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${filenameSuffix}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  };

  const ReportControlBar = ({
    language,
    setLanguage,
    currentTool,
    setTool,
    onCopy,
    onExport,
    isDark = true
  }: {
    language: string,
    setLanguage: (l: string) => void,
    currentTool: string | null,
    setTool: (t: string | null) => void,
    onCopy: () => void,
    onExport: () => void,
    isDark?: boolean
  }) => (
    <div className={`flex flex-col sm:flex-row items-center justify-between px-8 py-6 border-b border-slate-50 dark:border-white/5 ${isDark ? 'bg-slate-50/50 dark:bg-white/[0.02]' : 'bg-slate-50/50'} gap-4`}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <LanguageSelector value={language} onChange={setLanguage} />
        </div>
        <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/10 hidden sm:block" />
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 rounded-xl text-teal-600">
            <Sparkles size={16} />
          </div>
          <select
            value={currentTool || 'summary'}
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'summary') {
                setTool(null);
              } else {
                setTool(val);
                window.dispatchEvent(new CustomEvent('generate-tool-content', { detail: { mode: val } }));
              }
            }}
            className={`bg-transparent border-none text-xs font-black uppercase tracking-widest text-[#646e5a] dark:text-slate-400 focus:outline-none cursor-pointer hover:text-teal-700 transition-colors ${isNonLatin ? 'normal-case tracking-normal' : ''}`}
          >
            <option value="summary" className="bg-white dark:bg-[#0a0a0a] text-black dark:text-white uppercase">Overall Summary</option>
            <option value="detailed_summary" className="bg-white dark:bg-[#0a0a0a] text-black dark:text-white uppercase">Detailed Summary</option>
            <option value="points_oriented" className="bg-white dark:bg-[#0a0a0a] text-black dark:text-white uppercase">Points Oriented</option>
            <option value="timestamped_highlights" className="bg-white dark:bg-[#0a0a0a] text-black dark:text-white uppercase">Timestamped Highlights</option>
            <option value="reading_mode" className="bg-white dark:bg-[#0a0a0a] text-black dark:text-white uppercase">Reading Mode</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <button
          onClick={onCopy}
          className="flex-1 sm:flex-none p-2.5 bg-white dark:bg-white/5 border border-emerald-100 dark:border-white/10 rounded-xl text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-white hover:border-emerald-500/20 transition-all flex items-center justify-center gap-2 group/btn"
          title="Copy Result"
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          <span className="text-[10px] font-black uppercase tracking-tighter">Copy</span>
        </button>
        <button
          onClick={onExport}
          className="flex-1 sm:flex-none p-2.5 bg-white dark:bg-white/5 border border-emerald-100 dark:border-white/10 rounded-xl text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-white hover:border-emerald-500/20 transition-all flex items-center justify-center gap-2 group/btn"
          title="Export as Markdown"
        >
          <Download size={14} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Export</span>
        </button>
      </div>
    </div>
  );

  return (
    <DashboardContainer>
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white dark:bg-[#191e16]/40 p-8 md:p-10 rounded-[2.5rem] border border-emerald-100 dark:border-white/5 shadow-2xl backdrop-blur-xl relative">
          {/* Subtle Background Glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10 max-w-xl">
            <h1 className={`text-4xl font-black text-[#111827] dark:text-white mb-2 tracking-tighter uppercase ${isNonLatin ? 'normal-case italic-none' : 'italic'}`}>AI YT Summariser</h1>
            <p className="text-[#374151] dark:text-slate-400 font-medium tracking-tight">Get the core insights from any video instantly.</p>
          </div>

          <form onSubmit={handleGenerate} className="relative z-10 flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:min-w-[450px]">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
                  <Youtube className="text-red-500 w-5 h-5" />
                </div>
                <input
                  type="text"
                  placeholder="Paste YouTube Link..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl py-3.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm font-bold text-[#111827] dark:text-white shadow-inner"
                />
              </div>
            <button
              type="submit"
              disabled={loading || !url}
              className="bg-[#111827] dark:bg-white text-white dark:text-black font-black py-3.5 px-6 rounded-xl shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-widest text-[10px] whitespace-nowrap h-[46px]"
            >
              {loading ? (
                <Loader2 className="animate-spin w-3.5 h-3.5" />
              ) : (
                <Sparkles size={14} />
              )}
              Summarise
            </button>
          </form>

          {error && (
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-rose-500/10 border-t border-rose-500/20 animate-in slide-in-from-bottom-full">
              <p className="text-[10px] font-black uppercase tracking-tight text-rose-500 text-center flex items-center justify-center gap-2">
                <AlertCircle size={12} />
                {error}
              </p>
            </div>
          )}
          {notice && !error && (
            <div className="absolute bottom-[-50px] left-0 right-0 p-4 bg-sky-500/10 border border-sky-500/20 rounded-2xl animate-in slide-in-from-bottom-full backdrop-blur-md shadow-lg shadow-sky-500/5">
              <p className="text-[11px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400 text-center flex items-center justify-center gap-3">
                <Loader2 size={14} className="animate-spin" />
                {notice}
              </p>
            </div>
          )}
        </div>

        {previewInfo && !result && (
          <div className="flex justify-center animate-in fade-in slide-in-from-top-4 duration-500 mt-4 mb-2">
            <div className="bg-white/40 dark:bg-[#191e16]/40 p-3 rounded-[2rem] border border-emerald-100/50 dark:border-white/5 flex gap-5 items-center backdrop-blur-md shadow-xl w-full max-w-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-28 md:w-36 aspect-video rounded-xl overflow-hidden shadow-inner shrink-0 bg-black/5">
                <Image src={`https://img.youtube.com/vi/${currentVideoId}/mqdefault.jpg`} unoptimized fill className="object-cover" alt="Video Preview" />
              </div>
              <div className="flex-1 pr-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 size={10} /> Video Accessible
                </p>
                <h3 className="font-bold text-sm md:text-base line-clamp-2 text-slate-800 dark:text-slate-200 leading-tight">{previewInfo.title}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 opacity-80">{previewInfo.author_name}</p>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-top-4 duration-1000">
            {/* Main Content: 8 Columns */}
            <div className="lg:col-span-8 space-y-10">
              {!activeTool && (
                <>
                  <div className="bg-white dark:bg-[#191e16]/60 rounded-[3rem] border border-emerald-100 dark:border-white/5 shadow-2xl backdrop-blur-xl relative group/report animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <ReportControlBar
                      language={selectedLanguage}
                      setLanguage={setSelectedLanguage}
                      currentTool={activeTool}
                      setTool={setActiveTool}
                      onCopy={handleCopy}
                      onExport={handleExport}
                    />

                    {/* Summary Section */}
                    <div className="p-10 md:p-12 border-b border-emerald-50 dark:border-white/5">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
                          <Sparkles size={24} />
                        </div>
                        <h2 className={`text-3xl font-black text-[#111827] dark:text-white tracking-tighter uppercase ${isNonLatin ? 'normal-case' : 'italic'}`}>Executive Summary</h2>
                      </div>
                      <div className="flex flex-col gap-6">
                        <p className="text-[#374151] dark:text-slate-300 leading-relaxed text-xl font-medium tracking-tight">
                          {result.summary}
                        </p>
                        <div className="flex justify-start">
                          <TTSButton text={result.summary} language={selectedLanguage} />
                        </div>
                      </div>
                    </div>

                    {/* Dual Column for Key Points & Highlights */}
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      {/* Key Points */}
                      <div className="p-10 md:p-12 border-b md:border-b-0 md:border-r border-emerald-50 dark:border-white/5 bg-emerald-50/10 dark:bg-white/[0.01]">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600">
                            <CheckCircle2 size={24} />
                          </div>
                          <h3 className={`text-2xl font-black text-[#111827] dark:text-white tracking-tighter uppercase ${isNonLatin ? 'normal-case' : 'italic'}`}>Key Points</h3>
                        </div>
                        <ul className="space-y-6">
                          {(result.key_points || []).map((point: string, i: number) => (
                            <li key={i} className="flex items-start gap-4 text-base font-medium text-[#374151] dark:text-slate-400 leading-relaxed">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2.5 shrink-0 shadow-lg shadow-emerald-500/40" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Highlights */}
                      <div className="p-10 md:p-12">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="p-3 bg-teal-500/10 rounded-2xl text-teal-600">
                            <Star size={24} fill="currentColor" />
                          </div>
                          <h3 className={`text-2xl font-black text-[#111827] dark:text-white tracking-tighter uppercase ${isNonLatin ? 'normal-case' : 'italic'}`}>Highlights</h3>
                        </div>
                        <ul className="space-y-6">
                          {(result.highlights || []).map((highlight: string, i: number) => (
                            <li key={i} className="flex items-start gap-4 text-base font-medium text-[#374151] dark:text-slate-400 leading-relaxed">
                              <div className="w-2 h-2 rounded-full bg-amber-500 mt-2.5 shrink-0 shadow-lg shadow-amber-500/40" />
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTool && (
                <button
                  onClick={() => setActiveTool(null)}
                  className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-all mb-8 group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-all">
                    <ChevronRight className="rotate-180" size={18} />
                  </div>
                  <span className="text-xs font-black tracking-widest uppercase">Back to Overview</span>
                </button>
              )}

              {/* Tool Results Rendering */}
              {toolLoading && (
                <div className="bg-white dark:bg-white/5 p-16 rounded-[3rem] border border-slate-100 dark:border-white/10 flex flex-col items-center justify-center gap-6 animate-pulse">
                  <Loader2 className="animate-spin text-emerald-500 w-12 h-12" />
                  <p className="text-[#374151] dark:text-slate-400 font-bold uppercase tracking-widest text-xs">AI is crafting your {toolLoading.replace('_', ' ')}...</p>
                </div>
              )}

              {activeTool === 'detailed_summary' && toolResults.detailed_summary && (
                <div id="tool-detailed_summary" className="bg-white dark:bg-[#080808]/60 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-2xl backdrop-blur-xl relative group/report animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <ReportControlBar
                    language={selectedLanguage}
                    setLanguage={setSelectedLanguage}
                    currentTool={activeTool}
                    setTool={setActiveTool}
                    onCopy={handleCopy}
                    onExport={handleExport}
                  />

                  <div className="p-10 md:p-12">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="p-3 bg-blue-500/10 text-blue-500 rounded-2xl">
                        <FileText size={24} />
                      </div>
                      <h2 className={`text-3xl font-black text-[#111827] dark:text-white tracking-tighter uppercase ${isNonLatin ? 'normal-case' : 'italic'}`}>Detailed Intelligence</h2>
                    </div>
                    <div className="prose prose-slate dark:prose-invert max-w-none text-lg font-medium leading-relaxed">
                      <ReactMarkdown>
                        {getStringContent(toolResults.detailed_summary)}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              {activeTool === 'points_oriented' && toolResults.points_oriented && (
                <div id="tool-points_oriented" className="bg-white dark:bg-[#080808]/60 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-2xl backdrop-blur-xl relative group/report animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <ReportControlBar
                    language={selectedLanguage}
                    setLanguage={setSelectedLanguage}
                    currentTool={activeTool}
                    setTool={setActiveTool}
                    onCopy={handleCopy}
                    onExport={handleExport}
                  />

                  <div className="p-10 md:p-12">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl">
                        <ListOrdered size={24} />
                      </div>
                      <h2 className={`text-3xl font-black text-[#111827] dark:text-white tracking-tighter uppercase ${isNonLatin ? 'normal-case' : 'italic'}`}>Structured Insights</h2>
                    </div>
                    <ul className="space-y-6">
                      {(Array.isArray(toolResults.points_oriented) ? toolResults.points_oriented : []).map((point: string, i: number) => (
                        <li key={i} className="flex items-start gap-6 p-6 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 text-[#374151] dark:text-slate-300 transition-all hover:translate-x-1 group">
                          <span className="text-xl font-black text-indigo-500/30 group-hover:text-indigo-500 transition-colors">{String(i + 1).padStart(2, '0')}</span>
                          <span className="font-semibold leading-relaxed tracking-tight">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTool === 'timestamped_highlights' && toolResults.timestamped_highlights && (
                <div id="tool-timestamped_highlights" className="bg-white dark:bg-[#080808]/60 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-2xl backdrop-blur-xl relative group/report animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <ReportControlBar
                    language={selectedLanguage}
                    setLanguage={setSelectedLanguage}
                    currentTool={activeTool}
                    setTool={setActiveTool}
                    onCopy={handleCopy}
                    onExport={handleExport}
                  />

                  <div className="p-10 md:p-12">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
                        <Clock size={24} />
                      </div>
                      <h2 className={`text-3xl font-black text-[#111827] dark:text-white tracking-tighter uppercase ${isNonLatin ? 'normal-case' : 'italic'}`}>Visual Timeline</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {(Array.isArray(toolResults.timestamped_highlights) ? toolResults.timestamped_highlights : []).map((highlight: string, i: number) => {
                        const [time, ...desc] = highlight.split(' – ');
                        return (
                          <div key={i} className="flex items-center gap-6 p-6 rounded-[1.5rem] bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 hover:border-amber-500/20 transition-all group">
                            <span className="bg-[#111827] dark:bg-amber-500/10 text-white dark:text-amber-400 px-4 py-2 rounded-xl font-black text-sm border border-white/10 dark:border-amber-500/20 group-hover:scale-110 transition-transform">
                              {time}
                            </span>
                            <span className="text-[#374151] dark:text-slate-300 font-bold tracking-tight">{desc.join(' – ')}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeTool === 'reading_mode' && toolResults.reading_mode && (
                <div id="tool-reading_mode" className="bg-white dark:bg-[#080808]/60 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-2xl backdrop-blur-xl relative group/report animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <ReportControlBar
                    language={selectedLanguage}
                    setLanguage={setSelectedLanguage}
                    currentTool={activeTool}
                    setTool={setActiveTool}
                    onCopy={handleCopy}
                    onExport={handleExport}
                    isDark={true}
                  />

                  {/* Document Watermark */}
                  <div className="absolute top-10 right-10 opacity-5 dark:opacity-10 pointer-events-none select-none">
                    <BookOpen size={200} className="text-slate-200 dark:text-white/10" />
                  </div>

                  <div className="relative z-10 p-10 md:p-12">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl">
                        <BookOpen size={24} />
                      </div>
                      <h2 className="text-3xl font-black text-[#111827] dark:text-white italic tracking-tighter uppercase">Premium Article</h2>
                    </div>

                    <article className="prose prose-slate dark:prose-invert max-w-none">
                      <h1 className="text-3xl font-black text-[#111827] dark:text-white mb-12 leading-[1.1] tracking-tighter uppercase italic">
                        {toolResults.reading_mode?.title || result?.video_title || 'Article'}
                      </h1>

                      {(toolResults.reading_mode?.introduction || toolResults.reading_mode?.summary) && (
                        <div className="bg-slate-50 dark:bg-white/[0.02] border-l-[6px] border-emerald-500 p-10 rounded-r-3xl mb-16 shadow-sm">
                          <p className="text-lg text-[#374151] dark:text-slate-300 leading-relaxed font-medium italic mb-0">
                            {toolResults.reading_mode?.introduction || toolResults.reading_mode?.summary}
                          </p>
                        </div>
                      )}

                      <div className="space-y-20">
                        {(toolResults.reading_mode?.sections || []).map((section, i) => (
                          <section key={i} className="group">
                            <h2 className="text-3xl font-black text-[#111827] dark:text-white border-b-2 border-slate-100 dark:border-white/5 pb-4 mb-8 flex items-center gap-4 group-hover:border-emerald-500/30 transition-colors">
                              <span className="text-emerald-500 text-sm font-black tracking-widest font-mono">SECTION 0{i + 1}</span>
                              <span className="tracking-tight italic">{section.heading || section.title || `Chapter ${i + 1}`}</span>
                            </h2>
                            <div className="text-[#374151] dark:text-slate-300 leading-[1.8] text-lg font-medium tracking-tight space-y-6">
                              <ReactMarkdown
                                components={{
                                  strong: (props) => <span className="font-black text-[#111827] dark:text-white" {...props} />,
                                  li: (props) => <li className="marker:text-emerald-500 list-disc ml-6 pl-2" {...props} />
                                }}
                              >
                                {typeof section.content === 'string' ? section.content : (section.text || '')}
                              </ReactMarkdown>
                            </div>
                          </section>
                        ))}
                      </div>

                      {toolResults.reading_mode?.conclusion && (
                        <div className="mt-24 pt-12 border-t-4 border-slate-50 dark:border-white/5">
                          <h3 className="text-2xl font-black text-[#111827] dark:text-white italic uppercase tracking-tighter mb-6 flex items-center gap-3">
                            <CheckCircle2 className="text-emerald-500" /> Executive Conclusion
                          </h3>
                          <div className="bg-[#111827] dark:bg-black p-12 rounded-[2.5rem] text-white shadow-2xl shadow-black/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-125" />
                            <p className="text-lg leading-relaxed font-bold tracking-tight relative z-10">
                              {toolResults.reading_mode?.conclusion}
                            </p>
                          </div>
                        </div>
                      )}
                    </article>
                  </div>
                </div>
              )}

              {activeTool === 'podcast_script' && toolResults.podcast_script && (
                <div id="tool-podcast_script" className="bg-white dark:bg-[#080808]/60 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-2xl backdrop-blur-xl relative group/report animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <ReportControlBar
                    language={selectedLanguage}
                    setLanguage={setSelectedLanguage}
                    currentTool={activeTool}
                    setTool={setActiveTool}
                    onCopy={handleCopy}
                    onExport={handleExport}
                  />

                  <div className="p-10 md:p-12">
                    <div className="flex items-center justify-between gap-4 mb-10">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl">
                          <Sparkles size={24} />
                        </div>
                        <h2 className={`text-3xl font-black text-[#111827] dark:text-white tracking-tighter uppercase ${isNonLatin ? 'normal-case' : 'italic'}`}>Podcast Script</h2>
                      </div>
                      <TTSButton text={typeof toolResults.podcast_script === 'string' ? toolResults.podcast_script : JSON.stringify(toolResults.podcast_script)} language={selectedLanguage} />
                    </div>
                    <div className="prose prose-slate dark:prose-invert max-w-none text-lg font-medium leading-relaxed bg-slate-50/50 dark:bg-white/[0.02] p-8 rounded-3xl border border-slate-100 dark:border-white/5 shadow-inner">
                      <ReactMarkdown>
                        {getStringContent(toolResults.podcast_script)}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar: 4 Columns */}
            <div className="lg:col-span-4 space-y-10">
              {/* Video Info Card */}
              <div className="bg-white dark:bg-[#080808]/60 rounded-[3rem] border border-slate-100 dark:border-white/5 overflow-hidden shadow-sm backdrop-blur-xl">
                <div className="aspect-video relative overflow-hidden">
                  <Image
                    src={`https://img.youtube.com/vi/${result.videoId || result.video_id}/maxresdefault.jpg`}
                    alt="Video Thumbnail"
                    width={480}
                    height={270}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                </div>
                <div className="p-8">
                  <h3 className="text-xl font-black text-[#111827] dark:text-white italic tracking-tighter leading-tight">
                    {result.title || result.video_title}
                  </h3>
                  <div className="mt-6 flex items-center justify-between">
                    <a
                      href={result.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-all font-black uppercase tracking-widest text-[10px]"
                    >
                      <Youtube size={16} /> Open YouTube
                    </a>
                  </div>
                </div>
              </div>

              {/* Key Takeaways Card */}
              <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-[3rem] p-10 text-white shadow-2xl shadow-emerald-500/20 relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                  <Lightbulb size={120} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-white/10 rounded-2xl text-amber-300">
                      <Lightbulb size={24} fill="currentColor" />
                    </div>
                    <h3 className="text-2xl font-black italic tracking-tighter uppercase">Key Takeaways</h3>
                  </div>
                  <ul className="space-y-4">
                    {(result.key_takeaways || []).map((takeaway: string, i: number) => (
                      <li key={i} className="bg-white/10 backdrop-blur-md p-5 rounded-[1.5rem] border border-white/10 text-sm font-bold tracking-tight leading-relaxed shadow-lg">
                        {takeaway}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardContainer>
  );
}
