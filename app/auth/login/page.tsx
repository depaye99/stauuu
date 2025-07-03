"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { authService } from "@/lib/services/auth-service"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { user, error: authError } = await authService.signIn(email, password)

      if (authError) {
        setError(authError.message)
        return
      }

      if (user) {
        // Use router.push instead of window.location.href to avoid reload
        const routes = {
          admin: "/admin",
          rh: "/rh",
          tuteur: "/tuteur",
          stagiaire: "/stagiaire",
        }

        const redirectTo = routes[user.role as keyof typeof routes] || "/stagiaire"

        // Force a small delay to ensure auth state is set
        setTimeout(() => {
          router.push(redirectTo)
        }, 100)
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Erreur de connexion")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen h-screen flex flex-col">
      {/* Header */}
      <Header showAuth={true} />

      {/* Main Content */}
      <div className="flex-1 flex min-h-screen h-screen w-full">
        {/* Left Side - Image */}
        <div className="hidden lg:flex lg:w-1/2 relative">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{
              backgroundImage: `url('/images/hero-laptop.png')`,
            }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 bg-gray-100 flex items-center justify-center p-8 dark:bg-gray-900">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2 dark:text-white">Connexion à votre compte</h1>
              <h2 className="text-xl font-medium text-gray-700 dark:text-white">Bridge</h2>
            </div>

            <form onSubmit={handleLogin} className="space-y-6 ">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="email" className="text-gray-700 font-medium dark:text-white">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 bg-white border-gray-300 dark:text-black"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-gray-700 font-medium dark:text-white">
                  Mot de passe
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 bg-white border-gray-300 dark:text-black"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-black hover:bg-gray-800 text-white py-3 rounded-md font-medium"
                disabled={loading}
              >
                {loading ? "Connexion..." : "Se connecter"}
              </Button>

              <div className="text-center">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">ou</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-gray-600">
                  Vous n'avez pas de compte?{" "}
                  <Link href="/auth/register" className="text-blue-600 hover:text-blue-500 font-medium">
                    S'inscrire
                  </Link>
                </p>
              </div>

              <div className="text-xs text-gray-500 text-center leading-relaxed">
                En vous connectant vous acceptez nos{" "}
                <Link href="/privacy" className="underline hover:text-gray-700">
                  politiques de confidentialité
                </Link>{" "}
                et nos{" "}
                <Link href="/terms" className="underline hover:text-gray-700">
                  conditions d'utilisation
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer /> 
    </div>
  )
}
