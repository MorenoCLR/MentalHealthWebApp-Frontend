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

    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // set cookies on the response we'll return so the browser receives them
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
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
      // redirect to /error without throwing
      const redirectUrl = new URL('/error', request.url)
      redirectUrl.searchParams.set('reason', 'login_failed')
      const response = NextResponse.redirect(redirectUrl)
      // copy any cookies we set
      supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
        response.cookies.set(name, value)
      })
      return response
    }

    console.log('Sign-in successful for:', email)
    // On success, redirect to /account and include the cookies we set
    const successUrl = new URL('/account', request.url)
    const response = NextResponse.redirect(successUrl)
    // copy any cookies we set
    supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
      response.cookies.set(name, value)
    })
    return response
  } catch (err) {
    console.error('Unexpected login error:', err instanceof Error ? err.message : err)
    return NextResponse.json(
      { error: 'Internal server error during login' },
      { status: 500 }
    )
  }
}
