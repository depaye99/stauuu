"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { BackButton } from "@/components/ui/back-button"
import { Header } from "@/components/layout/header"
import { useToast } from "@/components/ui/use-toast"
import {
  FileText,
  User,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  MessageSquare,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface DemandeDetail {
  id: string
  stagiaire_id: string
  type: string
  description: string
  statut: string
  date_demande: string
  date_traitement?: string
  commentaire_rh?: string
  documents?: string[]
  stagiaire?: {
    id: string
    user?: {
      name: string
      email: string
    }
    entreprise?: string
    poste?: string
  }
}

export default function RHDemandeDetailPage() {
  const [user, setUser] = useState<any>(null)
  const [demande, setDemande] = useState<DemandeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [commentaire, setCommentaire] = useState("")
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = async () => {
      // Vérifier que l'ID est valide
      if (params.id === "new" || !params.id) {
        router.push("/rh/demandes")
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
      if (!profile || profile.role !== "rh") {
        router.push("/auth/login")
        return
      }

      setUser(profile)
      await loadDemande()
      setLoading(false)
    }

    checkAuth()
  }, [params.id])

  const loadDemande = async () => {
    try {
      const response = await fetch(`/api/rh/demandes/${params.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du chargement")
      }

      setDemande(data.data)
      setCommentaire(data.data.commentaire_rh || "")
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de la demande",
        variant: "destructive",
      })
    }
  }

  const handleTraitement = async (nouveauStatut: string) => {
    if (!demande) return

    try {
      setProcessing(true)
      const response = await fetch(`/api/rh/demandes/${demande.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          statut: nouveauStatut,
          commentaire_rh: commentaire,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du traitement")
      }

      toast({
        title: "Succès",
        description: `Demande ${nouveauStatut === "approuvee" ? "approuvée" : "rejetée"} avec succès`,
      })

      await loadDemande()
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors du traitement de la demande",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "approuvee":
        return "bg-green-100 text-green-800"
      case "rejetee":
        return "bg-red-100 text-red-800"
      case "en_attente":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Non défini"
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!demande) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} />
        <main className="max-w-4xl mx-auto py-6 px-4">
          <BackButton href="/rh/demandes" />
          <Card className="mt-6">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Demande non trouvée</h3>
              <p className="text-gray-500">La demande demandée n'existe pas ou a été supprimée.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <BackButton href="/rh/demandes" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Détails de la demande
                  </CardTitle>
                  <Badge className={getStatusBadgeColor(demande.statut)}>{demande.statut}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Type de demande</label>
                    <p className="text-lg font-medium">{demande.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date de demande</label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p>{formatDate(demande.date_demande)}</p>
                    </div>
                  </div>
                  {demande.date_traitement && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Date de traitement</label>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <p>{formatDate(demande.date_traitement)}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md mt-1">{demande.description}</p>
                </div>

                {demande.documents && demande.documents.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Documents fournis</label>
                    <div className="mt-2 space-y-2">
                      {demande.documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">{doc.nom || doc}</span>
                            {doc.taille && (
                              <span className="text-xs text-gray-500">
                                ({Math.round(doc.taille / 1024)} KB)
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.open(`/api/documents/${doc.id}/content`, '_blank')}
                            >
                              👁️ Voir
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.open(`/api/documents/${doc.id}/download`, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section de traitement */}
            {demande.statut === "en_attente" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Traitement de la demande
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Commentaire RH</label>
                    <Textarea
                      value={commentaire}
                      onChange={(e) => setCommentaire(e.target.value)}
                      placeholder="Ajoutez un commentaire sur cette demande..."
                      className="mt-1"
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleTraitement("approuvee")}
                      disabled={processing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approuver
                    </Button>
                    <Button onClick={() => handleTraitement("rejetee")} disabled={processing} variant="destructive">
                      <XCircle className="h-4 w-4 mr-2" />
                      Rejeter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Commentaire RH existant */}
            {demande.commentaire_rh && demande.statut !== "en_attente" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Commentaire RH
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{demande.commentaire_rh}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations stagiaire</CardTitle>
              </CardHeader>
              <CardContent>
                {demande.stagiaire ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{demande.stagiaire.user?.name || "Nom non défini"}</p>
                        <p className="text-sm text-gray-500">{demande.stagiaire.user?.email}</p>
                      </div>
                    </div>
                    {demande.stagiaire.entreprise && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Entreprise</label>
                        <p className="text-sm">{demande.stagiaire.entreprise}</p>
                      </div>
                    )}
                    {demande.stagiaire.poste && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Poste</label>
                        <p className="text-sm">{demande.stagiaire.poste}</p>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => router.push(`/rh/stagiaires/${demande.stagiaire?.id}`)}
                    >
                      Voir le profil
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Informations stagiaire non disponibles</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
