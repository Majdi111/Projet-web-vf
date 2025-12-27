"use client"
import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import LoginForm from "./login/LoginForm"
import RegisterForm from "./login/RegisterForm"
import ForgotPasswordForm from "./login/ForgotPasswordForm"

/**
 * LoginPage Component
 * 
 * Main authentication page with animated form transitions between login, register, and password reset.
 * Features:
 * - Smooth slide animations between different authentication forms
 * - Dark gradient background with glassmorphic design
 * - Responsive two-panel layout (welcome text + form)
 * - Directional transitions based on user navigation
 */
export default function LoginPage() {
  // Track which form is currently displayed
  const [formType, setFormType] = useState<"login" | "register" | "forgot">("login")
  
  // Controls animation direction for form transitions (1 = right, -1 = left)
  const [direction, setDirection] = useState(0)

  /**
   * Handles switching between different authentication forms
   * @param type - The target form type ("login", "register", or "forgot")
   * Sets appropriate slide direction: negative for login, positive for others
   */
  const handleSwitch = (type: "login" | "register" | "forgot") => {
    setDirection(type === "login" ? -1 : 1)
    setFormType(type)
  }

  return (
    // Main container with dark gradient background
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#010513] via-[#061030] to-[#020617] p-6 overflow-hidden">
      {/* Animated glass card container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative w-full max-w-4xl bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl flex overflow-hidden"
      >
        <div className="absolute left-6 bottom-6 z-30">
          <Image
            src="/logo.png"
            alt="MMKR Solutions logo"
            width={64}
            height={64}
            priority
            className="h-auto w-[56px]"
          />
        </div>
        {/* Left Panel - Welcome Section with branding and decorative elements */}
        <div className="w-1/2 relative px-10 py-12 bg-gradient-to-br from-[#081534] via-[#0d1b47] to-[#050e27] text-white overflow-hidden">
          {/* Animated background glow effects */}
          <div className="absolute -right-24 -bottom-10 w-64 h-64 rounded-full bg-blue-900/30 blur-2xl z-0" />
          <div className="absolute -left-16 top-6 w-52 h-52 rounded-full bg-indigo-700/40 blur-xl z-0" />

          {/* Welcome text and company branding */}
          <div className="relative z-20">
            <h1 className="text-4xl font-bold tracking-wide text-blue-100">WELCOME</h1>
            <p className="mt-2 text-sm text-blue-200/80">MMKR SOLUTIONS</p>
            <p className="mt-6 text-sm text-blue-100/70 leading-relaxed">
              Empowering your business through smart digital solutions.
              Our platform combines innovation, performance, and seamless user experience to help you grow faster.
            </p>
          </div>
        </div>

        {/* Right Panel - Dynamic Form Container with smooth transitions */}
        <div className="w-1/2 bg-gradient-to-b from-[#0e142d] via-[#0a0f26] to-[#05091b] p-10 text-white overflow-hidden relative">
          {/* Animated form transitions using Framer Motion AnimatePresence */}
          <AnimatePresence custom={direction} mode="wait">
            {/* Login Form - Slides in from left when selected */}
            {formType === "login" && (
              <motion.div
                key="login"
                initial={{ x: direction > 0 ? 300 : -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction > 0 ? -300 : 300, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <LoginForm onSwitch={handleSwitch} />
              </motion.div>
            )}

            {/* Registration Form - Slides in from right when selected */}
            {formType === "register" && (
              <motion.div
                key="register"
                initial={{ x: direction > 0 ? 300 : -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction > 0 ? -300 : 300, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <RegisterForm onSwitch={handleSwitch} />
              </motion.div>
            )}

            {/* Password Reset Form - Slides in from right when selected */}
            {formType === "forgot" && (
              <motion.div
                key="forgot"
                initial={{ x: direction > 0 ? 300 : -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction > 0 ? -300 : 300, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <ForgotPasswordForm onSwitch={handleSwitch} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
