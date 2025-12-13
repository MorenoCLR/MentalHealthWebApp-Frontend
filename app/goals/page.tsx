"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createGoal, updateGoal, getGoals } from "./actions"
import { Heart, Plus, Calendar, Target } from "lucide-react"

type Goal = {
  id: string
  name: string
  target: string
  progress: string
  updated_at: string
}

type FilterType = 'daily' | 'weekly' | 'monthly' | 'all'

export default function GoalsPage() {
  const router = useRouter()
  const [goals, setGoals] = useState<Goal[]>([])
  const [filter, setFilter] = useState<FilterType>('daily')
  const [loading, setLoading] = useState(true)
  const [username] = useState("Moreno")

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)

  // Form states
  const [goalName, setGoalName] = useState("")
  const [frequency, setFrequency] = useState("")
  const [errors, setErrors] = useState<{ name?: string; frequency?: string }>({})
  const [submitting, setSubmitting] = useState(false)

  const loadGoals = useCallback(async () => {
    setLoading(true)
    const result = await getGoals(filter)
    if (result.data) {
      setGoals(result.data)
    }
    setLoading(false)
  }, [filter])

  useEffect(() => {
    loadGoals()
  }, [loadGoals])

  const handleAddClick = () => {
    setSelectedGoal(null)
    setGoalName("")
    setFrequency("")
    setErrors({})
    setShowAddModal(true)
  }

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoal(goal)
    setGoalName(goal.name)
    setFrequency(goal.target)
    setErrors({})
    setShowUpdateConfirm(true)
  }

  const handleUpdateConfirm = () => {
    setShowUpdateConfirm(false)
    setShowAddModal(true)
  }

  const handleUpdateCancel = () => {
    setShowUpdateConfirm(false)
    setSelectedGoal(null)
  }

  const validateForm = () => {
    const newErrors: { name?: string; frequency?: string } = {}

    if (!goalName.trim()) {
      newErrors.name = "Goal is required"
    }

    if (!frequency.trim()) {
      newErrors.frequency = "Frequency is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('name', goalName)
      formData.append('target', frequency)

      let result
      if (selectedGoal) {
        formData.append('id', selectedGoal.id)
        result = await updateGoal(formData)
      } else {
        result = await createGoal(formData)
      }

      if (result?.error) {
        setErrors({ name: result.error })
      } else {
        setShowAddModal(false)
        setSelectedGoal(null)
        setGoalName("")
        setFrequency("")
        await loadGoals()
      }
    } catch (err) {
      console.error(err)
      setErrors({ name: 'An unexpected error occurred' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setSelectedGoal(null)
    setGoalName("")
    setFrequency("")
    setErrors({})
  }

  return (
    <div className="relative min-h-screen w-full bg-[#A4B870] overflow-hidden">
      {/* Decorative background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-10 left-20 w-64 h-64 border-4 border-white rounded-full"></div>
        <div className="absolute top-40 right-32 w-96 h-96 border-4 border-white rounded-full"></div>
        <div className="absolute bottom-20 left-40 w-48 h-48 border-4 border-white rounded-full"></div>
        <div className="absolute bottom-40 right-20 w-72 h-72 border-4 border-white rounded-full"></div>
      </div>

      {/* Header */}
      <header className="relative flex items-center justify-between px-6 py-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
        >
          <span className="text-2xl w-10 h-10 border-2 border-white rounded-full flex items-center justify-center">
            ←
          </span>
          <span className="text-xl font-semibold">Goals</span>
        </button>

        <button
          onClick={() => setFilter(filter === 'daily' ? 'all' : 'daily')}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-full transition-colors"
        >
          {filter.toUpperCase()}
        </button>
      </header>

      {/* Main content */}
      <main className="relative flex flex-col items-center justify-center px-8 pb-8 min-h-[calc(100vh-100px)]">
        {goals.length === 0 && !loading ? (
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              👋 Hey {username}!
            </h1>
            <p className="text-xl text-white/90 mb-8">
              &quot;Practice mindfulness daily&quot;
            </p>

            <button
              onClick={handleAddClick}
              className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              <Plus className="w-8 h-8 text-[#6E8450]" strokeWidth={3} />
            </button>
          </div>
        ) : (
          <div className="w-full max-w-2xl">
            <h1 className="text-3xl font-bold text-white mb-2 text-center">
              👋 Hey {username}!
            </h1>
            <p className="text-lg text-white/90 mb-8 text-center">
              Your goals for today
            </p>

            {/* Goals list */}
            <div className="space-y-4 mb-6">
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => handleGoalClick(goal)}
                  className="w-full bg-white/95 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#A4B870]/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Target className="w-6 h-6 text-[#6E8450]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-800 mb-1">
                        {goal.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{goal.target}</span>
                      </div>
                      <div className="mt-2">
                        <span className={`text-xs px-3 py-1 rounded-full ${
                          goal.progress === 'Completed' 
                            ? 'bg-green-100 text-green-700'
                            : goal.progress === 'In Progress'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {goal.progress}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Add button */}
            <div className="flex justify-center">
              <button
                onClick={handleAddClick}
                className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                <Plus className="w-7 h-7 text-[#6E8450]" strokeWidth={3} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Update Confirmation Modal */}
      {showUpdateConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-8 z-50">
          <div className="bg-[#A4B870] rounded-3xl p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Do you want to update it?
            </h2>

            <div className="flex items-center justify-center mb-8">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <Heart className="w-8 h-8 text-[#6E8450]" fill="currentColor" />
                <Plus className="w-5 h-5 text-[#6E8450] absolute" strokeWidth={3} />
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleUpdateCancel}
                className="px-8 py-3 bg-white text-gray-800 rounded-full font-medium hover:bg-gray-100 transition-colors"
              >
                No
              </button>
              <button
                onClick={handleUpdateConfirm}
                className="px-8 py-3 bg-white text-gray-800 rounded-full font-medium hover:bg-gray-100 transition-colors"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-8 z-50">
          <div className="bg-[#A4B870] rounded-3xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-semibold text-white mb-2 text-center">
              Please add your goal
            </h2>

            <div className="flex justify-center mb-6">
              <span className="text-4xl">😊</span>
            </div>

            <div className="bg-white rounded-3xl p-6 mb-6">
              {/* Goal input */}
              <div className="mb-4">
                <label className="text-sm text-[#A67C52] font-medium mb-2 block">
                  Goal
                </label>
                <div className="relative">
                  <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={goalName}
                    onChange={(e) => {
                      setGoalName(e.target.value)
                      if (errors.name) setErrors({ ...errors, name: undefined })
                    }}
                    placeholder="Enter your goal..."
                    className={`w-full pl-10 pr-4 py-3 rounded-full border ${
                      errors.name ? 'border-red-400' : 'border-gray-200'
                    } focus:outline-none focus:ring-2 focus:ring-[#A4B870]/50`}
                  />
                </div>
              </div>

              {/* Frequency input */}
              <div>
                <label className="text-sm text-gray-700 font-medium mb-2 block">
                  Frequency
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={frequency}
                    onChange={(e) => {
                      setFrequency(e.target.value)
                      if (errors.frequency) setErrors({ ...errors, frequency: undefined })
                    }}
                    placeholder="Enter your frequency..."
                    className={`w-full pl-10 pr-4 py-3 rounded-full border ${
                      errors.frequency ? 'border-red-400' : 'border-gray-200'
                    } focus:outline-none focus:ring-2 focus:ring-[#A4B870]/50`}
                  />
                </div>
                {errors.frequency && (
                  <div className="mt-2 px-4 py-2 bg-red-100 border border-red-300 rounded-full flex items-center gap-2 text-sm text-red-700">
                    <span>⚠️</span>
                    <span>Fulfill the Requirement!!!</span>
                  </div>
                )}
                {errors.name && !errors.frequency && (
                  <div className="mt-2 px-4 py-2 bg-red-100 border border-red-300 rounded-full flex items-center gap-2 text-sm text-red-700">
                    <span>⚠️</span>
                    <span>{errors.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleCloseModal}
                className="flex-1 py-3 bg-white/20 hover:bg-white/30 text-white rounded-full font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={submitting}
                className="flex-1 py-3 bg-white hover:bg-gray-100 text-gray-800 rounded-full font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
