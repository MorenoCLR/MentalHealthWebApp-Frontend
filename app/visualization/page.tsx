"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import { getMoodVisualization, getUserProfile, type MoodData, type MoodStats, type WeeklyMood } from "./actions"
import { RefreshCw, MoreVertical, Weight, Activity } from "lucide-react"

export default function VisualizationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('monthly')
  
  const [moodData, setMoodData] = useState<MoodData[]>([])
  const [stats, setStats] = useState<MoodStats | null>(null)
  const [weeklyMoods, setWeeklyMoods] = useState<WeeklyMood[]>([])
  const [username, setUsername] = useState<string | null>(null)
  const [physicalStats, setPhysicalStats] = useState<{ weight?: number, height?: number } | null>(null)

  useEffect(() => {
    loadData()
  }, [period])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const [vizResult, profileResult] = await Promise.all([
        getMoodVisualization(period),
        getUserProfile()
      ])

      if (vizResult.error) {
        setError(vizResult.error)
      } else {
        setMoodData(vizResult.data || [])
        setStats(vizResult.stats)
        setWeeklyMoods(vizResult.weeklyMoods || [])
      }

      if (profileResult.username) {
        setUsername(profileResult.full_name || profileResult.username)
      }
      
      if (profileResult.physicalHealth) {
        setPhysicalStats(profileResult.physicalHealth)
      }
    } catch (err) {
      console.error(err)
      setError('Failed to Retrieve Your mood!!')
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    loadData()
  }

  const getBarColor = (rating: number) => {
    // 1-2 = negative (coral), 3+ = positive (green)
    return rating <= 2 ? '#FF8C69' : '#A4B870'
  }

  const getBarHeight = (rating: number) => {
    // Scale 1-5 to percentage
    return `${(rating / 5) * 100}%`
  }

  const formatDateLabel = (dateStr: string, index: number, total: number) => {
    const date = new Date(dateStr)
    
    // Show first and last date labels
    if (index === 0) {
      return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })
    }
    if (index === total - 1) {
      return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })
    }
    return ''
  }

  return (
    <div className="relative min-h-screen w-full bg-[#A4B870] overflow-hidden pb-8">
      {/* Navbar */}
      <Navbar />

      {/* Decorative background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-10 left-20 w-64 h-64 border-4 border-white rounded-full"></div>
        <div className="absolute top-40 right-32 w-96 h-96 border-4 border-white rounded-full"></div>
        <div className="absolute bottom-20 left-40 w-48 h-48 border-4 border-white rounded-full"></div>
      </div>

      {/* Main content with sidebar offset */}
      <div className="md:ml-20">
        {/* Page Header */}
        <header className="relative flex items-center justify-between px-6 py-6">
          <h1 className="text-2xl font-semibold text-white">Visualization</h1>
        </header>

        {/* Main content */}
        <main className="relative px-6 pt-4">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                Mood Data Visualization
              </h2>
              <p className="text-xl font-semibold text-[#6E8450] mb-3">
                {username}
              </p>
            
            {/* Dynamic Physical Stats Badge */}
            {physicalStats && (physicalStats.weight || physicalStats.height) && (
              <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium">
                {physicalStats.weight && (
                  <div className="flex items-center gap-1.5">
                    <Weight size={14} />
                    <span>{physicalStats.weight} kg</span>
                  </div>
                )}
                {physicalStats.weight && physicalStats.height && (
                  <span className="w-1 h-1 bg-white/60 rounded-full" />
                )}
                {physicalStats.height && (
                  <div className="flex items-center gap-1.5">
                    <Activity size={14} />
                    <span>{physicalStats.height} cm</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chart Card */}
          <div className="bg-white rounded-3xl p-6 mb-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF8C69]"></div>
                  <span className="text-gray-600">Bad (1-2)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#E5D68A]"></div>
                  <span className="text-gray-600">Neutral (3)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#A4B870]"></div>
                  <span className="text-gray-600">Good (4-5)</span>
                </div>
              </div>
              <button
                onClick={() => setPeriod(period === 'monthly' ? 'weekly' : 'monthly')}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
              >
                <span className="text-gray-400">😊</span>
                <span className="capitalize">{period}</span>
                <span>▼</span>
              </button>
            </div>

            {/* Chart or Loading/Error State */}
            <div className="relative h-48">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <button
                    onClick={handleRetry}
                    className="flex flex-col items-center gap-3 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <RefreshCw className="w-12 h-12 animate-spin" />
                    <span className="text-sm font-medium">Tap to Retry</span>
                  </button>
                </div>
              ) : error ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="bg-red-100 rounded-full px-4 py-1 mb-3">
                    <span className="text-red-600 text-sm font-medium">Error</span>
                  </div>
                  <div className="w-16 h-16 bg-gray-300 rounded-2xl flex items-center justify-center mb-3">
                    <span className="text-3xl">⚠️</span>
                  </div>
                  <p className="text-gray-700 text-sm mb-4">{error}</p>
                  <button
                    onClick={handleRetry}
                    className="px-8 py-2 bg-white border-2 border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50"
                  >
                    Ok 👍
                  </button>
                </div>
              ) : moodData.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-gray-400">No mood data available</p>
                </div>
              ) : (
                <div className="h-full bg-gray-50 rounded-2xl p-4 flex items-end justify-between gap-1 overflow-x-auto">
                  {moodData.map((mood, index) => (
                    <div key={mood.id} className="flex-1 min-w-[20px] flex flex-col items-center justify-end h-full gap-2 group">
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        {new Date(mood.mood_at).toLocaleDateString()} - Rating: {mood.mood_rating}
                      </div>
                      
                      <div
                        className="w-2 md:w-3 rounded-full transition-all duration-300 hover:opacity-80 shadow-sm"
                        style={{
                          backgroundColor: mood.mood_rating >= 4 ? '#A4B870' : mood.mood_rating === 3 ? '#E5D68A' : '#FF8C69',
                          height: `${(mood.mood_rating / 5) * 100}%`,
                          minHeight: '8px'
                        }}
                      ></div>
                      
                      {/* Date Label - show sparsely to avoid clutter */}
                      {(index === 0 || index === moodData.length - 1 || index % Math.ceil(moodData.length / 5) === 0) && (
                        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap absolute bottom-1">
                          {new Date(mood.mood_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mood History Card */}
          <div className="bg-white rounded-3xl p-6 mb-4 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">Mood History</h3>
              <button className="text-gray-400 hover:text-gray-600">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-between items-center">
              {weeklyMoods.map((dayMood) => (
                <div key={dayMood.day} className="flex flex-col items-center gap-2">
                  <div className={`text-3xl ${dayMood.mood === null ? 'opacity-30' : ''}`}>
                    {dayMood.emoji}
                  </div>
                  <span className="text-xs text-gray-600">{dayMood.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Mood Score Summary Card */}
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-gray-800">{stats?.healthScore || '-'}</div>
                <div className="text-xs text-gray-500">Healthy</div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-3">Mood Score Summary</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>Highest Mood Score : <span className="text-gray-800 font-medium">{stats?.highest || '-'}</span></div>
                  <div>Lowest Mood Score : <span className="text-gray-800 font-medium">{stats?.lowest || '-'}</span></div>
                  <div>Average Mood Score : <span className="text-gray-800 font-medium">{stats?.average || '-'}</span></div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </main>
      </div>
    </div>
  )
}
