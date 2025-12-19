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
    username?: string
    full_name?: string
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
  hasLoggedMoodToday?: boolean
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
  weight?: number | null
  sleepHours?: number | null
  stepCounts?: number | null
}

type Article = {
  id: string
  title: string
}

type Suggestion = {
  id: string
  title: string
  description?: string
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
  const [greeting, setGreeting] = useState("Hope you are doing well on this day")

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

  useEffect(() => {
    const greetings = [
      "Hope you are doing well today!",
      "Wishing you a wonderful day ahead!",
      "Remember to take time for yourself.",
      "You're doing great, keep it up!",
      "Sending you positive vibes!",
      "Every day is a fresh start.",
      "Believe in yourself and all that you are.",
      "Small steps lead to big changes.",
      "Make today count!"
    ]

    const today = new Date().toISOString().split('T')[0]
    const savedDate = localStorage.getItem('greetingDate')
    const savedGreeting = localStorage.getItem('greetingMessage')

    if (savedDate === today && savedGreeting) {
      setGreeting(savedGreeting)
    } else {
      let newGreeting = greetings[Math.floor(Math.random() * greetings.length)]
      // Ensure different greeting from yesterday if possible
      if (savedGreeting && greetings.length > 1) {
        while (newGreeting === savedGreeting) {
          newGreeting = greetings[Math.floor(Math.random() * greetings.length)]
        }
      }
      localStorage.setItem('greetingDate', today)
      localStorage.setItem('greetingMessage', newGreeting)
      setGreeting(newGreeting)
    }
  }, [])

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
      <div className="md:ml-20 p-6 pb-12">
        {/* Header */}
        <div className="mb-6 mt-12 md:mt-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">👋</span> Hi, {data?.user?.username || data?.user?.full_name || 'there'}!
            </h1>
            <p className="mt-1 text-gray-600">{greeting}</p>
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
                      <p className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2">
                        {goal.name}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs font-medium text-gray-600">
                          {(() => {
                            if (goal.target === 'Indefinite') return 'Ongoing'
                            if (/^\d{4}-\d{2}-\d{2}$/.test(goal.target)) {
                              const targetDate = new Date(goal.target)
                              const today = new Date()
                              today.setHours(0, 0, 0, 0)
                              targetDate.setHours(0, 0, 0, 0)

                              if (targetDate.getTime() === today.getTime()) {
                                return 'Due Today'
                              } else if (targetDate < today) {
                                return `Overdue (${targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`
                              } else {
                                return `Due ${targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                              }
                            }
                            return goal.target
                          })()}
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
              <h3 className="text-sm font-semibold opacity-90">Mood Check</h3>
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
              <h3 className="text-sm font-semibold opacity-90">Stress Level</h3>
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
                <h3 className="text-sm font-semibold opacity-90">Journal</h3>
                <span className="text-xs opacity-80 hover:underline">See all</span>
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
          <div
            onClick={() => router.push('/visualization')}
            className="rounded-3xl bg-white p-6 shadow-lg cursor-pointer hover:shadow-xl transition-shadow group"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Mood Highlight</h3>
              <span className="text-sm text-gray-400 group-hover:text-[#A4B870] transition-colors">View Details →</span>
            </div>

            {/* Color Legend */}
            {data?.weeklyMoods?.length ? (
              <div className="flex items-center gap-3 mb-3 text-[10px]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#FF8C69]"></div>
                  <span className="text-gray-500">Low</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#E5D68A]"></div>
                  <span className="text-gray-500">Okay</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#A4B870]"></div>
                  <span className="text-gray-500">Good</span>
                </div>
              </div>
            ) : null}

            {/* Mini Chart */}
            <div className="mb-3 h-28 bg-gray-50 rounded-2xl p-4 pt-2">
              {data?.weeklyMoods?.length ? (
                <>
                  <div className="h-full flex items-end justify-between gap-1.5">
                    {data.weeklyMoods.slice(0, 7).map((mood, index) => {
                      const getBarColor = (rating: number) => {
                        if (rating >= 4) return '#A4B870'
                        if (rating === 3) return '#E5D68A'
                        return '#FF8C69'
                      }
                      const getBarHeight = (rating: number) => {
                        return (rating / 5) * 100
                      }
                      return (
                        <div key={mood.id} className="flex-1 flex flex-col items-center h-full justify-end group/bar relative">
                          {/* Tooltip */}
                          <div className="opacity-0 group-hover/bar:opacity-100 absolute bottom-full mb-1 bg-gray-800 text-white text-[10px] px-2 py-1 rounded transition-opacity whitespace-nowrap pointer-events-none z-10">
                            {new Date(mood.mood_at).toLocaleDateString(undefined, { weekday: 'short' })}: {mood.mood_rating}/5
                          </div>

                          {/* Bar */}
                          <div
                            className="w-3 md:w-4 rounded-full transition-all duration-300 group-hover/bar:opacity-80 mb-1"
                            style={{
                              backgroundColor: getBarColor(mood.mood_rating),
                              height: `${getBarHeight(mood.mood_rating)}%`,
                              minHeight: '8px'
                            }}
                          ></div>

                          {/* Day Label */}
                          <span className="text-[9px] text-gray-400 font-medium">
                            {new Date(mood.mood_at).toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <p className="text-sm text-gray-400 mb-3">No mood data yet</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push('/mood')
                    }}
                    className="text-xs px-4 py-2 bg-[#A4B870] text-white rounded-full hover:bg-[#6E8450] transition-colors"
                  >
                    Track Your Mood
                  </button>
                </div>
              )}
            </div>

            {/* Insights */}
            {data?.weeklyMoods?.length ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#A4B870]/20">
                    <span className="text-lg">
                      {(() => {
                        const avg = data.weeklyMoods.reduce((sum, m) => sum + m.mood_rating, 0) / data.weeklyMoods.length
                        if (avg >= 4) return '😊'
                        if (avg >= 3) return '😐'
                        return '😰'
                      })()}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Average Mood</p>
                    <p className="font-bold text-gray-800">
                      {(data.weeklyMoods.reduce((sum, m) => sum + m.mood_rating, 0) / data.weeklyMoods.length).toFixed(1)}/5
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Trend</p>
                  <p className="font-semibold text-gray-800">
                    {(() => {
                      if (data.weeklyMoods.length < 2) return '—'
                      const firstHalf = data.weeklyMoods.slice(0, Math.ceil(data.weeklyMoods.length / 2))
                      const secondHalf = data.weeklyMoods.slice(Math.ceil(data.weeklyMoods.length / 2))
                      const firstAvg = firstHalf.reduce((sum, m) => sum + m.mood_rating, 0) / firstHalf.length
                      const secondAvg = secondHalf.reduce((sum, m) => sum + m.mood_rating, 0) / secondHalf.length
                      const diff = secondAvg - firstAvg
                      if (diff > 0.3) return '↑ Improving'
                      if (diff < -0.3) return '↓ Declining'
                      return '→ Stable'
                    })()}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Relaxation Suggestions - Right Column */}
          <div>
            <div className="mb-3">
              <h2 className="text-lg font-semibold text-gray-800">Relaxation Suggestions</h2>
            </div>
            {!data?.hasLoggedMoodToday ? (
              <div
                onClick={() => router.push('/mood')}
                className="cursor-pointer rounded-3xl bg-[#E56C34] p-6 text-white shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-3xl">😔</span>
                  </div>
                  <div>
                    <p className="text-xl font-bold mb-2">Seems like your mood its not enough!</p>
                    <p className="text-white/90 text-sm mb-4">Please log your mood again</p>
                    <div className="inline-block px-4 py-2 bg-white text-[#E56C34] rounded-full font-semibold text-sm hover:bg-gray-100 transition-colors">
                      Log Mood Now →
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => router.push('/relaxation')}
                className="cursor-pointer rounded-3xl bg-gradient-to-br from-[#6E8450] to-[#4A5A35] p-6 text-white shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="space-y-3">
                  {data?.suggestions && data.suggestions.length > 0 ? (
                    data.suggestions.map((suggestion) => (
                      <div key={suggestion.id} className="rounded-2xl bg-white/10 p-4 hover:bg-white/15 transition-colors">
                        <p className="text-lg font-bold">{suggestion.title}</p>
                      </div>
                    ))
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-white/70">No suggestions available</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Other Features Row - Physical Health Cards */}
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Physical Health</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

          {/* Physical Health */}
          <div 
            onClick={() => router.push('/physical-health')}
            className="cursor-pointer rounded-3xl bg-white p-6 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Step Counts</h3>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#A4B870]">
                <Activity size={24} className="text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {data?.physicalHealth?.stepCounts ?? '-'} <span className="text-sm font-normal text-gray-500">steps</span>
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
                <p className="text-2xl font-bold text-gray-800">
                  {data?.physicalHealth?.sleepHours ?? '-'} <span className="text-sm font-normal text-gray-500">Hours</span>
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
              <ChevronRight size={16} className="text-gray-400" />
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
