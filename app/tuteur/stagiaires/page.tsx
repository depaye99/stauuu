"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { Users, Search, Eye, ClipboardList } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface StagiaireWithUser {
  id: string
  user_id: string
  entreprise?: string
  poste?: string
  date_debut?: string
  date_fin?: string
  statut: string
  notes?: string
  user?: {
    name: string
    email: string
    phone?: string
  }
}

export default function TuteurStagiairesPage() {
  const [user, setUser] = useState<any>(null)
  const [stagiaires, setStagiaires] = useState<StagiaireWithUser[]>([])
  const [filteredStagiaires, setFilteredStagiaires] = useState<StagiaireWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
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
      if (!profile || profile.role !== "tuteur") {
        router.push("/auth/login")
        return
      }

      setUser(profile)
      await loadMesStagiaires()
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadMesStagiaires = async () => {
    try {
      const response = await fetch("/api/tuteur/stagiaires")
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors du chargement")
      }

      console.log("✅ Stagiaires chargés:", result.data?.length || 0)
      setStagiaires(result.data || [])
      setFilteredStagiaires(result.data || [])
    } catch (error) {
      console.error("❌ Erreur lors du chargement des stagiaires:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger vos stagiaires",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    let filtered = stagiaires

    if (searchQuery) {
      filtered = filtered.filter(
        (stagiaire) =>
          stagiaire.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stagiaire.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stagiaire.entreprise?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredStagiaires(filtered)
  }, [stagiaires, searchQuery])

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "actif":
        return "bg-green-100 text-green-800"
      case "termine":
        return "bg-gray-100 text-gray-800"
      case "suspendu":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("fr-FR")
  }

  const calculateProgress = (dateDebut?: string, dateFin?: string) => {
    if (!dateDebut || !dateFin) return 0
    const debut = new Date(dateDebut)
    const fin = new Date(dateFin)
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
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mes stagiaires</h1>
          <p className="text-gray-600">Suivi et encadrement de vos stagiaires</p>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{stagiaires.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Actifs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stagiaires.filter((s) => s.statut === "actif").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-gray-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Terminés</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stagiaires.filter((s) => s.statut === "termine").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recherche */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, email, entreprise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Liste des stagiaires */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStagiaires.map((stagiaire) => (
            <Card key={stagiaire.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{stagiaire.user?.name || "N/A"}</CardTitle>
                  <Badge className={getStatusBadgeColor(stagiaire.statut)}>{stagiaire.statut}</Badge>
                </div>
                <p className="text-sm text-gray-500">{stagiaire.user?.email}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Entreprise</p>
                    <p className="text-sm">{stagiaire.entreprise || "Non spécifiée"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Poste</p>
                    <p className="text-sm">{stagiaire.poste || "Non spécifié"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Période</p>
                    <p className="text-sm">
                      {formatDate(stagiaire.date_debut)} - {formatDate(stagiaire.date_fin)}
                    </p>
                  </div>
                  {stagiaire.statut === "actif" && stagiaire.date_debut && stagiaire.date_fin && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Progression</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${calculateProgress(stagiaire.date_debut, stagiaire.date_fin)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {calculateProgress(stagiaire.date_debut, stagiaire.date_fin)}% terminé
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/tuteur/stagiaires/${stagiaire.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/tuteur/stagiaires/${stagiaire.id}/evaluation`)}
                    >
                      <ClipboardList className="h-4 w-4 mr-1" />
                      Évaluer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStagiaires.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun stagiaire trouvé</h3>
              <p className="text-gray-500">
                {searchQuery
                  ? "Aucun stagiaire ne correspond à votre recherche."
                  : "Vous n'avez pas encore de stagiaires assignés."}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
