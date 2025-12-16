"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { getArticleById } from "../actions"

type Article = {
  id: string
  title: string
  content: string
  url?: string
  date_published: string
  created_at: string
  updated_at: string
}

export default function ArticleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadArticle = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    const result = await getArticleById(id)

    if (result.error) {
      setError(result.error)
    } else if (result.data) {
      setArticle(result.data)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    if (params.id) {
      loadArticle(params.id as string)
    }
  }, [params.id, loadArticle])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#A4B870]/30 border-t-[#A4B870]" />
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <span className="text-2xl text-red-500">✕</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Article not found</h2>
          <button
            onClick={() => router.back()}
            className="mt-4 rounded-full bg-[#A4B870] px-6 py-2 text-white hover:bg-[#6E8450]"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-[#A4B870] p-6">
      <div className="mx-auto max-w-4xl">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-white/90 hover:text-white transition-colors"
        >
          <span className="text-2xl">←</span>
        </button>

        {/* Article content */}
        <div className="rounded-3xl bg-white/95 p-8 shadow-xl backdrop-blur-md md:p-12">
          {/* Title and metadata */}
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-3 text-sm text-gray-500">
              <span className="rounded-full bg-[#A4B870] px-3 py-1 text-white">ARTICLE</span>
              <span>•</span>
              <span>
                {new Date(article.date_published).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              <span>•</span>
              <span>{Math.ceil(article.content.length / 1000)} min read</span>
            </div>

            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {article.title}
            </h1>

            {/* Author info */}
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#A4B870] to-[#6E8450] flex items-center justify-center">
                <span className="text-xl text-white">👤</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">By Johann Liebert</p>
                <p className="text-sm text-gray-500">Mental Health Expert</p>
              </div>
            </div>
          </div>

          {/* Article intro badge */}
          <div className="mb-6 flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <span className="text-lg font-semibold text-[#6E8450]">Introduction</span>
          </div>

          {/* Article content */}
          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {article.content}
            </div>
          </div>

          {/* Featured image placeholder */}
          <div className="mt-8 rounded-2xl bg-gradient-to-br from-[#A4B870]/20 to-[#6E8450]/20 h-64 flex items-center justify-center">
            <p className="text-sm text-gray-500 italic">Image Content</p>
          </div>

          {/* Article sections */}
          <div className="mt-12 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Should We, or Should we Not?
              </h2>
              <p className="text-gray-700 leading-relaxed">
                The term "life," in a biological context, refers to the set of characteristics that distinguish living organisms from non-living matter. These characteristics include the capacity to grow, respond to stimuli, adapt to the environment, maintain homeostasis, and reproduce.
              </p>
            </div>
          </div>

          {/* Go to article button */}
          {article.url && (
            <div className="mt-8 rounded-2xl bg-gradient-to-r from-[#A4B870] to-[#6E8450] p-6 text-center">
              <h3 className="text-xl font-semibold text-white mb-3">Read the Full Article</h3>
              <p className="text-white/90 text-sm mb-4">Visit the original source for the complete article</p>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-lg font-semibold text-[#6E8450] hover:bg-white/90 transition-colors shadow-lg"
              >
                Go to article →
              </a>
            </div>
          )}

          {/* Share and actions */}
          <div className="mt-12 flex items-center justify-between border-t pt-6">
            <div className="flex gap-4">
              <button className="rounded-full bg-[#A4B870] px-6 py-2 text-white hover:bg-[#6E8450] transition-colors">
                Share
              </button>
              <button className="rounded-full border border-[#A4B870] px-6 py-2 text-[#6E8450] hover:bg-[#A4B870]/10 transition-colors">
                Save
              </button>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <button className="hover:text-[#6E8450]">👍 Like</button>
              <button className="hover:text-[#6E8450]">💬 Comment</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
