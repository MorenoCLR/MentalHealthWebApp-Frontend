"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import { getRelaxationSuggestions, saveSelectedActivities, type RelaxationActivity } from "./actions"
import { Check } from "lucide-react"

export default function RelaxationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [activities, setActivities] = useState<RelaxationActivity[]>([])
  const [hasLoggedMoodToday, setHasLoggedMoodToday] = useState(true)
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadSuggestions()
  }, [])

  const loadSuggestions = async () => {
    setLoading(true)

    // Simulate loading delay for better UX
    await new Promise(resolve => setTimeout(resolve, 2000))

    try {
      const result = await getRelaxationSuggestions()

      if (result.error) {
        setError(result.error as string)
      }

      if (result.message) {
        setInfo(result.message)
      }

      if (result.activities) {
        setActivities(result.activities)
      }

      setHasLoggedMoodToday(result.hasLoggedMoodToday ?? true)
    } catch (err) {
      console.error(err)
      setError('Unable to load relaxation suggestions')
    } finally {
      setLoading(false)
    }
  }

  const handleMoodRedirect = () => {
    router.push('/mood')
  }

  const toggleActivity = (activityId: string) => {
    setSelectedActivities(prev => {
      if (prev.includes(activityId)) {
        return prev.filter(id => id !== activityId)
      } else {
        return [...prev, activityId]
      }
    })
  }

  const handleSaveActivities = async () => {
    if (selectedActivities.length === 0) {
      setSaveMessage({ type: 'error', text: 'Please select at least 1 activity' })
      setTimeout(() => setSaveMessage(null), 3000)
      return
    }

    setSaving(true)
    setSaveMessage(null)

    try {
      const result = await saveSelectedActivities(selectedActivities)

      if (result.error) {
        setSaveMessage({ type: 'error', text: result.error })
      } else {
        setSaveMessage({ type: 'success', text: `Successfully saved ${selectedActivities.length} activity(ies)!` })
        // Clear selections after successful save
        setTimeout(() => {
          setSelectedActivities([])
          setSaveMessage(null)
        }, 2000)
      }
    } catch (err) {
      setSaveMessage({ type: 'error', text: 'Failed to save activities' })
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMessage(null), 5000)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="relative min-h-screen w-full bg-[#A4B870]">
        {/* Navbar */}
        <Navbar />

        {/* Decorative background patterns */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-10 z-0">
          <div className="absolute top-10 left-20 w-64 h-64 border-4 border-white rounded-full"></div>
          <div className="absolute top-40 right-32 w-96 h-96 border-4 border-white rounded-full"></div>
          <div className="absolute bottom-20 left-40 w-48 h-48 border-4 border-white rounded-full"></div>
        </div>

        {/* Main content with sidebar offset */}
        <div className="md:ml-20">
          {/* Page Header */}
          <header className="relative flex items-center justify-between px-6 py-6">
            <h1 className="text-2xl font-semibold text-white">Relaxation</h1>
          </header>

          {/* Loading content */}
          <main className="relative flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-8 text-center">
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
      </div>
    )
  }

  // No mood logged today - Show orange warning
  if (!hasLoggedMoodToday && !loading) {
    return (
      <div className="min-h-screen w-full bg-[#E56C34]">
        {/* Navbar */}
        <Navbar />

        {/* Decorative background patterns */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-10 z-0">
          <div className="absolute top-10 left-20 w-64 h-64 border-4 border-white rounded-full"></div>
          <div className="absolute top-40 right-32 w-96 h-96 border-4 border-white rounded-full"></div>
          <div className="absolute bottom-20 left-40 w-48 h-48 border-4 border-white rounded-full"></div>
        </div>

        {/* Main content with sidebar offset */}
        <div className="md:ml-20">
          {/* Page Header */}
          <header className="relative flex items-center justify-between px-6 py-6">
            <h1 className="text-2xl font-semibold text-white">Relaxation</h1>
          </header>

          {/* Main content */}
          <main className="relative px-6 py-6 flex items-center justify-center min-h-[calc(100vh-120px)]">
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-12 border border-white/30">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-6xl">😔</span>
                </div>
                <h2 className="text-4xl font-bold text-white mb-4">
                  {info || "Seems like your mood its not enough!"}
                </h2>
                <p className="text-xl text-white/90 mb-8">
                  Please log your mood again
                </p>
                <button
                  onClick={() => router.push('/mood')}
                  className="px-8 py-4 bg-white text-[#E56C34] font-semibold rounded-full hover:bg-gray-100 transition-colors shadow-lg text-lg"
                >
                  Log Your Mood Now
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  // Success state - Show activities
  return (
    <div className="relative min-h-screen w-full bg-[#A4B870] pb-12">
      {/* Navbar */}
      <Navbar />

      {/* Decorative background patterns */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-10 z-0">
        <div className="absolute top-10 left-20 w-64 h-64 border-4 border-white rounded-full"></div>
        <div className="absolute top-40 right-32 w-96 h-96 border-4 border-white rounded-full"></div>
        <div className="absolute bottom-20 left-40 w-48 h-48 border-4 border-white rounded-full"></div>
      </div>

      {/* Main content with sidebar offset */}
      <div className="md:ml-20">
        {/* Page Header */}
        <header className="relative flex items-center justify-between px-6 py-6">
          <h1 className="text-2xl font-semibold text-white">Relaxation</h1>
        </header>

        {/* Main content */}
        <main className="relative px-6 py-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6">
              Here are the relaxation ideas for you
            </h2>

          {info && (
            <div className="mb-8 rounded-2xl bg-white/20 border border-white/30 text-white px-4 py-3">
              {info}
            </div>
          )}

          {error && (
            <div className="mb-8 rounded-2xl bg-red-500/20 border border-red-500/40 text-white px-4 py-3">
              {error}
            </div>
          )}

          {saveMessage && (
            <div className={`mb-8 rounded-2xl border px-4 py-3 text-white ${
              saveMessage.type === 'success'
                ? 'bg-green-500/30 border-green-400/50'
                : 'bg-red-500/30 border-red-400/50'
            }`}>
              {saveMessage.text}
            </div>
          )}

          {/* Save Button */}
          {activities.length > 0 && (
            <div className="mb-8 flex items-center justify-between bg-white/20 backdrop-blur-sm rounded-2xl p-4 border border-white/30">
              <div className="text-white">
                <p className="text-lg font-semibold">
                  {selectedActivities.length} of {activities.length} selected
                </p>
                <p className="text-sm text-white/80">
                  Select at least 1 activity to save
                </p>
              </div>
              <button
                onClick={handleSaveActivities}
                disabled={saving || selectedActivities.length === 0}
                className={`px-6 py-3 rounded-full font-semibold transition-all ${
                  selectedActivities.length === 0
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-white text-[#A4B870] hover:bg-gray-100 shadow-lg'
                } disabled:opacity-50`}
              >
                {saving ? 'Saving...' : 'Save Selected Activities'}
              </button>
            </div>
          )}

          {/* Activities list */}
          <div className="space-y-6">
            {activities.map((activity, index) => {
              const isSelected = selectedActivities.includes(activity.id)

              return (
                <div
                  key={activity.id}
                  onClick={() => toggleActivity(activity.id)}
                  className={`flex cursor-pointer ${
                    index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                  } items-center gap-0 bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all relative ${
                    isSelected ? 'ring-4 ring-white ring-offset-4 ring-offset-[#A4B870]' : ''
                  }`}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-4 right-4 z-10 bg-[#A4B870] text-white rounded-full p-2 shadow-lg">
                      <Check size={24} />
                    </div>
                  )}

                  {/* Text content */}
                  <div className="flex-1 p-8">
                    <h2 className="text-3xl font-bold text-[#A4B870] mb-4">
                      {activity.title}
                    </h2>
                    <p className="text-gray-600 leading-relaxed">
                      {activity.description}
                    </p>
                    <div className="mt-4">
                      <span className="inline-block px-3 py-1 bg-[#A4B870]/10 text-[#6E8450] text-sm rounded-full">
                        {activity.category}
                      </span>
                    </div>
                  </div>

                  {/* Image */}
                  <div className="flex-1 h-64 bg-gray-200 relative overflow-hidden">
                    <img
                      src={activity.image}
                      alt={activity.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )
            })}
          </div>
          </div>
        </main>
      </div>
    </div>
  )
}
