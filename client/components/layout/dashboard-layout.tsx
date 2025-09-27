"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Navbar } from "./navbar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated, hasApiKey } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated || !hasApiKey) {
      router.push("/")
    }
  }, [isAuthenticated, hasApiKey, router])

  if (!isAuthenticated || !hasApiKey) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
