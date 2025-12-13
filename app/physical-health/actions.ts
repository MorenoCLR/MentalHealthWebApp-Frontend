'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export type PhysicalHealthData = {
  weight?: number
  sleepHours?: number
  stepCounts?: number
}

export async function savePhysicalHealth(formData: FormData) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  const weight = formData.get('weight') as string
  const sleepHours = formData.get('sleep_hours') as string
  const stepCounts = formData.get('step_counts') as string

  // Validate at least one field is filled
  if (!weight && !sleepHours && !stepCounts) {
    return { error: 'Please fill in at least one field' }
  }

  // Build health data string
  const healthData = {
    weight: weight ? parseFloat(weight) : null,
    sleepHours: sleepHours ? parseFloat(sleepHours) : null,
    stepCounts: stepCounts ? parseInt(stepCounts) : null,
    date: new Date().toISOString()
  }

  const { error } = await supabase
    .from('physical_health')
    .insert({
      user_id: user.id,
      complaints: JSON.stringify(healthData),
      health_id: `health_${Date.now()}`,
    })

  if (error) {
    console.error('Error saving physical health:', error)
    return { error: error.message }
  }

  revalidatePath('/physical-health', 'layout')
  return { success: true }
}

export async function getLatestPhysicalHealth() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('physical_health')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    return { error: error.message, data: null }
  }

  return { data, error: null }
}
