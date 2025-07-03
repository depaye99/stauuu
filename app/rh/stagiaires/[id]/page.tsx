"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BackButton } from "@/components/ui/back-button"
import { Header } from "@/components/layout/header"
import { useToast } from "@/hooks/use-toast"
import { User, Building, Calendar, Edit, FileText, Star, Phone, Mail } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Progress } from "@/components/ui/progress"

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
  user?: {
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

export default function RHStagiaireDetailPage() {
  const [user, setUser] = useState<any>(null)
  const [stagiaire, setStagiaire] = useState<StagiaireDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
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
      if (!profile || profile.role !== "rh") {
        router.push("/auth/login")
        return
      }

      setUser(profile)

      // Vérifier que l'ID n'est pas une route spéciale
      if (params.id === "nouveau" || params.id === "evaluation") {
        return
      }

      await loadStagiaire()
      setLoading(false)
    }

    checkAuth()
  }, [params.id])

  const loadStagiaire = async () => {
    try {
      const response = await fetch(`/api/rh/stagiaires/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setStagiaire(data.data)
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
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
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const calculateProgress = () => {
    if (!stagiaire?.date_debut || !stagiaire?.date_fin) return 0

    const debut = new Date(stagiaire.date_debut)
    const fin = new Date(stagiaire.date_fin)
    const maintenant = new Date()

    if (maintenant < debut) return 0
    if (maintenant > fin) return 100

    const totalDuration = fin.getTime() - debut.getTime()
    const currentDuration = maintenant.getTime() - debut.getTime()

    return Math.round((currentDuration / totalDuration) * 100)
  }

  const getDaysRemaining = () => {
    if (!stagiaire?.date_fin) return null

    const fin = new Date(stagiaire.date_fin)
    const maintenant = new Date()

    if (maintenant > fin) return 0

    const diffTime = fin.getTime() - maintenant.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
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
          <BackButton href="/rh/stagiaires" />
          <Card className="mt-6">
            <CardContent className="p-12 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Stagiaire non trouvé</h3>
              <p className="text-gray-500">Le stagiaire demandé n'existe pas ou vous n'y avez pas accès.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  const progress = calculateProgress()
  const daysRemaining = getDaysRemaining()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <BackButton href="/rh/stagiaires" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {stagiaire.user?.name || "Nom non disponible"}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getStatusBadgeColor(stagiaire.statut)}>{stagiaire.statut}</Badge>
                    <Button size="sm" onClick={() => router.push(`/rh/stagiaires/${stagiaire.id}/edit`)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <p>{stagiaire.user?.email || "-"}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Téléphone</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p>{stagiaire.user?.phone || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Entreprise</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Building className="h-4 w-4 text-gray-400" />
                      <p>{stagiaire.entreprise || "-"}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Poste</label>
                    <p className="mt-1">{stagiaire.poste || "-"}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date de début</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p>{formatDate(stagiaire.date_debut)}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date de fin</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p>{formatDate(stagiaire.date_fin)}</p>
                    </div>
                  </div>
                </div>

                {stagiaire.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Notes</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-md mt-1">{stagiaire.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progression du stage */}
            <Card>
              <CardHeader>
                <CardTitle>Progression du stage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progression</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {daysRemaining !== null && (
                    <div className="text-sm text-gray-600">
                      {daysRemaining > 0 ? (
                        <p>
                          Reste {daysRemaining} jour{daysRemaining > 1 ? "s" : ""}
                        </p>
                      ) : (
                        <p>Stage terminé</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {stagiaire.tuteur && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tuteur assigné</CardTitle>
                </CardHeader>
                <CardContent>
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
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/rh/demandes?stagiaire=${stagiaire.id}`)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Voir les demandes
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/rh/evaluations?stagiaire=${stagiaire.id}`)}
                >
                  <Star className="mr-2 h-4 w-4" />
                  Évaluations
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/rh/stagiaires/${stagiaire.id}/edit`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations système</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <div>
                  <span className="font-medium">Créé le:</span>
                  <br />
                  {formatDate(stagiaire.created_at)}
                </div>
                <div>
                  <span className="font-medium">ID:</span>
                  <br />
                  <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{stagiaire.id}</code>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
