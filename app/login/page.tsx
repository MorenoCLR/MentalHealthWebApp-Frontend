"use client"

import React, { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { sendOtpClient, verifyOtpClient, resetPasswordClient, resendConfirmationClient } from "./clientAuth"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const modeParam = searchParams.get('mode') as "password" | "otp" | "forgot" | "resend" | "waiting_for_confirmation" | null
  
  const [mode, setMode] = useState<"password" | "otp" | "forgot" | "resend">(
    modeParam === "waiting_for_confirmation" ? "resend" : (modeParam || "password")
  )
  const [email, setEmail] = useState<string>("")
  const [token, setToken] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [resetCooldown, setResetCooldown] = useState(0)

  return (
    <div className="relative min-h-screen w-full bg-[#F5F5F0] overflow-hidden">
      <main className="relative flex min-h-screen w-full items-center justify-center">
        <div className="z-10 w-full max-w-md px-8">
          <div className="mx-auto rounded-3xl bg-white/90 p-10 shadow-xl backdrop-blur-md text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#A4B870]">
              <span className="text-3xl">🙂</span>
            </div>

            <h1 className="text-2xl font-bold text-[#6E8450]">Login</h1>

            <div className="mt-6">
              <div className="text-left text-xs text-gray-700 font-medium mb-2">Email Address</div>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email..." className="w-full rounded-full border border-gray-200 px-4 py-3 shadow-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4B870]" type="email" />
            </div>

            {mode === "password" && (
              <form action="/api/auth/login" method="post" className="mt-4">
                <input type="hidden" name="email" value={email} />
                <div className="text-left text-xs text-gray-700 font-medium mb-2">Password</div>
                <div className="relative">
                  <input name="password" placeholder="Enter your password..." className="w-full rounded-full border border-gray-200 px-4 py-3 shadow-sm pr-10 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4B870]" type="password" />
                </div>

                <div className="mt-4 text-left text-xs">
                  <button type="button" onClick={() => setMode("forgot")} className="text-gray-500 hover:underline">Forgot Password?</button>
                </div>

                <button type="submit" className="mt-6 w-full rounded-full bg-[#A4B870] px-6 py-3 text-white">Login →</button>
              </form>
            )}

            {mode === "otp" && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">We'll send a confirmation link to your email.</p>
                <div className="mt-4">
                  <button
                    onClick={async () => {
                      setLoading(true)
                      const { error } = await sendOtpClient(email)
                      setLoading(false)
                      if (error) {
                        alert('Failed to send OTP: ' + (error.message || 'unknown'))
                        return
                      }
                      alert('Check your email for the magic link.')
                    }}
                    className="w-full rounded-full bg-[#A4B870] px-6 py-3 text-white"
                  >
                    {loading ? 'Sending…' : 'Send Link'}
                  </button>
                </div>

                <div className="mt-4">
                  <input value={token} onChange={(e) => setToken(e.target.value)} name="token" placeholder="Enter OTP (if you received a code)" className="w-full rounded-full border border-gray-200 px-4 py-3 shadow-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4B870]" />
                  <button
                    onClick={async () => {
                      if (!token) return alert('Enter the OTP token')
                      setLoading(true)
                      const { error } = await verifyOtpClient(email, token)
                      setLoading(false)
                      if (error) {
                        alert('OTP verification failed: ' + (error.message || 'unknown'))
                        return
                      }
                      window.location.href = '/dashboard'
                    }}
                    className="mt-4 w-full rounded-full bg-[#A4B870] px-6 py-3 text-white"
                  >
                    Verify OTP
                  </button>
                </div>
              </div>
            )}

            {mode === "forgot" && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">Enter your registered email to receive a password reset link.</p>
                <button
                  onClick={async () => {
                    if (resetCooldown > 0) return
                    setLoading(true)
                    const { error } = await resetPasswordClient(email)
                    setLoading(false)
                    if (error) {
                      alert('Failed to send reset email: ' + (error.message || 'unknown'))
                      return
                    }
                    alert('Reset email sent — check your inbox.')
                    setResetCooldown(60)
                    const timer = setInterval(() => {
                      setResetCooldown(prev => {
                        if (prev <= 1) {
                          clearInterval(timer)
                          return 0
                        }
                        return prev - 1
                      })
                    }, 1000)
                  }}
                  disabled={resetCooldown > 0 || loading}
                  className="mt-6 w-full rounded-full bg-[#A4683c] px-6 py-3 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending…' : resetCooldown > 0 ? `Wait ${resetCooldown}s` : 'Send Reset Link'}
                </button>
              </div>
            )}

            {mode === "resend" && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-4">
                  Didn't receive the confirmation email? We'll send it again to the email address you registered with.
                </p>
                <button
                  onClick={async () => {
                    setLoading(true)
                    const { error } = await resendConfirmationClient(email)
                    setLoading(false)
                    if (error) {
                      alert('Failed to resend confirmation: ' + (error.message || 'unknown'))
                      return
                    }
                    alert('Confirmation email resent — check your inbox.')
                    setMode('password')
                  }}
                  className="w-full rounded-full bg-[#A4B870] px-6 py-3 text-white"
                >
                  {loading ? 'Sending…' : 'Resend Confirmation Email'}
                </button>
              </div>
            )}

            <div className="mt-6 text-xs text-gray-700">
              <button onClick={() => setMode("password")} className="mr-4 text-[#6E8450] hover:underline">Password</button>
              <button onClick={() => setMode("otp")} className="mr-4 text-[#6E8450] hover:underline">OTP</button>
              <button onClick={() => setMode("resend")} className="mr-4 text-[#6E8450] hover:underline">Resend</button>
              <Link href="/register" className="text-orange-600 ml-2 font-semibold hover:underline">Sign up</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}