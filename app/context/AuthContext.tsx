"use client"

import { createContext, useContext, useEffect, useRef, useState } from "react"
import { auth } from "@/lib/firebaseClient"
import {
  browserSessionPersistence,
  onAuthStateChanged,
  setPersistence,
  type User,
} from "firebase/auth"
import { usePathname, useRouter } from "next/navigation"

type AuthContextValue = {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const hasRedirected = useRef(false)

  const isAuthPage =
    pathname === "/" || pathname === "/login" || pathname === "/register" || pathname === "/signin"

  useEffect(() => {
    let didCancel = false
    let unsubscribe: (() => void) | undefined

    ;(async () => {
      try {
        await setPersistence(auth, browserSessionPersistence)
      } catch {
      }

      if (didCancel) return

      unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
        setUser(firebaseUser)
        setLoading(false)

        if (hasRedirected.current) return

        if (!firebaseUser && !isAuthPage) {
          hasRedirected.current = true
          router.replace("/")
        }

        if (firebaseUser && isAuthPage) {
          hasRedirected.current = true
          router.replace("/dashboard")
        }
      })
    })()

    hasRedirected.current = false

    return () => {
      didCancel = true
      unsubscribe?.()
    }
  }, [router, pathname, isAuthPage])

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (isAuthPage) return
      if (!event.persisted) return

      if (!auth.currentUser) {
        window.location.replace("/")
      }
    }

    window.addEventListener("pageshow", onPageShow)
    return () => window.removeEventListener("pageshow", onPageShow)
  }, [isAuthPage])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {!loading && (user && isAuthPage ? false : isAuthPage || user) ? children : null}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)