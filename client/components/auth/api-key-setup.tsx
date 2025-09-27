"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { Key } from "lucide-react"

export function ApiKeySetup() {
  const [apiKeyInput, setApiKeyInput] = useState("")
  const [error, setError] = useState("")
  const { setApiKey } = useAuth()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!apiKeyInput.trim()) {
      setError("Please enter your API key")
      return
    }

    // Mock validation - in real app, this would validate with backend
    if (apiKeyInput.length < 10) {
      setError("Invalid API key format")
      return
    }

    setApiKey(apiKeyInput.trim())
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
          <Key className="h-6 w-6 text-accent" />
        </div>
        <CardTitle className="text-2xl font-bold">API Key Required</CardTitle>
        <CardDescription>Enter your Kryos API key to access all features</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your Kryos API key"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">Get your API key from the Kryos main dashboard</p>
        </div>
      </CardContent>
    </Card>
  )
}
