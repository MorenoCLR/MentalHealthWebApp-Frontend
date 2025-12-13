"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { BarChart3, Activity, Moon, Weight, ChevronRight } from "lucide-react"
import { getDashboardData } from "./actions"
import Navbar from "@/components/Navbar"

type DashboardData = {
  user: {
    id: string
    email?: string
    [key: string]: unknown
  }
  latestMood: Mood | null
  weeklyMoods: Mood[]
  physicalHealth: PhysicalHealth | null
  articles: Article[]
  suggestions: Suggestion[]
  stressLevel: number
  goalsCount: number
}

type Mood = {
  id: string
  user_id: string
  mood_at: string
  mood_rating: number
  created_at: string
  updated_at: string | null
}

type PhysicalHealth = {
  id: string
  user_id: string
  updated_at: string | null
  complaints: string | null
  health_id: string | null
}

type Article = {
  id: string
  title: string
}

type Suggestion = {
  id: string
  message?: string
  [key: string]: unknown
}

export default function DashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const dashboardData = await getDashboardData()
      setData(dashboardData)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#A4B870]/30 border-t-[#A4B870]" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const moodEmoji = data?.latestMood?.mood_rating === 5 ? "😊" : 
                    data?.latestMood?.mood_rating === 4 ? "🙂" :
                    data?.latestMood?.mood_rating === 3 ? "😐" :
                    data?.latestMood?.mood_rating === 2 ? "😰" : "😢"

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Navbar */}
      <Navbar />

      {/* Main content */}
      <div className="md:ml-20 p-6">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between mt-12 md:mt-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">👋</span> Hi, Moreno!
            </h1>
            <p className="mt-1 text-gray-600">Hope you are doing well on this day ~</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Good Daily Visualization */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">Good Daily Visualization</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Mood Check Card */}
                <div
                  onClick={() => router.push('/mood')}
                  className="cursor-pointer rounded-3xl bg-[#A4B870] p-6 text-white shadow-lg hover:shadow-xl transition-shadow"
                >
                  <h3 className="text-sm font-medium opacity-90">Mood Check</h3>
                  <div className="mt-4 flex items-center justify-center">
                    <div className="text-6xl">{moodEmoji}</div>
                  </div>
                  <p className="mt-4 text-center text-3xl font-bold">
                    {data?.latestMood?.mood_rating || 0}
                  </p>
                </div>

                {/* Stress Level Card */}
                <div
                  onClick={() => router.push('/visualization')}
                  className="cursor-pointer rounded-3xl bg-[#FF8C69] p-6 text-white shadow-lg hover:shadow-xl transition-shadow"
                >
                  <h3 className="text-sm font-medium opacity-90">Stress Level</h3>
                  <div className="mt-4">
                    <BarChart3 size={48} className="mx-auto" />
                  </div>
                  <p className="mt-4 text-center text-3xl font-bold">
                    {data?.stressLevel}%
                  </p>
                </div>
              </div>
            </div>

            {/* Weekly Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* MoodHighlight */}
              <div className="rounded-3xl bg-white p-6 shadow-lg">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">MoodHighlight</h3>
                  <span className="text-lg">✓</span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E5D68A]">
                    <span className="text-xl">😊</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Stress Level</p>
                    <p className="font-medium text-gray-800">Last 7 Weekdays</p>
                  </div>
                </div>
              </div>

              {/* PhysicalHealthMap */}
              <div className="rounded-3xl bg-white p-6 shadow-lg">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">PhysicalHealthMap</h3>
                  <span className="text-lg">✓</span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#A4B870]">
                    <Activity size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Sleep Count</p>
                    <p className="font-medium text-gray-800">Last 7 Weekdays</p>
                  </div>
                </div>
              </div>

              {/* Sleep Hours */}
              <div 
                onClick={() => router.push('/physical-health')}
                className="cursor-pointer rounded-3xl bg-white p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">ProjectileSubButton</h3>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#6E8450] to-[#A4B870]">
                    <Moon size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Sleep Hours</p>
                    <p className="font-medium text-gray-800">Last 7 Weekdays</p>
                  </div>
                </div>
              </div>

              {/* Weight Card */}
              <div 
                onClick={() => router.push('/physical-health')}
                className="cursor-pointer rounded-3xl bg-white p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-700">Weight</h3>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#9CA3AF]">
                    <Weight size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-800">
                      {data?.physicalHealth?.health_id || '60'} <span className="text-sm font-normal text-gray-500">KG</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Session & Articles */}
          <div className="space-y-6">
            {/* Session Suggestions */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">Session Suggestions</h2>
                <span className="text-lg">✓</span>
              </div>
              <div 
                onClick={() => router.push('/relaxation')}
                className="cursor-pointer rounded-3xl bg-gradient-to-br from-[#6E8450] to-[#4A5A35] p-6 text-white shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="space-y-3">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xl font-bold">Walking</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xl font-bold">Yoga</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-sm opacity-80">Reading</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Article Section */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">Article</h2>
                <button 
                  onClick={() => router.push('/articles')}
                  className="text-sm text-[#6E8450] hover:underline"
                >
                  See all
                </button>
              </div>
              <div className="space-y-4">
                {/* Article 1 */}
                <div 
                  onClick={() => data?.articles?.[0] && router.push(`/articles/${data.articles[0].id}`)}
                  className="cursor-pointer rounded-3xl bg-white p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[#FF8C69]">
                      <span className="text-2xl">📄</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 line-clamp-2">
                        {data?.articles?.[0]?.title || 'Reduce stress in crowded place'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Article 2 */}
                <div 
                  onClick={() => data?.articles?.[1] && router.push(`/articles/${data.articles[1].id}`)}
                  className="cursor-pointer rounded-3xl bg-white p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-[#9B9BE8]">
                      <span className="text-2xl">📄</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800 line-clamp-2">
                        {data?.articles?.[1]?.title || 'Increase fitness in contact way'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
