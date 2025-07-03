"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BackButton } from "@/components/ui/back-button"
import { Header } from "@/components/layout/header"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { FileText, User, Calendar, CheckCircle, XCircle, Clock, AlertCircle, Building } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DemandeDetail {
  id: string
  type: string
  titre: string
  description?: string
  statut: string
  date_demande: string
  date_reponse?: string
  commentaire_reponse?: string
  stagiaires?: {
    id: string
    entreprise?: string
    users?: {
      name: string
      email: string
    }
  }
}

export default function TuteurDemandeDetailPage() {
  const [user, setUser] = useState<any>(null)
  const [demande, setDemande] = useState<DemandeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false)
  const [processAction, setProcessAction] = useState<"approve" | "reject" | null>(null)
  const [commentaire, setCommentaire] = useState("")
  const [processing, setProcessing] = useState(false)
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
      if (!profile || profile.role !== "tuteur") {
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
      const { data, error } = await supabase
        .from("demandes")
        .select(`
          *,
          stagiaires(
            id,
            entreprise,
            users!user_id(name, email)
          )
        `)
        .eq("id", params.id)
        .eq("tuteur_id", user?.id)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          toast({
            title: "Erreur",
            description: "Demande non trouvée ou non autorisée",
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

  const handleProcessDemande = async () => {
    if (!demande || !processAction) return

    setProcessing(true)
    try {
      const newStatus = processAction === "approve" ? "approuvee" : "rejetee"
      const { error } = await supabase
        .from("demandes")
        .update({
          statut: newStatus,
          date_reponse: new Date().toISOString(),
          commentaire_reponse:
            commentaire || (processAction === "approve" ? "Approuvé par le tuteur" : "Rejeté par le tuteur"),
        })
        .eq("id", demande.id)

      if (error) throw error

      await loadDemande()
      setIsProcessDialogOpen(false)
      setProcessAction(null)
      setCommentaire("")
      toast({
        title: "Succès",
        description: `Demande ${processAction === "approve" ? "approuvée" : "rejetée"} avec succès`,
      })
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        title: "Erreur",
        description: "Impossible de traiter la demande",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const openProcessDialog = (action: "approve" | "reject") => {
    setProcessAction(action)
    setIsProcessDialogOpen(true)
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

  if (!demande) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} />
        <main className="max-w-4xl mx-auto py-6 px-4">
          <BackButton href="/tuteur/demandes" />
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
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <BackButton href="/tuteur/demandes" />
          <div className="flex gap-2">
            {demande.statut === "en_attente" && (
              <>
                <Button onClick={() => openProcessDialog("approve")} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approuver
                </Button>
                <Button onClick={() => openProcessDialog("reject")} variant="destructive">
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejeter
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
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

            {/* Documents fournis */}
            {demande.documents && demande.documents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documents fournis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {demande.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium">{doc.nom || doc}</p>
                            {doc.type && (
                              <p className="text-xs text-gray-500">{doc.type}</p>
                            )}
                          </div>
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
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations du stagiaire</CardTitle>
              </CardHeader>
              <CardContent>
                {demande.stagiaires ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{demande.stagiaires.users?.name}</p>
                        <p className="text-sm text-gray-500">{demande.stagiaires.users?.email}</p>
                      </div>
                    </div>
                    {demande.stagiaires.entreprise && (
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <p className="text-sm">{demande.stagiaires.entreprise}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Informations non disponibles</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Statut de la demande</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {demande.statut === "en_attente" && <Clock className="h-5 w-5 text-yellow-500" />}
                  {demande.statut === "approuvee" && <CheckCircle className="h-5 w-5 text-green-500" />}
                  {demande.statut === "rejetee" && <XCircle className="h-5 w-5 text-red-500" />}
                  <Badge className={getStatusBadgeColor(demande.statut)}>{demande.statut.replace("_", " ")}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialog de traitement */}
        <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{processAction === "approve" ? "Approuver" : "Rejeter"} la demande</DialogTitle>
              <DialogDescription>
                Demande: {demande.titre}
                <br />
                Stagiaire: {demande.stagiaires?.users?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Commentaire (optionnel)</label>
                <Textarea
                  placeholder={`Commentaire pour ${processAction === "approve" ? "l'approbation" : "le rejet"}...`}
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsProcessDialogOpen(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleProcessDemande}
                variant={processAction === "approve" ? "default" : "destructive"}
                disabled={processing}
              >
                {processing ? "Traitement..." : processAction === "approve" ? "Approuver" : "Rejeter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
