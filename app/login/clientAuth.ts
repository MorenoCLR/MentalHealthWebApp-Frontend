"use client"

import { createClient } from '@/utils/supabase/client'

export async function sendOtpClient(email: string) {
  const supabase = createClient()
  
  // Check if user exists first
  const { data: exists, error: checkError } = await supabase.rpc('check_email_exists', { 
    email_to_check: email 
  })

  if (checkError) {
    console.error('Error checking email:', checkError)
    // Fail safe: proceed if check fails, or error out?
    // Let's return error to be safe as per user request to show error
    return { error: { message: 'Failed to verify email existence.' } }
  }

  if (!exists) {
    return { error: { message: 'This email is not registered. Please sign up first.' } }
  }

  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/confirm`

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { 
      emailRedirectTo: redirectTo,
      shouldCreateUser: false // Explicitly prevent creation
    },
  })

  return { error }
}

export async function verifyOtpClient(email: string, token: string, type: string = 'recovery') {
  const supabase = createClient()
  const { error } = await supabase.auth.verifyOtp({ email, token, type: type as any })
  return { error }
}

export async function resetPasswordClient(email: string) {
  const supabase = createClient()
  
  // Check if user exists first
  const { data: exists, error: checkError } = await supabase.rpc('check_email_exists', { 
    email_to_check: email 
  })

  if (!exists && !checkError) {
    return { error: { message: 'This email is not registered.' } }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const redirectTo = `${appUrl}/auth/confirm?type=recovery`
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  return { error }
}

export async function resendConfirmationClient(email: string) {
  const supabase = createClient()
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/confirm`
  const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirectTo } })
  return { error }
}
