"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { FileText, Calendar, UserPlus, ClipboardList } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function RHDashboard() {
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

      if (!profile || profile.role !== "rh") {
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
      console.log("📊 Chargement des statistiques RH...")

      const [stagiairesResponse, demandesResponse, statsResponse] = await Promise.all([
        fetch("/api/rh/stagiaires"),
        fetch("/api/rh/demandes"),
        fetch("/api/statistics/dashboard")
      ])

      if (stagiairesResponse.ok) {
        const stagiairesData = await stagiairesResponse.json()
        setStagiaires(stagiairesData.data || [])
      }

      if (demandesResponse.ok) {
        const demandesData = await demandesResponse.json()
        setDemandes(demandesData.data || [])
      }

      // Charger les statistiques générales si les API spécifiques échouent
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        if (statsData.success) {
          if (!stagiaires.length) {
            setStagiaires(Array(statsData.data.stagiaires.total).fill(null).map((_, i) => ({ 
              id: i, 
              statut: i < statsData.data.stagiaires.actif ? 'actif' : 'termine' 
            })))
          }
          if (!demandes.length) {
            setDemandes(Array(statsData.data.demandes.total).fill(null).map((_, i) => ({ 
              id: i, 
              statut: i < statsData.data.demandes.en_attente ? 'en_attente' : 'approuvee' 
            })))
          }
        }
      }

      console.log("✅ Statistiques RH chargées")
    } catch (error) {
      console.error("❌ Erreur lors du chargement des statistiques RH:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive",
      })
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
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord RH</h1>
          <p className="text-gray-600">Bienvenue, {user?.name}</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stagiaires</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.stagiaires_total || 0}</div>
              <p className="text-xs text-muted-foreground">Stagiaires actifs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Demandes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.demandes_total || 0}</div>
              <p className="text-xs text-muted-foreground">Total des demandes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.demandes_en_attente || 0}</div>
              <p className="text-xs text-muted-foreground">Demandes en attente</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des stagiaires</CardTitle>
              <CardDescription>Superviser les stagiaires et leurs stages</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/rh/stagiaires")}>
                <UserPlus className="mr-2 h-4 w-4" />
                Gérer les stagiaires
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Demandes</CardTitle>
              <CardDescription>Traiter les demandes des stagiaires</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/rh/demandes")}>
                <FileText className="mr-2 h-4 w-4" />
                Voir les demandes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Évaluations</CardTitle>
              <CardDescription>Consulter les évaluations des stagiaires</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/rh/evaluations")}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Voir les évaluations
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
