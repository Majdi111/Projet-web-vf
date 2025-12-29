"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebaseClient"
import { useRouter } from "next/navigation"

type AuthFormType = "login" | "register" | "forgot"

export default function LoginForm({ onSwitch }: { onSwitch: (type: AuthFormType) => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [focused, setFocused] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null)
  const router = useRouter()

  const showMessage = (type: string, text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      showMessage("success", "Login successful. Redirecting to your dashboard…")
      router.replace("/dashboard")
    } catch (err: unknown) {
      let text = "An unexpected error occurred. Please try again later."
      const code =
        typeof err === "object" && err !== null && "code" in err
          ? String((err as { code?: unknown }).code ?? "")
          : err instanceof Error
            ? err.message
            : ""

      if (code.includes("user-not-found")) {
        text = "No account found with this email. Please register first."
      } else if (code.includes("wrong-password")) {
        text = "The password entered is incorrect. Please try again."
      } else if (code.includes("invalid-email")) {
        text = "The email address format is invalid. Please check and try again."
      } else if (code.includes("invalid-credential")) {
        text = "Your login credentials are invalid. Please check your email and password."
      }

      showMessage("error", text)
    } finally {
      setLoading(false)
    }
  }

  const isActive = (field: string) => (field === "email" ? email !== "" : password !== "") || focused === field

  return (
    <div className="relative w-full">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className={`mb-4 w-full rounded-lg text-center py-2 font-medium ${
              message.type === "success"
                ? "bg-green-600/20 text-green-400 border border-green-500/30"
                : "bg-red-600/20 text-red-400 border border-red-500/30"
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <h2 className="text-2xl font-semibold">Login</h2>
      <p className="text-sm text-gray-400 mt-1">Enter your credentials to log in</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {["email", "password"].map((field) => (
          <motion.div
            key={field}
            animate={focused === field ? { scale: 1.05 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="relative"
          >
            <input
              id={field}
              name={field}
              type={field === "password" ? "password" : "email"}
              value={field === "password" ? password : email}
              onChange={(e) =>
                field === "password" ? setPassword(e.target.value) : setEmail(e.target.value)
              }
              onFocus={() => setFocused(field)}
              onBlur={() => setFocused(null)}
              placeholder=" "
              className={`peer w-full bg-transparent border rounded-lg px-4 pt-5 pb-2 text-white placeholder-transparent focus:outline-none transition-all duration-300 ${
                focused === field
                  ? "border-blue-500 ring-2 ring-blue-600/50 shadow-[0_0_20px_rgba(37,99,235,0.5)]"
                  : "border-white/20"
              }`}
              required
            />
            <label
              htmlFor={field}
              className={`absolute left-4 text-gray-400 text-sm transition-all duration-200 ${
                isActive(field) ? "top-1 text-xs text-blue-400" : "top-4 text-base"
              }`}
            >
              {field === "email" ? "Email" : "Password"}
            </label>
          </motion.div>
        ))}
        <div className="text-right">
          <button
            type="button"
            onClick={() => onSwitch("forgot")}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Forgot Password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full mt-4 rounded-lg py-3 font-semibold ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          } bg-gradient-to-r from-blue-900 via-blue-800 to-blue-950 text-white shadow-lg hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] transition-all duration-300 ease-out`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-sm text-gray-400 mt-3">
          Don’t have an account?{" "}
          <button
            type="button"
            onClick={() => onSwitch("register")}
            className="text-blue-400 hover:text-blue-300"
          >
            Sign Up
          </button>
        </p>
      </form>
    </div>
  )
}
