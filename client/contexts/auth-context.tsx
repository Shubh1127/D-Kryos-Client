"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  email: string
  name: string
  role: string
  lastProfileUpdate?: string
}

interface AuthContextType {
  user: User | null
  apiKey: string | null
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name: string) => Promise<boolean>
  logout: () => void
  setApiKey: (key: string) => void
  isAuthenticated: boolean
  hasApiKey: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [apiKey, setApiKeyState] = useState<string | null>(null)

  useEffect(() => {
    // Load from localStorage on mount
    const savedUser = localStorage.getItem("kryos_user")
    const savedApiKey = localStorage.getItem("kryos_api_key")

    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    if (savedApiKey) {
      setApiKeyState(savedApiKey)
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Mock authentication - in real app, this would call your backend
      const mockUser: User = {
        id: "1",
        email,
        name: email.split("@")[0],
        role: "user",
      }

      setUser(mockUser)
      localStorage.setItem("kryos_user", JSON.stringify(mockUser))
      return true
    } catch (error) {
      console.error("Login failed:", error)
      return false
    }
  }

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      // Mock registration - in real app, this would call your backend
      const mockUser: User = {
        id: Date.now().toString(),
        email,
        name,
        role: "user",
      }

      setUser(mockUser)
      localStorage.setItem("kryos_user", JSON.stringify(mockUser))
      return true
    } catch (error) {
      console.error("Registration failed:", error)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    setApiKeyState(null)
    localStorage.removeItem("kryos_user")
    localStorage.removeItem("kryos_api_key")
  }

  const setApiKey = (key: string) => {
    setApiKeyState(key)
    localStorage.setItem("kryos_api_key", key)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        apiKey,
        login,
        register,
        logout,
        setApiKey,
        isAuthenticated: !!user,
        hasApiKey: !!apiKey,
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
