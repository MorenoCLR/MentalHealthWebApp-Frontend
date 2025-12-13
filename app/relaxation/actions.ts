'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export type RelaxationActivity = {
  id: string
  title: string
  description: string
  image: string
  category: string
}

const RELAXATION_ACTIVITIES: RelaxationActivity[] = [
  {
    id: 'running-walking',
    title: 'Running / Walking',
    description: 'Walking or running regularly helps boost mood, reduce stress, and improve sleep by giving your mind space to relax. Aim for about 30 minutes of walking or 20–30 minutes of running, around 3–5 times per week, to feel the mental benefits.',
    image: '/images/running.jpg',
    category: 'exercise'
  },
  {
    id: 'yoga',
    title: 'Yoga',
    description: 'Practicing yoga helps calm the mind, reduce stress, and improve focus by combining gentle movement with breathing and mindfulness. Aim for 20–40 minutes of yoga, 3–5 times per week, to support better emotional balance and mental clarity.',
    image: '/images/yoga.jpg',
    category: 'mindfulness'
  },
  {
    id: 'reading',
    title: 'Reading',
    description: 'Reading helps relax the mind, reduce stress, and improve focus by allowing your brain to slow down and shift away from daily pressure. Aim to read for at least 20–30 minutes a day to support mental clarity and emotional well-being.',
    image: '/images/reading.jpg',
    category: 'leisure'
  }
]

export async function getRelaxationSuggestions() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  // Get the user's most recent mood
  const { data: recentMood, error: moodError } = await supabase
    .from('moods')
    .select('*')
    .eq('user_id', user.id)
    .order('mood_at', { ascending: false })
    .limit(1)
    .single()

  if (moodError || !recentMood) {
    return { 
      error: 'NO_MOOD_DATA',
      message: 'No recent mood data found',
      activities: []
    }
  }

  // Check if mood is too low (rating 1-2)
  if (recentMood.mood_rating <= 2) {
    return {
      error: 'LOW_MOOD',
      message: 'Your mood is not high enough for personalized suggestions',
      moodRating: recentMood.mood_rating,
      activities: []
    }
  }

  // Check if suggestions already exist for this mood
  const { data: existingSuggestions, error: suggestionError } = await supabase
    .from('relaxation_suggestions')
    .select('*')
    .eq('user_id', user.id)
    .eq('mood_id', recentMood.id)

  // If no existing suggestions, create them
  if (!existingSuggestions || existingSuggestions.length === 0) {
    const suggestions = RELAXATION_ACTIVITIES.map(activity => ({
      user_id: user.id,
      mood_id: recentMood.id,
      activity_suggestion: JSON.stringify(activity)
    }))

    await supabase
      .from('relaxation_suggestions')
      .insert(suggestions)
  }

  return {
    error: null,
    activities: RELAXATION_ACTIVITIES,
    moodRating: recentMood.mood_rating
  }
}

export async function saveRelaxationSuggestion(activityId: string) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  // Get the most recent mood
  const { data: recentMood } = await supabase
    .from('moods')
    .select('*')
    .eq('user_id', user.id)
    .order('mood_at', { ascending: false })
    .limit(1)
    .single()

  if (!recentMood) {
    return { error: 'No recent mood found' }
  }

  const activity = RELAXATION_ACTIVITIES.find(a => a.id === activityId)
  
  if (!activity) {
    return { error: 'Activity not found' }
  }

  const { error } = await supabase
    .from('relaxation_suggestions')
    .insert({
      user_id: user.id,
      mood_id: recentMood.id,
      activity_suggestion: JSON.stringify(activity)
    })

  if (error) {
    console.error('Error saving relaxation suggestion:', error)
    return { error: error.message }
  }

  return { success: true }
}
