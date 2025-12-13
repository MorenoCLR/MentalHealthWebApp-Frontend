'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function saveMood(formData: FormData) {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  const moodRating = parseInt(formData.get('mood_rating') as string)

  if (!moodRating || moodRating < 1 || moodRating > 5) {
    return { error: 'Invalid mood rating. Must be between 1 and 5.' }
  }

  const { error } = await supabase
    .from('moods')
    .insert({
      user_id: user.id,
      mood_rating: moodRating,
      mood_at: new Date().toISOString(),
    })

  if (error) {
    console.error('Error saving mood:', error)
    return { error: error.message }
  }

  revalidatePath('/mood', 'layout')
  return { success: true }
}

export async function getMoodHistory() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('moods')
    .select('*')
    .eq('user_id', user.id)
    .order('mood_at', { ascending: false })
    .limit(30)

  if (error) {
    console.error('Error fetching mood history:', error)
    return { error: error.message, data: [] }
  }

  return { data, error: null }
}
