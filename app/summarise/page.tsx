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
  Check,
  User
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
  const [activeTool, setActiveTool] = useState<string | null>('detailed_summary');
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
      setActiveTool('detailed_summary');
    }
    try {
      let response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, language: selectedLanguage, mode: 'detailed_summary' }),
      });
      let data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Something went wrong');

      if (data.status === 'fallback_summary_used') {
        setNotice('Summary generated using fallback AI mode.');
      } else {
        setNotice(null);
      }
      
      setResult(data);
      setToolResults({ detailed_summary: data.detailed_summary || data });
      setActiveTool('detailed_summary');
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
  }: {
    language: string,
    setLanguage: (l: string) => void,
    currentTool: string | null,
    setTool: (t: string | null) => void,
    onCopy: () => void,
    onExport: () => void,
  }) => (
    <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-b border-blue-100/50 dark:border-white/5 bg-white/60 dark:bg-slate-800/40 backdrop-blur-xl gap-4 relative z-10">
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <LanguageSelector value={language} onChange={setLanguage} />
        <div className="w-[1px] h-6 bg-slate-200 dark:bg-white/10 hidden sm:block mx-1" />
        <div className="relative group w-full sm:w-56">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-blue-500">
            <Sparkles size={14} />
          </div>
          <select
            value={currentTool || 'detailed_summary'}
            onChange={(e) => {
              const val = e.target.value;
              setTool(val);
              window.dispatchEvent(new CustomEvent('generate-tool-content', { detail: { mode: val } }));
            }}
            className="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/10 rounded-xl py-2 pl-9 pr-8 text-[11px] font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer appearance-none uppercase tracking-wider shadow-sm"
          >
            <option value="detailed_summary">Detailed Summary</option>
            <option value="points_oriented">Points Oriented</option>
            <option value="timestamped_highlights">Timestamped Highlights</option>
            <option value="reading_mode">Reading Mode</option>
          </select>
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
            <ChevronRight size={14} className="rotate-90" />
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <button
          onClick={onCopy}
          className="flex-1 sm:flex-none h-10 px-4 bg-white/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider"
        >
          {copied ? <Check size={14} className="text-blue-500" /> : <Copy size={14} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
        <button
          onClick={onExport}
          className="flex-1 sm:flex-none h-10 px-5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider"
        >
          <Download size={14} />
          <span>Export</span>
        </button>
      </div>
    </div>
  );

  return (
    <DashboardContainer>
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-white/60 dark:bg-slate-900/50 backdrop-blur-xl border border-blue-100/50 dark:border-white/10 rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow max-w-4xl mx-auto w-full relative z-20 flex flex-col md:flex-row md:items-center gap-5">
          <div className="hidden md:flex items-center gap-3 shrink-0 px-2 group/logo relative">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-[1.25rem] text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100/50 dark:border-blue-800/30 shrink-0 relative z-10 transition-transform group-hover/logo:scale-105">
               <Sparkles size={20} />
            </div>
            <div className="relative z-10">
               <h1 className={`font-bold tracking-tight text-xl leading-none text-slate-800 dark:text-white`}>AI YT <br/><span className="text-blue-600 dark:text-blue-400 text-[10px] font-semibold uppercase tracking-wider block mt-0.5">Summariser</span></h1>
            </div>
          </div>
          <form onSubmit={handleGenerate} className="flex-1 flex flex-col sm:flex-row gap-3 w-full relative">
            <div className="flex-1 relative group/input">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none transition-transform group-focus-within/input:text-blue-500">
                <Youtube className="text-slate-400 dark:text-slate-500 w-[18px] h-[18px] group-focus-within/input:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Paste YouTube Link..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-white/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/10 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-300 transition-all placeholder:text-slate-400 text-sm font-medium text-slate-800 dark:text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] h-12"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !url}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 rounded-xl shadow-sm hover:shadow hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 flex items-center justify-center gap-2 text-sm whitespace-nowrap h-12 outline-none cursor-pointer"
            >
              {loading ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <Sparkles size={16} />
              )}
              Summarise
            </button>
          </form>

          {error && (
            <div className="absolute bottom-[-50px] left-0 right-0 p-2.5 bg-red-50/90 border border-red-100 rounded-xl animate-in slide-in-from-bottom-2 shadow-sm backdrop-blur-md">
              <p className="text-xs font-semibold text-red-600 text-center flex items-center justify-center gap-2">
                <AlertCircle size={14} />
                {error}
              </p>
            </div>
          )}
          {notice && !error && (
            <div className="absolute bottom-[-50px] left-0 right-0 p-2.5 bg-sky-50/90 border border-sky-100 rounded-xl animate-in slide-in-from-bottom-2 shadow-sm backdrop-blur-md">
              <p className="text-xs font-semibold text-sky-600 dark:text-sky-400 text-center flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin text-sky-500" />
                {notice}
              </p>
            </div>
          )}
        </div>

        {previewInfo && !result && (
          <div className="flex justify-center animate-in fade-in slide-in-from-top-4 duration-500 mt-6 mb-6 px-4">
            <div className="bg-white/60 dark:bg-slate-900/60 p-5 rounded-3xl border border-blue-100/50 dark:border-white/10 flex flex-col md:flex-row gap-6 items-center backdrop-blur-xl shadow-sm hover:shadow-md transition-all w-full max-w-4xl mx-auto relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative w-full md:w-56 aspect-video rounded-2xl overflow-hidden shadow-sm shrink-0 bg-slate-100 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 group-hover:scale-[1.02] transition-transform duration-700 z-10">
                <Image src={`https://img.youtube.com/vi/${currentVideoId}/mqdefault.jpg`} unoptimized fill className="object-cover" alt="Video Preview" />
              </div>
              <div className="flex-1 relative z-10 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400 mb-4 border border-blue-100/50 dark:border-blue-800/30">
                  <CheckCircle2 size={12} className="text-blue-500" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Link Validated</span>
                </div>
                <h3 className="font-bold text-lg md:text-xl line-clamp-2 text-slate-800 dark:text-white leading-tight tracking-tight mb-3">
                  {previewInfo.title}
                </h3>
                <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500 dark:text-slate-400">
                  <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                    <User size={10} />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider">{previewInfo.author_name}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-10 animate-in fade-in slide-in-from-top-4 duration-1000 w-full max-w-5xl mx-auto">
            {/* Video Info Card (Moved above summary content) */}
            <div className="bg-white/60 dark:bg-slate-950/60 flex flex-col md:flex-row items-center gap-6 rounded-[2rem] p-6 border border-blue-100/50 dark:border-white/10 shadow-sm hover:shadow-md transition-all backdrop-blur-xl overflow-hidden relative group/header">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-3xl rounded-full -mr-32 -mt-32 group-hover/header:scale-110 transition-transform duration-1000" />
              
              <div className="w-full md:w-64 aspect-video relative overflow-hidden rounded-2xl shrink-0 shadow-sm border border-slate-200/50 dark:border-white/5 group-hover/header:rotate-1 group-hover/header:scale-[1.02] transition-transform duration-700">
                <Image
                  src={`https://img.youtube.com/vi/${result.videoId || result.video_id}/mqdefault.jpg`}
                  alt="Video Thumbnail"
                  fill
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1 w-full flex flex-col items-start text-left relative z-10 shrink pr-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-800/30">
                    <Sparkles size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Analysis Complete</span>
                  </div>
                  {(result as any).duration && (
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-white/40 dark:bg-white/5 px-2 py-1 rounded-lg border border-slate-200/50 dark:border-white/5">
                      {(result as any).duration}
                    </div>
                  )}
                </div>
                
                <h3 className="line-clamp-2 text-xl md:text-2xl font-bold text-slate-800 dark:text-white tracking-tight leading-tight mb-5">
                  {result.title || result.video_title}
                </h3>
                
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={result.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 transition-all font-bold text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-xl border border-transparent shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95"
                  >
                    <Youtube size={14} /> View Original
                  </a>
                  <button className="p-2.5 bg-white/60 dark:bg-slate-800/60 rounded-xl border border-slate-200/50 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm transition-all active:scale-95">
                    <Star size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content: Full Width */}
            <div className="w-full space-y-6">
              {!activeTool && (
                <>
                  <div className="bg-white/60 dark:bg-slate-900/60 flex flex-col rounded-3xl border border-blue-100/50 dark:border-white/10 shadow-sm backdrop-blur-xl relative group/report animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden">
                    <ReportControlBar
                      language={selectedLanguage}
                      setLanguage={setSelectedLanguage}
                      currentTool={activeTool}
                      setTool={setActiveTool}
                      onCopy={handleCopy}
                      onExport={handleExport}
                    />

                    {/* Summary Section */}
                    <div className="p-8 md:p-10 border-b border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100/50">
                          <Sparkles size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Executive Summary</h2>
                      </div>
                      <div className="flex flex-col gap-4">
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm md:text-base font-medium">
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
                      <div className="p-8 md:p-10 border-b md:border-b-0 md:border-r border-slate-100 dark:border-white/5 bg-blue-50/10 dark:bg-white/[0.01]">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-100/50">
                            <CheckCircle2 size={20} />
                          </div>
                          <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Key Points</h3>
                        </div>
                        <ul className="space-y-4">
                          {(result.key_points || []).map((point: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0 shadow-sm" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Highlights */}
                      <div className="p-8 md:p-10">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-orange-600 dark:text-orange-400 shadow-sm border border-slate-100/50">
                            <Star size={20} fill="currentColor" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Highlights</h3>
                        </div>
                        <ul className="space-y-4">
                          {(result.highlights || []).map((highlight: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0 shadow-sm" />
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Tool Results Rendering */}
              {toolLoading && (
                <div className="bg-white dark:bg-white/5 p-16 rounded-[3rem] border border-slate-100 dark:border-white/10 flex flex-col items-center justify-center gap-6 animate-pulse">
                  <Loader2 className="animate-spin text-emerald-500 w-12 h-12" />
                  <p className="text-[#374151] dark:text-slate-400 font-bold uppercase tracking-widest text-xs">AI is crafting your {toolLoading.replace('_', ' ')}...</p>
                </div>
              )}

              {activeTool === 'detailed_summary' && toolResults.detailed_summary && (
                <div id="tool-detailed_summary" className="bg-white/60 dark:bg-slate-900/60 flex flex-col rounded-3xl border border-blue-100/50 dark:border-white/10 shadow-sm backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden">
                  <ReportControlBar
                    language={selectedLanguage}
                    setLanguage={setSelectedLanguage}
                    currentTool={activeTool}
                    setTool={setActiveTool}
                    onCopy={handleCopy}
                    onExport={handleExport}
                  />

                  <div className="p-8 md:p-12">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl shadow-sm border border-blue-100/50">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Detailed Summary</h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Comprehensive intelligence</p>
                      </div>
                    </div>
                    
                    <div className="prose prose-slate dark:prose-invert max-w-none prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-p:text-sm md:prose-p:text-base prose-p:mb-6 prose-strong:text-blue-600 dark:prose-strong:text-blue-400">
                      <ReactMarkdown>
                        {getStringContent(toolResults.detailed_summary)}
                      </ReactMarkdown>
                    </div>
                    
                    <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 flex justify-start">
                      <TTSButton text={getStringContent(toolResults.detailed_summary)} language={selectedLanguage} />
                    </div>
                  </div>
                </div>
              )}

              {activeTool === 'points_oriented' && toolResults.points_oriented && (
                <div id="tool-points_oriented" className="bg-white/60 dark:bg-slate-900/60 flex flex-col rounded-3xl border border-blue-100/50 dark:border-white/10 shadow-sm backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden">
                  <ReportControlBar
                    language={selectedLanguage}
                    setLanguage={setSelectedLanguage}
                    currentTool={activeTool}
                    setTool={setActiveTool}
                    onCopy={handleCopy}
                    onExport={handleExport}
                  />

                  <div className="p-8 md:p-12">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-sm border border-indigo-100/50">
                        <ListOrdered size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Structured Insights</h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Key takeaways & points</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {(Array.isArray(toolResults.points_oriented) ? toolResults.points_oriented : []).map((point: string, i: number) => (
                        <div key={i} className="flex items-start gap-5 p-5 rounded-2xl bg-white/40 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all group shadow-sm">
                          <div className="shrink-0 w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-800/30 group-hover:scale-110 transition-transform">
                            {String(i + 1).padStart(2, '0')}
                          </div>
                          <p className="text-sm md:text-[15px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
                            {point}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTool === 'timestamped_highlights' && toolResults.timestamped_highlights && (
                <div id="tool-timestamped_highlights" className="bg-white/60 dark:bg-slate-900/60 flex flex-col rounded-3xl border border-blue-100/50 dark:border-white/10 shadow-sm backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden">
                  <ReportControlBar
                    language={selectedLanguage}
                    setLanguage={setSelectedLanguage}
                    currentTool={activeTool}
                    setTool={setActiveTool}
                    onCopy={handleCopy}
                    onExport={handleExport}
                  />

                  <div className="p-8 md:p-12">
                    <div className="flex items-center gap-4 mb-10">
                      <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl shadow-sm border border-amber-100/50">
                        <Clock size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">Video Highlights</h2>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Chronological timeline</p>
                      </div>
                    </div>
                    
                    <div className="relative pl-8 md:pl-10 space-y-8 before:absolute before:left-[15px] md:before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] before:bg-slate-100 dark:before:bg-white/5">
                      {(Array.isArray(toolResults.timestamped_highlights) ? toolResults.timestamped_highlights : []).map((highlight: string, i: number) => {
                        const [time, ...desc] = highlight.split(' – ');
                        return (
                          <div key={i} className="relative group">
                            <div className="absolute -left-12 md:-left-12 top-1 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-2 border-amber-400 shadow-sm flex items-center justify-center z-10 group-hover:scale-110 transition-transform">
                              <div className="w-2 h-2 rounded-full bg-amber-400 group-hover:scale-150 transition-transform" />
                            </div>
                            
                            <div className="bg-white/40 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 p-5 rounded-2xl shadow-sm hover:border-amber-200 dark:hover:border-amber-800/50 transition-all flex flex-col md:flex-row md:items-center gap-4">
                              <span className="shrink-0 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-lg text-xs font-bold font-mono border border-amber-100/50 dark:border-amber-800/30 w-fit">
                                {time}
                              </span>
                              <p className="text-sm md:text-[15px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                                {desc.join(' – ')}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {activeTool === 'reading_mode' && toolResults.reading_mode && (
                <div id="tool-reading_mode" className="bg-white/60 dark:bg-slate-900/60 flex flex-col rounded-3xl border border-blue-100/50 dark:border-white/10 shadow-sm backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-1000 overflow-hidden">
                  <ReportControlBar
                    language={selectedLanguage}
                    setLanguage={setSelectedLanguage}
                    currentTool={activeTool}
                    setTool={setActiveTool}
                    onCopy={handleCopy}
                    onExport={handleExport}
                  />

                  <div className="p-8 md:p-14 md:pb-20 max-w-4xl mx-auto w-full">
                    <header className="mb-16">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-sm border border-emerald-100/50">
                          <BookOpen size={18} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Premium Editorial Mode</span>
                      </div>
                      
                      <h1 className="text-3xl md:text-5xl font-bold text-slate-800 dark:text-white leading-[1.1] mb-8 tracking-tight">
                        {toolResults.reading_mode?.title || result?.video_title}
                      </h1>

                      {(toolResults.reading_mode?.introduction || toolResults.reading_mode?.summary) && (
                        <div className="relative p-8 rounded-2xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-800/20 shadow-inner">
                          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-2xl" />
                          <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-medium italic mb-0">
                            {toolResults.reading_mode?.introduction || toolResults.reading_mode?.summary}
                          </p>
                        </div>
                      )}
                    </header>

                    <div className="space-y-20">
                      {(toolResults.reading_mode?.sections || []).map((section, i) => (
                        <section key={i} className="relative">
                          <div className="flex flex-col items-start gap-4 mb-8">
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded text-[9px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200/50 dark:border-white/5">
                              Section 0{i + 1}
                            </span>
                            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
                              {section.heading || section.title || `Insight ${i + 1}`}
                            </h2>
                          </div>
                          
                          <div className="prose prose-slate dark:prose-invert max-w-none prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-[1.8] prose-p:text-base md:prose-p:text-lg prose-p:mb-6 prose-strong:text-blue-600 dark:prose-strong:text-blue-400">
                            <ReactMarkdown
                              components={{
                                li: (props) => <li className="marker:text-blue-500 list-disc ml-6 pl-2" {...props} />
                              }}
                            >
                              {typeof section.content === 'string' ? section.content : (section.text || '')}
                            </ReactMarkdown>
                          </div>
                        </section>
                      ))}
                    </div>

                    {toolResults.reading_mode?.conclusion && (
                      <div className="mt-20 pt-12 border-t border-slate-100 dark:border-white/5">
                        <div className="bg-slate-800 dark:bg-slate-900 p-10 rounded-3xl text-white shadow-xl relative overflow-hidden">
                          <div className="flex items-center gap-3 mb-6 relative z-10">
                            <CheckCircle2 className="text-blue-400" size={20} />
                            <h3 className="text-lg font-bold uppercase tracking-wider">Executive Conclusion</h3>
                          </div>
                          <p className="text-base md:text-lg leading-relaxed font-medium text-slate-300 relative z-10">
                            {toolResults.reading_mode?.conclusion}
                          </p>
                          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-12 flex justify-center">
                      <TTSButton text={getStringContent(toolResults.reading_mode)} language={selectedLanguage} />
                    </div>
                  </div>
                </div>
              )}

              {activeTool === 'podcast_script' && toolResults.podcast_script && (
                <div id="tool-podcast_script" className="bg-white dark:bg-[#191e16]/80 flex flex-col rounded-[3.5rem] border border-emerald-100 dark:border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] dark:shadow-none backdrop-blur-3xl relative group/report animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden">
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
                    <div className="prose prose-slate dark:prose-invert prose-headings:font-black prose-headings:italic prose-headings:uppercase prose-headings:tracking-tighter prose-p:text-[#374151] dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-p:font-medium prose-p:text-lg max-w-none bg-slate-50/50 dark:bg-white/[0.02] p-8 rounded-3xl border border-emerald-50 dark:border-white/10 shadow-inner">
                      <ReactMarkdown>
                        {getStringContent(toolResults.podcast_script)}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardContainer>
  );
}
