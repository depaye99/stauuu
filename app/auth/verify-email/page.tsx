"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react"

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get("token")
    if (token) {
      verifyEmail(token)
    } else {
      setError("Token de vérification manquant")
      setLoading(false)
    }
  }, [searchParams])

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la vérification")
      }

      setSuccess(true)
    } catch (error: any) {
      console.error("Erreur:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const resendVerification = async () => {
    setResending(true)
    try {
      const email = searchParams.get("email")
      if (!email) {
        throw new Error("Email manquant")
      }

      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, resend: true }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du renvoi")
      }

      // Notification de succès
    } catch (error: any) {
      console.error("Erreur:", error)
      setError(error.message)
    } finally {
      setResending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Loader2 className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <CardTitle>Vérification en cours...</CardTitle>
            <CardDescription>
              Nous vérifions votre adresse email
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <CardTitle>Email vérifié</CardTitle>
            <CardDescription>
              Votre adresse email a été vérifiée avec succès
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => router.push("/auth/login")}
            >
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <CardTitle>Erreur de vérification</CardTitle>
          <CardDescription>
            Une erreur s'est produite lors de la vérification
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <Button 
              className="w-full" 
              variant="outline"
              onClick={resendVerification}
              disabled={resending}
            >
              {resending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Renvoi...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Renvoyer l'email
                </>
              )}
            </Button>
            
            <Button 
              className="w-full" 
              onClick={() => router.push("/auth/login")}
            >
              Retour à la connexion
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
