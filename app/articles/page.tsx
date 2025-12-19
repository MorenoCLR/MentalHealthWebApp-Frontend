"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { getArticles, searchArticles } from "./actions"
import Navbar from "@/components/Navbar"

type Article = {
  id: string
  title: string
  content: string
  url?: string
  date_published: string
  created_at: string
  updated_at: string
}

const SUGGESTED_TOPICS = [
  { label: "Health", color: "#A4B870" },
  { label: "Lifestyle", color: "#E5D68A" },
  { label: "Mental", color: "#FF8C69" },
  { label: "Sleep", color: "#F4D03F" },
  { label: "Stress", color: "#A67C52" },
]

const FILTER_TAGS = ["HEALTH", "MEDITATION", "STRESS", "ANXIETY", "IMPROVE HELP"]

// Keyword mapping so category filters actually match article text
const FILTER_KEYWORDS: Record<string, string[]> = {
  HEALTH: ["health", "wellbeing", "mental health", "wellness"],
  MEDITATION: ["meditation", "mindfulness", "breathing"],
  STRESS: ["stress", "burnout", "overwhelm"],
  ANXIETY: ["anxiety", "worry", "panic"],
  "IMPROVE HELP": ["support", "help", "therapy", "treatment", "improve"],
}

export default function ArticlesPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const loadArticles = useCallback(async () => {
    setLoading(true)
    setError(null)

    const result = await getArticles()

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setArticles(result.data)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadArticles()
  }, [loadArticles])

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadArticles()
      return
    }

    setLoading(true)
    const result = await searchArticles(searchQuery)

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setArticles(result.data)
    }

    setLoading(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Filter articles based on active filter
  const filteredArticles = useMemo(() => {
    if (!activeFilter) return articles

    const keywords = FILTER_KEYWORDS[activeFilter] ?? [activeFilter]
    return articles.filter((article) => {
      const text = `${article.title} ${article.content}`.toLowerCase()
      return keywords.some((kw) => text.includes(kw.toLowerCase()))
    })
  }, [articles, activeFilter])

  const decorativeCircles = useMemo(() => 
    [...Array(15)].map((_, i) => ({
      key: i,
      width: Math.random() * 200 + 50,
      height: Math.random() * 200 + 50,
      left: Math.random() * 100,
      top: Math.random() * 100,
    })), [])

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#A4B870]">
        {/* Navbar */}
        <Navbar />

        {/* Main content with sidebar offset */}
        <div className="md:ml-20 p-6 pb-12"></div>

        {/* Decorative circles - only render on client to avoid hydration error */}
        {mounted && (
          <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {decorativeCircles.map((circle) => (
              <div
                key={circle.key}
                className="absolute rounded-full bg-white/20"
                style={{
                  width: `${circle.width}px`,
                  height: `${circle.height}px`,
                  left: `${circle.left}%`,
                  top: `${circle.top}%`,
                }}
              />
            ))}
          </div>
        )}

        <div className="md:ml-20">
          <div className="relative z-10 flex min-h-screen items-center justify-center">
            <div className="text-center text-white">
              <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-white/30 border-t-white" />
              <h2 className="text-2xl font-semibold">Let us load all the articles.</h2>
              <p className="mt-2 text-sm opacity-80">Express your emotions by reading</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || articles.length === 0) {
    return (
      <div className="relative min-h-screen w-full bg-[#D85A43]">
        {/* Navbar */}
        <Navbar />

        {/* Decorative circles - only render on client to avoid hydration error */}
        {mounted && (
          <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {decorativeCircles.map((circle) => (
              <div
                key={circle.key}
                className="absolute rounded-full bg-white/20"
                style={{
                  width: `${circle.width}px`,
                  height: `${circle.height}px`,
                  left: `${circle.left}%`,
                  top: `${circle.top}%`,
                }}
              />
            ))}
          </div>
        )}

        <div className="md:ml-20">
          <div className="relative z-10 flex min-h-screen items-center justify-center">
            <div className="text-center text-white">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white">
                <span className="text-4xl text-[#D85A43]">✕</span>
              </div>
              <h2 className="text-2xl font-semibold">There are no article at this moment...</h2>
              <p className="mt-2 text-sm opacity-80">Please Try Again Later</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#A4B870] pb-12">
      {/* Navbar */}
      <Navbar />
      
      <div className="md:ml-20 p-6">
        <div className="mx-auto max-w-7xl">
          {/* Page Header */}
          <div className="mb-6 mt-12 md:mt-0">
            <h2 className="text-2xl font-semibold text-white">Articles</h2>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Explore Articles</h1>
            <p className="text-white/80">Read your mind by reading...</p>
          </div>

        {/* Search bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Searching 190 articles"
              className="w-full rounded-full border-none bg-white text-gray-800 placeholder:text-gray-400 px-6 py-4 pr-12 shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              onClick={handleSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <Search size={20} />
            </button>
          </div>
        </div>

        {/* Filter tags */}
        <div className="mb-8 flex flex-wrap gap-2">
          {FILTER_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveFilter(activeFilter === tag ? null : tag)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                activeFilter === tag
                  ? 'bg-white text-[#6E8450]'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Articles list */}
          <div className="lg:col-span-2 space-y-4">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                onClick={() => router.push(`/articles/${article.id}`)}
                className="group cursor-pointer rounded-3xl bg-white p-6 shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#FF8C69] to-[#E5D68A] flex items-center justify-center">
                      <span className="text-xl">📄</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 group-hover:text-[#6E8450] transition-colors">
                      {article.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {article.content.substring(0, 150)}...
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(article.date_published).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Suggested Topics */}
            <div className="rounded-3xl bg-white/90 p-6 shadow-lg backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Suggested Topics</h2>
                <button
                  onClick={() => {
                    setActiveFilter(null)
                    setSearchQuery("")
                    loadArticles()
                  }}
                  className="text-sm text-[#6E8450] hover:underline"
                >
                  See all
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {SUGGESTED_TOPICS.map((topic) => (
                  <button
                    key={topic.label}
                    onClick={() => setActiveFilter(topic.label.toUpperCase())}
                    className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-transform hover:scale-105"
                    style={{ backgroundColor: topic.color + '20', color: topic.color }}
                  >
                    <span className="h-6 w-6 rounded-full" style={{ backgroundColor: topic.color }} />
                    {topic.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mindful Articles */}
            <div className="rounded-3xl bg-white/90 p-6 shadow-lg backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Mindful Articles</h2>
                <button
                  onClick={() => {
                    setActiveFilter(null)
                    setSearchQuery("")
                    loadArticles()
                  }}
                  className="text-sm text-[#6E8450] hover:underline"
                >
                  See all
                </button>
              </div>
              <div className="space-y-4">
                {articles.slice(0, 2).map((article) => (
                  <div
                    key={article.id}
                    onClick={() => router.push(`/articles/${article.id}`)}
                    className="cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-16 flex-shrink-0 rounded-2xl bg-gradient-to-br from-[#A4B870] to-[#6E8450]" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 group-hover:text-[#6E8450] line-clamp-2">
                          {article.title}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}
