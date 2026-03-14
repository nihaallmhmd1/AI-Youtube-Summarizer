import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getURL() {
  let url =
    process?.env?.NEXT_PUBLIC_APP_URL ||
    process?.env?.NEXT_PUBLIC_VERCEL_URL || // Vercel sets this in previews
    'http://localhost:3000';
  
  // Client-side: use current origin as source of truth
  if (typeof window !== 'undefined') {
    url = window.location.origin;
  }
  
  // Clean up URL
  url = url.replace(/\/$/, ''); // Remove trailing slash
  url = url.includes('http') ? url : `https://${url}`; // Ensure scheme
  
  return url;
}
