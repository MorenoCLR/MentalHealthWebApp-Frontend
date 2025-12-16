import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// Creating a handler to a GET request to route /auth/confirm
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') || '/dashboard'

  // Create redirect link without the secret token
  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  redirectTo.searchParams.delete('code')
  redirectTo.searchParams.delete('type')
  redirectTo.searchParams.delete('token_hash')

  // Handle password recovery FIRST (before code) - Supabase sends both code and type=recovery
  if (type === 'recovery' && code) {
    const supabase = await createClient()
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        console.log('Password recovery session established')
        const resetUrl = request.nextUrl.clone()
        resetUrl.pathname = '/reset-password'
        resetUrl.searchParams.delete('code')
        resetUrl.searchParams.delete('type')
        resetUrl.searchParams.delete('token_hash')
        return NextResponse.redirect(resetUrl)
      }
      
      console.error('Recovery code exchange error:', error)
    } catch (err) {
      console.error('Unexpected error during recovery code exchange:', err)
    }
  }

  // Handle email confirmation with code (from signUp)
  if (code) {
    const supabase = await createClient()
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        console.log('Email confirmed successfully via code')
        // For registration, redirect to profile setup
        redirectTo.pathname = '/register'
        redirectTo.searchParams.set('confirmed', 'true')
        return NextResponse.redirect(redirectTo)
      }
      
      console.error('Code exchange error:', error)
    } catch (err) {
      console.error('Unexpected error during code exchange:', err)
    }
  }

  // Handle OTP verification with token_hash (for password reset and other OTP flows)
  if (token_hash && type) {
    const supabase = await createClient()
    
    try {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      })
      
      if (!error) {
        console.log('OTP verified successfully')
        // For password recovery, redirect to reset password page
        if (type === 'recovery' || type === 'email_change') {
          const resetUrl = request.nextUrl.clone()
          resetUrl.pathname = '/reset-password'
          resetUrl.searchParams.delete('token_hash')
          resetUrl.searchParams.delete('type')
          return NextResponse.redirect(resetUrl)
        }
        
        // For signup confirmation
        if (type === 'signup' || type === 'email') {
          redirectTo.pathname = '/register'
          redirectTo.searchParams.set('confirmed', 'true')
          return NextResponse.redirect(redirectTo)
        }
        
        return NextResponse.redirect(redirectTo)
      }
      
      console.error('OTP verification error:', error)
    } catch (err) {
      console.error('Unexpected error during OTP verification:', err)
    }
  }

  // return the user to an error page with some instructions
  redirectTo.pathname = '/error'
  redirectTo.searchParams.set('message', 'Email verification failed. Please try signing up again.')
  return NextResponse.redirect(redirectTo)
}