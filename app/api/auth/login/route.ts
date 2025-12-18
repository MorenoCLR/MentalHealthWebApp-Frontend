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

    // Create response object using proper host from request headers
    const protocol = request.headers.get('x-forwarded-proto') || 'https'
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`

    const successUrl = new URL('/dashboard', baseUrl)
    const errorUrl = new URL('/error', baseUrl)
    errorUrl.searchParams.set('reason', 'login_failed')

    const response = NextResponse.redirect(successUrl)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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
        code: error.name,
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
