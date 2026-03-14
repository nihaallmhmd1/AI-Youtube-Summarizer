'use client';

import React, { useState, useRef } from 'react';
import { Volume2, Loader2, CircleStop } from 'lucide-react';

interface TTSButtonProps {
  text: string;
  language?: string;
}

export default function TTSButton({ text, language = 'en' }: TTSButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getLanguageCode = (lang: string) => {
    const map: Record<string, string> = {
      'English': 'en',
      'Spanish': 'es',
      'French': 'fr',
      'German': 'de',
      'Italian': 'it',
      'Japanese': 'ja',
      'Korean': 'ko',
      'Chinese': 'zh-CN',
      'Hindi': 'hi',
      'Malayalam': 'ml',
      'Arabic': 'ar',
      'Portuguese': 'pt',
      'Russian': 'ru',
    };
    return map[lang] || 'en';
  };

  const handleSpeak = () => {
    if (isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      return;
    }

    setLoading(true);
    const langCode = getLanguageCode(language);
    
    // Split text into chunks to respect Google TTS length limits (~200 chars)
    // For simplicity, we just take the first 200 for now or use a cleaner split if needed
    // However, for a "Play" experience, we'll try the full text first and see if it works
    const encodedText = encodeURIComponent(text.substring(0, 500)); 
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=${langCode}&client=tw-ob`;

    if (!audioRef.current) {
      audioRef.current = new Audio(url);
    } else {
      audioRef.current.src = url;
    }

    audioRef.current.oncanplaythrough = () => {
      setLoading(false);
      setIsPlaying(true);
      audioRef.current?.play();
    };

    audioRef.current.onended = () => {
      setIsPlaying(false);
    };

    audioRef.current.onerror = () => {
      setLoading(false);
      setIsPlaying(false);
      console.error('TTS Error');
    };
  };

  return (
    <button
      onClick={handleSpeak}
      disabled={loading}
      className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-all flex items-center gap-2 group"
      title={isPlaying ? "Stop listening" : "Listen to this"}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : isPlaying ? (
        <CircleStop size={16} className="text-rose-500" />
      ) : (
        <Volume2 size={16} className="group-hover:scale-110 transition-transform" />
      )}
      <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">
        {isPlaying ? "Stop" : "Listen"}
      </span>
    </button>
  );
}
