import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '').trim()

    console.log('Login attempt:', { email, passwordLength: password.length })

    if (!email || !password) {
      console.error('Missing email or password', { email, password })
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Create response object
    const successUrl = new URL('/account', request.url)
    const errorUrl = new URL('/error', request.url)
    errorUrl.searchParams.set('reason', 'login_failed')
    
    let response = NextResponse.redirect(successUrl)

    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // Set cookies on the response
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      console.error('Sign-in error details:', {
        message: error.message,
        status: error.status,
        code: (error as any).code,
        fullError: error,
      })
      return NextResponse.redirect(errorUrl)
    }

    console.log('Sign-in successful for:', email)
    return response
  } catch (err) {
    console.error('Unexpected login error:', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { error: 'Internal server error during login' },
      { status: 500 }
    )
  }
}
