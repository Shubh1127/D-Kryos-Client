"use client"

import type React from "react"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { CreditCard, AlertTriangle, Shield, Clock, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface PaymentData {
  amount: number
  receiver: string
  description: string
  currency: string
}

export default function PaymentsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentData, setPaymentData] = useState<PaymentData>({
    amount: 0,
    receiver: "",
    description: "",
    currency: "INR",
  })

  const MAX_PAYMENT_AMOUNT = 1000000 // ₹10,00,000
  const isAdmin = user?.role === "admin"

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      // Validation
      if (paymentData.amount <= 0) {
        throw new Error("Please enter a valid amount")
      }

      if (!paymentData.receiver.trim()) {
        throw new Error("Please enter receiver details")
      }

      // Check payment limits for non-admin users
      if (!isAdmin && paymentData.amount > MAX_PAYMENT_AMOUNT) {
        throw new Error(`Payment amount cannot exceed ₹${MAX_PAYMENT_AMOUNT.toLocaleString()} for regular users`)
      }

      // Mock Razorpay integration
      const options = {
        key: "rzp_test_1234567890", // Mock test key
        amount: paymentData.amount * 100, // Razorpay expects amount in paise
        currency: paymentData.currency,
        name: "Kryos Demo",
        description: paymentData.description || "Payment via Kryos",
        handler: (response: any) => {
          // Mock successful payment
          const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

          // Save transaction to localStorage (in real app, this would go to backend)
          const transaction = {
            id: transactionId,
            amount: paymentData.amount,
            receiver: paymentData.receiver,
            description: paymentData.description,
            currency: paymentData.currency,
            status: isAdmin ? "approved" : "pending",
            timestamp: new Date().toISOString(),
            userId: user?.id,
            razorpayPaymentId: response.razorpay_payment_id,
            needsApproval: !isAdmin,
          }

          const existingTransactions = JSON.parse(localStorage.getItem("kryos_transactions") || "[]")
          localStorage.setItem("kryos_transactions", JSON.stringify([transaction, ...existingTransactions]))

          toast({
            title: "Payment Initiated",
            description: isAdmin ? "Payment processed successfully!" : "Payment submitted for admin approval.",
          })

          // Reset form
          setPaymentData({
            amount: 0,
            receiver: "",
            description: "",
            currency: "INR",
          })
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: "#8B5CF6", // Purple accent color
        },
      }

      // Mock Razorpay checkout (in real app, this would load Razorpay SDK)
      setTimeout(() => {
        options.handler({ razorpay_payment_id: `pay_${Date.now()}` })
        setIsProcessing(false)
      }, 2000)
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive",
      })
      setIsProcessing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">Process secure payments via Razorpay integration</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Make Payment
                </CardTitle>
                <CardDescription>Enter payment details to process via Razorpay</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePayment} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                        <Input
                          id="amount"
                          type="number"
                          min="1"
                          max={isAdmin ? undefined : MAX_PAYMENT_AMOUNT}
                          value={paymentData.amount || ""}
                          onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                          placeholder="0"
                          className="pl-8"
                          required
                        />
                      </div>
                      {!isAdmin && paymentData.amount > MAX_PAYMENT_AMOUNT && (
                        <p className="text-sm text-destructive">
                          Amount exceeds limit of ₹{MAX_PAYMENT_AMOUNT.toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={paymentData.currency}
                        onValueChange={(value) => setPaymentData({ ...paymentData, currency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR (₹)</SelectItem>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receiver">Receiver</Label>
                    <Input
                      id="receiver"
                      value={paymentData.receiver}
                      onChange={(e) => setPaymentData({ ...paymentData, receiver: e.target.value })}
                      placeholder="Enter receiver name or account details"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Input
                      id="description"
                      value={paymentData.description}
                      onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
                      placeholder="Payment description or reference"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isProcessing || (!isAdmin && paymentData.amount > MAX_PAYMENT_AMOUNT)}
                  >
                    {isProcessing ? "Processing..." : `Pay ${formatCurrency(paymentData.amount)}`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Payment Info Sidebar */}
          <div className="space-y-6">
            {/* User Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Role</span>
                  <Badge variant={isAdmin ? "default" : "secondary"}>{user?.role?.toUpperCase()}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Payment Limit</span>
                  <span className="text-sm font-medium">
                    {isAdmin ? "Unlimited" : formatCurrency(MAX_PAYMENT_AMOUNT)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Approval Required</span>
                  <span className="text-sm font-medium">{isAdmin ? "No" : "Yes"}</span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Rules */}
            <Card className="border-orange-500/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-orange-500">
                  <AlertTriangle className="h-4 w-4" />
                  Payment Rules
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Security</p>
                    <p className="text-muted-foreground">All payments are processed securely via Razorpay</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Approval Process</p>
                    <p className="text-muted-foreground">
                      {isAdmin
                        ? "Admin payments are processed immediately"
                        : "Regular user payments require admin approval"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <CreditCard className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Payment Limits</p>
                    <p className="text-muted-foreground">
                      {isAdmin
                        ? "No payment limits for admin users"
                        : `Maximum ₹${MAX_PAYMENT_AMOUNT.toLocaleString()} per transaction`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Test Mode Notice */}
            <Card className="border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-blue-500">
                  <CheckCircle className="h-4 w-4" />
                  Test Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="text-muted-foreground">
                  This is a demo environment. All payments are processed in test mode and no real money will be charged.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
