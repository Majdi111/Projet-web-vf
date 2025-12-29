"use client"
import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth"
import { auth, db } from "@/lib/firebaseClient"
import { doc, setDoc } from "firebase/firestore"

type AuthFormType = "login" | "register" | "forgot"

type RegisterFormState = {
  username: string
  email: string
  password: string
  confirm: string
}

export default function RegisterForm({ onSwitch }: { onSwitch: (type: AuthFormType) => void }) {
  const [focused, setFocused] = useState<string | null>(null)
  const [form, setForm] = useState<RegisterFormState>({ username: "", email: "", password: "", confirm: "" })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name as keyof RegisterFormState]: e.target.value })

  const isActive = (field: keyof RegisterFormState) => focused === field || form[field] !== ""

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (form.password !== form.confirm) {
      showMessage("error", " Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password)
      const user = userCredential.user

      await updateProfile(user, { displayName: form.username })
      await setDoc(doc(db, "users", user.uid), {
        username: form.username,
        email: form.email,
        createdAt: new Date(),
      })

      showMessage("success", "Account created successfully! Redirecting...")
      setTimeout(() => onSwitch("login"), 2500)
    } catch (err: unknown) {
      let message = " Something went wrong. Please try again."
      const code =
        typeof err === "object" && err !== null && "code" in err
          ? String((err as { code?: unknown }).code ?? "")
          : ""

      switch (code) {
        case "auth/email-already-in-use":
          message = " This email is already registered. Please sign in instead."
          break
        case "auth/invalid-email":
          message = " Invalid email address."
          break
        case "auth/weak-password":
          message = " Password should be at least 6 characters long."
          break
      }
      showMessage("error", message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <h2 className="text-2xl font-semibold">Create Account</h2>
      <p className="text-sm text-gray-400 mt-1">Fill in your details to sign up</p>

      <AnimatePresence mode="wait">
        {message && (
          <motion.div
            key={message.text}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              boxShadow:
                message.type === "success"
                  ? "0 0 25px rgba(34,197,94,0.25)"
                  : "0 0 25px rgba(239,68,68,0.25)",
            }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`mt-5 px-4 py-3 text-sm rounded-md text-center backdrop-blur-md ${
              message.type === "success"
                ? "bg-green-500/10 text-green-400 border border-green-500/30"
                : "bg-red-500/10 text-red-400 border border-red-500/30"
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        {(["username", "email", "password", "confirm"] as const).map((field) => (
          <motion.div
            key={field}
            animate={focused === field ? { scale: 1.05 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
            className="relative"
          >
            <input
              id={field}
              name={field}
              value={form[field]}
              onChange={handleChange}
              onFocus={() => setFocused(field)}
              onBlur={() => setFocused(null)}
              placeholder=" "
              type={field === "password" || field === "confirm" ? "password" : field === "email" ? "email" : "text"}
              className={`peer w-full bg-transparent border rounded-lg px-4 pt-5 pb-2 text-white placeholder-transparent focus:outline-none transition-all duration-300 ${
                focused === field
                  ? "border-blue-500 ring-2 ring-blue-600/50 shadow-[0_0_25px_rgba(37,99,235,0.5)]"
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
              {field === "confirm"
                ? "Confirm Password"
                : field.charAt(0).toUpperCase() + field.slice(1)}
            </label>
          </motion.div>
        ))}

        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.97 }}
          whileHover={!loading ? { scale: 1.02, boxShadow: "0 0 25px rgba(37,99,235,0.4)" } : {}}
          transition={{ type: "spring", stiffness: 150, damping: 8 }}
          className={`w-full mt-4 rounded-lg py-3 font-semibold ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          } bg-gradient-to-r from-blue-900 via-blue-800 to-blue-950 text-white shadow-lg transition-all duration-300 ease-out`}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </motion.button>

        <p className="text-center text-sm text-gray-400 mt-3">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => onSwitch("login")}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Sign In
          </button>
        </p>
      </form>
    </div>
  )
}
