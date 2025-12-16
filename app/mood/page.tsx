"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { saveMood } from "./actions"
import Navbar from "@/components/Navbar"

// Mood configuration: rating, emoji, label, background color
const MOODS = [
  { rating: 5, emoji: "😊", label: "Great", bgColor: "#A4B870" },
  { rating: 4, emoji: "🙂", label: "Good", bgColor: "#E5D68A" },
  { rating: 3, emoji: "😐", label: "Okay", bgColor: "#A67C52" },
  { rating: 2, emoji: "😰", label: "Anxious", bgColor: "#FF8C69" },
  { rating: 1, emoji: "😢", label: "Sad", bgColor: "#9B9BE8" },
]

export default function MoodLoggingPage() {
  const router = useRouter()
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [loggedToday, setLoggedToday] = useState(false)
  const [todayMoodRating, setTodayMoodRating] = useState<number | null>(null)
  const [showChangeConfirm, setShowChangeConfirm] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch username
        const userRes = await fetch('/api/user-profile', { cache: 'no-store' })
        if (userRes.ok) {
          const userData = await userRes.json()
          setUsername(userData.username || userData.full_name || 'there')
        }

        // Check if user logged mood today
        const moodRes = await fetch('/api/mood-today', { cache: 'no-store' })
        if (moodRes.ok) {
          const moodData = await moodRes.json()
          if (moodData.moodRating) {
            setLoggedToday(true)
            setTodayMoodRating(moodData.moodRating)
          } else {
            setLoggedToday(false)
            setTodayMoodRating(null)
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err)
      }
    }

    fetchData()

    // Refetch when document becomes visible (user returns to page)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Also refetch when window regains focus
    const handleFocus = () => {
      fetchData()
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  // Calculate background color
  const displayMoodRating = loggedToday && !selectedMood ? todayMoodRating : selectedMood
  const backgroundColor = displayMoodRating 
    ? MOODS.find(m => m.rating === displayMoodRating)?.bgColor || "#F5F5F0"
    : "#9CA3AF"

  useEffect(() => {
    document.body.style.backgroundColor = backgroundColor
    document.body.style.transition = "background-color 0.5s ease"
    return () => {
      document.body.style.backgroundColor = ""
    }
  }, [backgroundColor])

  const handleChangeConfirm = () => {
    setShowChangeConfirm(false)
    setLoggedToday(false)
    setTodayMoodRating(null)
    setSelectedMood(null)
    setError(null)
  }

  const handleMoodSelect = (rating: number) => {
    setSelectedMood(rating)
    setError(null)
  }

  const handleSave = async () => {
    if (!selectedMood) {
      setError("Please choose your mood!")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('mood_rating', selectedMood.toString())
      
      const result = await saveMood(formData)
      
      if (result?.error) {
        setError(result.error)
      } else {
        setSelectedMood(null)
        setLoggedToday(true)
        setTodayMoodRating(selectedMood)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden transition-colors duration-500">
      {/* Navbar */}
      <Navbar />
      
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="absolute top-6 left-24 md:left-28 flex items-center gap-2 text-white/90 hover:text-white transition-colors z-10"
      >
        <span className="text-2xl">←</span>
        <span className="text-sm font-medium">Daily Mood Logging</span>
      </button>

      {/* Main content */}
      <main className="flex min-h-screen w-full items-center justify-center px-8">
        <div className="w-full max-w-md text-center">
          {/* Greeting with selected/today emoji */}
          <div className="mb-8">
            {(selectedMood || (loggedToday && todayMoodRating)) && (
              <div className="text-6xl mb-4 animate-bounce">
                {MOODS.find(m => m.rating === (selectedMood || todayMoodRating))?.emoji}
              </div>
            )}
            <h1 className="text-3xl font-bold text-white mb-2">
              👋 Hey {username}!
            </h1>
            <p className="text-xl text-white/90">
              {loggedToday && !selectedMood ? "You have logged today" : "How are you feeling this day?"}
            </p>
          </div>

          {/* Mood selection card - blurred if logged today */}
          <div className={`bg-white/95 rounded-3xl p-8 shadow-2xl backdrop-blur-sm ${
            loggedToday && !selectedMood ? 'blur-sm pointer-events-none opacity-50' : ''
          }`}>
            {/* Error message */}
            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-full text-sm">
                {error}
              </div>
            )}

            {/* Mood grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {MOODS.map((mood) => (
                <button
                  key={mood.rating}
                  onClick={() => handleMoodSelect(mood.rating)}
                  className={`
                    relative flex flex-col items-center justify-center 
                    p-4 rounded-2xl transition-all duration-300
                    ${selectedMood === mood.rating 
                      ? 'ring-4 ring-offset-2 ring-offset-white scale-110' 
                      : 'hover:scale-105'
                    }
                  `}
                  style={{
                    backgroundColor: mood.bgColor + '30', // 30% opacity
                    ...(selectedMood === mood.rating && {
                      '--tw-ring-color': mood.bgColor
                    } as React.CSSProperties)
                  }}
                  disabled={loading || (loggedToday && !selectedMood)}
                >
                  <span className="text-4xl mb-2">{mood.emoji}</span>
                  <span className="text-xs font-medium text-gray-700">
                    {mood.label}
                  </span>
                  {selectedMood === mood.rating && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={!selectedMood || loading || (loggedToday && !selectedMood)}
              className={`
                w-full py-3 px-6 rounded-full font-medium text-white
                transition-all duration-300 shadow-lg
                ${!selectedMood || loading || (loggedToday && !selectedMood)
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gray-800 hover:bg-gray-900 hover:shadow-xl active:scale-95'
                }
              `}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>

          {/* Change mood button - only when logged today */}
          {loggedToday && !selectedMood && (
            <button
              onClick={() => setShowChangeConfirm(true)}
              className="mt-6 px-6 py-3 bg-white text-[#A4B870] font-medium rounded-full hover:bg-gray-100 transition-colors shadow-lg"
            >
              Change my mood log today
            </button>
          )}
        </div>
      </main>

      {/* Change Confirmation Modal */}
      {showChangeConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-8 z-50">
          <div className="bg-[#A4B870] rounded-3xl p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Change Mood Log?
            </h2>

            <div className="flex items-center justify-center mb-8">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <span className="text-2xl">{MOODS.find(m => m.rating === todayMoodRating)?.emoji}</span>
              </div>
            </div>

            <p className="text-white mb-6">
              Are you sure you want to change your mood log for today?
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowChangeConfirm(false)}
                className="px-8 py-3 bg-white text-gray-800 rounded-full font-medium hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangeConfirm}
                className="px-8 py-3 bg-white text-gray-800 rounded-full font-medium hover:bg-gray-100 transition-colors"
              >
                Yes, Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
