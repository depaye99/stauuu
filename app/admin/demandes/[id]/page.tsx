"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BackButton } from "@/components/ui/back-button"
import { toast } from "@/hooks/use-toast"
import { FileText, User, MessageSquare, Download } from "lucide-react"

interface Demande {
  id: string
  type: string
  statut: string
  description: string
  date_debut?: string
  date_fin?: string
  commentaire?: string
  commentaire_reponse?: string
  date_creation: string
  date_reponse?: string
  documents_requis?: string[]
  stagiaires: {
    id: string
    entreprise: string
    poste: string
    users: {
      name: string
      email: string
      phone?: string
    }
  }
  tuteur?: {
    name: string
    email: string
  }
}

export default function DemandeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [demande, setDemande] = useState<Demande | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [statut, setStatut] = useState("")
  const [commentaireReponse, setCommentaireReponse] = useState("")

  useEffect(() => {
    loadDemande()
  }, [params.id])

  const loadDemande = async () => {
    try {
      const response = await fetch(`/api/admin/demandes/${params.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du chargement")
      }

      setDemande(data.data)
      setStatut(data.data.statut)
      setCommentaireReponse(data.data.commentaire_reponse || "")
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger la demande",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatut = async () => {
    if (!statut) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un statut",
        variant: "destructive",
      })
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/demandes/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statut,
          commentaire_reponse: commentaireReponse,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la mise à jour")
      }

      toast({
        title: "Succès",
        description: "Demande mise à jour avec succès",
      })

      loadDemande()
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la demande",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "approuve":
        return "bg-green-100 text-green-800"
      case "rejete":
        return "bg-red-100 text-red-800"
      case "en_attente":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "conge":
        return "Congé"
      case "prolongation":
        return "Prolongation"
      case "changement_tuteur":
        return "Changement de tuteur"
      case "modification_stage":
        return "Modification de stage"
      default:
        return type
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!demande) {
    return (
      <div className="container mx-auto p-4">
        <BackButton href="/admin/demandes" />
        <div className="text-center py-8">
          <p className="text-gray-500">Demande non trouvée</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <BackButton href="/admin/demandes" />
        <h1 className="text-2xl font-bold">Détail de la demande</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informations de la demande */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Type</label>
              <p className="font-medium">{getTypeLabel(demande.type)}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Statut</label>
              <Badge className={getStatutColor(demande.statut)}>{demande.statut.replace("_", " ").toUpperCase()}</Badge>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Date de création</label>
              <p>{new Date(demande.date_creation).toLocaleDateString("fr-FR")}</p>
            </div>

            {demande.date_debut && (
              <div>
                <label className="text-sm font-medium text-gray-500">Date de début</label>
                <p>{new Date(demande.date_debut).toLocaleDateString("fr-FR")}</p>
              </div>
            )}

            {demande.date_fin && (
              <div>
                <label className="text-sm font-medium text-gray-500">Date de fin</label>
                <p>{new Date(demande.date_fin).toLocaleDateString("fr-FR")}</p>
              </div>
            )}

            {demande.date_reponse && (
              <div>
                <label className="text-sm font-medium text-gray-500">Date de réponse</label>
                <p>{new Date(demande.date_reponse).toLocaleDateString("fr-FR")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informations du stagiaire */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Stagiaire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Nom</label>
              <p className="font-medium">{demande.stagiaires.users.name}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p>{demande.stagiaires.users.email}</p>
            </div>

            {demande.stagiaires.users.phone && (
              <div>
                <label className="text-sm font-medium text-gray-500">Téléphone</label>
                <p>{demande.stagiaires.users.phone}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-500">Entreprise</label>
              <p className="font-medium">{demande.stagiaires.entreprise}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Poste</label>
              <p>{demande.stagiaires.poste}</p>
            </div>

            {demande.tuteur && (
              <div>
                <label className="text-sm font-medium text-gray-500">Tuteur</label>
                <p className="font-medium">{demande.tuteur.name}</p>
                <p className="text-sm text-gray-500">{demande.tuteur.email}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Description de la demande */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Description de la demande
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{demande.description}</p>

          {demande.commentaire && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <label className="text-sm font-medium text-gray-500">Commentaire du stagiaire</label>
              <p className="mt-1 whitespace-pre-wrap">{demande.commentaire}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents requis */}
      {demande.documents_requis && demande.documents_requis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Documents fournis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {demande.documents_requis.map((doc, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span>{doc}</span>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Traitement de la demande */}
      <Card>
        <CardHeader>
          <CardTitle>Traitement de la demande</CardTitle>
          <CardDescription>Modifier le statut et ajouter une réponse</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Statut</label>
            <Select value={statut} onValueChange={setStatut}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="approuve">Approuvé</SelectItem>
                <SelectItem value="rejete">Rejeté</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Commentaire de réponse</label>
            <Textarea
              value={commentaireReponse}
              onChange={(e) => setCommentaireReponse(e.target.value)}
              placeholder="Ajouter un commentaire..."
              rows={4}
            />
          </div>

          {demande.commentaire_reponse && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <label className="text-sm font-medium text-blue-700">Réponse précédente</label>
              <p className="mt-1 text-blue-800 whitespace-pre-wrap">{demande.commentaire_reponse}</p>
            </div>
          )}

          <Button onClick={handleUpdateStatut} disabled={updating} className="w-full">
            {updating ? "Mise à jour..." : "Mettre à jour la demande"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
