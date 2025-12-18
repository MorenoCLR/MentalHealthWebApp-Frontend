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

  // Get today's date range (start and end of day in user's timezone)
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  // Check if there's already a mood entry for today
  const { data: existingMoods, error: fetchError } = await supabase
    .from('moods')
    .select('id')
    .eq('user_id', user.id)
    .gte('mood_at', startOfDay.toISOString())
    .lt('mood_at', endOfDay.toISOString())

  if (fetchError) {
    console.error('Error checking existing mood:', fetchError)
    return { error: fetchError.message }
  }

  // If mood exists for today, update it; otherwise insert new
  if (existingMoods && existingMoods.length > 0) {
    // Update the existing mood entry
    const { error: updateError } = await supabase
      .from('moods')
      .update({
        mood_rating: moodRating,
        mood_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingMoods[0].id)

    if (updateError) {
      console.error('Error updating mood:', updateError)
      return { error: updateError.message }
    }
  } else {
    // Insert new mood entry
    const { error: insertError } = await supabase
      .from('moods')
      .insert({
        user_id: user.id,
        mood_rating: moodRating,
        mood_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Error saving mood:', insertError)
      return { error: insertError.message }
    }
  }

  revalidatePath('/mood', 'layout')
  revalidatePath('/dashboard', 'layout')
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
