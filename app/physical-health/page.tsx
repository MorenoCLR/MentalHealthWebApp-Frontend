"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { savePhysicalHealth, getLast7DaysPhysicalHealth } from "./actions"
import { Plus, Check } from "lucide-react"

type HealthEntry = {
  id: string
  complaints: string
  created_at: string
}

export default function PhysicalHealthPage() {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [healthLogs, setHealthLogs] = useState<HealthEntry[]>([])
  const [loggedToday, setLoggedToday] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch username
        const userRes = await fetch('/api/user-profile', { cache: 'no-store' })
        if (userRes.ok) {
          const userData = await userRes.json()
          setUsername(userData.username || userData.full_name || 'there')
        }

        // Check if user logged physical health today
        const healthRes = await fetch('/api/physical-health-today', { cache: 'no-store' })
        if (healthRes.ok) {
          const healthData = await healthRes.json()
          setLoggedToday(healthData.loggedToday)
        }
      } catch (err) {
        console.error('Error fetching data:', err)
      }
    }
    
    fetchData()
    loadHealthLogs()

    // Refetch logs when document becomes visible (user returns to page)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchData()
        loadHealthLogs()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Also refetch when window regains focus
    const handleFocus = () => {
      fetchData()
      loadHealthLogs()
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const loadHealthLogs = async () => {
    const result = await getLast7DaysPhysicalHealth()
    if (result.data) {
      setHealthLogs(result.data as HealthEntry[])
    }
  }

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
        setLoggedToday(true)
        setShowSuccess(true)
        // Clear form
        setWeight("")
        setSleepHours("")
        setStepCounts("")
        
        // Reload health logs
        await loadHealthLogs()
        
        // Auto-hide success and show history after 3 seconds
        setTimeout(() => {
          setShowSuccess(false)
          setShowForm(false)
          setShowHistory(true)
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
      <main className="flex min-h-screen w-full flex-col items-center justify-center px-8 py-8">
        {!showHistory ? (
          // Physical Health Logging Section
          <div className="w-full max-w-md text-center">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                👋 Hey {username}!
              </h1>
            </div>

            <h2 className="text-2xl font-semibold text-white mb-12">
              Physical Health Log
            </h2>

            {/* Form container */}
            <div className={`${loggedToday && !showForm ? 'blur-sm pointer-events-none opacity-50' : ''}`}>
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
                  <label className="block text-sm text-gray-700 font-medium mb-2">
                    Weight(kg)
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Enter your Weight..."
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A67C52]/50"
                    step="0.1"
                    disabled={loading || showSuccess || loggedToday}
                  />
                </div>

                {/* Sleep Hours Input */}
                <div className="mb-6 text-left">
                  <label className="block text-sm text-gray-700 font-medium mb-2">
                    Sleep Hour(hours)
                  </label>
                  <input
                    type="number"
                    value={sleepHours}
                    onChange={(e) => setSleepHours(e.target.value)}
                    placeholder="Enter your Sleep Hours..."
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A67C52]/50"
                    step="0.5"
                    disabled={loading || showSuccess || loggedToday}
                  />
                </div>

                {/* Step Counts Input */}
                <div className="text-left">
                  <label className="block text-sm text-gray-700 font-medium mb-2">
                    Step Counts(steps)
                  </label>
                  <input
                    type="number"
                    value={stepCounts}
                    onChange={(e) => setStepCounts(e.target.value)}
                    placeholder="Enter your Step Counts..."
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A67C52]/50"
                    disabled={loading || showSuccess || loggedToday}
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                onClick={handleSubmit}
                disabled={loading || showSuccess || loggedToday}
                className={`
                  w-full py-3 px-6 rounded-full font-medium text-gray-800
                  transition-all duration-300 shadow-lg
                  ${loading || showSuccess || loggedToday
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-white hover:bg-gray-100 hover:shadow-xl active:scale-95'
                  }
                `}
              >
                {loading ? 'Saving...' : loggedToday ? 'You have logged today' : 'Submit'}
              </button>
            </div>

            {/* Show history button when logged today */}
            {loggedToday && (
              <button
                onClick={() => setShowHistory(true)}
                className="mt-6 px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-full font-medium transition-colors"
              >
                See The Latest Week History
              </button>
            )}
          </div>
        ) : (
          // History Section
          <div className="w-full max-w-2xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                👋 Hey {username}!
              </h1>
            </div>

            <h2 className="text-2xl font-semibold text-white mb-8">
              Health Logs (Last 7 Days)
            </h2>

            {/* Health logs list */}
            {healthLogs.length > 0 ? (
              <div className="space-y-4 mb-8">
                {healthLogs.map((log) => {
                  let logData: any = {}
                  try {
                    logData = JSON.parse(log.complaints)
                  } catch (e) {}
                  
                  return (
                    <div key={log.id} className="bg-white/95 rounded-3xl p-6 shadow-lg">
                      <p className="text-sm text-gray-500 mb-2">
                        {new Date(log.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                      <div className="space-y-2">
                        {logData.weight && (
                          <p className="text-gray-800"><span className="font-medium">Weight:</span> {logData.weight} kg</p>
                        )}
                        {logData.sleepHours && (
                          <p className="text-gray-800"><span className="font-medium">Sleep:</span> {logData.sleepHours} hours</p>
                        )}
                        {logData.stepCounts && (
                          <p className="text-gray-800"><span className="font-medium">Steps:</span> {logData.stepCounts}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center mb-8">
                <p className="text-white/80 text-lg">No health logs yet</p>
              </div>
            )}

            {/* Back to logging button */}
            <button
              onClick={() => setShowHistory(false)}
              className="w-full py-3 px-6 rounded-full font-medium text-gray-800 bg-white hover:bg-gray-100 hover:shadow-xl active:scale-95 transition-all duration-300 shadow-lg"
            >
              Back to Logging
            </button>
          </div>
        )}
      </main>    </div>
  )
}