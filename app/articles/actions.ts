'use server'

import { createClient } from '@/utils/supabase/server'

export async function getArticles() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('date_published', { ascending: false })

  if (error) {
    console.error('Error fetching articles:', error)
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

export async function getArticleById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching article:', error)
    return { error: error.message, data: null }
  }

  return { data, error: null }
}

export async function searchArticles(query: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order('date_published', { ascending: false })

  if (error) {
    console.error('Error searching articles:', error)
    return { error: error.message, data: null }
  }

  return { data, error: null }
}
