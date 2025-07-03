"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { FileText, Search, Eye, CheckCircle, XCircle, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DemandeWithStagiaire {
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

export default function TuteurDemandesPage() {
  const [user, setUser] = useState<any>(null)
  const [demandes, setDemandes] = useState<DemandeWithStagiaire[]>([])
  const [filteredDemandes, setFilteredDemandes] = useState<DemandeWithStagiaire[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDemande, setSelectedDemande] = useState<DemandeWithStagiaire | null>(null)
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false)
  const [processAction, setProcessAction] = useState<"approve" | "reject" | null>(null)
  const [commentaire, setCommentaire] = useState("")
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
      await loadDemandesMesStagiaires(session.user.id)
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadDemandesMesStagiaires = async (tuteurId: string) => {
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
        .eq("tuteur_id", tuteurId)
        .order("date_demande", { ascending: false })

      if (error) throw error
      setDemandes(data || [])
      setFilteredDemandes(data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des demandes:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les demandes",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    let filtered = demandes

    if (searchQuery) {
      filtered = filtered.filter(
        (demande) =>
          demande.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
          demande.stagiaires?.users?.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredDemandes(filtered)
  }, [demandes, searchQuery])

  const handleProcessDemande = async () => {
    if (!selectedDemande || !processAction || !user) return

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
        .eq("id", selectedDemande.id)

      if (error) throw error

      await loadDemandesMesStagiaires(user.id)
      setIsProcessDialogOpen(false)
      setSelectedDemande(null)
      setProcessAction(null)
      setCommentaire("")
      toast({
        title: "Succès",
        description: `Demande ${processAction === "approve" ? "approuvée" : "rejetée"} avec succès`,
      })
    } catch (error) {
      console.error("Erreur lors du traitement:", error)
      toast({
        title: "Erreur",
        description: "Impossible de traiter la demande",
        variant: "destructive",
      })
    }
  }

  const openProcessDialog = (demande: DemandeWithStagiaire, action: "approve" | "reject") => {
    setSelectedDemande(demande)
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
    return new Date(dateString).toLocaleDateString("fr-FR")
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
          <h1 className="text-3xl font-bold text-gray-900">Demandes de mes stagiaires</h1>
          <p className="text-gray-600">Examiner et valider les demandes de votre équipe</p>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">En attente</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {demandes.filter((d) => d.statut === "en_attente").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approuvées</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {demandes.filter((d) => d.statut === "approuvee").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rejetées</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {demandes.filter((d) => d.statut === "rejetee").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{demandes.length}</p>
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
                placeholder="Rechercher par titre, stagiaire..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tableau des demandes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Demandes à examiner ({filteredDemandes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Stagiaire</TableHead>
                  <TableHead>Date demande</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDemandes.map((demande) => (
                  <TableRow key={demande.id}>
                    <TableCell className="font-medium">{demande.titre}</TableCell>
                    <TableCell>
                      <Badge className={getTypeBadgeColor(demande.type)}>{demande.type.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{demande.stagiaires?.users?.name || "N/A"}</div>
                        <div className="text-sm text-gray-500">{demande.stagiaires?.entreprise}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(demande.date_demande)}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(demande.statut)}>{demande.statut.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/tuteur/demandes/${demande.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {demande.statut === "en_attente" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openProcessDialog(demande, "approve")}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openProcessDialog(demande, "reject")}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog de traitement */}
        <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{processAction === "approve" ? "Approuver" : "Rejeter"} la demande</DialogTitle>
              <DialogDescription>
                Demande: {selectedDemande?.titre}
                <br />
                Stagiaire: {selectedDemande?.stagiaires?.users?.name}
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
              <Button onClick={handleProcessDemande} variant={processAction === "approve" ? "default" : "destructive"}>
                {processAction === "approve" ? "Approuver" : "Rejeter"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {filteredDemandes.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune demande trouvée</h3>
              <p className="text-gray-500">
                {searchQuery
                  ? "Aucune demande ne correspond à votre recherche."
                  : "Vos stagiaires n'ont pas encore soumis de demandes."}
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
