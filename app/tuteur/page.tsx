"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { Users, FileText, ClipboardList, Calendar } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function TuteurDashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase.from("users").select("*").eq("id", session.user.id).single()

      if (!profile || profile.role !== "tuteur") {
        router.push("/auth/login")
        return
      }

      setUser(profile)
      await loadStats()
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadStats = async () => {
    try {
      const [mesStagiairesCount, demandesCount, evaluationsCount] = await Promise.all([
        supabase.from("stagiaires").select("id", { count: "exact", head: true }).eq("tuteur_id", user?.id),
        supabase.from("demandes").select("id", { count: "exact", head: true }).eq("tuteur_id", user?.id),
        supabase.from("evaluations").select("id", { count: "exact", head: true }).eq("evaluateur_id", user?.id),
      ])

      setStats({
        mes_stagiaires: mesStagiairesCount.count || 0,
        demandes_total: demandesCount.count || 0,
        evaluations_total: evaluationsCount.count || 0,
      })
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord Tuteur</h1>
          <p className="text-gray-600">Bienvenue, {user?.name}</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="transition-all duration-300 hover:scale-[1.03] hover:shadow-xl animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mes stagiaires</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.mes_stagiaires || 0}</div>
              <p className="text-xs text-muted-foreground">Stagiaires sous ma supervision</p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:scale-[1.03] hover:shadow-xl animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Demandes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.demandes_total || 0}</div>
              <p className="text-xs text-muted-foreground">Demandes à traiter</p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:scale-[1.03] hover:shadow-xl animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Évaluations</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.evaluations_total || 0}</div>
              <p className="text-xs text-muted-foreground">Évaluations réalisées</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="transition-all duration-300 hover:scale-[1.03] hover:shadow-xl animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle>Mes stagiaires</CardTitle>
              <CardDescription>Gérer et suivre mes stagiaires</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/tuteur/stagiaires")}>
                <Users className="mr-2 h-4 w-4" />
                Voir mes stagiaires
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:scale-[1.03] hover:shadow-xl animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle>Demandes</CardTitle>
              <CardDescription>Traiter les demandes de mes stagiaires</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/tuteur/demandes")}>
                <FileText className="mr-2 h-4 w-4" />
                Voir les demandes
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:scale-[1.03] hover:shadow-xl animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle>Évaluations</CardTitle>
              <CardDescription>Évaluer les performances des stagiaires</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/tuteur/evaluations")}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Gérer les évaluations
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:scale-[1.03] hover:shadow-xl animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle>Planning</CardTitle>
              <CardDescription>Consulter le planning des stages</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/tuteur/planning")}>
                <Calendar className="mr-2 h-4 w-4" />
                Voir le planning
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
