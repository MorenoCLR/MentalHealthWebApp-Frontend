'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ErrorContent() {
    const searchParams = useSearchParams()
    const reason = searchParams.get('reason') || 'unknown'

    const errorMessages: Record<string, { title: string; message: string }> = {
        'login_failed': {
            title: 'Login Failed',
            message: 'The email or password you entered is incorrect. Please try again.',
        },
        'otp_send_failed': {
            title: 'OTP Send Failed',
            message: 'Failed to send OTP to your email. Please check your email address and try again.',
        },
        'otp_verification_failed': {
            title: 'OTP Verification Failed',
            message: 'The OTP code is invalid or has expired. Please request a new one.',
        },
        'missing_otp_fields': {
            title: 'Invalid OTP Request',
            message: 'Please enter both your email and the OTP code.',
        },
        'resend_failed': {
            title: 'Resend Failed',
            message: 'Failed to resend the confirmation email. Please check your email address and try again.',
        },
        'confirm_expired': {
            title: 'Confirmation Link Expired',
            message: 'The confirmation link has expired or is invalid. Please register again.',
        },
        'unknown': {
            title: 'Something went wrong',
            message: 'We encountered an error while processing your request.',
        },
    }

    const error = errorMessages[reason] || errorMessages['unknown']

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100">
            <div className="text-center space-y-4 p-8 bg-white rounded-lg shadow-lg max-w-md">
                <h1 className="text-3xl font-bold text-red-600">{error.title}</h1>
                <p className="text-gray-600">
                    {error.message}
                </p>
                <div className="pt-4 space-y-2">
                    <a
                        href="/register"
                        className="inline-block bg-[#A4B870] text-white px-6 py-2 rounded-full hover:bg-[#93a664] transition-all"
                    >
                        Register Again
                    </a>
                    <a
                        href="/login"
                        className="inline-block text-[#A4B870] px-6 py-2 rounded-full hover:underline ml-2"
                    >
                        Login
                    </a>
                </div>
            </div>
        </div>
    )
}

export default function ErrorPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-red-100">
                <div className="text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-red-300 border-t-red-600" />
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <ErrorContent />
        </Suspense>
    )
}
