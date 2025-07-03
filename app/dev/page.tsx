"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  Database,
  Mail,
  Settings,
  RefreshCw,
  Plus,
  Eye,
  XCircle,
} from "lucide-react"

export default function DevPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [databaseStatus, setDatabaseStatus] = useState<any>(null)
  const [error, setError] = useState("")
  const [emailToConfirm, setEmailToConfirm] = useState("")
  const [unconfirmedUsers, setUnconfirmedUsers] = useState<any[]>([])
  const [confirmResults, setConfirmResults] = useState<any>(null)

  const loadDatabaseStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/dev/database-test")
      const data = await response.json()
      setDatabaseStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load database status")
    } finally {
      setIsLoading(false)
    }
  }

  const createSampleData = async () => {
    setIsLoading(true)
    setError("")
    try {
      const response = await fetch("/api/dev/database-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_sample_data" }),
      })

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error)
      }

      alert("Sample data created successfully!")
      await loadDatabaseStatus()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create sample data")
    } finally {
      setIsLoading(false)
    }
  }

  const loadUnconfirmedUsers = async () => {
    try {
      const response = await fetch("/api/dev/confirm-email")
      const data = await response.json()
      if (data.success) {
        setUnconfirmedUsers(data.unconfirmed_users || [])
      }
    } catch (err) {
      console.error("Failed to load unconfirmed users:", err)
    }
  }

  const confirmUserEmail = async (email: string) => {
    setIsLoading(true)
    setError("")
    setConfirmResults(null)

    try {
      const response = await fetch("/api/dev/confirm-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to confirm email")
      }

      setConfirmResults(data)
      await loadUnconfirmedUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDatabaseStatus()
    loadUnconfirmedUsers()
  }, [])

  if (process.env.NODE_ENV !== "development") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p>This page is only available in development mode.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Development Dashboard</h1>
          <p className="text-gray-600 mt-2">Complete diagnostic and setup tools</p>
        </div>

        <Tabs defaultValue="database" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="setup">Setup</TabsTrigger>
          </TabsList>

          <TabsContent value="database" className="space-y-6">
            {/* Database Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Status
                  <Button onClick={loadDatabaseStatus} disabled={isLoading} size="sm" variant="outline">
                    <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                  </Button>
                </CardTitle>
                <CardDescription>Check database connection, tables, and data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {databaseStatus && (
                  <>
                    {/* Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {databaseStatus.summary?.existing_tables || 0}
                        </div>
                        <div className="text-sm text-blue-800">Tables Created</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {databaseStatus.summary?.total_records || 0}
                        </div>
                        <div className="text-sm text-green-800">Total Records</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {databaseStatus.insert_test?.success ? "✓" : "✗"}
                        </div>
                        <div className="text-sm text-purple-800">Insert Test</div>
                      </div>
                    </div>

                    {/* Tables Status */}
                    <div>
                      <h4 className="font-medium mb-3">Tables Status</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(databaseStatus.tables || {}).map(([table, status]: [string, any]) => (
                          <div key={table} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              {status.exists ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className="font-medium">{table}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={status.exists ? "default" : "destructive"}>
                                {status.count || 0} records
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button onClick={createSampleData} disabled={isLoading}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Sample Data
                      </Button>
                      <Button onClick={() => window.open("https://supabase.com/dashboard", "_blank")} variant="outline">
                        <Eye className="mr-2 h-4 w-4" />
                        Open Supabase Dashboard
                      </Button>
                    </div>
                  </>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            {/* Email Confirmation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Confirmation Management
                </CardTitle>
                <CardDescription>Manage email confirmations for development</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Configuration Instructions */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Recommended: Disable Email Confirmation</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    For development, disable email confirmation in Supabase Dashboard → Auth → Settings
                  </p>
                  <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
                    <li>Go to Supabase Dashboard</li>
                    <li>Navigate to Authentication → Settings</li>
                    <li>Disable "Enable email confirmations"</li>
                    <li>Set Site URL to: http://localhost:3000</li>
                    <li>Add Redirect URL: http://localhost:3000/**</li>
                  </ol>
                </div>

                <Separator />

                {/* Manual Confirmation */}
                <div>
                  <h4 className="font-medium mb-3">Manual Email Confirmation</h4>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={emailToConfirm}
                      onChange={(e) => setEmailToConfirm(e.target.value)}
                      placeholder="user@example.com"
                    />
                    <Button onClick={() => confirmUserEmail(emailToConfirm)} disabled={isLoading || !emailToConfirm}>
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
                    </Button>
                  </div>
                </div>

                {/* Unconfirmed Users */}
                {unconfirmedUsers.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Unconfirmed Users ({unconfirmedUsers.length})</h4>
                    <div className="space-y-2">
                      {unconfirmedUsers.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{user.email}</p>
                            <p className="text-sm text-gray-500">
                              Created: {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            onClick={() => confirmUserEmail(user.email)}
                            disabled={isLoading}
                            size="sm"
                            variant="outline"
                          >
                            Confirm
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {confirmResults && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{confirmResults.message}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="setup" className="space-y-6">
            {/* Setup Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Complete Setup Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Execute Database Script</p>
                      <p className="text-sm text-gray-600">
                        Run the SQL script in Supabase SQL Editor to create all tables with test data
                      </p>
                      <Button size="sm" variant="outline" className="mt-2">
                        Copy SQL Script
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Configure Authentication</p>
                      <p className="text-sm text-gray-600">Disable email confirmation in Supabase Dashboard</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Test Database Connection</p>
                      <p className="text-sm text-gray-600">Use the Database tab to verify everything works</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
                      4
                    </div>
                    <div>
                      <p className="font-medium">Create Your Account</p>
                      <p className="text-sm text-gray-600">Register via /auth/register</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => window.open("/auth/register", "_blank")}
                      >
                        Open Registration
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
                      5
                    </div>
                    <div>
                      <p className="font-medium">Login and Test</p>
                      <p className="text-sm text-gray-600">Login with your account and test all features</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => window.open("/auth/login", "_blank")}
                      >
                        Open Login
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
