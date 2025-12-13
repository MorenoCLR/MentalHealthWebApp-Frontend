'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function createGoal(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  const name = formData.get('name') as string
  const target = formData.get('target') as string

  if (!name || name.trim().length === 0) {
    return { error: 'Goal name is required' }
  }

  if (!target || target.trim().length === 0) {
    return { error: 'Frequency is required' }
  }

  const { error } = await supabase
    .from('goal')
    .insert({
      user_id: user.id,
      name: name.trim(),
      target: target.trim(),
      progress: 'Not Started',
    })

  if (error) {
    console.error('Error creating goal:', error)
    return { error: error.message }
  }

  revalidatePath('/goals', 'layout')
  return { success: true }
}

export async function updateGoal(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  const goalId = formData.get('id') as string
  const name = formData.get('name') as string
  const target = formData.get('target') as string

  if (!goalId) {
    return { error: 'Goal ID is required' }
  }

  if (!name || name.trim().length === 0) {
    return { error: 'Goal name is required' }
  }

  if (!target || target.trim().length === 0) {
    return { error: 'Frequency is required' }
  }

  const { error } = await supabase
    .from('goal')
    .update({
      name: name.trim(),
      target: target.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating goal:', error)
    return { error: error.message }
  }

  revalidatePath('/goals', 'layout')
  return { success: true }
}

export async function deleteGoal(goalId: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  const { error } = await supabase
    .from('goal')
    .delete()
    .eq('id', goalId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting goal:', error)
    return { error: error.message }
  }

  revalidatePath('/goals', 'layout')
  return { success: true }
}

export async function getGoals(filter?: 'daily' | 'weekly' | 'monthly' | 'all') {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  let query = supabase
    .from('goal')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  // Filter by target frequency if specified
  if (filter && filter !== 'all') {
    query = query.ilike('target', `%${filter}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching goals:', error)
    return { error: error.message, data: [] }
  }

  return { data, error: null }
}
