"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { Users, FileText, ClipboardList, Settings, UserPlus, FolderOpen } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("🔍 Vérification de l'authentification admin...")

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          console.log("❌ Pas de session")
          router.push("/auth/login")
          return
        }

        console.log("✅ Session trouvée:", session.user.email)

        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (profileError) {
          console.error("❌ Erreur récupération profil:", profileError)
          toast({
            title: "Erreur",
            description: "Impossible de récupérer le profil utilisateur",
            variant: "destructive",
          })
          router.push("/auth/login")
          return
        }

        if (!profile || profile.role !== "admin") {
          console.log("❌ Profil non admin:", profile?.role)
          toast({
            title: "Accès refusé",
            description: "Vous n'avez pas les permissions d'administrateur",
            variant: "destructive",
          })
          router.push("/")
          return
        }

        console.log("✅ Profil admin confirmé")
        setUser(profile)
        await loadStats()
        setLoading(false)
      } catch (error) {
        console.error("💥 Erreur auth check:", error)
        toast({
          title: "Erreur",
          description: "Erreur lors de la vérification de l'authentification",
          variant: "destructive",
        })
        router.push("/auth/login")
      }
    }

    checkAuth()
  }, [router, supabase, toast])

  const loadStats = async () => {
    try {
      console.log("📊 Chargement des statistiques...")

      const response = await fetch("/api/statistics/dashboard")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setStats(result.data)
        console.log("✅ Statistiques chargées:", result.data)
      } else {
        throw new Error(result.error || "Erreur lors du chargement des statistiques")
      }
    } catch (error) {
      console.error("❌ Erreur lors du chargement des statistiques:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header user={user} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tableau de bord Administrateur</h1>
          <p className="text-gray-600 dark:text-gray-400">Bienvenue, {user?.name}</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stagiaires</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.stagiaires?.total || 0}</div>
              <p className="text-xs text-muted-foreground">Total des stagiaires</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Demandes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.demandes?.total || 0}</div>
              <p className="text-xs text-muted-foreground">Demandes en cours</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.documents?.total || 0}</div>
              <p className="text-xs text-muted-foreground">Documents gérés</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.users?.total || 0}</div>
              <p className="text-xs text-muted-foreground">Utilisateurs enregistrés</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des utilisateurs</CardTitle>
              <CardDescription>Administrer les comptes utilisateurs</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/admin/users")}>
                <Users className="mr-2 h-4 w-4" />
                Gérer les utilisateurs
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gestion des stagiaires</CardTitle>
              <CardDescription>Superviser tous les stagiaires</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/admin/stagiaires")}>
                <UserPlus className="mr-2 h-4 w-4" />
                Gérer les stagiaires
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Demandes</CardTitle>
              <CardDescription>Traiter les demandes en attente</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/admin/demandes")}>
                <FileText className="mr-2 h-4 w-4" />
                Voir les demandes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rapports</CardTitle>
              <CardDescription>Générer des rapports détaillés</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/admin/reports")}>
                <ClipboardList className="mr-2 h-4 w-4" />
                Voir les rapports
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Paramètres</CardTitle>
              <CardDescription>Configuration du système</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/admin/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Paramètres système
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}