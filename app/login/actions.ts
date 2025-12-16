'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/error')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function sendOtp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/confirm`

  console.log('Sending OTP to:', email)

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  })

  if (error) {
    console.error('sendOtp error:', error.message || error)
    redirect('/error?reason=otp_send_failed')
  }

  console.log('OTP sent successfully to:', email)
  // redirect back to login page with mode=otp_verify so they stay on OTP tab
  redirect('/login?mode=otp_verify')
}

export async function verifyOtp(formData: FormData) {
  const supabase = await createClient()

  const token = formData.get('token') as string
  const email = formData.get('email') as string
  const type = (formData.get('type') as string) || 'recovery'

  console.log('Verifying OTP:', { email, token: token ? 'provided' : 'missing', type })

  if (!token || !email) {
    console.error('Missing token or email for OTP verification')
    redirect('/error?reason=missing_otp_fields')
  }

  // server-side verifyOtp expects token and type
  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: type as any,
  })

  if (error) {
    console.error('OTP verification error:', error.message || error)
    redirect('/error?reason=otp_verification_failed')
  }

  console.log('OTP verification successful')
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/confirm`

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  if (error) {
    redirect('/error')
  }

  redirect('/login')
}

export async function resendConfirmationEmail(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/confirm`

  console.log('Resending confirmation email to:', email)

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  })

  if (error) {
    console.error('Resend confirmation error:', error.message || error)
    redirect('/error?reason=resend_failed')
  }

  console.log('Confirmation email resent successfully')
  redirect('/login?mode=waiting_for_confirmation')
}