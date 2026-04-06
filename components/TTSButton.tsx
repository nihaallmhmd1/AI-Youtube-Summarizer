'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, CircleStop, Loader2 } from 'lucide-react';

interface TTSButtonProps {
  text: string;
  language?: string;
}

const LANGUAGE_CODE_MAP: Record<string, string> = {
  'English': 'en-US',
  'Spanish': 'es-ES',
  'French': 'fr-FR',
  'German': 'de-DE',
  'Italian': 'it-IT',
  'Japanese': 'ja-JP',
  'Korean': 'ko-KR',
  'Chinese': 'zh-CN',
  'Hindi': 'hi-IN',
  'Malayalam': 'ml-IN',
  'Arabic': 'ar-SA',
  'Portuguese': 'pt-PT',
  'Russian': 'ru-RU',
  'Turkish': 'tr-TR',
  'Dutch': 'nl-NL',
  'Polish': 'pl-PL',
  'Swedish': 'sv-SE',
  'Bengali': 'bn-IN',
  'Tamil': 'ta-IN',
  'Telugu': 'te-IN',
  'Urdu': 'ur-PK',
  'Vietnamese': 'vi-VN',
  'Thai': 'th-TH',
  'Greek': 'el-GR',
  'Hebrew': 'he-IL',
};

export default function TTSButton({ text, language = 'English' }: TTSButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [supported, setSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setSupported(false);
    }
    // Cleanup on unmount
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Stop when text changes
  useEffect(() => {
    if (isPlaying) {
      window.speechSynthesis?.cancel();
      setIsPlaying(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const handleSpeak = () => {
    if (!window.speechSynthesis) return;

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    const langCode = LANGUAGE_CODE_MAP[language] || 'en-US';

    // Clean the text: strip markdown symbols for better reading
    const cleanText = text
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/`/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\n+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = langCode;
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to pick a matching voice for the language
    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find(v => v.lang.startsWith(langCode.split('-')[0]));
    if (matchingVoice) utterance.voice = matchingVoice;

    utterance.onstart = () => {
      setIsLoading(false);
      setIsPlaying(true);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);

    // Safeguard: if onstart doesn't fire (some browsers), clear loading after 500ms
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  if (!supported) return null;

  return (
    <button
      onClick={handleSpeak}
      className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center gap-2 group border border-blue-100 dark:border-blue-800/30 shadow-sm"
      title={isPlaying ? 'Stop listening' : 'Listen to this'}
    >
      {isLoading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : isPlaying ? (
        <CircleStop size={14} className="text-red-500 group-hover:scale-110 transition-transform" />
      ) : (
        <Volume2 size={14} className="group-hover:scale-110 transition-transform" />
      )}
      <span className="text-[11px] font-semibold uppercase tracking-wider hidden md:inline">
        {isPlaying ? 'Stop' : 'Listen'}
      </span>
    </button>
  );
}
