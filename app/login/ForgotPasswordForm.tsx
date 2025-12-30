"use client"
import React, { useState } from "react"
import { motion } from "framer-motion"

import { auth } from "@/lib/firebaseClient"
import { fetchSignInMethodsForEmail, sendPasswordResetEmail } from "firebase/auth"

type AuthFormType = "login" | "register" | "forgot"

export default function ForgotPasswordForm({ onSwitch }: { onSwitch: (type: AuthFormType) => void }) {
  const [email, setEmail] = useState("")
  const [focused, setFocused] = useState(false)

  const isActive = focused || email !== ""
  
  const handleReset = async (e: React.FormEvent) => {
  e.preventDefault()
  try {
    const cleanEmail = email.trim().toLowerCase();
    const methods = await fetchSignInMethodsForEmail(auth, cleanEmail);

    if (methods.length === 0) {
      alert("This email is not registered.")
      return
    }

    await sendPasswordResetEmail(auth, email)
    alert("A password reset link has been sent to your email.")
  } catch (err) {
    console.error(err)
    alert("Something went wrong. Please try again.")
  }
}


  return (
    <div>
      <h2 className="text-2xl font-semibold">Reset Password</h2>
      <p className="text-sm text-gray-400 mt-1">Enter your email to reset your password</p>

      <form className="mt-6 space-y-5" onSubmit={handleReset}>

        <motion.div
          animate={isActive ? { scale: 1.05 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
          className="relative"
        >
          <input
            id="email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder=" "
            type="email"
            className={`peer w-full bg-transparent border rounded-lg px-4 pt-5 pb-2 text-white placeholder-transparent focus:outline-none transition-all duration-300 ${
              isActive ? "border-blue-500 ring-2 ring-blue-600/50 shadow-[0_0_20px_rgba(37,99,235,0.5)]" : "border-white/20"
            }`}
          />
          <label
            htmlFor="email"
            className={`absolute left-4 text-gray-400 text-sm transition-all duration-200
              ${isActive ? "top-1 text-xs text-blue-400" : "top-4 text-base"}
            `}
          >
            Email
          </label>
        </motion.div>

        <button className="w-full mt-4 rounded-lg py-3 font-semibold bg-gradient-to-r from-blue-900 via-blue-800 to-blue-950 text-white shadow-lg hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] transition-all duration-300 ease-out">
          Send Reset Link
        </button>

        <p className="text-center text-sm text-gray-400 mt-3">
          Back to{" "}
          <button type="button" onClick={() => onSwitch("login")} className="text-blue-400 hover:text-blue-300">
            Sign In
          </button>
        </p>
      </form>
    </div>
  )
}
