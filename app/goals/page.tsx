"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import { createGoal, updateGoal, getGoals, deleteGoal } from "./actions"
import { Heart, Plus, Calendar, Target, Check as CheckIcon } from "lucide-react"

type Goal = {
  id: string
  name: string
  target: string
  progress: string
  updated_at: string
}

type FilterType = 'today' | 'all'

export default function GoalsPage() {
  const router = useRouter()
  const [goals, setGoals] = useState<Goal[]>([])
  const [filter, setFilter] = useState<FilterType>(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('goals_filter') as FilterType | null
      if (stored === 'today' || stored === 'all') return stored
    }
    return 'today'
  })
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUsername() {
      const response = await fetch('/api/user-profile')
      if (response.ok) {
        const data = await response.json()
        setUsername(data.username || data.full_name || 'there')
      }
    }
    fetchUsername()
  }, [])

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false)
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)

  // Form states
  const [goalName, setGoalName] = useState("")
  const [frequency, setFrequency] = useState("") // legacy support
  const [dueDate, setDueDate] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('goals_selected_day')
      if (stored) return stored
    }
    return new Date().toISOString().slice(0,10)
  })
  const [isIndefinite, setIsIndefinite] = useState<boolean>(false)
  const [errors, setErrors] = useState<{ name?: string; frequency?: string; dueDate?: string }>({})
  const [submitting, setSubmitting] = useState(false)

  const loadGoals = useCallback(async () => {
    setLoading(true)
    const result = await getGoals(filter === 'all' ? 'all' : undefined)
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
    setDueDate(new Date().toISOString().slice(0,10))
    setIsIndefinite(false)
    setErrors({})
    setShowAddModal(true)
  }

  const handleGoalClick = (goal: Goal) => {
    setSelectedGoal(goal)
    setGoalName(goal.name)
    // parse target
    if (goal.target === 'Indefinite') {
      setIsIndefinite(true)
      setDueDate(new Date().toISOString().slice(0,10))
      setFrequency('')
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(goal.target)) {
      setIsIndefinite(false)
      setDueDate(goal.target)
      setFrequency('')
    } else {
      // legacy e.g. 'daily', keep in frequency
      setIsIndefinite(false)
      setDueDate(new Date().toISOString().slice(0,10))
      setFrequency(goal.target)
    }
    setErrors({})
    setShowUpdateConfirm(true)
  }

  const handleDeleteClick = (e: React.MouseEvent, goal: Goal) => {
    e.stopPropagation()
    setSelectedGoal(goal)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedGoal) return

    setSubmitting(true)
    const formData = new FormData()
    formData.append('id', selectedGoal.id)
    formData.append('name', selectedGoal.name)
    formData.append('target', selectedGoal.target)
    formData.append('progress', 'Completed')
    
    const result = await updateGoal(formData)
    
    if (result?.error) {
      setErrors({ name: result.error })
    } else {
      setShowDeleteConfirm(false)
      setSelectedGoal(null)
      await loadGoals()
    }
    setSubmitting(false)
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setSelectedGoal(null)
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
    const newErrors: { name?: string; frequency?: string; dueDate?: string } = {}

    if (!goalName.trim()) {
      newErrors.name = "Goal is required"
    }

    // For new model: require date unless indefinite; allow legacy frequency
    if (!isIndefinite && !frequency.trim() && !dueDate) {
      newErrors.dueDate = "Date is required"
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
      formData.append('target', isIndefinite ? 'Indefinite' : (frequency.trim() ? frequency.trim() : dueDate))

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
        setDueDate(new Date().toISOString().slice(0,10))
        setIsIndefinite(false)
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
    setDueDate(new Date().toISOString().slice(0,10))
    setIsIndefinite(false)
    setErrors({})
  }

  return (
    <div className="relative min-h-screen w-full bg-[#A4B870] overflow-hidden">
      {/* Navbar */}
      <Navbar />

      {/* Decorative background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-10 left-20 w-64 h-64 border-4 border-white rounded-full"></div>
        <div className="absolute top-40 right-32 w-96 h-96 border-4 border-white rounded-full"></div>
        <div className="absolute bottom-20 left-40 w-48 h-48 border-4 border-white rounded-full"></div>
        <div className="absolute bottom-40 right-20 w-72 h-72 border-4 border-white rounded-full"></div>
      </div>

      {/* Main Content with sidebar offset */}
      <div className="md:ml-20">
        {/* Header */}
        <header className="relative flex items-center justify-between px-6 py-6">

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-white">Goals</h1>
          </div>
          <div className="flex items-center gap-3">
            {filter === 'today' && (
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value)
                  if (typeof window !== 'undefined') {
                    window.localStorage.setItem('goals_selected_day', e.target.value)
                  }
                }}
                className="px-3 py-2 rounded-full bg-white/20 text-white placeholder:text-white/70 border border-white/30 focus:outline-none"
              />
            )}
            <button
              onClick={() => {
                const next = filter === 'today' ? 'all' : 'today'
                setFilter(next)
                if (typeof window !== 'undefined') {
                  window.localStorage.setItem('goals_filter', next)
                }
              }}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-full transition-colors"
            >
              {filter.toUpperCase()}
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="relative flex flex-col items-center justify-center px-8 pb-8 min-h-[calc(100vh-100px)]">
        {goals.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              👋 Hey {username}!
            </h1>
            <p className="text-xl text-white/90 mb-8">
              &quot;Practice mindfulness daily&quot;
            </p>

            <div className="flex flex-col items-center gap-3">
              <button
                onClick={handleAddClick}
                className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                <Plus className="w-8 h-8 text-[#6E8450]" strokeWidth={3} />
              </button>
              <p className="text-white font-medium">Set Other Goals</p>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-2xl flex flex-col items-center">
            <h1 className="text-3xl font-bold text-white mb-2 text-center">
              👋 Hey {username}!
            </h1>
            <p className="text-lg text-white/90 mb-8 text-center">
              {filter === 'today' ? 'Your goals for today' : 'All goals'}
            </p>

            {/* Goals list */}
            {filter === 'today' && (
            <div className="space-y-4 mb-6 w-full">
              {goals.filter(g => {
                const t = g.target
                const day = dueDate
                if (t === 'Indefinite') return true
                if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t === day
                // legacy daily appears on today
                return t.toLowerCase().includes('daily')
              }).map((goal) => (
                  <div
                  key={goal.id}
                  onClick={() => handleGoalClick(goal)}
                    className="w-full bg-white/95 rounded-2xl p-6 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-left flex items-center justify-between cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#A4B870]/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <Target className="w-6 h-6 text-[#6E8450]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-800 mb-2">
                          {goal.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-600">
                            {(() => {
                              if (goal.target === 'Indefinite') return 'Ongoing Goal'
                              if (/^\d{4}-\d{2}-\d{2}$/.test(goal.target)) {
                                const targetDate = new Date(goal.target)
                                const today = new Date()
                                today.setHours(0, 0, 0, 0)
                                targetDate.setHours(0, 0, 0, 0)

                                if (targetDate.getTime() === today.getTime()) {
                                  return 'Due Today'
                                } else if (targetDate < today) {
                                  return `Overdue - ${targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                } else {
                                  return `Due ${targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
                                }
                              }
                              return goal.target
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteClick(e, goal)}
                    title="Mark as completed"
                    aria-label="Mark as completed"
                    className="ml-4 w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <CheckIcon className="w-5 h-5 text-white" strokeWidth={3} />
                  </button>
                  </div>
              ))}
            </div>
            )}

            {filter === 'all' && (
              <div className="w-full space-y-8">
                {/* Ongoing */}
                <section>
                  <h3 className="text-white text-lg font-semibold mb-3">Ongoing</h3>
                  <div className="space-y-3">
                    {goals.filter(g => g.progress !== 'Completed' && (!/^\d{4}-\d{2}-\d{2}$/.test(g.target) || new Date(g.target) >= new Date(new Date().toDateString()))).map(g => (
                      <div key={g.id} onClick={() => handleGoalClick(g)} className="bg-white/95 rounded-2xl p-4 shadow hover:shadow-lg transition-shadow cursor-pointer flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Target className="w-5 h-5 text-[#6E8450] flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-800 font-medium truncate">{g.name}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-xs text-gray-600">
                                {g.target === 'Indefinite' ? 'Ongoing' : /^\d{4}-\d{2}-\d{2}$/.test(g.target) ? `Due ${new Date(g.target).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : g.target}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button onClick={(e) => handleDeleteClick(e, g)} title="Mark as completed" aria-label="Mark as completed" className="ml-4 w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors flex-shrink-0">
                          <CheckIcon className="w-5 h-5 text-white" strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Overdue */}
                <section>
                  <h3 className="text-white text-lg font-semibold mb-3">Overdue</h3>
                  <div className="space-y-3">
                    {goals.filter(g => g.progress !== 'Completed' && /^\d{4}-\d{2}-\d{2}$/.test(g.target) && new Date(g.target) < new Date(new Date().toDateString())).map(g => (
                      <div key={g.id} onClick={() => handleGoalClick(g)} className="bg-red-50 border-l-4 border-red-400 rounded-2xl p-4 shadow hover:shadow-lg transition-shadow cursor-pointer flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Target className="w-5 h-5 text-red-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-800 font-medium truncate">{g.name}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Calendar className="w-3.5 h-3.5 text-red-400" />
                              <span className="text-xs font-medium text-red-600">
                                Overdue - {new Date(g.target).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button onClick={(e) => handleDeleteClick(e, g)} title="Mark as completed" aria-label="Mark as completed" className="ml-4 w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors flex-shrink-0">
                          <CheckIcon className="w-5 h-5 text-white" strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Completed */}
                <section>
                  <h3 className="text-white text-lg font-semibold mb-3">Completed</h3>
                  <div className="space-y-3">
                    {goals.filter(g => g.progress === 'Completed').map(g => (
                      <div key={g.id} className="bg-white/70 rounded-2xl p-4 shadow opacity-75">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <CheckIcon className="w-5 h-5 text-green-600" strokeWidth={3} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-700 font-medium line-through truncate">{g.name}</p>
                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 inline-block mt-1">Completed</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* Add button */}
            <div className="flex flex-col items-center gap-2 mt-8">
              <button
                onClick={handleAddClick}
                className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                <Plus className="w-7 h-7 text-[#6E8450]" strokeWidth={3} />
              </button>
              <p className="text-white font-medium text-sm">Set Other Goals</p>
            </div>
          </div>
        )}
        </main>
      </div>

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

      {/* Completion Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-8 z-50">
          <div className="bg-[#A4B870] rounded-3xl p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-semibold text-white mb-6">
              Goal Completion Confirmation
            </h2>

            <div className="flex items-center justify-center mb-8">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <CheckIcon className="w-8 h-8 text-[#6E8450]" strokeWidth={3} />
              </div>
            </div>

            <p className="text-white mb-6">
              Mark &quot;{selectedGoal?.name}&quot; as completed? It will be removed from your active goals.
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={handleDeleteCancel}
                disabled={submitting}
                className="px-8 py-3 bg-white text-gray-800 rounded-full font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={submitting}
                className="px-8 py-3 bg-white text-gray-800 rounded-full font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Completing...' : 'Complete'}
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
                <label className="text-sm text-gray-700 font-medium mb-2 block">
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
                    className={`w-full pl-10 pr-4 py-3 rounded-full border text-gray-800 placeholder:text-gray-400 ${
                      errors.name ? 'border-red-400' : 'border-gray-200'
                    } focus:outline-none focus:ring-2 focus:ring-[#A4B870]/50`}
                  />
                </div>
              </div>

              {/* Date / Indefinite */}
              <div>
                <label className="text-sm text-gray-700 font-medium mb-2 block">
                  Due Date
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => {
                        setDueDate(e.target.value)
                        if (errors.dueDate) setErrors({ ...errors, dueDate: undefined })
                      }}
                      disabled={isIndefinite}
                      className={`w-full pl-10 pr-4 py-3 rounded-full border text-gray-800 placeholder:text-gray-400 ${
                        errors.dueDate ? 'border-red-400' : 'border-gray-200'
                      } focus:outline-none focus:ring-2 focus:ring-[#A4B870]/50 disabled:bg-gray-100 disabled:text-gray-500`}
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={isIndefinite}
                      onChange={(e) => setIsIndefinite(e.target.checked)}
                      className="rounded"
                    />
                    Indefinite
                  </label>
                </div>
                {errors.dueDate && (
                  <div className="mt-2 px-4 py-2 bg-red-100 border border-red-300 rounded-full flex items-center gap-2 text-sm text-red-700">
                    <span>⚠️</span>
                    <span>{errors.dueDate}</span>
                  </div>
                )}
                {errors.name && !errors.dueDate && (
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
