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
  const [username] = useState<string>("Moreno")

  // Calculate background color based on selected mood
  const backgroundColor = selectedMood 
    ? MOODS.find(m => m.rating === selectedMood)?.bgColor || "#F5F5F0"
    : "#9CA3AF" // Default gray

  useEffect(() => {
    // Apply background color to body for full-page effect
    document.body.style.backgroundColor = backgroundColor
    document.body.style.transition = "background-color 0.5s ease"

    return () => {
      document.body.style.backgroundColor = ""
    }
  }, [backgroundColor])

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
        // Success - could redirect or show success message
        setSelectedMood(null)
        // Optional: redirect to dashboard or show success
        // router.push('/dashboard')
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
          {/* Greeting with selected emoji */}
          <div className="mb-8">
            {selectedMood && (
              <div className="text-6xl mb-4 animate-bounce">
                {MOODS.find(m => m.rating === selectedMood)?.emoji}
              </div>
            )}
            <h1 className="text-3xl font-bold text-white mb-2">
              👋 Hey {username}!
            </h1>
            <p className="text-xl text-white/90">
              How are you feeling this day?
            </p>
          </div>

          {/* Mood selection card */}
          <div className="bg-white/95 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
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
                  disabled={loading}
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
              disabled={!selectedMood || loading}
              className={`
                w-full py-3 px-6 rounded-full font-medium text-white
                transition-all duration-300 shadow-lg
                ${!selectedMood || loading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gray-800 hover:bg-gray-900 hover:shadow-xl active:scale-95'
                }
              `}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
