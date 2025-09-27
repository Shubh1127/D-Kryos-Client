"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import {
  Users,
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Shield,
  AlertTriangle,
  Activity,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Transaction {
  id: string
  amount: number
  receiver: string
  description: string
  currency: string
  status: "pending" | "approved" | "rejected"
  timestamp: string
  userId: string
  razorpayPaymentId?: string
  needsApproval: boolean
}

interface User {
  id: string
  email: string
  name: string
  role: string
  lastProfileUpdate?: string
}

export default function AdminPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [users, setUsers] = useState<User[]>([])

  const isAdmin = user?.role === "admin"

  useEffect(() => {
    if (!isAdmin) {
      router.push("/dashboard")
      return
    }

    // Load data from localStorage
    const savedTransactions = JSON.parse(localStorage.getItem("kryos_transactions") || "[]")
    const savedUsers = JSON.parse(localStorage.getItem("kryos_users") || "[]")

    setTransactions(savedTransactions)
    setUsers(savedUsers)
  }, [isAdmin, router])

  const handleBulkApprove = () => {
    const pendingTransactions = transactions.filter((t) => t.status === "pending")

    if (pendingTransactions.length === 0) {
      toast({
        title: "No Pending Transactions",
        description: "There are no pending transactions to approve.",
      })
      return
    }

    const updatedTransactions = transactions.map((t) =>
      t.status === "pending" ? { ...t, status: "approved" as const } : t,
    )

    setTransactions(updatedTransactions)
    localStorage.setItem("kryos_transactions", JSON.stringify(updatedTransactions))

    toast({
      title: "Bulk Approval Complete",
      description: `${pendingTransactions.length} transactions have been approved.`,
    })
  }

  const handleTransactionAction = (transactionId: string, action: "approved" | "rejected") => {
    const updatedTransactions = transactions.map((t) => (t.id === transactionId ? { ...t, status: action } : t))

    setTransactions(updatedTransactions)
    localStorage.setItem("kryos_transactions", JSON.stringify(updatedTransactions))

    toast({
      title: `Transaction ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      description: `The transaction has been ${action}.`,
      variant: action === "rejected" ? "destructive" : "default",
    })
  }

  const formatCurrency = (amount: number, currency = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!isAdmin) {
    return null
  }

  const stats = {
    totalTransactions: transactions.length,
    pendingTransactions: transactions.filter((t) => t.status === "pending").length,
    approvedTransactions: transactions.filter((t) => t.status === "approved").length,
    rejectedTransactions: transactions.filter((t) => t.status === "rejected").length,
    totalUsers: users.length,
    totalValue: transactions.filter((t) => t.status === "approved").reduce((sum, t) => sum + t.amount, 0),
    avgTransactionValue:
      transactions.length > 0 ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length : 0,
  }

  const pendingTransactions = transactions.filter((t) => t.status === "pending")
  const recentTransactions = transactions
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8 text-accent" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">Manage users, transactions, and system operations</p>
          </div>
          <Badge className="bg-accent/10 text-accent border-accent/20">Admin Access</Badge>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Approvals</p>
                  <p className="text-2xl font-bold text-orange-500">{stats.pendingTransactions}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{stats.totalTransactions}</p>
                </div>
                <CreditCard className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Admin Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending ({stats.pendingTransactions})
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              All Transactions
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Pending Transactions Tab */}
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      Pending Approvals
                    </CardTitle>
                    <CardDescription>{pendingTransactions.length} transactions awaiting approval</CardDescription>
                  </div>
                  {pendingTransactions.length > 0 && (
                    <Button onClick={handleBulkApprove} className="bg-green-600 hover:bg-green-700">
                      Approve All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingTransactions.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <p className="text-muted-foreground">No pending transactions</p>
                    </div>
                  ) : (
                    pendingTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border border-orange-500/20 rounded-lg bg-orange-500/5"
                      >
                        <div className="flex items-center gap-4">
                          <Clock className="h-5 w-5 text-orange-500" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{formatCurrency(transaction.amount, transaction.currency)}</p>
                              <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">Pending</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">To: {transaction.receiver}</p>
                            {transaction.description && (
                              <p className="text-sm text-muted-foreground">{transaction.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {formatDate(transaction.timestamp)} • ID: {transaction.id}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleTransactionAction(transaction.id, "approved")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleTransactionAction(transaction.id, "rejected")}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* All Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Transactions</CardTitle>
                <CardDescription>Complete transaction history across all users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.length === 0 ? (
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No transactions found</p>
                    </div>
                  ) : (
                    recentTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/5"
                      >
                        <div className="flex items-center gap-4">
                          {transaction.status === "approved" && <CheckCircle className="h-5 w-5 text-green-500" />}
                          {transaction.status === "rejected" && <XCircle className="h-5 w-5 text-red-500" />}
                          {transaction.status === "pending" && <Clock className="h-5 w-5 text-orange-500" />}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{formatCurrency(transaction.amount, transaction.currency)}</p>
                              <Badge
                                className={
                                  transaction.status === "approved"
                                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                                    : transaction.status === "rejected"
                                      ? "bg-red-500/10 text-red-500 border-red-500/20"
                                      : "bg-orange-500/10 text-orange-500 border-orange-500/20"
                                }
                              >
                                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">To: {transaction.receiver}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(transaction.timestamp)} • User: {transaction.userId}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No users found</p>
                    </div>
                  ) : (
                    users.map((userData) => (
                      <div
                        key={userData.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/5"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                            <span className="text-accent font-medium">{userData.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="font-medium">{userData.name}</p>
                            <p className="text-sm text-muted-foreground">{userData.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={userData.role === "admin" ? "default" : "secondary"}>
                                {userData.role.toUpperCase()}
                              </Badge>
                              {userData.lastProfileUpdate && (
                                <span className="text-xs text-muted-foreground">
                                  Updated: {new Date(userData.lastProfileUpdate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Analytics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Average Transaction</span>
                    <span className="font-medium">{formatCurrency(stats.avgTransactionValue)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Approval Rate</span>
                    <span className="font-medium">
                      {stats.totalTransactions > 0
                        ? Math.round((stats.approvedTransactions / stats.totalTransactions) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Rejection Rate</span>
                    <span className="font-medium">
                      {stats.totalTransactions > 0
                        ? Math.round((stats.rejectedTransactions / stats.totalTransactions) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">API Status</span>
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Operational</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Payment Gateway</span>
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Connected</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Database</span>
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Healthy</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
