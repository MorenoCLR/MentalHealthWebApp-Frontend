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

  // Build health data object
  const healthData = {
    weight: weight ? parseFloat(weight) : null,
    sleepHours: sleepHours ? parseFloat(sleepHours) : null,
    stepCounts: stepCounts ? parseInt(stepCounts) : null,
    date: new Date().toISOString()
  }

  // Get today's date range
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)

  // Check if there's already a physical health entry for today
  const { data: existingEntries, error: fetchError } = await supabase
    .from('physical_health')
    .select('id')
    .eq('user_id', user.id)
    .gte('created_at', startOfDay.toISOString())
    .lt('created_at', endOfDay.toISOString())

  if (fetchError) {
    console.error('Error checking existing entry:', fetchError)
    return { error: fetchError.message }
  }

  // If entry exists for today, update it; otherwise insert new
  if (existingEntries && existingEntries.length > 0) {
    // Update the existing entry
    const { error: updateError } = await supabase
      .from('physical_health')
      .update({
        complaints: JSON.stringify(healthData),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingEntries[0].id)

    if (updateError) {
      console.error('Error updating physical health:', updateError)
      return { error: updateError.message }
    }
  } else {
    // Insert new entry
    const { error: insertError } = await supabase
      .from('physical_health')
      .insert({
        user_id: user.id,
        complaints: JSON.stringify(healthData),
        health_id: `health_${Date.now()}`,
        updated_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Error saving physical health:', insertError)
      return { error: insertError.message }
    }
  }

  revalidatePath('/physical-health', 'layout')
  revalidatePath('/dashboard', 'layout')
  return { success: true }
}

export async function getLast7DaysPhysicalHealth() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    redirect('/login')
  }

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data, error } = await supabase
    .from('physical_health')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', sevenDaysAgo.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message, data: [] }
  }

  return { data, error: null }
}
