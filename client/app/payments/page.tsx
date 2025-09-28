"use client"

import type React from "react"

import { useState, useEffect } from "react"
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

interface Transaction {
  id: string
  amount: number
  currency: string
  receiver: string
  description: string
  status: string
  razorpay_payment_id?: string
  razorpay_order_id?: string
  created_at: Date
  signature_verified?: boolean
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function PaymentsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentData, setPaymentData] = useState<PaymentData>({
    amount: 0,
    receiver: "",
    description: "",
    currency: "INR",
  })

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  // Fetch transaction history
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/payments/transactions?userId=${user.id}`)
        if (response.ok) {
          const data = await response.json()
          setTransactions(data.transactions || [])
        }
      } catch (error) {
        console.error('Error fetching transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [user])

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

      if (!user) {
        throw new Error("Please login to make payments")
      }

      // Check payment limits for non-admin users
      if (!isAdmin && paymentData.amount > MAX_PAYMENT_AMOUNT) {
        throw new Error(`Payment amount cannot exceed ₹${MAX_PAYMENT_AMOUNT.toLocaleString()} for regular users`)
      }

      // Create Razorpay order
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: paymentData.amount,
          currency: paymentData.currency,
          receipt: `rcpt_${Date.now()}`,
          notes: {
            receiver: paymentData.receiver,
            description: paymentData.description,
            userId: user.id,
          },
        }),
      })

      if (!orderResponse.ok) {
        const error = await orderResponse.json()
        throw new Error(error.error || 'Failed to create payment order')
      }

      const orderData = await orderResponse.json()
      console.log('Order created:', orderData)

      // Razorpay checkout options
      const options = {
        key: orderData.key_id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "Kryos Demo",
        description: paymentData.description || "Payment via Kryos",
        order_id: orderData.order.id,
        handler: async (response: any) => {
          try {
            // Verify payment on server
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_details: paymentData,
                user_id: user.id,
              }),
            })

            const verifyData = await verifyResponse.json()
            
            if (verifyData.success && verifyData.verified) {
              toast({
                title: "Payment Successful",
                description: `Payment completed successfully! Transaction ID: ${verifyData.transaction_id}`,
              })

              // Reset form and refresh transactions
              setPaymentData({
                amount: 0,
                receiver: "",
                description: "",
                currency: "INR",
              })

              // Refresh transaction history
              const transactionsResponse = await fetch(`/api/payments/transactions?userId=${user.id}`)
              if (transactionsResponse.ok) {
                const transactionsData = await transactionsResponse.json()
                setTransactions(transactionsData.transactions || [])
              }
              
            } else {
              throw new Error('Payment verification failed')
            }
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError)
            toast({
              title: "Payment Verification Failed",
              description: "Payment may have been processed but verification failed. Please contact support.",
              variant: "destructive",
            })
          }
        },
        prefill: {
          name: user.name || '',
          email: user.email || '',
        },
        theme: {
          color: "#8B5CF6",
        },
        error: async (response: any) => {
          // Handle payment errors
          console.error('Payment error:', response)
          
          try {
            await fetch('/api/payments/failed', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: orderData.order.id,
                order_details: paymentData,
                user_id: user.id,
                failure_reason: response.error?.description || 'Payment failed',
              }),
            })

            // Refresh transaction history
            const transactionsResponse = await fetch(`/api/payments/transactions?userId=${user.id}`)
            if (transactionsResponse.ok) {
              const transactionsData = await transactionsResponse.json()
              setTransactions(transactionsData.transactions || [])
            }
          } catch (error) {
            console.error('Error recording failed payment:', error)
          }

          toast({
            title: "Payment Failed",
            description: response.error?.description || "Payment could not be processed",
            variant: "destructive",
          })
          setIsProcessing(false)
        },
        modal: {
          ondismiss: async () => {
            // Record failed transaction when user closes modal
            try {
              await fetch('/api/payments/failed', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  razorpay_order_id: orderData.order.id,
                  order_details: paymentData,
                  user_id: user.id,
                  failure_reason: 'Payment cancelled by user',
                }),
              })

              // Refresh transaction history
              const transactionsResponse = await fetch(`/api/payments/transactions?userId=${user.id}`)
              if (transactionsResponse.ok) {
                const transactionsData = await transactionsResponse.json()
                setTransactions(transactionsData.transactions || [])
              }
            } catch (error) {
              console.error('Error recording failed payment:', error)
            }
            setIsProcessing(false)
          }
        }
      }

      // Open Razorpay checkout
      if (window.Razorpay) {
        const rzp = new window.Razorpay(options)
        rzp.open()
      } else {
        throw new Error('Razorpay SDK not loaded')
      }

    } catch (error) {
      console.error('Payment error:', error)
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

        {/* Transaction History */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Transaction History
            </CardTitle>
            <CardDescription>
              View your recent payment transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                      <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                    </div>
                    <div className="h-6 bg-muted animate-pulse rounded w-20" />
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No transactions yet</p>
                <p className="text-sm text-muted-foreground">Your payment history will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{transaction.receiver}</p>
                        <Badge 
                          variant={
                            transaction.status === 'completed' ? 'default' :
                            transaction.status === 'failed' ? 'destructive' : 'secondary'
                          }
                        >
                          {transaction.status}
                        </Badge>
                        {transaction.signature_verified && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {transaction.description || 'No description'}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          {new Date(transaction.created_at).toLocaleDateString()} {new Date(transaction.created_at).toLocaleTimeString()}
                        </span>
                        {transaction.razorpay_payment_id && (
                          <span>ID: {transaction.razorpay_payment_id}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.currency}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
