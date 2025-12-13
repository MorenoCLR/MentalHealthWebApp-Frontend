'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

type DashboardData = {
  user: {
    id: string
    email?: string
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
  } | null
  articles: Array<{
    id: string
    title: string
  }>
  suggestions: Array<{
    id: string
    [key: string]: unknown
  }>
  stressLevel: number
  goalsCount: number
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

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
    .limit(2)

  // Get relaxation suggestions
  const { data: suggestions } = await supabase
    .from('relaxation_suggestions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(2)

  // Calculate stress level (based on mood ratings)
  const stressLevel = weeklyMoods && weeklyMoods.length > 0
    ? Math.round((1 - (weeklyMoods.reduce((sum, m) => sum + m.mood_rating, 0) / (weeklyMoods.length * 5))) * 100)
    : 0

  // Get goals count
  const { count: goalsCount } = await supabase
    .from('goal')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    latestMood,
    weeklyMoods: weeklyMoods || [],
    physicalHealth,
    articles: articles || [],
    suggestions: suggestions || [],
    stressLevel,
    goalsCount: goalsCount || 0
  }
}
