"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  CheckCircle2,
  Smile,
} from "lucide-react";

export default function RegisterPage() {
  const supabase = createClient();

  // UI states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  // Step logic
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Check if user came back after email confirmation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const confirmed = params.get('confirmed');
    
    if (confirmed === 'true') {
      console.log('User returned after email confirmation');
      setShowProfilePopup(true);
      // Clean up URL
      window.history.replaceState({}, '', '/register');
    }
  }, []);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  // VALIDATORS

  // STEP 1 — REGISTER WITH EMAIL + PASSWORD
  // Email must not be empty and must be valid format
function validateEmail(email: string) {
  if (!email) return "Email cannot be empty.";

  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email) ? "" : "Invalid email address.";
}

// Password security validation
function validatePassword(pw: string) {
  if (!pw) return "Password cannot be empty.";

  if (pw.length < 8) return "Password must be at least 8 characters.";

  if (!/[A-Z]/.test(pw)) return "Password must contain at least one uppercase letter.";

  if (!/[a-z]/.test(pw)) return "Password must contain at least one lowercase letter.";

  if (!/[0-9]/.test(pw)) return "Password must contain at least one number.";

  if (!/[!@#$%^&*(),.?":{}|<>_\-+=~]/.test(pw))
    return "Password must contain at least one symbol.";

  if (/\s/.test(pw)) return "Password cannot contain spaces.";

  return "";
}

const handleRegister = async () => {
  setEmailError("");
  setPasswordError("");

  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(password);

  if (emailValidation) {
    setEmailError(emailValidation);
    return;
  }
  if (passwordValidation) {
    setPasswordError(passwordValidation);
    return;
  }

  setLoading(true);

  try {
    const redirectUrl = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm`
      : `${window.location.origin}/auth/confirm`;

    console.log('=== REGISTRATION DEBUG ===');
    console.log('Email:', email);
    console.log('Redirect URL:', redirectUrl);
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          email: email
        }
      },
    });

    console.log('Signup response data:', JSON.stringify(data, null, 2));
    console.log('Signup error:', error);

    setLoading(false);

    if (error) {
      console.error('Signup error:', error);
      setEmailError(error.message);
      return;
    }

    // Log what happened
    if (data?.user && !data.session) {
      console.log('✅ User created, email confirmation REQUIRED');
      console.log('User ID:', data.user.id);
      console.log('Email sent to:', data.user.email);
      console.log('Confirmation sent at:', data.user.confirmation_sent_at);
      setShowConfirmationPopup(true);
    } else if (data?.session) {
      console.log('⚠️ User created with AUTO-CONFIRM (no email sent)');
      console.log('Session exists:', !!data.session);
      alert('Email confirmation is disabled in Supabase. To enable email sending:\n\n1. Go to Supabase Dashboard\n2. Authentication → Providers → Email\n3. Enable "Confirm email"');
      setShowProfilePopup(true);
    } else if (data?.user && data.user.identities && data.user.identities.length === 0) {
      console.log('⚠️ User already exists (may need to login instead)');
      setEmailError('This email is already registered. Please try logging in instead.');
    } else {
      console.log('⚠️ Unexpected signup state:', data);
      setShowConfirmationPopup(true);
    }
  } catch (err) {
    console.error('Unexpected signup error:', err);
    setEmailError('An unexpected error occurred. Please try again.');
    setLoading(false);
  }
};


  // STEP 2 — User clicks confirmation link in email, then returns to continue profile setup
  const handleContinueAfterConfirmation = async () => {
    // Verify the user actually has a session (clicked the email link)
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (!session || error) {
      alert("Please click the confirmation link in your email first. Check your inbox (and spam folder) for an email from Supabase.");
      return;
    }
    
    setShowConfirmationPopup(false);
    setShowProfilePopup(true);
  };

  // STEP 3 — SAVE PROFILE DATA
  const handleSaveProfile = async () => {
    setProfileLoading(true);
    
    try {
      // Retry logic: try up to 3 times to get the user with a delay
      let user = null;
      let userError = null;
      
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data: { user: currentUser }, error: err } = await supabase.auth.getUser();
        
        if (currentUser?.id) {
          user = currentUser;
          break;
        }
        
        userError = err;
        
        // Wait 1 second before retrying (except on last attempt)
        if (attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (userError || !user?.id) {
        console.error("Auth error after retries:", userError);
        alert("Error: Your email confirmation may not be complete. Please refresh the page and try clicking the confirmation link again.");
        setProfileLoading(false);
        return;
      }

      const uid = user.id;

      // Try to insert or update the user profile
      const { error } = await supabase
        .from("users")
        .upsert(
          {
            id: uid,
            full_name: fullName,
            username: username,
            phone_number: phoneNumber,
          },
          { onConflict: "id" }
        );

      if (error) {
        console.error("Error saving profile:", error);
        // If the users table doesn't exist, still proceed to success
        if (error.code === "PGRST116" || error.code === "42P01") {
          console.warn("Users table does not exist yet. Profile data not saved, but continuing registration.");
          setProfileLoading(false);
          setShowProfilePopup(false);
          setShowSuccessPopup(true);
          return;
        }
        alert(`Error saving profile: ${error.message}`);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(false);
      setShowProfilePopup(false);
      setShowSuccessPopup(true);
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("An unexpected error occurred. Please try again.");
      setProfileLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#F5F5F0] overflow-hidden flex items-center justify-center">

      {/* TOP CURVED SHAPE */}
      <div className="absolute top-[-200px] left-0 w-full h-[400px] bg-[#A4B870] rounded-b-full z-0 pointer-events-none"></div>

      {/* BOTTOM CURVED SHAPE */}
      <div className="absolute bottom-[-200px] left-0 w-full h-[400px] bg-[#A4B870] rounded-t-full z-0 pointer-events-none"></div>

      {/* CENTER CARD */}
      <div className="relative z-10 w-full max-w-md bg-white/80 backdrop-blur-md shadow-lg rounded-3xl p-10 text-center flex flex-col items-center">

        {/* Smiley Icon */}
        <Smile className="w-16 h-16 text-[#A4B870]" />

        <h1 className="text-3xl mt-4 font-bold text-[#6E8450]">Register</h1>

        {/* INPUT FIELDS */}
        <div className="mt-8 w-full space-y-5">

          {/* Email */}
          <div>
            <input
              type="email"
              placeholder="Enter your email..."
              className={`w-full px-5 py-3 rounded-full border ${
                emailError ? "border-red-400 bg-red-50" : "border-gray-300"
              } text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4B870]`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {emailError && (
              <p className="text-red-500 text-sm mt-1">{emailError}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <input
              type="password"
              placeholder="Enter your password..."
              className={`w-full px-5 py-3 rounded-full border ${
                passwordError
                  ? "border-red-400 bg-red-50"
                  : "border-gray-300"
              } text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4B870]`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {passwordError && (
              <p className="text-red-500 text-sm mt-1">{passwordError}</p>
            )}
          </div>
        </div>

        {/* REGISTER BUTTON */}
        <button
          onClick={handleRegister}
          className="mt-8 bg-[#A4B870] text-white px-10 py-3 rounded-full shadow hover:bg-[#93a664] transition-all"
        >
          {loading ? "Loading..." : "Register →"}
        </button>

        <p className="text-sm mt-4 text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-orange-600 font-semibold hover:underline">Sign In</a>
        </p>
      </div>

      {/* EMAIL CONFIRMATION POPUP */}
      {showConfirmationPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-[350px] text-center space-y-4">
            <CheckCircle2 className="text-green-600 w-10 h-10 mx-auto" />
            <p className="text-xl font-semibold text-[#A4B870]">Confirm Your Email</p>
            <p className="text-gray-600 text-sm">
              We&apos;ve sent a confirmation link to <strong>{email}</strong>. Please click the link in your email to activate your account.
            </p>
            <p className="text-gray-500 text-xs">
              Once you&apos;ve clicked the link, come back here to complete your profile.
            </p>
            <button
              onClick={handleContinueAfterConfirmation}
              className="mt-5 bg-[#A4B870] text-white px-10 py-3 rounded-full"
            >
              I&apos;ve Confirmed My Email
            </button>
          </div>
        </div>
      )}

      {/* PROFILE POPUP */}
      {showProfilePopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-[350px] text-center space-y-4">
            <p className="text-xl font-semibold text-[#A4B870]">Personal Details</p>

            <input
              placeholder="Enter your full name..."
              className="w-full px-5 py-3 rounded-full border border-gray-300 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4B870]"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <input
              placeholder="Enter your username..."
              className="w-full px-5 py-3 rounded-full border border-gray-300 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4B870]"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <input
              placeholder="Enter your phone number..."
              className="w-full px-5 py-3 rounded-full border border-gray-300 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A4B870]"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />

            <button
              onClick={handleSaveProfile}
              disabled={profileLoading}
              className="mt-4 bg-[#A4B870] text-white px-10 py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {profileLoading ? "Saving..." : "Save"}
            </button>

          </div>
        </div>
      )}

      {/* SUCCESS POPUP */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-[350px] text-center space-y-4">
            <CheckCircle2 className="text-green-600 w-10 h-10 mx-auto" />
            <p className="text-lg font-semibold">Registration Successful!</p>

            <button
              onClick={() => (window.location.href = "/login")}
              className="mt-4 bg-[#A4B870] text-white px-10 py-3 rounded-full"
            >
              Continue
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
