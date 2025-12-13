"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import { getJournals, createJournal, updateJournal, deleteJournal, type JournalEntry } from "./actions"
import { PenSquare, Home, Settings, Plus, Trash2 } from "lucide-react"

export default function JournalPage() {
  const router = useRouter()
  const [journals, setJournals] = useState<JournalEntry[]>([])
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingJournal, setEditingJournal] = useState<JournalEntry | null>(null)

  // Form states
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [errors, setErrors] = useState<{ title?: string }>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadJournals()
  }, [])

  const loadJournals = async () => {
    setLoading(true)
    const result = await getJournals()
    if (result.data) {
      setJournals(result.data)
      if (result.data.length > 0 && !selectedJournal) {
        setSelectedJournal(result.data[0])
      }
    }
    setLoading(false)
  }

  const handleCreateNew = () => {
    setEditingJournal(null)
    setTitle("")
    setContent("")
    setErrors({})
    setShowModal(true)
  }

  const handleJournalClick = (journal: JournalEntry) => {
    setSelectedJournal(journal)
  }

  const handleEditTitle = () => {
    if (selectedJournal) {
      setEditingJournal(selectedJournal)
      setTitle(selectedJournal.title)
      setContent(selectedJournal.content || "")
      setErrors({})
      setShowModal(true)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setErrors({ title: 'Title is required' })
      return
    }

    setSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('content', content)

      let result
      if (editingJournal) {
        formData.append('id', editingJournal.id)
        result = await updateJournal(formData)
      } else {
        result = await createJournal(formData)
      }

      if (result?.error) {
        setErrors({ title: result.error })
      } else {
        setShowModal(false)
        await loadJournals()
      }
    } catch (err) {
      console.error(err)
      setErrors({ title: 'An unexpected error occurred' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (selectedJournal && confirm('Are you sure you want to delete this journal entry?')) {
      await deleteJournal(selectedJournal.id)
      setSelectedJournal(null)
      await loadJournals()
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })
  }

  const getJournalNumber = (index: number) => {
    return `#${journals.length - index}`
  }

  return (
    <div className="flex h-screen bg-[#A4B870] overflow-hidden">
      {/* Decorative background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
        <div className="absolute top-10 left-20 w-64 h-64 border-4 border-white rounded-full"></div>
        <div className="absolute top-40 right-32 w-96 h-96 border-4 border-white rounded-full"></div>
        <div className="absolute bottom-20 left-40 w-48 h-48 border-4 border-white rounded-full"></div>
      </div>

      {/* Sidebar */}
      <aside className="relative w-80 bg-[#8FA05E] p-6 flex flex-col shadow-2xl">
        {/* New Journal Button */}
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-3 px-4 py-3 bg-[#6E8450] hover:bg-[#5d7043] text-white rounded-lg mb-6 transition-colors shadow-md"
        >
          <PenSquare className="w-5 h-5" />
          <span className="font-medium">Journaling</span>
        </button>

        {/* Journal List Header */}
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-white font-semibold text-sm">Journaling</h2>
          <span className="text-white/70 text-xs">😊</span>
        </div>

        {/* Journal List */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-6">
          {loading ? (
            <p className="text-white/60 text-sm text-center py-8">Loading...</p>
          ) : journals.length === 0 ? (
            <p className="text-white/60 text-sm text-center py-8">No journal entries yet</p>
          ) : (
            journals.map((journal, index) => (
              <button
                key={journal.id}
                onClick={() => handleJournalClick(journal)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  selectedJournal?.id === journal.id
                    ? 'bg-[#A4B870] text-white shadow-md'
                    : 'bg-[#9FAA6D] hover:bg-[#A4B870] text-white/90'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">Journal {getJournalNumber(index)}</div>
                    <div className="text-xs text-white/70 mt-1">
                      {formatDate(journal.date_created)}
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#6E8450] flex-shrink-0 ml-3">
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="space-y-2">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors w-full"
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Home</span>
          </button>
          <button
            onClick={() => router.push('/settings')}
            className="flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors w-full"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden">
        {selectedJournal ? (
          <div className="h-full flex flex-col">
            {/* Header */}
            <header className="bg-white/10 backdrop-blur-sm px-8 py-6 flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="text-white/80 hover:text-white flex items-center gap-2"
              >
                <span className="text-xl">←</span>
                <span>Journal {getJournalNumber(journals.findIndex(j => j.id === selectedJournal.id))}</span>
              </button>
              <button
                onClick={handleDelete}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5 text-white/80 hover:text-red-300" />
              </button>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl min-h-full">
                {/* Title Section */}
                <div className="border-b border-gray-200 p-8">
                  <div className="flex items-center justify-between mb-2">
                    <input
                      type="text"
                      value={selectedJournal.title}
                      readOnly
                      onClick={handleEditTitle}
                      className="text-2xl font-semibold text-gray-800 bg-transparent border-none outline-none cursor-pointer hover:text-[#6E8450] w-full"
                      placeholder="Untitled"
                    />
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedJournal.date_created).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>

                {/* Content Section */}
                <div className="p-8">
                  <textarea
                    value={selectedJournal.content || ""}
                    readOnly
                    onClick={handleEditTitle}
                    className="w-full h-96 text-gray-700 bg-transparent border-none outline-none resize-none cursor-pointer hover:text-gray-900"
                    placeholder="Start writing your thoughts..."
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-white/60">
              <PenSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl">Select a journal entry or create a new one</p>
            </div>
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              {editingJournal ? 'Edit Entry' : 'New Entry'}
            </h2>

            {/* Title Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (errors.title) setErrors({ ...errors, title: undefined })
                }}
                placeholder="I am feeling sick today"
                className={`w-full px-4 py-3 rounded-full border ${
                  errors.title ? 'border-red-400' : 'border-gray-200'
                } focus:outline-none focus:ring-2 focus:ring-[#A4B870]/50`}
              />
              {errors.title && (
                <p className="text-red-600 text-sm mt-2">{errors.title}</p>
              )}
            </div>

            {/* Content Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your thoughts..."
                rows={6}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#A4B870]/50 resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={submitting}
                className="flex-1 py-3 bg-[#A4B870] hover:bg-[#8FA05E] text-white rounded-full font-medium transition-colors disabled:opacity-50"
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
