"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/Navbar"
import {
  User, Mail, Lock, Bell, Shield, Database, Trash2, Download,
  LogOut, ChevronRight, Check, X, Settings as SettingsIcon,
  Moon, Sun, Globe, Phone, Calendar
} from "lucide-react"
import { 
  getUserProfile, updateProfile, updateEmail, updatePassword, 
  deleteAccount, exportUserData, logout, getAccountStats 
} from "./actions"

type Tab = 'account' | 'profile' | 'security' | 'notifications' | 'data' | 'about'

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('account')
  const [userProfile, setUserProfile] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Form states
  const [profileData, setProfileData] = useState({
    full_name: '',
    username: '',
    phone: ''
  })
  const [emailData, setEmailData] = useState({ email: '' })
  const [passwordData, setPasswordData] = useState({ password: '', confirm_password: '' })
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    moodReminders: true,
    journalReminders: false,
    weeklyReports: true
  })
  const [darkMode, setDarkMode] = useState(false)

  const tabs = [
    { id: 'account' as Tab, label: 'Account', icon: User },
    { id: 'profile' as Tab, label: 'Profile', icon: User },
    { id: 'security' as Tab, label: 'Security', icon: Lock },
    { id: 'notifications' as Tab, label: 'Notifications', icon: Bell },
    { id: 'data' as Tab, label: 'Data', icon: Database },
    { id: 'about' as Tab, label: 'About', icon: SettingsIcon },
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    const [profileResult, statsResult] = await Promise.all([
      getUserProfile(),
      getAccountStats()
    ])
    
    if (profileResult.user) {
      setUserProfile(profileResult.user)
      setProfileData({
        full_name: profileResult.user.full_name || '',
        username: profileResult.user.username || '',
        phone: profileResult.user.phone_number || ''
      })
      setEmailData({ email: profileResult.user.email || '' })
    }
    
    setStats(statsResult)
    setLoading(false)
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleUpdateProfile = async () => {
    setSaving(true)
    const formData = new FormData()
    formData.append('full_name', profileData.full_name)
    formData.append('username', profileData.username)
    formData.append('phone', profileData.phone)

    const result = await updateProfile(formData)
    setSaving(false)

    if (result?.error) {
      showMessage('error', result.error)
    } else {
      showMessage('success', 'Profile updated successfully')
      loadData()
    }
  }

  const handleUpdateEmail = async () => {
    setSaving(true)
    const formData = new FormData()
    formData.append('email', emailData.email)
    
    const result = await updateEmail(formData)
    setSaving(false)
    
    if (result?.error) {
      showMessage('error', result.error)
    } else {
      showMessage('success', result.message || 'Email update initiated')
    }
  }

  const handleUpdatePassword = async () => {
    setSaving(true)
    const formData = new FormData()
    formData.append('password', passwordData.password)
    formData.append('confirm_password', passwordData.confirm_password)
    
    const result = await updatePassword(formData)
    setSaving(false)
    
    if (result?.error) {
      showMessage('error', result.error)
    } else {
      showMessage('success', result.message || 'Password updated')
      setPasswordData({ password: '', confirm_password: '' })
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you absolutely sure? This action cannot be undone.')) return
    
    setSaving(true)
    const formData = new FormData()
    formData.append('confirmation', deleteConfirmation)
    
    const result = await deleteAccount(formData)
    
    if (result?.error) {
      showMessage('error', result.error)
      setSaving(false)
    }
  }

  const handleExportData = async () => {
    setSaving(true)
    const data = await exportUserData()
    
    // Create download
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mental-health-data-${new Date().toISOString()}.json`
    a.click()
    
    setSaving(false)
    showMessage('success', 'Data exported successfully')
  }

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to log out?')) return
    await logout()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#A4B870]/30 border-t-[#A4B870]" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0]">
      {/* Shared Navbar */}
      <Navbar />

      {/* Main Content Area (offset by Navbar width on desktop) */}
      <div className="flex-1 md:ml-20 p-6 pb-12">
        {/* Page Header */}
        <div className="mb-8 mt-12 md:mt-0">
          <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
          <p className="mt-2 text-gray-600">Manage your account and preferences</p>
        </div>

        {/* Message Banner */}
        {message && (
          <div className={`mb-6`}>
            <div className={`rounded-2xl p-4 flex items-center justify-between ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {message.type === 'success' ? <Check size={20} /> : <X size={20} />}
                <span>{message.text}</span>
              </div>
              <button onClick={() => setMessage(null)}>
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation for Settings */}
          <div className="lg:col-span-1">
            <div className="rounded-3xl bg-white p-6 shadow-lg">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-[#A4B870] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="font-medium">{tab.label}</span>
                      {activeTab === tab.id && <ChevronRight size={16} className="ml-auto" />}
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Main Settings Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Account Overview */}
            {activeTab === 'account' && (
              <>
                <div className="rounded-3xl bg-white p-8 shadow-lg">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Account Overview</h2>
                  
                  <div className="flex items-center gap-6 mb-8">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#A4B870] to-[#6E8450] flex items-center justify-center">
                      <span className="text-4xl text-white">
                        {userProfile?.full_name?.charAt(0) || userProfile?.email?.charAt(0) || '👤'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">
                        {userProfile?.full_name || 'User'}
                      </h3>
                      <p className="text-gray-600">{userProfile?.email}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Member since {new Date(userProfile?.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-2xl bg-[#A4B870]/10 p-6 text-center">
                      <p className="text-3xl font-bold text-[#6E8450]">{stats?.journalsCount || 0}</p>
                      <p className="text-sm text-gray-600 mt-1">Journal Entries</p>
                    </div>
                    <div className="rounded-2xl bg-[#FF8C69]/10 p-6 text-center">
                      <p className="text-3xl font-bold text-[#D85A43]">{stats?.moodsCount || 0}</p>
                      <p className="text-sm text-gray-600 mt-1">Mood Logs</p>
                    </div>
                    <div className="rounded-2xl bg-[#E5D68A]/10 p-6 text-center">
                      <p className="text-3xl font-bold text-[#C4A04A]">{stats?.goalsCount || 0}</p>
                      <p className="text-sm text-gray-600 mt-1">Goals Set</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl bg-white p-8 shadow-lg">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={handleExportData}
                      disabled={saving}
                      className="flex items-center gap-3 rounded-2xl bg-[#A4B870]/10 p-4 text-left hover:bg-[#A4B870]/20 transition-colors"
                    >
                      <Download size={24} className="text-[#6E8450]" />
                      <div>
                        <p className="font-medium text-gray-800">Export Data</p>
                        <p className="text-xs text-gray-600">Download your info</p>
                      </div>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-left hover:bg-red-100 transition-colors"
                    >
                      <LogOut size={24} className="text-red-600" />
                      <div>
                        <p className="font-medium text-gray-800">Log Out</p>
                        <p className="text-xs text-gray-600">Sign out of account</p>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="rounded-3xl bg-white p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User size={16} className="inline mr-2" />
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                      className="w-full rounded-full border border-gray-200 px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4B870]"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User size={16} className="inline mr-2" />
                      Username
                    </label>
                    <input
                      type="text"
                      value={profileData.username}
                      onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                      className="w-full rounded-full border border-gray-200 px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4B870]"
                      placeholder="Enter your username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone size={16} className="inline mr-2" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full rounded-full border border-gray-200 px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4B870]"
                      placeholder="+62 8XX-XXXX-XXXX"
                    />
                  </div>

                  <button
                    onClick={handleUpdateProfile}
                    disabled={saving}
                    className="w-full rounded-full bg-[#A4B870] px-6 py-3 text-white font-medium hover:bg-[#6E8450] transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <>
                <div className="rounded-3xl bg-white p-8 shadow-lg">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Change Email</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Email
                      </label>
                      <div className="w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-3 text-gray-600">
                        {userProfile?.email}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail size={16} className="inline mr-2" />
                        New Email Address
                      </label>
                      <input
                        type="email"
                        value={emailData.email}
                        onChange={(e) => setEmailData({ email: e.target.value })}
                        className="w-full rounded-full border border-gray-200 px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4B870]"
                        placeholder="new.email@example.com"
                      />
                    </div>

                    <button
                      onClick={handleUpdateEmail}
                      disabled={saving}
                      className="w-full rounded-full bg-[#A4B870] px-6 py-3 text-white font-medium hover:bg-[#6E8450] transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Updating...' : 'Update Email'}
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl bg-white p-8 shadow-lg">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Change Password</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Lock size={16} className="inline mr-2" />
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.password}
                        onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                        className="w-full rounded-full border border-gray-200 px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4B870]"
                        placeholder="Enter new password"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Lock size={16} className="inline mr-2" />
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                        className="w-full rounded-full border border-gray-200 px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4B870]"
                        placeholder="Confirm new password"
                      />
                    </div>

                    <button
                      onClick={handleUpdatePassword}
                      disabled={saving}
                      className="w-full rounded-full bg-[#A4B870] px-6 py-3 text-white font-medium hover:bg-[#6E8450] transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="rounded-3xl bg-white p-8 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Notification Preferences</h2>
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    Coming Soon
                  </span>
                </div>
                
                <p className="text-gray-500 mb-6 text-sm">
                  We are working on bringing you personalized notifications. This feature is currently disabled.
                </p>
                
                <div className="space-y-6 opacity-60 pointer-events-none select-none grayscale">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Email Notifications</p>
                      <p className="text-sm text-gray-600">Receive updates via email</p>
                    </div>
                    <button 
                      className="relative h-8 w-14 rounded-full bg-gray-300"
                      disabled
                    >
                      <span className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition-transform" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Mood Check Reminders</p>
                      <p className="text-sm text-gray-600">Daily reminder to log your mood</p>
                    </div>
                    <button 
                      className="relative h-8 w-14 rounded-full bg-gray-300"
                      disabled
                    >
                      <span className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition-transform" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Journal Reminders</p>
                      <p className="text-sm text-gray-600">Reminder to write in your journal</p>
                    </div>
                    <button 
                      className="relative h-8 w-14 rounded-full bg-gray-300"
                      disabled
                    >
                      <span className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition-transform" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Weekly Reports</p>
                      <p className="text-sm text-gray-600">Summary of your mental health progress</p>
                    </div>
                    <button 
                      className="relative h-8 w-14 rounded-full bg-gray-300"
                      disabled
                    >
                      <span className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Data Management */}
            {activeTab === 'data' && (
              <>
                <div className="rounded-3xl bg-white p-8 shadow-lg">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Data Management</h2>
                  
                  <div className="space-y-4">
                    <button
                      onClick={handleExportData}
                      disabled={saving}
                      className="w-full flex items-center justify-between rounded-2xl bg-[#A4B870]/10 p-6 hover:bg-[#A4B870]/20 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#A4B870]">
                          <Download size={24} className="text-white" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-gray-800">Export Your Data</p>
                          <p className="text-sm text-gray-600">Download all your information as JSON</p>
                        </div>
                      </div>
                      <ChevronRight className="text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl bg-red-50 p-8 shadow-lg border-2 border-red-200">
                  <h2 className="text-2xl font-bold text-red-800 mb-4 flex items-center gap-2">
                    <Trash2 size={24} />
                    Danger Zone
                  </h2>
                  <p className="text-gray-700 mb-6">
                    Once you delete your account, there is no going back. This will permanently delete all your data including journals, mood logs, and goals.
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type DELETE to confirm
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        className="w-full rounded-full border-2 border-red-300 px-4 py-3 text-red-800 font-semibold placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                        placeholder="DELETE"
                      />
                    </div>

                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmation !== 'DELETE' || saving}
                      className="w-full rounded-full bg-red-600 px-6 py-3 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Deleting...' : 'Delete My Account'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* About */}
            {activeTab === 'about' && (
              <div className="rounded-3xl bg-white p-8 shadow-lg">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">About</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Mental Health Web App</h3>
                    <p className="text-gray-600">Version 1.0.0</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
                    <p className="text-gray-600">
                      A comprehensive mental health tracking application designed to help you monitor your mood, 
                      maintain a journal, set wellness goals, and track your overall mental well-being.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button className="w-full text-left rounded-2xl bg-gray-50 p-4 hover:bg-gray-100 transition-colors">
                      <p className="font-medium text-gray-800">Terms of Service</p>
                    </button>
                    <button className="w-full text-left rounded-2xl bg-gray-50 p-4 hover:bg-gray-100 transition-colors">
                      <p className="font-medium text-gray-800">Privacy Policy</p>
                    </button>
                    <button className="w-full text-left rounded-2xl bg-gray-50 p-4 hover:bg-gray-100 transition-colors">
                      <p className="font-medium text-gray-800">Help & Support</p>
                    </button>
                    <button className="w-full text-left rounded-2xl bg-gray-50 p-4 hover:bg-gray-100 transition-colors">
                      <p className="font-medium text-gray-800">Contact Us</p>
                    </button>
                  </div>

                  <div className="pt-6 border-t">
                    <p className="text-center text-sm text-gray-500">
                      Made with ❤️ for mental wellness
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}