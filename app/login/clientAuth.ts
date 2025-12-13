"use client"

import { createClient } from '@/utils/supabase/client'

export async function sendOtpClient(email: string) {
  const supabase = createClient()
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/confirm`

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
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
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/confirm?type=recovery`
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  return { error }
}

export async function resendConfirmationClient(email: string) {
  const supabase = createClient()
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/confirm`
  const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: redirectTo } })
  return { error }
}
