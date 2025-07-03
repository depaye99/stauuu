
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react"

export default function AuthDebugPage() {
  const [loading, setLoading] = useState(false)
  const [testEmail, setTestEmail] = useState("test@example.com")
  const [testPassword, setTestPassword] = useState("password123")
  const [results, setResults] = useState<any[]>([])
  const [authSettings, setAuthSettings] = useState<any>(null)
  
  const supabase = createClient()

  const addResult = (type: "success" | "error" | "info", message: string, details?: any) => {
    setResults(prev => [...prev, {
      type,
      message,
      details,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  const testPublicRegistration = async () => {
    try {
      addResult("info", "Test d'enregistrement public...")
      
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: `test-${Date.now()}@example.com`,
          password: testPassword,
          name: "Test User",
          role: "stagiaire"
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        addResult("success", "Enregistrement public réussi", result)
      } else {
        addResult("error", "Échec enregistrement public", result)
      }
    } catch (error) {
      addResult("error", "Erreur enregistrement public", error)
    }
  }

  const testAdminRegistration = async () => {
    try {
      addResult("info", "Test d'enregistrement admin...")
      
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: `admin-test-${Date.now()}@example.com`,
          password: testPassword,
          name: "Admin Test User",
          role: "stagiaire"
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        addResult("success", "Enregistrement admin réussi", result)
      } else {
        addResult("error", "Échec enregistrement admin", result)
      }
    } catch (error) {
      addResult("error", "Erreur enregistrement admin", error)
    }
  }

  const testDirectSupabaseAuth = async () => {
    try {
      addResult("info", "Test direct Supabase auth...")
      
      const { data, error } = await supabase.auth.signUp({
        email: `direct-${Date.now()}@example.com`,
        password: testPassword,
        options: {
          data: {
            name: "Direct Test User",
            role: "stagiaire"
          }
        }
      })

      if (error) {
        addResult("error", "Échec auth direct Supabase", error)
      } else {
        addResult("success", "Auth direct Supabase réussi", data)
      }
    } catch (error) {
      addResult("error", "Erreur auth direct", error)
    }
  }

  const checkAuthSettings = async () => {
    try {
      addResult("info", "Vérification des paramètres auth...")
      
      // Essayer de récupérer les paramètres via l'API
      const response = await fetch("/api/debug/auth-settings")
      if (response.ok) {
        const settings = await response.json()
        setAuthSettings(settings)
        addResult("info", "Paramètres auth récupérés", settings)
      } else {
        addResult("error", "Impossible de récupérer les paramètres auth")
      }
    } catch (error) {
      addResult("error", "Erreur vérification paramètres", error)
    }
  }

  const runAllTests = async () => {
    setLoading(true)
    setResults([])
    
    await checkAuthSettings()
    await testDirectSupabaseAuth()
    await testPublicRegistration()
    await testAdminRegistration()
    
    setLoading(false)
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Debug Authentification</h1>
        <p className="text-gray-600">Diagnostic des problèmes d'enregistrement</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contrôles de test */}
        <Card>
          <CardHeader>
            <CardTitle>Tests d'authentification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="test-email">Email de test</Label>
              <Input
                id="test-email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="test-password">Mot de passe de test</Label>
              <Input
                id="test-password"
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                placeholder="password123"
              />
            </div>

            <div className="space-y-2">
              <Button onClick={runAllTests} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Tests en cours...
                  </>
                ) : (
                  "Lancer tous les tests"
                )}
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={testPublicRegistration} disabled={loading}>
                  Test Public
                </Button>
                <Button variant="outline" onClick={testAdminRegistration} disabled={loading}>
                  Test Admin
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Paramètres auth */}
        <Card>
          <CardHeader>
            <CardTitle>Paramètres d'authentification</CardTitle>
          </CardHeader>
          <CardContent>
            {authSettings ? (
              <pre className="text-sm bg-gray-100 p-4 rounded overflow-x-auto">
                {JSON.stringify(authSettings, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500">Aucun paramètre récupéré</p>
            )}
          </CardContent>
        </Card>

        {/* Résultats */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Résultats des tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-gray-500">Aucun test lancé</p>
              ) : (
                results.map((result, index) => (
                  <Alert key={index} className={
                    result.type === "success" ? "border-green-500 bg-green-50" :
                    result.type === "error" ? "border-red-500 bg-red-50" :
                    "border-blue-500 bg-blue-50"
                  }>
                    <div className="flex items-start gap-2">
                      {result.type === "success" && <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />}
                      {result.type === "error" && <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />}
                      {result.type === "info" && <Loader2 className="h-4 w-4 text-blue-600 mt-0.5" />}
                      
                      <div className="flex-1">
                        <AlertDescription>
                          <div className="flex justify-between items-start">
                            <span>{result.message}</span>
                            <span className="text-xs text-gray-500">{result.timestamp}</span>
                          </div>
                          {result.details && (
                            <details className="mt-2">
                              <summary className="text-xs cursor-pointer">Détails</summary>
                              <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                                {JSON.stringify(result.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </AlertDescription>
                      </div>
                    </div>
                  </Alert>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
