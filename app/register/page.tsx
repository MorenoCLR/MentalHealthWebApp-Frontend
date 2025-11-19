"use client";

import React, { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  AlertCircle,
  CheckCircle2,
  Smile,
} from "lucide-react";

export default function RegisterPage() {
  const supabase = createClientComponentClient();

  // UI states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step logic
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const [otpCode, setOtpCode] = useState("");
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
  // Reset errors
  setEmailError("");
  setPasswordError("");

  // Run validators
  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(password);

  let hasError = false;

  if (emailValidation) {
    setEmailError(emailValidation);
    hasError = true;
  }

  if (passwordValidation) {
    setPasswordError(passwordValidation);
    hasError = true;
  }

  if (hasError) return;

  setLoading(true);

  const { error } = await supabase.auth.signUp({
    email: email,
    password: password,
  });

  setLoading(false);

  if (error?.message.includes("already registered")) {
    setEmailError("Email is already registered. Try another.");
    return;
  }

  // Move to OTP popup
  setShowOtpPopup(true);
};


  // STEP 2 — VERIFY OTP
  const handleOtpVerify = async () => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: "signup",
    });

    if (error) {
      alert("Invalid OTP. Try again.");
      return;
    }

    setShowOtpPopup(false);
    setShowProfilePopup(true);
  };

  // STEP 3 — SAVE PROFILE DATA
  const handleSaveProfile = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;

    if (!uid) return;

    await supabase
      .from("users")
      .update({
        full_name: fullName,
        username: username,
        phone_number: phoneNumber,
      })
      .eq("id", uid);

    setShowProfilePopup(false);
    setShowSuccessPopup(true);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#F5F5F0] overflow-hidden flex items-center justify-center">

      {/* TOP CURVED SHAPE */}
      <div className="absolute top-[-200px] left-0 w-full h-[400px] bg-[#A4B870] rounded-b-full"></div>

      {/* BOTTOM CURVED SHAPE */}
      <div className="absolute bottom-[-200px] left-0 w-full h-[400px] bg-[#A4B870] rounded-t-full"></div>

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
              } focus:outline-none`}
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
              } focus:outline-none`}
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

        <p className="text-sm mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-orange-600 font-semibold">Sign In</a>
        </p>
      </div>

      {/* OTP POPUP */}
      {showOtpPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 w-[350px] text-center">
            <p className="text-xl font-semibold text-[#A4B870]">Enter OTP</p>

            <input
              className="mt-5 w-full px-5 py-3 rounded-full border border-gray-300"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
            />

            <button
              onClick={handleOtpVerify}
              className="mt-5 bg-[#A4B870] text-white px-10 py-3 rounded-full"
            >
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* PROFILE POPUP */}
      {showProfilePopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 w-[350px] text-center space-y-4">

            <p className="text-xl font-semibold text-[#A4B870]">Personal Details</p>

            <input
              placeholder="Enter your full name..."
              className="w-full px-5 py-3 rounded-full border border-gray-300"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />

            <input
              placeholder="Enter your username..."
              className="w-full px-5 py-3 rounded-full border border-gray-300"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <input
              placeholder="Enter your phone number..."
              className="w-full px-5 py-3 rounded-full border border-gray-300"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />

            <button
              onClick={handleSaveProfile}
              className="mt-4 bg-[#A4B870] text-white px-10 py-3 rounded-full"
            >
              Save
            </button>

          </div>
        </div>
      )}

      {/* SUCCESS POPUP */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
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
