"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { FileText, Users, TrendingUp, Settings, Calendar, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { authService } from "@/lib/services/auth-service"

interface User {
  id: string
  email: string
  name: string
  role: string
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser()

        if (currentUser) {
          setUser(currentUser)
          // Redirect authenticated users to their dashboard
          const routes = {
            admin: "/admin",
            rh: "/rh",
            tuteur: "/tuteur",
            stagiaire: "/stagiaire",
          }
          const redirectTo = routes[currentUser.role as keyof typeof routes] || "/stagiaire"
          router.push(redirectTo)
          return
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'utilisateur:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkUser()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <Header/>

      {/* Hero Section */}
      <section className="bg-gray-200 py-16 relative min-h-[500px] text-[rgba(135,135,134,1)] dark:bg-gray-800">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center h-full">
            {/* Left Content */}
            <div className="text-left space-y-6">
              <h1 className="text-3xl lg:text-4xl font-bold leading-tight text-black dark:text-white">
                Bienvenue sur
                <br />
                Bridge Technologies Solutions
              </h1>
              <p className="text-base lg:text-lg leading-relaxed max-w-md text-black dark:text-white">
                Explorez et soumettez vos demandes de stage en toute simplicité grâce à notre plateforme intuitive.
              </p>
            </div>

            {/* Right Content - Image */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative">
                <img
                  src="/images/hero-laptop.png"
                  alt="Professional workspace"
                  className="dark:hidden w-full max-w-sm lg:max-w-md rounded-lg shadow-lg"
                />

                  <img
                  src="https://cdn.pixabay.com/photo/2015/01/08/18/11/laptops-593296_1280.jpg"
                  alt="Professional"
                  className="w-full px-8 py-12 max-w-sm lg:max-w-md rounded-lg shadow-lg  hidden dark:block"
                />
                
                {/* Blue Circle */}
               
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-200 py-12 dark:bg-gray-800 text-gray-700 dark:text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl lg:text-2xl font-bold mb-3 text-black dark:text-white">
            Commencer dès maintenant et suivez en temps réel
          </h2>
          <p className="mb-8 text-sm lg:text-base text-black dark:text-white">
            Déposez votre candidature en un clic et suivez son avancé en temps réel
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link href="/auth/register">
              <Button size="lg" className="bg-black hover:bg-gray-900 text-white px-6 py-2 text-sm font-medium rounded">
                Commencer →
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button
                variant="outline"
                size="lg"
                className="bg-white text-black hover:bg-gray-100 hover:text-black  border-white px-6 py-2 text-sm font-medium rounded"
              >
                J'ai déjà un compte
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer/>      
    </div>
  )
}
