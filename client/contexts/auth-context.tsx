"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { auth, db } from "../firebase/firebaseConfig"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"

interface User {
  id: string
  email: string | null
  name: string | null
  role: string
  lastProfileUpdate?: string
}

interface AuthContextType {
  user: User | null
  apiKey: string | null
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name: string) => Promise<boolean>
  logout: () => Promise<void>
  setApiKey: (key: string) => void
  isAuthenticated: boolean
  hasApiKey: boolean
  isOffline: boolean
  refreshUserProfile: () => Promise<void>
  initializing: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [apiKey, setApiKeyState] = useState<string | null>(null)
  const [initializing, setInitializing] = useState<boolean>(true)
  const [isOffline, setIsOffline] = useState<boolean>(false)

  const mapAndEnsureUserDoc = useCallback(async (fbUser: FirebaseUser): Promise<User> => {
    try {
      const userRef = doc(db, "users", fbUser.uid)
      const snap = await getDoc(userRef)

      if (!snap.exists()) {
        if (isOffline) {
          return {
            id: fbUser.uid,
            email: fbUser.email,
            name: fbUser.displayName || fbUser.email?.split("@")[0] || null,
            role: "user",
          }
        }
        const newUserDoc = {
          email: fbUser.email,
          name: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
          role: "user",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
        await setDoc(userRef, newUserDoc)
        return {
          id: fbUser.uid,
          email: newUserDoc.email,
          name: newUserDoc.name,
          role: newUserDoc.role,
          lastProfileUpdate: new Date().toISOString(),
        }
      }

      const data = snap.data() as any
      return {
        id: fbUser.uid,
        email: fbUser.email,
        name: data.name || fbUser.displayName || fbUser.email?.split("@")[0] || null,
        role: data.role || "user",
        lastProfileUpdate: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : undefined,
      }
    } catch (err) {
      console.warn("[AuthContext] mapAndEnsureUserDoc failed (possibly offline)", err)
      return {
        id: fbUser.uid,
        email: fbUser.email,
        name: fbUser.displayName || fbUser.email?.split("@")[0] || null,
        role: "user",
      }
    }
  }, [isOffline])

  useEffect(() => {
    // Load api key only
    if (typeof window !== "undefined") {
      const savedApiKey = localStorage.getItem("kryos_api_key")
      if (savedApiKey) setApiKeyState(savedApiKey)

      const handleOnline = () => setIsOffline(false)
      const handleOffline = () => setIsOffline(true)
      window.addEventListener("online", handleOnline)
      window.addEventListener("offline", handleOffline)
      setIsOffline(!navigator.onLine)

      const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
        try {
          if (fbUser) {
            const mapped = await mapAndEnsureUserDoc(fbUser)
            setUser(mapped)
          } else {
            setUser(null)
          }
        } finally {
          setInitializing(false)
        }
      })

      return () => {
        window.removeEventListener("online", handleOnline)
        window.removeEventListener("offline", handleOffline)
        unsubscribeAuth()
      }
    } else {
      // On server just mark initializing false (no auth persistence there)
      setInitializing(false)
    }
  }, [mapAndEnsureUserDoc])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const mapped = await mapAndEnsureUserDoc(cred.user)
      setUser(mapped)
      return true
    } catch (error) {
      console.error("[AuthContext] Login failed", error)
      return false
    }
  }

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      if (name) {
        await updateProfile(cred.user, { displayName: name })
      }
      // Ensure user doc
      const mapped = await mapAndEnsureUserDoc(cred.user)
      setUser({ ...mapped, name: name || mapped.name })
      return true
    } catch (error) {
      console.error("[AuthContext] Registration failed", error)
      return false
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (e) {
      console.error("[AuthContext] Logout error", e)
    } finally {
      setUser(null)
      setApiKeyState(null)
      if (typeof window !== "undefined") {
        localStorage.removeItem("kryos_api_key")
      }
    }
  }

  const setApiKey = (key: string) => {
    setApiKeyState(key)
    if (typeof window !== "undefined") {
      localStorage.setItem("kryos_api_key", key)
    }
  }

  const refreshUserProfile = useCallback(async () => {
    const fbUser = auth.currentUser
    if (!fbUser) return
    const mapped = await mapAndEnsureUserDoc(fbUser)
    setUser(mapped)
  }, [mapAndEnsureUserDoc])

  return (
    <AuthContext.Provider
      value={{
        user,
        apiKey,
        login,
        register,
        logout,
        setApiKey,
        isAuthenticated: !!user && !initializing,
        hasApiKey: !!apiKey,
        isOffline,
        refreshUserProfile,
        initializing,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
