"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setError(error.message)
      } else {
        alert("Password updated successfully!")
        router.push("/login")
      }
    } catch (err) {
      console.error(err)
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-[#F5F5F0] overflow-hidden">
      <main className="relative flex min-h-screen w-full items-center justify-center">
        <div className="z-10 w-full max-w-md px-8">
          <div className="mx-auto rounded-3xl bg-white/90 p-10 shadow-xl backdrop-blur-md">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#A67C52]">
              <span className="text-3xl">🔒</span>
            </div>

            <h1 className="text-2xl font-bold text-[#8B6F47] text-center mb-2">
              Reset Password
            </h1>
            <p className="text-sm text-gray-600 text-center mb-6">
              Enter your new password below
            </p>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-full text-sm text-center">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <div className="text-left text-xs text-[#8B6F47] font-medium mb-2">
                  New Password
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password..."
                  className="w-full rounded-full border border-gray-300 px-4 py-3 shadow-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A67C52]"
                  required
                  minLength={6}
                />
              </div>

              <div className="mb-6">
                <div className="text-left text-xs text-[#8B6F47] font-medium mb-2">
                  Confirm Password
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password..."
                  className="w-full rounded-full border border-gray-300 px-4 py-3 shadow-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A67C52]"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#A67C52] px-6 py-3 text-white hover:bg-[#8B6F47] transition-colors disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  className="text-sm text-[#8B6F47] hover:underline"
                >
                  Back to Login
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
