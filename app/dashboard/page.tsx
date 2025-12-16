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
  journals: Journal[]
  goals: Goal[]
  stressLevel: number
  goalsCount: number
}

type Goal = {
  id: string
  name: string
  target: string
  progress: string
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

type Journal = {
  id: string
  title: string
  date_created: string
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
              <span className="text-2xl">👋</span> Hi, {data?.user?.username || data?.user?.full_name || 'there'}!
            </h1>
            <p className="mt-1 text-gray-600">Hope you are doing well on this day ~</p>
          </div>
        </div>

        {/* Top Row - Today's Goals */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">Today's Goals</h2>
            <button 
              onClick={() => router.push('/goals')}
              className="text-sm text-[#6E8450] hover:underline"
            >
              See all
            </button>
          </div>
          {(!data?.goals || data.goals.length === 0) ? (
            <div className="rounded-3xl bg-white p-8 shadow-lg text-center">
              <p className="text-gray-600">No goals for today. Set one to get started!</p>
              <button 
                onClick={() => router.push('/goals')}
                className="mt-4 px-6 py-2 bg-[#A4B870] text-white rounded-full hover:bg-[#6E8450] transition-colors"
              >
                Add Goal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.goals.map((goal) => (
                <div
                  key={goal.id}
                  onClick={() => router.push('/goals')}
                  className="cursor-pointer rounded-3xl bg-white p-6 shadow-lg hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#A4B870]/20">
                      <span className="text-xl">🎯</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1">
                        {goal.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {/^\d{4}-\d{2}-\d{2}$/.test(goal.target) ? new Date(goal.target).toLocaleDateString() : goal.target}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          goal.progress === 'In Progress'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {goal.progress}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Good Daily Visualization - Mood Check, Stress Level, Journal */}
        <div className="mb-6">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Good Daily Visualization</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* Journal Card */}
            <div 
              onClick={() => router.push('/journal')}
              className="cursor-pointer rounded-3xl bg-gradient-to-br from-[#8B7355] to-[#6B5644] p-6 text-white shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium opacity-90">Journal</h3>
                <span className="text-xs opacity-80">See all →</span>
              </div>
              {(!data?.journals || data.journals.length === 0) ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-white/70 text-sm">No entries yet</p>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {data.journals.slice(0, 2).map((journal) => (
                    <div 
                      key={journal.id}
                      className="rounded-2xl bg-white/10 p-3 hover:bg-white/20 transition-colors"
                    >
                      <p className="text-sm font-medium truncate">
                        {journal.title}
                      </p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(journal.date_created).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Highlight and Relax Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Mood Highlight */}
          <div className="rounded-3xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Mood Highlight</h3>
              <span className="text-lg">✓</span>
            </div>
            
            {/* Mini Chart */}
            <div className="mb-4 h-20 bg-gray-50 rounded-lg p-2 flex items-end justify-between gap-1">
              {data?.weeklyMoods?.length ? (
                data.weeklyMoods.slice(0, 7).map((mood, index) => {
                  const getBarColor = (rating: number) => {
                    if (rating >= 4) return '#A4B870'
                    if (rating === 3) return '#A67C52'
                    return '#FF8C69'
                  }
                  const getBarHeight = (rating: number) => {
                    return (rating / 5) * 100
                  }
                  return (
                    <div
                      key={mood.id}
                      className="flex-1 rounded-t-sm transition-all duration-300 hover:opacity-80"
                      style={{
                        backgroundColor: getBarColor(mood.mood_rating),
                        height: `${getBarHeight(mood.mood_rating)}%`,
                        minHeight: '4px'
                      }}
                      title={`Mood: ${mood.mood_rating}/5`}
                    ></div>
                  )
                })
              ) : (
                <p className="w-full text-center text-xs text-gray-400">No mood data</p>
              )}
            </div>

            {/* Legend and Info */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E5D68A]">
                <span className="text-sm">📊</span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Last 7 Days</p>
                <p className="font-medium text-gray-800">Mood Trend</p>
              </div>
            </div>
          </div>

          {/* Relaxation Suggestions - Right Column */}
          <div>
            <div className="mb-3">
              <h2 className="text-lg font-semibold text-gray-800">Relaxation Suggestions</h2>
            </div>
            <div 
              onClick={() => router.push('/relaxation')}
              className="cursor-pointer rounded-3xl bg-gradient-to-br from-[#6E8450] to-[#4A5A35] p-6 text-white shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="space-y-3">
                <div className="rounded-2xl bg-white/10 p-4 hover:bg-white/15 transition-colors">
                  <p className="text-lg font-bold">Walking</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 hover:bg-white/15 transition-colors">
                  <p className="text-lg font-bold">Yoga</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 hover:bg-white/15 transition-colors">
                  <p className="text-lg font-bold">Reading</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Other Features Row - Physical Health Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Physical Health */}
          <div className="rounded-3xl bg-white p-6 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Physical Health</h3>
              <span className="text-lg">✓</span>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#A4B870]">
                <Activity size={24} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Step Counts</p>
                <p className="font-medium text-gray-800">
                  {data?.physicalHealth?.stepCounts ?? '-'} steps
                </p>
              </div>
            </div>
          </div>

          {/* Sleep Hours */}
          <div 
            onClick={() => router.push('/physical-health')}
            className="cursor-pointer rounded-3xl bg-white p-6 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Sleep Hours</h3>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#6E8450] to-[#A4B870]">
                <Moon size={24} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Sleep Hours</p>
                <p className="font-medium text-gray-800">
                  {data?.physicalHealth?.sleepHours ?? '-'} hours
                </p>
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
                  {data?.physicalHealth?.weight ?? '-'} <span className="text-sm font-normal text-gray-500">KG</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - Article (Full Width) */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(!data?.articles || data.articles.length === 0) && (
              <div className="rounded-3xl bg-white p-6 shadow-lg col-span-full">
                <p className="text-sm text-gray-600">There are no articles currently.</p>
              </div>
            )}

            {data?.articles?.map((article, index) => (
              <div 
                key={article.id}
                onClick={() => router.push(`/articles/${article.id}`)}
                className="cursor-pointer rounded-3xl bg-white p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full"
                    style={{ 
                      backgroundColor: index === 0 ? '#FF8C69' : index === 1 ? '#9B9BE8' : '#A4B870'
                    }}
                  >
                    <span className="text-2xl">📄</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 line-clamp-2">
                      {article.title}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
