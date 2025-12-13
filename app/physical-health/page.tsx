"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { savePhysicalHealth } from "./actions"
import { Plus, Check } from "lucide-react"

export default function PhysicalHealthPage() {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [username] = useState("Moreno")

  // Form states
  const [weight, setWeight] = useState("")
  const [sleepHours, setSleepHours] = useState("")
  const [stepCounts, setStepCounts] = useState("")

  const handleAddClick = () => {
    setShowForm(true)
    setShowSuccess(false)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!weight && !sleepHours && !stepCounts) {
      setError("Please fill in at least one field")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      if (weight) formData.append('weight', weight)
      if (sleepHours) formData.append('sleep_hours', sleepHours)
      if (stepCounts) formData.append('step_counts', stepCounts)

      const result = await savePhysicalHealth(formData)

      if (result?.error) {
        setError(result.error)
      } else {
        setShowSuccess(true)
        // Clear form
        setWeight("")
        setSleepHours("")
        setStepCounts("")
        
        // Auto-hide success after 3 seconds
        setTimeout(() => {
          setShowSuccess(false)
          setShowForm(false)
        }, 3000)
      }
    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-[#A67C52] overflow-hidden">
      {/* Decorative background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-10 left-20 w-64 h-64 border-4 border-white rounded-full"></div>
        <div className="absolute top-40 right-32 w-96 h-96 border-4 border-white rounded-full"></div>
        <div className="absolute bottom-20 left-40 w-48 h-48 border-4 border-white rounded-full"></div>
      </div>

      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="absolute top-6 left-6 flex items-center gap-2 text-white/90 hover:text-white transition-colors z-10"
      >
        <span className="text-2xl w-10 h-10 border-2 border-white rounded-full flex items-center justify-center">
          ←
        </span>
        <span className="text-sm font-medium">Physical Health Logging</span>
      </button>

      {/* Main content */}
      <main className="flex min-h-screen w-full items-center justify-center px-8">
        <div className="w-full max-w-md text-center relative">
          {!showForm ? (
            <>
              {/* Empty state */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                  👋 Hey {username}!
                </h1>
              </div>

              <h2 className="text-2xl font-semibold text-white mb-12">
                Log Entry
              </h2>

              <button
                onClick={handleAddClick}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all mx-auto"
              >
                <Plus className="w-8 h-8 text-[#A67C52]" strokeWidth={3} />
              </button>
            </>
          ) : (
            <>
              {/* Form */}
              <h2 className="text-2xl font-semibold text-white mb-8">
                Log Entry
              </h2>

              <div className="bg-white/95 rounded-3xl p-8 shadow-2xl backdrop-blur-sm mb-6 relative">
                {/* Success overlay */}
                {showSuccess && (
                  <div className="absolute inset-0 bg-green-50/95 rounded-3xl flex flex-col items-center justify-center z-10">
                    <div className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium mb-4">
                      Success
                    </div>
                    <p className="text-gray-700 font-medium mb-6">
                      Your Data has been Saved
                    </p>
                    <div className="w-16 h-16 bg-[#A4B870] rounded-full flex items-center justify-center">
                      <Check className="w-8 h-8 text-white" strokeWidth={3} />
                    </div>
                  </div>
                )}

                {/* Error message */}
                {error && !showSuccess && (
                  <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-full text-sm">
                    {error}
                  </div>
                )}

                {/* Weight Input */}
                <div className="mb-6 text-left">
                  <label className="block text-sm text-[#A67C52] font-medium mb-2">
                    Weight(kg)
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Enter your Weight..."
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A67C52]/50"
                    step="0.1"
                    disabled={loading || showSuccess}
                  />
                </div>

                {/* Sleep Hours Input */}
                <div className="mb-6 text-left">
                  <label className="block text-sm text-[#A67C52] font-medium mb-2">
                    Sleep Hour(hours)
                  </label>
                  <input
                    type="number"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    placeholder="Enter your Sleep Hours..."
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A67C52]/50"
                    step="0.5"
                    disabled={loading || showSuccess}
                  />
                </div>

                {/* Step Counts Input */}
                <div className="text-left">
                  <label className="block text-sm text-[#A67C52] font-medium mb-2">
                    Step Counts(steps)
                  </label>
                  <input
                    type="number"
                    value={stepCounts}
                    onChange={(e) => setStepCounts(e.target.value)}
                    placeholder="Enter your Step Counts..."
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A67C52]/50"
                    disabled={loading || showSuccess}
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={loading || showSuccess}
                className={`
                  w-full py-3 px-6 rounded-full font-medium text-gray-800
                  transition-all duration-300 shadow-lg
                  ${loading || showSuccess
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-white hover:bg-gray-100 hover:shadow-xl active:scale-95'
                  }
                `}
              >
                {loading ? 'Saving...' : 'Submit'}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
