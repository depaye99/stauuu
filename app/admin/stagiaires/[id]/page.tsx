"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BackButton } from "@/components/ui/back-button"
import { Header } from "@/components/layout/header"
import { useToast } from "@/components/ui/use-toast"
import { User, Building, Calendar, Mail, Phone, Edit, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface StagiaireDetail {
  id: string
  user_id: string
  tuteur_id?: string
  entreprise?: string
  poste?: string
  date_debut?: string
  date_fin?: string
  statut: string
  notes?: string
  created_at: string
  users?: {
    id: string
    name: string
    email: string
    phone?: string
  }
  tuteur?: {
    id: string
    name: string
    email: string
  }
}

export default function AdminStagiaireDetailPage() {
  const [user, setUser] = useState<any>(null)
  const [stagiaire, setStagiaire] = useState<StagiaireDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = async () => {
      // Vérifier que l'ID est valide
      if (params.id === "new" || !params.id) {
        router.push("/admin/stagiaires")
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase.from("users").select("*").eq("id", session.user.id).single()
      if (!profile || profile.role !== "admin") {
        router.push("/auth/login")
        return
      }

      setUser(profile)
      await loadStagiaire()
      setLoading(false)
    }

    checkAuth()
  }, [params.id])

  const loadStagiaire = async () => {
    try {
      const response = await fetch(`/api/admin/stagiaires/${params.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du chargement")
      }

      setStagiaire(data.data)
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails du stagiaire",
        variant: "destructive",
      })
    }
  }

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
    if (!dateString) return "Non défini"
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

  if (!stagiaire) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} />
        <main className="max-w-4xl mx-auto py-6 px-4">
          <BackButton href="/admin/stagiaires" />
          <Card className="mt-6">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Stagiaire non trouvé</h3>
              <p className="text-gray-500">Le stagiaire demandé n'existe pas ou a été supprimé.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <BackButton href="/admin/stagiaires" />
          <div className="flex gap-2">
            <Button onClick={() => router.push(`/admin/stagiaires/${stagiaire.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informations personnelles
                  </CardTitle>
                  <Badge className={getStatusBadgeColor(stagiaire.statut)}>{stagiaire.statut}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nom complet</label>
                    <p className="text-lg font-medium">{stagiaire.users?.name || "Non défini"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <p>{stagiaire.users?.email || "Non défini"}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Téléphone</label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p>{stagiaire.users?.phone || "Non défini"}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date d'inscription</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p>{formatDate(stagiaire.created_at)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Informations du stage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Entreprise</label>
                    <p className="text-lg">{stagiaire.entreprise || "Non définie"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Poste</label>
                    <p className="text-lg">{stagiaire.poste || "Non défini"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date de début</label>
                    <p>{formatDate(stagiaire.date_debut)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date de fin</label>
                    <p>{formatDate(stagiaire.date_fin)}</p>
                  </div>
                </div>

                {stagiaire.statut === "actif" && stagiaire.date_debut && stagiaire.date_fin && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Progression du stage</label>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${calculateProgress(stagiaire.date_debut, stagiaire.date_fin)}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {calculateProgress(stagiaire.date_debut, stagiaire.date_fin)}% terminé
                      </p>
                    </div>
                  </div>
                )}

                {stagiaire.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Notes</label>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md mt-1">{stagiaire.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tuteur assigné</CardTitle>
              </CardHeader>
              <CardContent>
                {stagiaire.tuteur ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{stagiaire.tuteur.name}</p>
                        <p className="text-sm text-gray-500">{stagiaire.tuteur.email}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      <Mail className="h-4 w-4 mr-2" />
                      Contacter
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Aucun tuteur assigné</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => router.push(`/admin/stagiaires/${stagiaire.id}/edit`)}
                    >
                      Assigner un tuteur
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Voir les demandes
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Voir les évaluations
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  Historique
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
