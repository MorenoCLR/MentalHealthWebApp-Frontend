'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export type RelaxationActivity = {
  id: string
  title: string
  description: string
  image: string
  category: string
  minMood: number
  maxMood: number
}

const RELAXATION_ACTIVITIES: RelaxationActivity[] = [
  // Low Mood Activities (1-2) - Gentle, comforting
  {
    id: 'deep-breathing',
    title: 'Deep Breathing',
    description: 'When you are feeling low or overwhelmed, deep breathing can help ground you. Try the 4-7-8 technique: Inhale for 4 seconds, hold for 7, and exhale for 8. It calms the nervous system immediately.',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop',
    category: 'mindfulness',
    minMood: 1,
    maxMood: 2
  },
  {
    id: 'gentle-stretching',
    title: 'Gentle Stretching',
    description: 'Release tension stored in your body with slow, gentle stretches. No need for a full workout—just move your neck, shoulders, and back to let go of physical stress.',
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop',
    category: 'movement',
    minMood: 1,
    maxMood: 2
  },
  {
    id: 'comfort-music',
    title: 'Calming Music',
    description: 'Listen to slow, ambient, or classical music. Sound therapy can lower cortisol levels and provide a sense of safety and comfort when things feel heavy.',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=600&fit=crop',
    category: 'leisure',
    minMood: 1,
    maxMood: 2
  },

  // Neutral Mood Activities (3) - Balanced, engaging but not intense
  {
    id: 'nature-walk',
    title: 'Nature Walk',
    description: 'A walk in nature helps clear the mind and provides a fresh perspective. The fresh air and natural surroundings can gently lift your spirits without demanding too much energy.',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
    category: 'nature',
    minMood: 2,
    maxMood: 4
  },
  {
    id: 'reading',
    title: 'Reading',
    description: 'Reading helps relax the mind, reduce stress, and improve focus by allowing your brain to slow down and shift away from daily pressure. Aim to read for at least 20–30 minutes.',
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=800&h=600&fit=crop',
    category: 'leisure',
    minMood: 2,
    maxMood: 4
  },
  {
    id: 'mindful-tea',
    title: 'Mindful Tea/Coffee',
    description: 'Prepare a warm beverage and focus entirely on the experience—the warmth of the cup, the aroma, and the taste. A simple grounding ritual for a balanced day.',
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&h=600&fit=crop',
    category: 'mindfulness',
    minMood: 3,
    maxMood: 4
  },

  // High Mood Activities (4-5) - Active, creative, energetic
  {
    id: 'running-jogging',
    title: 'Running / Jogging',
    description: 'Channel your good energy into physical movement. Running releases endorphins that enhance your already positive state and strengthens your body.',
    image: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&h=600&fit=crop',
    category: 'exercise',
    minMood: 4,
    maxMood: 5
  },
  {
    id: 'yoga-flow',
    title: 'Vinyasa Yoga',
    description: 'A more active yoga flow to build strength and flexibility. Perfect when you feel capable and want to challenge your body while maintaining mental focus.',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop',
    category: 'movement',
    minMood: 3,
    maxMood: 5
  },
  {
    id: 'creative-writing',
    title: 'Creative Writing',
    description: 'Use your positive headspace to create. Write a story, a poem, or journal about your success. Creativity flows best when you are feeling good.',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=600&fit=crop',
    category: 'creativity',
    minMood: 4,
    maxMood: 5
  }
]

export async function getRelaxationSuggestions() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Get today's date range
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  // Check if user logged mood TODAY
  const { data: todayMood } = await supabase
    .from('moods')
    .select('*')
    .eq('user_id', user.id)
    .gte('mood_at', startOfDay.toISOString())
    .lt('mood_at', endOfDay.toISOString())
    .order('mood_at', { ascending: false })
    .limit(1)
    .single()

  const hasLoggedMoodToday = !!todayMood

  // If no mood logged today, return special state
  if (!hasLoggedMoodToday) {
    return {
      error: null,
      activities: [],
      moodRating: null,
      message: "Seems like your mood its not enough!",
      hasLoggedMoodToday: false,
    }
  }

  const moodRating = todayMood.mood_rating

  // Filter activities based on the mood rating algorithm
  // Algorithm: Show activities where the current mood falls within their [minMood, maxMood] range
  const filteredActivities = RELAXATION_ACTIVITIES.filter(
    activity => moodRating >= activity.minMood && moodRating <= activity.maxMood
  )

  // Fallback: If for some reason filtering leaves < 2 items, return neutral ones + others
  const finalActivities = filteredActivities.length > 0
    ? filteredActivities
    : RELAXATION_ACTIVITIES.filter(a => a.minMood <= 3 && a.maxMood >= 3)

  let infoMessage = ''
  if (moodRating <= 2) {
    infoMessage = "It looks like you're having a tough time. Here are some gentle ways to take care of yourself."
  } else if (moodRating === 3) {
    infoMessage = "You're feeling okay. Here are some activities to maintain your balance."
  } else {
    infoMessage = "You're feeling great! Here are some ways to channel that positive energy."
  }

  return {
    error: null,
    activities: finalActivities,
    moodRating,
    message: infoMessage,
    hasLoggedMoodToday: true,
  }
}

export async function saveRelaxationSuggestion(activityId: string) {
  // Wrapper function that calls saveSelectedActivities with single activity
  // This maintains backward compatibility while using the primary multi-select function
  return saveSelectedActivities([activityId])
}

export async function saveSelectedActivities(activityIds: string[]) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Validate at least 1 activity selected
  if (!activityIds || activityIds.length === 0) {
    return { error: 'Please select at least 1 activity' }
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

  // Find all selected activities
  const selectedActivities = RELAXATION_ACTIVITIES.filter(a => activityIds.includes(a.id))

  if (selectedActivities.length === 0) {
    return { error: 'No valid activities found' }
  }

  // Prepare batch insert data
  const insertData = selectedActivities.map(activity => ({
    user_id: user.id,
    mood_id: recentMood.id,
    activity_suggestion: JSON.stringify(activity),
    created_at: new Date().toISOString()
  }))

  // Insert all selected activities
  const { error } = await supabase
    .from('relaxation_suggestions')
    .insert(insertData)

  if (error) {
    console.error('Error saving relaxation suggestions:', error)
    return { error: error.message }
  }

  return {
    success: true,
    count: selectedActivities.length,
    message: `Successfully saved ${selectedActivities.length} activity(ies)`
  }
}
