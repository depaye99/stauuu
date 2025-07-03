"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { FileText, ClipboardList, User, Plus, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface StagiaireStats {
  demandes_total: number
  demandes_en_attente: number
  demandes_approuvees: number
  demandes_rejetees: number
  documents_total: number
  evaluations_total: number
  note_moyenne: number
}

interface StagiaireInfo {
  id: string
  entreprise?: string
  poste?: string
  specialite?: string
  niveau?: string
  date_debut?: string
  date_fin?: string
  statut: string
  tuteur?: {
    name: string
    email: string
  }
}

export default function StagiaireDashboard() {
  const [user, setUser] = useState<any>(null)
  const [stagiaireInfo, setStagiaireInfo] = useState<StagiaireInfo | null>(null)
  const [stats, setStats] = useState<StagiaireStats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

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

      if (!profile || profile.role !== "stagiaire") {
        router.push("/auth/login")
        return
      }

      setUser(profile)
      await Promise.all([loadStagiaireInfo(profile.id), loadStats()])
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadStagiaireInfo = async (userId: string) => {
    try {
      console.log("🔍 Chargement des informations du stagiaire...")

      const { data: stagiaire, error } = await supabase
        .from("stagiaires")
        .select(`
          *,
          tuteur:users!stagiaires_tuteur_id_fkey(name, email)
        `)
        .eq("user_id", userId)
        .single()

      if (error) {
        console.error("❌ Erreur lors du chargement du stagiaire:", error)
        // Ne pas bloquer si pas de profil stagiaire
        return
      }

      console.log("✅ Informations stagiaire chargées:", stagiaire)
      setStagiaireInfo(stagiaire)
    } catch (error) {
      console.error("💥 Erreur loadStagiaireInfo:", error)
    }
  }

  const loadStats = async () => {
    try {
      console.log("📊 Chargement des statistiques...")

      const response = await fetch("/api/stagiaire/stats")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        console.log("✅ Statistiques chargées:", data.data)
        setStats(data.data)
      } else {
        console.error("❌ Erreur API stats:", data.error)
        // Utiliser des stats par défaut
        setStats({
          demandes_total: 0,
          demandes_en_attente: 0,
          demandes_approuvees: 0,
          demandes_rejetees: 0,
          documents_total: 0,
          evaluations_total: 0,
          note_moyenne: 0,
        })
      }
    } catch (error) {
      console.error("💥 Erreur lors du chargement des statistiques:", error)
      // Stats par défaut en cas d'erreur
      setStats({
        demandes_total: 0,
        demandes_en_attente: 0,
        demandes_approuvees: 0,
        demandes_rejetees: 0,
        documents_total: 0,
        evaluations_total: 0,
        note_moyenne: 0,
      })
    }
  }

  const getProgressPercentage = () => {
    if (!stagiaireInfo?.date_debut || !stagiaireInfo?.date_fin) return 0

    const debut = new Date(stagiaireInfo.date_debut)
    const fin = new Date(stagiaireInfo.date_fin)
    const maintenant = new Date()

    if (maintenant < debut) return 0
    if (maintenant > fin) return 100

    const totalDuration = fin.getTime() - debut.getTime()
    const elapsed = maintenant.getTime() - debut.getTime()
    return Math.round((elapsed / totalDuration) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header user={user} />

      <main className="flex-1 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mon espace stagiaire</h1>
          <p className="text-gray-600 dark:text-gray-400">Bienvenue, {user?.name}</p>

          {/* Notification email */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Notifications email activées :</strong> Vous recevrez une notification par email lors du
                traitement de vos demandes.
              </p>
            </div>
          </div>
        </div>

        {/* Informations du stage */}
        {stagiaireInfo && (
          <Card className="transition-all duration-300 hover:scale-[1.03] hover:shadow-xl animate-fade-in-up mb-8" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Informations de stage</span>
                <Badge variant={stagiaireInfo.statut === "actif" ? "default" : "secondary"}>
                  {stagiaireInfo.statut}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Entreprise</p>
                  <p className="font-medium">{stagiaireInfo.entreprise || "Non définie"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Poste</p>
                  <p className="font-medium">{stagiaireInfo.poste || "Non défini"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Spécialité</p>
                  <p className="font-medium">{stagiaireInfo.specialite || "Non définie"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Niveau</p>
                  <p className="font-medium">{stagiaireInfo.niveau || "Non défini"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tuteur</p>
                  <p className="font-medium">{stagiaireInfo.tuteur?.name || "Non assigné"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Progression</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage()}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{getProgressPercentage()}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="transition-all duration-300 hover:scale-[1.03] hover:shadow-xl animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mes demandes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.demandes_total || 0}</div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {stats?.demandes_en_attente || 0} en attente
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {stats?.demandes_approuvees || 0} approuvées
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:scale-[1.03] hover:shadow-xl animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mes documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.documents_total || 0}</div>
              <p className="text-xs text-muted-foreground">Documents uploadés</p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:scale-[1.03] hover:shadow-xl animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Évaluations</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.evaluations_total || 0}</div>
              <p className="text-xs text-muted-foreground">Évaluations reçues</p>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:scale-[1.03] hover:shadow-xl animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Note moyenne</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.note_moyenne ? `${stats.note_moyenne.toFixed(1)}/20` : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">Sur toutes les évaluations</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="transition-all duration-300 hover:scale-[1.03] hover:shadow-xl animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle>Nouvelle demande</CardTitle>
              <CardDescription>Soumettre une nouvelle demande</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/stagiaire/demandes/nouvelle")}>
                <Plus className="mr-2 h-4 w-4" />
                Créer une demande
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:scale-[1.03] hover:shadow-xl animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle>Mes demandes</CardTitle>
              <CardDescription>Consulter le statut de mes demandes</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/stagiaire/demandes")}>
                <FileText className="mr-2 h-4 w-4" />
                Voir mes demandes ({stats?.demandes_total || 0})
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:scale-[1.03] hover:shadow-xl animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle>Mes documents</CardTitle>
              <CardDescription>Gérer mes documents</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/stagiaire/documents")}>
                <FileText className="mr-2 h-4 w-4" />
                Mes documents ({stats?.documents_total || 0})
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:scale-[1.03] hover:shadow-xl animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle>Mon profil</CardTitle>
              <CardDescription>Mettre à jour mes informations</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/stagiaire/profile")}>
                <User className="mr-2 h-4 w-4" />
                Modifier mon profil
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
