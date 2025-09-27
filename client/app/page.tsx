"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { ApiKeySetup } from "@/components/auth/api-key-setup"

export default function HomePage() {
  const [isLogin, setIsLogin] = useState(true)
  const { isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, router])

  // Removed ApiKeySetup gating per new requirement

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2 text-balance">
          Welcome to <span className="text-accent">Kryos</span>
        </h1>
        <p className="text-lg text-muted-foreground text-balance">Professional startup webapp for modern businesses</p>
      </div>

      {/* Auth Form */}
      {isLogin ? (
        <LoginForm onToggleMode={() => setIsLogin(false)} />
      ) : (
        <RegisterForm onToggleMode={() => setIsLogin(true)} />
      )}

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">Secure • Professional • Enterprise-ready</p>
      </div>
    </div>
  )
}
