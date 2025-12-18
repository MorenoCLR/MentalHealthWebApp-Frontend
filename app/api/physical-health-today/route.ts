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
        { error: 'Unauthorized', loggedToday: false },
        { status: 401, headers }
      )
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0]

    // Fetch today's physical health log
    const { data, error } = await supabase
      .from('physical_health')
      .select('id, complaints')
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`)
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching physical health:', error)
      return NextResponse.json(
        { error: error.message, loggedToday: false },
        { status: 500, headers }
      )
    }

    return NextResponse.json({
      loggedToday: !!data,
      todayData: data?.complaints || null,
    }, { headers })
  } catch (err) {
    console.error('Error in physical-health-today route:', err)
    return NextResponse.json(
      { error: 'Internal server error', loggedToday: false },
      { status: 500, headers: new Headers({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }) }
    )
  }
}
