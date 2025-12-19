"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import { getJournals, createJournal, updateJournal, deleteJournal, type JournalEntry } from "./actions"
import { PenSquare, Plus, Trash2, Save, Menu, X } from "lucide-react"

export default function JournalPage() {
  const router = useRouter()
  const [journals, setJournals] = useState<JournalEntry[]>([])
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
    setSidebarOpen(false) // Close sidebar on mobile after selection
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
          if (isCreating && 'data' in result && result.data) {
             setSelectedJournal(result.data as JournalEntry)
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
    <div className="flex h-screen bg-[#F5F5F0] overflow-hidden">
      {/* Shared Navbar */}
      <Navbar />

      {/* Main Content Area (offset by Navbar width on desktop) */}
      <div className="flex-1 flex md:ml-20 h-full relative">
        
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Journal List Sidebar */}
        <aside className={`
          fixed md:relative
          w-80 max-w-[85vw]
          bg-[#8FA05E] p-6 flex flex-col shadow-xl z-30 overflow-y-auto
          h-full
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
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
              <header className="bg-[#6E8450] px-4 md:px-8 py-4 md:py-6 flex items-center justify-between border-b border-white/20 shadow-lg">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white"
                  aria-label="Open menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
                
                <div className="text-white font-medium text-sm md:text-lg flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                  <span className="hidden md:block bg-white/20 p-2 rounded-lg"><PenSquare size={20}/></span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate">
                      {isCreating
                        ? "New Entry"
                        : `Entry ${getJournalNumber(journals.findIndex(j => j.id === selectedJournal!.id))}`
                      }
                    </span>
                    {hasUnsavedChanges && (
                      <span className="hidden sm:flex items-center gap-1.5 text-xs bg-yellow-400 text-gray-800 px-3 py-1 rounded-full font-semibold flex-shrink-0">
                        <span className="w-2 h-2 bg-gray-800 rounded-full animate-pulse"></span>
                        Unsaved
                      </span>
                    )}
                    {hasUnsavedChanges && (
                      <span className="sm:hidden w-2 h-2 bg-yellow-400 rounded-full animate-pulse flex-shrink-0"></span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                  <button
                    onClick={handleSave}
                    disabled={submitting || !hasUnsavedChanges}
                    className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg transition-colors font-medium text-sm md:text-base ${
                      hasUnsavedChanges
                        ? 'bg-white text-[#6E8450] hover:bg-gray-100'
                        : 'bg-white/20 text-white/50 cursor-not-allowed'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    <span className="hidden sm:inline">{hasUnsavedChanges ? 'Save Changes' : 'Saved'}</span>
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
              <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col min-h-0">
                <div className="flex-1 max-w-4xl mx-auto bg-white/95 backdrop-blur rounded-3xl shadow-2xl flex flex-col w-full">
                  {/* Title Section */}
                  <div className="border-b border-gray-100 p-4 md:p-8 pb-4 flex-shrink-0">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={`text-xl md:text-3xl font-bold text-gray-800 bg-transparent border-none outline-none w-full placeholder:text-gray-300 focus:ring-0 ${
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
                  <div className="p-4 md:p-8 flex-1 flex flex-col min-h-0">
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full flex-1 text-base md:text-lg text-gray-600 bg-transparent border-none outline-none resize-none placeholder:text-gray-300 focus:ring-0 leading-relaxed min-h-0"
                      placeholder="What's on your mind today?"
                      style={{ height: '100%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center relative z-10 p-6">
              {/* Mobile Menu Button when no entry selected */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden fixed top-6 left-6 p-3 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white shadow-lg z-20"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <div className="text-center text-white/60">
                <div className="w-20 md:w-24 h-20 md:h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <PenSquare className="w-8 md:w-10 h-8 md:h-10" />
                </div>
                <h3 className="text-xl md:text-2xl font-semibold text-white mb-2">Select an entry</h3>
                <p className="text-white/70 text-sm md:text-base px-4">
                  <span className="hidden md:inline">Choose a journal from the sidebar or create a new one.</span>
                  <span className="md:hidden">Tap the menu to view your journals</span>
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
