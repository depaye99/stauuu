"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BackButton } from "@/components/ui/back-button"
import { Header } from "@/components/layout/header"
import { useToast } from "@/hooks/use-toast"
import { FileText, User, Calendar, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface DemandeDetail {
  id: string
  type: string
  titre: string
  description?: string
  statut: string
  date_demande: string
  date_reponse?: string
  commentaire_reponse?: string
  documents_requis?: string[]
  tuteur?: {
    name: string
    email: string
  }
}

export default function StagiaireDemandeDetailPage() {
  const [user, setUser] = useState<any>(null)
  const [stagiaireInfo, setStagiaireInfo] = useState<any>(null)
  const [demande, setDemande] = useState<DemandeDetail | null>(null)
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
      if (!profile) {
        router.push("/auth/login")
        return
      }

      setUser(profile)

      // Récupérer les informations du stagiaire
      const { data: stagiaire } = await supabase.from("stagiaires").select("*").eq("user_id", profile.id).single()
      setStagiaireInfo(stagiaire)

      // Vérifier que l'ID n'est pas une route spéciale
      if (params.id === "nouvelle") {
        router.push("/stagiaire/demandes/nouvelle")
        return
      }

      // Vérifier que l'ID est un UUID valide
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(params.id as string)) {
        toast({
          title: "Erreur",
          description: "ID de demande invalide",
          variant: "destructive",
        })
        router.push("/stagiaire/demandes")
        return
      }

      if (stagiaire) {
        await loadDemande(stagiaire.id)
      }

      setLoading(false)
    }

    checkAuth()
  }, [params.id])

  const loadDemande = async (stagiaireId: string) => {
    try {
      const { data, error } = await supabase
        .from("demandes")
        .select(`
          *,
          tuteur:users!tuteur_id(name, email)
        `)
        .eq("id", params.id)
        .eq("stagiaire_id", stagiaireId)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          toast({
            title: "Erreur",
            description: "Demande non trouvée",
            variant: "destructive",
          })
          return
        }
        throw error
      }

      setDemande(data)
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de la demande",
        variant: "destructive",
      })
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "en_attente":
        return "bg-yellow-100 text-yellow-800"
      case "approuvee":
        return "bg-green-100 text-green-800"
      case "rejetee":
        return "bg-red-100 text-red-800"
      case "en_cours":
        return "bg-blue-100 text-blue-800"
      case "terminee":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "stage_academique":
        return "bg-blue-100 text-blue-800"
      case "stage_professionnel":
        return "bg-green-100 text-green-800"
      case "conge":
        return "bg-orange-100 text-orange-800"
      case "prolongation":
        return "bg-purple-100 text-purple-800"
      case "attestation":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
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

  if (!stagiaireInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} />
        <main className="max-w-4xl mx-auto py-6 px-4">
          <BackButton href="/stagiaire/demandes" />
          <Card className="mt-6">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Profil incomplet</h3>
              <p className="text-gray-500">
                Vous devez compléter votre profil de stagiaire pour accéder à vos demandes.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  if (!demande) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} />
        <main className="max-w-4xl mx-auto py-6 px-4">
          <BackButton href="/stagiaire/demandes" />
          <Card className="mt-6">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Demande non trouvée</h3>
              <p className="text-gray-500">La demande demandée n'existe pas ou vous n'y avez pas accès.</p>
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
          <BackButton href="/stagiaire/demandes" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {demande.titre}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getTypeBadgeColor(demande.type)}>{demande.type.replace("_", " ")}</Badge>
                    <Badge className={getStatusBadgeColor(demande.statut)}>{demande.statut.replace("_", " ")}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-md mt-1">
                    {demande.description || "Aucune description fournie"}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date de demande</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p>{formatDate(demande.date_demande)}</p>
                    </div>
                  </div>
                  {demande.date_reponse && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Date de réponse</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <p>{formatDate(demande.date_reponse)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {demande.commentaire_reponse && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Commentaire de réponse</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-md mt-1">{demande.commentaire_reponse}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {demande.documents_requis && demande.documents_requis.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Documents fournis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {demande.documents_requis.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{doc}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Fourni
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {demande.tuteur && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tuteur assigné</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{demande.tuteur.name}</p>
                        <p className="text-sm text-gray-500">{demande.tuteur.email}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statut de la demande</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {demande.statut === "en_attente" && <Clock className="h-5 w-5 text-yellow-500" />}
                    {demande.statut === "approuvee" && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {demande.statut === "rejetee" && <XCircle className="h-5 w-5 text-red-500" />}
                    <Badge className={getStatusBadgeColor(demande.statut)}>{demande.statut.replace("_", " ")}</Badge>
                  </div>

                  <div className="text-sm text-gray-600">
                    {demande.statut === "en_attente" && (
                      <p>Votre demande est en cours d'examen par votre tuteur et les RH.</p>
                    )}
                    {demande.statut === "approuvee" && (
                      <p>Votre demande a été approuvée. Vous recevrez bientôt plus d'informations.</p>
                    )}
                    {demande.statut === "rejetee" && (
                      <p>Votre demande a été rejetée. Consultez le commentaire de réponse pour plus de détails.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>• Les demandes sont traitées dans un délai de 3 à 5 jours ouvrables</p>
                <p>• Vous recevrez une notification par email lors du traitement</p>
                <p>• Pour toute question, contactez votre tuteur</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
