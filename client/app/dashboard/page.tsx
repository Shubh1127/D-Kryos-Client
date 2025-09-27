"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { Upload, CreditCard, FileText, User, Key, TrendingUp, Shield } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  const quickActions = [
    {
      title: "Upload Files",
      description: "Upload and manage your media files",
      icon: Upload,
      href: "/files",
      color: "text-blue-500",
    },
    {
      title: "Make Payment",
      description: "Process payments via Razorpay",
      icon: CreditCard,
      href: "/payments",
      color: "text-green-500",
    },
    {
      title: "View Transactions",
      description: "Check your transaction history",
      icon: FileText,
      href: "/transactions",
      color: "text-purple-500",
    },
    {
      title: "Update Profile",
      description: "Manage your account details",
      icon: User,
      href: "/profile",
      color: "text-orange-500",
    },
  ]

  if (isAdmin) {
    quickActions.push({
      title: "Admin Panel",
      description: "Manage users and approvals",
      icon: Shield,
      href: "/admin",
      color: "text-red-500",
    })
  }

  const stats = [
    {
      title: "Files Uploaded",
      value: "24",
      icon: Upload,
      change: "+12%",
    },
    {
      title: "Transactions",
      value: "8",
      icon: CreditCard,
      change: "+3%",
    },
    {
      title: "API Calls",
      value: "156",
      icon: Key,
      change: "+18%",
    },
    {
      title: "Success Rate",
      value: "98.5%",
      icon: TrendingUp,
      change: "+2.1%",
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-balance">
            Welcome back, {user?.name}!{isAdmin && <span className="ml-2 text-accent">(Admin)</span>}
          </h1>
          <p className="text-muted-foreground">Here's what's happening with your Kryos account today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">{stat.change}</span> from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Card key={action.title} className="hover:bg-accent/5 transition-colors">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                  </div>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <Link href={action.href}>Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Profile updated successfully</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">3 files uploaded to storage</p>
                  <p className="text-xs text-muted-foreground">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-2 w-2 rounded-full bg-purple-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Payment of ₹25,000 processed</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
              {isAdmin && (
                <div className="flex items-center space-x-4">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">5 transactions approved via admin panel</p>
                    <p className="text-xs text-muted-foreground">3 hours ago</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
