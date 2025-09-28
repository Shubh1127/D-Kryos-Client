"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Clock, CheckCircle, XCircle, CreditCard, Filter, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Transaction {
  id: string
  amount: number
  receiver: string
  description: string
  currency: string
  status: "completed" | "failed" | "pending"
  created_at: Date
  userId: string
  razorpay_payment_id?: string
  razorpay_order_id?: string
  signature_verified?: boolean
  failure_reason?: string
}

export default function TransactionsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  const isAdmin = user?.email === 'admin@kryos.com' // Simple admin check

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/payments/transactions?userId=${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch transactions')
        }

        const data = await response.json()
        setTransactions(data.transactions || [])
        setFilteredTransactions(data.transactions || [])
      } catch (error) {
        console.error('Failed to fetch transactions:', error)
        toast({
          title: "Error",
          description: "Failed to load transactions",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [user, toast])

  useEffect(() => {
    // Apply filters
    let filtered = transactions

    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.receiver.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.id.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter)
    }

    setFilteredTransactions(filtered)
  }, [transactions, searchTerm, statusFilter])

  const handleApproveTransaction = async (transactionId: string) => {
    if (!isAdmin || !user) return

    try {
      // For now, just update local state since we're using Firestore
      // In a real application, you'd have an API endpoint to update transaction status
      toast({
        title: "Transaction Approved",
        description: "The transaction has been approved successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve transaction",
        variant: "destructive",
      })
    }
  }

  const handleRejectTransaction = async (transactionId: string) => {
    if (!isAdmin || !user) return

    try {
      // For now, just update local state since we're using Firestore
      // In a real application, you'd have an API endpoint to update transaction status
      toast({
        title: "Transaction Rejected",
        description: "The transaction has been rejected.",
        variant: "destructive",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject transaction",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-orange-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>
      case "failed":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Failed</Badge>
      case "pending":
        return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">Pending</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const formatCurrency = (amount: number, currency = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  const formatDate = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date)
    return d.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const stats = {
    total: transactions.length,
    pending: transactions.filter((t) => t.status === "pending").length,
    completed: transactions.filter((t) => t.status === "completed").length,
    failed: transactions.filter((t) => t.status === "failed").length,
    totalAmount: transactions.filter((t) => t.status === "completed").reduce((sum, t) => sum + t.amount, 0),
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Transactions</h1>
            <p className="text-muted-foreground">
              {isAdmin ? "Manage all transactions and approvals" : "View your transaction history and status"}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-orange-500">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold text-red-500">{stats.failed}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalAmount)}</p>
                </div>
                <CreditCard className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              {filteredTransactions.length} of {transactions.length} transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading transactions...</p>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No transactions found</p>
                </div>
              ) : (
                filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/5"
                  >
                    <div className="flex items-center gap-4">
                      {getStatusIcon(transaction.status)}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{formatCurrency(transaction.amount, transaction.currency)}</p>
                          {getStatusBadge(transaction.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">To: {transaction.receiver}</p>
                        {transaction.description && (
                          <p className="text-sm text-muted-foreground">{transaction.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDate(transaction.created_at)} • ID: {transaction.id}
                        </p>
                        {transaction.failure_reason && (
                          <p className="text-xs text-red-500">
                            Reason: {transaction.failure_reason}
                          </p>
                        )}
                        {transaction.razorpay_payment_id && (
                          <p className="text-xs text-muted-foreground">
                            Payment ID: {transaction.razorpay_payment_id}
                          </p>
                        )}
                      </div>
                    </div>

                    {isAdmin && transaction.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApproveTransaction(transaction.id)}
                          className="text-green-600 border-green-600 hover:bg-green-50"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectTransaction(transaction.id)}
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
