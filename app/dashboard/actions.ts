'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

type DashboardData = {
  user: {
    id: string
    email?: string
    username?: string
    full_name?: string
    [key: string]: unknown
  }
  latestMood: {
    id: string
    user_id: string
    mood_at: string
    mood_rating: number
    created_at: string
    updated_at: string | null
  } | null
  weeklyMoods: Array<{
    id: string
    user_id: string
    mood_at: string
    mood_rating: number
    created_at: string
    updated_at: string | null
  }>
  physicalHealth: {
    id: string
    user_id: string
    updated_at: string | null
    complaints: string | null
    health_id: string | null
    weight?: number | null
    sleepHours?: number | null
    stepCounts?: number | null
  } | null
  articles: Array<{
    id: string
    title: string
  }>
  suggestions: Array<{
    id: string
    title: string
    description: string
    [key: string]: unknown
  }>
  journals: Array<{
    id: string
    title: string
    date_created: string
  }>
  goals: Array<{
    id: string
    name: string
    target: string
    progress: string
  }>
  stressLevel: number
  goalsCount: number
}

// Copied from relaxation/actions.ts for consistency
const RELAXATION_ACTIVITIES = [
  // Low Mood Activities (1-2)
  {
    id: 'deep-breathing',
    title: 'Deep Breathing',
    description: 'When you are feeling low or overwhelmed, deep breathing can help ground you.',
    minMood: 1,
    maxMood: 2
  },
  {
    id: 'gentle-stretching',
    title: 'Gentle Stretching',
    description: 'Release tension stored in your body with slow, gentle stretches.',
    minMood: 1,
    maxMood: 2
  },
  {
    id: 'comfort-music',
    title: 'Calming Music',
    description: 'Listen to slow, ambient, or classical music to lower cortisol levels.',
    minMood: 1,
    maxMood: 2
  },

  // Neutral Mood Activities (3)
  {
    id: 'nature-walk',
    title: 'Nature Walk',
    description: 'A walk in nature helps clear the mind and provides a fresh perspective.',
    minMood: 2,
    maxMood: 4
  },
  {
    id: 'reading',
    title: 'Reading',
    description: 'Reading helps relax the mind and shift focus away from daily pressure.',
    minMood: 2,
    maxMood: 4
  },
  {
    id: 'mindful-tea',
    title: 'Mindful Tea/Coffee',
    description: 'Prepare a warm beverage and focus entirely on the experience.',
    minMood: 3,
    maxMood: 4
  },

  // High Mood Activities (4-5)
  {
    id: 'running-jogging',
    title: 'Running / Jogging',
    description: 'Channel your good energy into physical movement.',
    minMood: 4,
    maxMood: 5
  },
  {
    id: 'yoga-flow',
    title: 'Vinyasa Yoga',
    description: 'A more active yoga flow to build strength and flexibility.',
    minMood: 3,
    maxMood: 5
  },
  {
    id: 'creative-writing',
    title: 'Creative Writing',
    description: 'Use your positive headspace to create stories or journal success.',
    minMood: 4,
    maxMood: 5
  }
]

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  // Get user profile data
  const { data: userProfile } = await supabase
    .from('users')
    .select('username, full_name')
    .eq('id', user.id)
    .single()

  // Get latest mood (today)
  const { data: latestMood } = await supabase
    .from('moods')
    .select('*')
    .eq('user_id', user.id)
    .order('mood_at', { ascending: false })
    .limit(1)
    .single()

  // Get mood data for last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: weeklyMoods } = await supabase
    .from('moods')
    .select('*')
    .eq('user_id', user.id)
    .gte('mood_at', sevenDaysAgo.toISOString())
    .order('mood_at', { ascending: true })

  // Get latest physical health data
  const { data: physicalHealth } = await supabase
    .from('physical_health')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  // Get recent articles (top 2)
  const { data: articles } = await supabase
    .from('articles')
    .select('id, title')
    .order('date_published', { ascending: false })
    .limit(3)

  // Get relaxation suggestions based on mood
  const moodRating = latestMood?.mood_rating ?? 3 // Default to neutral (3) if no mood
  
  const filteredSuggestions = RELAXATION_ACTIVITIES.filter(
    activity => moodRating >= activity.minMood && moodRating <= activity.maxMood
  )
  
  // Take random 3 or all if less than 3
  const suggestions = filteredSuggestions
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)

  // Get recent journal entries (top 3)
  const { data: journals } = await supabase
    .from('journal')
    .select('id, title, date_created')
    .eq('user_id', user.id)
    .order('date_created', { ascending: false })
    .limit(3)

  // Get today's goals (due today + indefinite)
  const today = new Date().toISOString().slice(0,10)
  const { data: allGoals } = await supabase
    .from('goal')
    .select('id, name, target, progress')
    .eq('user_id', user.id)
    .neq('progress', 'Completed')
    .order('updated_at', { ascending: false })

  // Filter for today's goals (due today or indefinite)
  const todayGoals = (allGoals || []).filter(g => {
    const t = g.target
    if (t === 'Indefinite') return true
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t === today
    return t.toLowerCase().includes('daily')
  })

  // Calculate stress level (based on mood ratings)
  const stressLevel = weeklyMoods && weeklyMoods.length > 0
    ? Math.round((1 - (weeklyMoods.reduce((sum, m) => sum + m.mood_rating, 0) / (weeklyMoods.length * 5))) * 100)
    : 0

  // Get goals count
  const { count: goalsCount } = await supabase
    .from('goal')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Extract weight and other stats from complaints JSON if available
  let weight: number | null = null
  let sleepHoursVal: number | null = null
  let stepCountsVal: number | null = null
  if (physicalHealth?.complaints) {
    try {
      const parsed = JSON.parse(physicalHealth.complaints)
      weight = typeof parsed?.weight === 'number' ? parsed.weight : null
      sleepHoursVal = typeof parsed?.sleepHours === 'number' ? parsed.sleepHours : null
      stepCountsVal = typeof parsed?.stepCounts === 'number' ? parsed.stepCounts : null
    } catch {}
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      username: userProfile?.username,
      full_name: userProfile?.full_name,
    },
    latestMood,
    weeklyMoods: weeklyMoods || [],
    physicalHealth: physicalHealth ? { ...physicalHealth, weight, sleepHours: sleepHoursVal, stepCounts: stepCountsVal } : null,
    articles: articles || [],
    suggestions: suggestions || [],
    journals: journals || [],
    goals: todayGoals || [],
    stressLevel,
    goalsCount: goalsCount || 0
  }
}
