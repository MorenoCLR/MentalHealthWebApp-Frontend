'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function getUserProfile() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  // Get user data from users table
  const { data: userData, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return {
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      ...userData
    },
    error: error?.message || null
  }
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  const full_name = formData.get('full_name') as string
  const username = formData.get('username') as string
  const phone = formData.get('phone') as string

  const { error } = await supabase
    .from('users')
    .update({
      full_name,
      username,
      phone_number: phone,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings', 'layout')
  return { success: true }
}

export async function updateEmail(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  const newEmail = formData.get('email') as string

  if (!newEmail) {
    return { error: 'Email is required' }
  }

  const { error } = await supabase.auth.updateUser({ email: newEmail })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Check your new email to confirm the change' }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  const newPassword = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!newPassword || newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters' }
  }

  if (newPassword !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Password updated successfully' }
}

export async function deleteAccount(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  const confirmation = formData.get('confirmation') as string

  if (confirmation !== 'DELETE') {
    return { error: 'Please type DELETE to confirm' }
  }

  // Delete user data first (optional if we rely on cascade, but good for cleanup)
  const { error: dataError } = await supabase
    .from('users')
    .delete()
    .eq('id', user.id)

  if (dataError) {
    return { error: dataError.message }
  }

  // Call the secure RPC function to delete the auth user
  const { error: rpcError } = await supabase.rpc('delete_user')

  if (rpcError) {
    console.error('Error deleting account via RPC:', rpcError)
    return { error: 'Failed to delete account. Please try again.' }
  }

  // Sign out (although the user is deleted, this clears the session)
  await supabase.auth.signOut()
  redirect('/login')
}

export async function exportUserData() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  // Fetch all user data
  const [
    { data: userData },
    { data: goals },
    { data: journals },
    { data: moods },
    { data: physicalHealth }
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase.from('goal').select('*').eq('user_id', user.id),
    supabase.from('journal').select('*').eq('user_id', user.id),
    supabase.from('moods').select('*').eq('user_id', user.id),
    supabase.from('physical_health').select('*').eq('user_id', user.id)
  ])

  return {
    userData,
    goals,
    journals,
    moods,
    physicalHealth,
    exportedAt: new Date().toISOString()
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut({ scope: 'global' })

  // Explicitly clear Supabase auth cookies to prevent back-nav session restore
  const cookieStore = await cookies()
  cookieStore.getAll().forEach((cookie) => {
    if (cookie.name.startsWith('sb-')) {
      cookieStore.set(cookie.name, '', { path: '/', maxAge: 0 })
    }
  })

  redirect('/login')
}

export async function getAccountStats() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  const [
    { count: goalsCount },
    { count: journalsCount },
    { count: moodsCount }
  ] = await Promise.all([
    supabase.from('goal').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('journal').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('moods').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
  ])

  return {
    goalsCount: goalsCount || 0,
    journalsCount: journalsCount || 0,
    moodsCount: moodsCount || 0
  }
}
