import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  
  // O link mágico de OTP no Supabase também pode usar `token_hash` e `type=magiclink`
  // O auth.exchangeCodeForSession lida bem com `code` (se estiver no fluxo PKCE).
  // A partir do @supabase/ssr novo, o emailRedirectTo redireciona com code.

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(`${origin}/minha-alianca`);
    }
  }

  // Se houver algum erro ou não houver código, redireciona de volta para login com erro
  return NextResponse.redirect(`${origin}/login?error=InvalidLink`);
}
