'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export type MoodData = {
  id: string
  mood_rating: number
  mood_at: string
  created_at: string
}

export type MoodStats = {
  highest: number
  lowest: number
  average: number
  healthScore: number
  totalEntries: number
}

export type WeeklyMood = {
  day: string
  mood: number | null
  emoji: string
}

export async function getMoodVisualization(period: 'weekly' | 'monthly' = 'monthly') {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  // Calculate date range based on period
  const now = new Date()
  const startDate = new Date()
  
  if (period === 'weekly') {
    startDate.setDate(now.getDate() - 7)
  } else {
    startDate.setMonth(now.getMonth() - 1)
  }

  const { data, error } = await supabase
    .from('moods')
    .select('*')
    .eq('user_id', user.id)
    .gte('mood_at', startDate.toISOString())
    .order('mood_at', { ascending: true })

  if (error) {
    console.error('Error fetching mood visualization:', error)
    return { error: error.message, data: null, stats: null, weeklyMoods: null }
  }

  // Calculate statistics
  const stats = calculateMoodStats(data)
  
  // Get weekly moods for mood history
  const weeklyMoods = getWeeklyMoods(data)

  return { data, error: null, stats, weeklyMoods }
}

function calculateMoodStats(moods: MoodData[]): MoodStats {
  if (!moods || moods.length === 0) {
    return {
      highest: 0,
      lowest: 0,
      average: 0,
      healthScore: 0,
      totalEntries: 0
    }
  }

  const ratings = moods.map(m => m.mood_rating)
  const highest = Math.max(...ratings)
  const lowest = Math.min(...ratings)
  const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length
  
  // Calculate health score (0-100 scale based on average mood)
  // mood_rating is 1-5, so we convert to percentage
  const healthScore = Math.round((average / 5) * 100)

  return {
    highest,
    lowest,
    average: Math.round(average * 10) / 10, // Round to 1 decimal
    healthScore,
    totalEntries: moods.length
  }
}

function getWeeklyMoods(moods: MoodData[]): WeeklyMood[] {
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
  
  // Adjust to make Monday = 0
  const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  
  const weeklyMoods: WeeklyMood[] = []
  
  for (let i = 0; i < 7; i++) {
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() - (adjustedDay - i))
    targetDate.setHours(0, 0, 0, 0)
    
    const nextDate = new Date(targetDate)
    nextDate.setDate(targetDate.getDate() + 1)
    
    // Find mood for this day
    const dayMood = moods.find(m => {
      const moodDate = new Date(m.mood_at)
      return moodDate >= targetDate && moodDate < nextDate
    })
    
    const moodRating = dayMood?.mood_rating || null
    const emoji = getMoodEmoji(moodRating)
    
    weeklyMoods.push({
      day: daysOfWeek[i],
      mood: moodRating,
      emoji
    })
  }
  
  return weeklyMoods
}

function getMoodEmoji(rating: number | null): string {
  if (rating === null) return '😐'
  
  switch (rating) {
    case 5: return '😊'
    case 4: return '🙂'
    case 3: return '😐'
    case 2: return '😰'
    case 1: return '😢'
    default: return '😐'
  }
}

export async function getUserProfile() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('users')
    .select('username, full_name')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return { username: 'User', full_name: null }
  }

  return {
    username: data?.username || 'User',
    full_name: data?.full_name || null
  }
}
