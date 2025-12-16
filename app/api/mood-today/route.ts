import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Disable caching to ensure fresh data on page return
  const headers = new Headers({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  })
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', moodRating: null },
        { status: 401, headers }
      )
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0]

    // Fetch today's mood using date range comparison
    const { data, error } = await supabase
      .from('moods')
      .select('mood_rating')
      .eq('user_id', user.id)
      .gte('mood_at', `${today}T00:00:00`)
      .lt('mood_at', `${today}T23:59:59`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching mood:', error)
      return NextResponse.json(
        { error: error.message, moodRating: null },
        { status: 500, headers }
      )
    }

    return NextResponse.json({
      moodRating: data?.mood_rating || null,
    }, { headers })
  } catch (err) {
    console.error('Error in mood-today route:', err)
    return NextResponse.json(
      { error: 'Internal server error', moodRating: null },
      { status: 500, headers: new Headers({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }) }
    )
  }
}
