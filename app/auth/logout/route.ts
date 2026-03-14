import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getURL } from '@/lib/utils';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const origin = getURL();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Sign out from Supabase (invalidates session on server)
  await supabase.auth.signOut();

  // Redirect to home page
  return NextResponse.redirect(`${origin}/`, {
    status: 303, // See Other (standard for POST-redirect-GET)
  });
}
