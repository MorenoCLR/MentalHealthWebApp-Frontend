'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export type JournalEntry = {
  id: string
  user_id: string
  title: string
  content: string | null
  date_created: string
  updated_at: string
}

export async function getJournals() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('journal')
    .select('*')
    .eq('user_id', user.id)
    .order('date_created', { ascending: false })

  if (error) {
    console.error('Error fetching journals:', error)
    return { error: error.message, data: [] }
  }

  return { data, error: null }
}

export async function getJournal(id: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('journal')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Error fetching journal:', error)
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

export async function createJournal(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  const title = formData.get('title') as string
  const content = formData.get('content') as string

  if (!title || title.trim().length === 0) {
    return { error: 'Title is required' }
  }

  const { data, error } = await supabase
    .from('journal')
    .insert({
      user_id: user.id,
      title: title.trim(),
      content: content?.trim() || null,
      date_created: new Date().toISOString().split('T')[0] // YYYY-MM-DD
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating journal:', error)
    return { error: error.message }
  }

  revalidatePath('/journal', 'layout')
  return { success: true, data }
}

export async function updateJournal(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  const id = formData.get('id') as string
  const title = formData.get('title') as string
  const content = formData.get('content') as string

  if (!id) {
    return { error: 'Journal ID is required' }
  }

  if (!title || title.trim().length === 0) {
    return { error: 'Title is required' }
  }

  const { error } = await supabase
    .from('journal')
    .update({
      title: title.trim(),
      content: content?.trim() || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating journal:', error)
    return { error: error.message }
  }

  revalidatePath('/journal', 'layout')
  return { success: true }
}

export async function deleteJournal(id: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  const { error } = await supabase
    .from('journal')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting journal:', error)
    return { error: error.message }
  }

  revalidatePath('/journal', 'layout')
  return { success: true }
}
