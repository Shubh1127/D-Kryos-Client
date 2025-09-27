"use client"

import { ReactNode, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

interface ProtectedRouteProps {
  children: ReactNode
  requireApiKey?: boolean
  redirectTo?: string
}

export function ProtectedRoute({ children, requireApiKey = false, redirectTo = "/" }: ProtectedRouteProps) {
  const { isAuthenticated, hasApiKey } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(redirectTo)
    } else if (requireApiKey && !hasApiKey) {
      // stay on page; caller can render ApiKeySetup or we could redirect optionally
    }
  }, [isAuthenticated, hasApiKey, requireApiKey, redirectTo, router])

  if (!isAuthenticated) return null
  if (requireApiKey && !hasApiKey) {
    // Let parent decide UI; could also return a placeholder
    return <div className="flex justify-center"><p className="text-muted-foreground text-sm">API key required.</p></div>
  }

  return <>{children}</>
}

export function useRedirectIfAuthenticated(target: string = "/dashboard") {
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  useEffect(() => {
    if (isAuthenticated) router.replace(target)
  }, [isAuthenticated, target, router])
}
