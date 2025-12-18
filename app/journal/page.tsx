"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import { getJournals, createJournal, updateJournal, deleteJournal, type JournalEntry } from "./actions"
import { PenSquare, Plus, Trash2, Save } from "lucide-react"

export default function JournalPage() {
  const router = useRouter()
  const [journals, setJournals] = useState<JournalEntry[]>([])
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  // Form states
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [errors, setErrors] = useState<{ title?: string }>({})
  const [submitting, setSubmitting] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSavedTitle, setLastSavedTitle] = useState("")
  const [lastSavedContent, setLastSavedContent] = useState("")

  useEffect(() => {
    loadJournals()
  }, [])

  useEffect(() => {
    if (selectedJournal) {
      setTitle(selectedJournal.title)
      setContent(selectedJournal.content || "")
      setLastSavedTitle(selectedJournal.title)
      setLastSavedContent(selectedJournal.content || "")
      setIsCreating(false)
      setErrors({})
      setHasUnsavedChanges(false)
    }
  }, [selectedJournal])

  // Track unsaved changes
  useEffect(() => {
    if (isCreating) {
      setHasUnsavedChanges(title.trim() !== "" || content.trim() !== "")
    } else {
      setHasUnsavedChanges(
        title !== lastSavedTitle || content !== lastSavedContent
      )
    }
  }, [title, content, lastSavedTitle, lastSavedContent, isCreating])

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
    setSelectedJournal(null)
    setIsCreating(true)
    setTitle("")
    setContent("")
    setLastSavedTitle("")
    setLastSavedContent("")
    setErrors({})
    setHasUnsavedChanges(false)
  }

  const handleJournalClick = (journal: JournalEntry) => {
    setSelectedJournal(journal)
    setIsCreating(false)
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
      if (selectedJournal && !isCreating) {
        formData.append('id', selectedJournal.id)
        result = await updateJournal(formData)
      } else {
        result = await createJournal(formData)
      }

      if (result?.error) {
        setErrors({ title: result.error })
      } else {
        // Update last saved state
        setLastSavedTitle(title)
        setLastSavedContent(content)
        setHasUnsavedChanges(false)

        const updatedJournals = await getJournals()
        if (updatedJournals.data) {
          setJournals(updatedJournals.data)
          if (isCreating && result?.data) {
             setSelectedJournal(result.data)
             setIsCreating(false)
          } else if (selectedJournal) {
             // Refresh selected journal data to ensure sync
             const updated = updatedJournals.data.find(j => j.id === selectedJournal.id)
             if (updated) setSelectedJournal(updated)
          }
        }
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
    <div className="flex h-screen bg-[#F5F5F0]">
      {/* Shared Navbar */}
      <Navbar />

      {/* Main Content Area (offset by Navbar width on desktop) */}
      <div className="flex-1 flex md:ml-20 h-full overflow-hidden">
        
        {/* Journal List Sidebar */}
        <aside className="w-80 bg-[#8FA05E] p-6 flex flex-col shadow-xl z-10 h-full">
          {/* New Journal Button */}
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-3 px-4 py-3 bg-[#6E8450] hover:bg-[#5d7043] text-white rounded-lg mb-6 transition-colors shadow-md w-full justify-center"
          >
            <PenSquare className="w-5 h-5" />
            <span className="font-medium">New Journal</span>
          </button>

          {/* Journal List Header */}
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-white font-semibold text-sm">Your Entries</h2>
            <span className="text-white/70 text-xs">😊</span>
          </div>

          {/* Journal List */}
          <div className="flex-1 overflow-y-auto space-y-2 mb-6 pr-2 custom-scrollbar">
            {loading ? (
              <p className="text-white/60 text-sm text-center py-8">Loading...</p>
            ) : journals.length === 0 ? (
              <p className="text-white/60 text-sm text-center py-8">No journal entries yet</p>
            ) : (
              journals.map((journal) => (
                <button
                  key={journal.id}
                  onClick={() => handleJournalClick(journal)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    selectedJournal?.id === journal.id
                      ? 'bg-[#A4B870] text-white shadow-md translate-x-1'
                      : 'bg-[#9FAA6D] hover:bg-[#A4B870] text-white/90 hover:translate-x-1'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{journal.title}</div>
                      <div className="text-xs text-white/70 mt-1">
                        {formatDate(journal.date_created)}
                      </div>
                    </div>
                    {/* {selectedJournal?.id === journal.id && (
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-white flex-shrink-0 ml-2">
                        <Plus className="w-3 h-3" />
                      </div>
                    )} */}
                  </div>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Editor / Content Area */}
        <main className="flex-1 bg-[#A4B870] relative overflow-hidden flex flex-col">
          {/* Decorative background patterns */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
            <div className="absolute top-10 left-20 w-64 h-64 border-4 border-white rounded-full"></div>
            <div className="absolute top-40 right-32 w-96 h-96 border-4 border-white rounded-full"></div>
            <div className="absolute bottom-20 left-40 w-48 h-48 border-4 border-white rounded-full"></div>
          </div>

          {selectedJournal || isCreating ? (
            <div className="h-full flex flex-col relative z-10">
              {/* Header */}
              <header className="bg-[#6E8450] px-8 py-6 flex items-center justify-between border-b border-white/20 shadow-lg">
                <div className="text-white font-medium text-lg flex items-center gap-3">
                  <span className="bg-white/20 p-2 rounded-lg"><PenSquare size={20}/></span>
                  <div className="flex items-center gap-2">
                    <span>
                      {isCreating
                        ? "New Entry"
                        : `Entry ${getJournalNumber(journals.findIndex(j => j.id === selectedJournal!.id))}`
                      }
                    </span>
                    {hasUnsavedChanges && (
                      <span className="flex items-center gap-1.5 text-xs bg-yellow-400 text-gray-800 px-3 py-1 rounded-full font-semibold">
                        <span className="w-2 h-2 bg-gray-800 rounded-full animate-pulse"></span>
                        Unsaved
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSave}
                    disabled={submitting || !hasUnsavedChanges}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                      hasUnsavedChanges
                        ? 'bg-white text-[#6E8450] hover:bg-gray-100'
                        : 'bg-white/20 text-white/50 cursor-not-allowed'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
                  </button>
                  {!isCreating && (
                    <button
                      onClick={handleDelete}
                      className="p-2 bg-red-500/30 hover:bg-red-500/50 rounded-lg transition-colors text-white"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </header>

              {/* Content Editor */}
              <div className="flex-1 overflow-y-auto p-8 flex flex-col min-h-0">
                <div className="flex-1 max-w-4xl mx-auto bg-white/95 backdrop-blur rounded-3xl shadow-2xl flex flex-col w-full">
                  {/* Title Section */}
                  <div className="border-b border-gray-100 p-8 pb-4 flex-shrink-0">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={`text-3xl font-bold text-gray-800 bg-transparent border-none outline-none w-full placeholder:text-gray-300 focus:ring-0 ${
                        errors.title ? 'text-red-600' : ''
                      }`}
                      placeholder="Title your entry..."
                    />
                    {errors.title && (
                      <p className="text-red-500 text-sm mt-1">{errors.title}</p>
                    )}
                    <p className="text-sm text-[#6E8450] font-medium mt-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#6E8450]"></span>
                      {isCreating
                        ? new Date().toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : new Date(selectedJournal!.date_created).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                      }
                    </p>
                  </div>

                  {/* Text Area */}
                  <div className="p-8 flex-1 flex flex-col min-h-0">
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full flex-1 text-lg text-gray-600 bg-transparent border-none outline-none resize-none placeholder:text-gray-300 focus:ring-0 leading-relaxed min-h-0"
                      placeholder="What's on your mind today?"
                      style={{ height: '100%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center relative z-10">
              <div className="text-center text-white/60">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <PenSquare className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">Select an entry</h3>
                <p className="text-white/70">Choose a journal from the sidebar or create a new one.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
