"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getRelaxationSuggestions, type RelaxationActivity } from "./actions"

export default function RelaxationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<'LOW_MOOD' | 'NO_MOOD_DATA' | null>(null)
  const [activities, setActivities] = useState<RelaxationActivity[]>([])

  useEffect(() => {
    loadSuggestions()
  }, [])

  const loadSuggestions = async () => {
    setLoading(true)
    
    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 2000))

    try {
      const result = await getRelaxationSuggestions()

      if (result.error === 'LOW_MOOD') {
        setError('LOW_MOOD')
      } else if (result.error === 'NO_MOOD_DATA') {
        setError('NO_MOOD_DATA')
      } else {
        setActivities(result.activities)
      }
    } catch (err) {
      console.error(err)
      setError('NO_MOOD_DATA')
    } finally {
      setLoading(false)
    }
  }

  const handleMoodRedirect = () => {
    router.push('/mood')
  }

  // Loading state
  if (loading) {
    return (
      <div className="relative min-h-screen w-full bg-[#A4B870] overflow-hidden">
        {/* Decorative background patterns */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          <div className="absolute top-10 left-20 w-64 h-64 border-4 border-white rounded-full"></div>
          <div className="absolute top-40 right-32 w-96 h-96 border-4 border-white rounded-full"></div>
          <div className="absolute bottom-20 left-40 w-48 h-48 border-4 border-white rounded-full"></div>
        </div>

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-6 left-6 w-10 h-10 border-2 border-white/50 rounded-full flex items-center justify-center text-white/90 hover:text-white hover:border-white transition-colors"
        >
          ←
        </button>

        {/* Loading content */}
        <main className="relative flex flex-col items-center justify-center min-h-screen px-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-12">
            Lets us find all relaxation that suits you
          </h1>

          <div className="mb-6">
            <div className="w-32 h-32 border-8 border-white/30 border-t-white rounded-full animate-spin"></div>
          </div>

          <p className="text-xl text-white">
            Please wait...
          </p>
        </main>
      </div>
    )
  }

  // Error state - Low mood
  if (error === 'LOW_MOOD') {
    return (
      <div className="relative min-h-screen w-full bg-[#FF8C69] overflow-hidden">
        {/* Decorative background patterns */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          <div className="absolute top-10 left-20 w-64 h-64 border-4 border-white rounded-full"></div>
          <div className="absolute top-40 right-32 w-96 h-96 border-4 border-white rounded-full"></div>
          <div className="absolute bottom-20 left-40 w-48 h-48 border-4 border-white rounded-full"></div>
        </div>

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-6 left-6 w-10 h-10 border-2 border-white/50 rounded-full flex items-center justify-center text-white/90 hover:text-white hover:border-white transition-colors"
        >
          ←
        </button>

        {/* Error content */}
        <main className="relative flex flex-col items-center justify-center min-h-screen px-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">
            Seems like your mood its not enough!!!
          </h1>

          <button
            onClick={handleMoodRedirect}
            className="text-xl text-white hover:underline"
          >
            Please log your mood again
          </button>
        </main>
      </div>
    )
  }

  // Error state - No mood data
  if (error === 'NO_MOOD_DATA') {
    return (
      <div className="relative min-h-screen w-full bg-[#FF8C69] overflow-hidden">
        {/* Decorative background patterns */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          <div className="absolute top-10 left-20 w-64 h-64 border-4 border-white rounded-full"></div>
          <div className="absolute top-40 right-32 w-96 h-96 border-4 border-white rounded-full"></div>
          <div className="absolute bottom-20 left-40 w-48 h-48 border-4 border-white rounded-full"></div>
        </div>

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-6 left-6 w-10 h-10 border-2 border-white/50 rounded-full flex items-center justify-center text-white/90 hover:text-white hover:border-white transition-colors"
        >
          ←
        </button>

        {/* Error content */}
        <main className="relative flex flex-col items-center justify-center min-h-screen px-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">
            No mood data found!
          </h1>

          <button
            onClick={handleMoodRedirect}
            className="text-xl text-white hover:underline"
          >
            Please log your mood first
          </button>
        </main>
      </div>
    )
  }

  // Success state - Show activities
  return (
    <div className="relative min-h-screen w-full bg-[#A4B870] overflow-hidden pb-12">
      {/* Decorative background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-10 left-20 w-64 h-64 border-4 border-white rounded-full"></div>
        <div className="absolute top-40 right-32 w-96 h-96 border-4 border-white rounded-full"></div>
        <div className="absolute bottom-20 left-40 w-48 h-48 border-4 border-white rounded-full"></div>
      </div>

      {/* Main content */}
      <main className="relative px-6 py-12">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-12">
            Here are the list relaxation for you
          </h1>

          {/* Activities list */}
          <div className="space-y-6">
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className={`flex ${
                  index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                } items-center gap-0 bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow`}
              >
                {/* Text content */}
                <div className="flex-1 p-8">
                  <h2 className="text-3xl font-bold text-[#A4B870] mb-4">
                    {activity.title}
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    {activity.description}
                  </p>
                </div>

                {/* Image */}
                <div className="flex-1 h-64 bg-gray-200 relative overflow-hidden">
                  {/* Placeholder for image - you can replace with actual images */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                    <span className="text-6xl opacity-50">
                      {activity.id === 'running-walking' && '🏃'}
                      {activity.id === 'yoga' && '🧘'}
                      {activity.id === 'reading' && '📖'}
                    </span>
                  </div>
                  {/* Uncomment when you have actual images */}
                  {/* <img 
                    src={activity.image} 
                    alt={activity.title}
                    className="w-full h-full object-cover"
                  /> */}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
