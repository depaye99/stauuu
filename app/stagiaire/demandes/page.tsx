"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { FileText, Plus, Eye, Clock, CheckCircle, XCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Demande {
  id: string
  type: string
  titre: string
  description?: string
  statut: string
  date_demande: string
  date_reponse?: string
  commentaire_reponse?: string
}

export default function StagiaireDemandesPage() {
  const [user, setUser] = useState<any>(null)
  const [stagiaireInfo, setStagiaireInfo] = useState<any>(null)
  const [demandes, setDemandes] = useState<Demande[]>([])
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
      if (!profile) {
        router.push("/auth/login")
        return
      }

      setUser(profile)

      // Récupérer les informations du stagiaire
      const { data: stagiaire } = await supabase.from("stagiaires").select("*").eq("user_id", profile.id).single()

      setStagiaireInfo(stagiaire)

      if (stagiaire) {
        await loadDemandes(stagiaire.id)
      }

      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadDemandes = async (stagiaireId: string) => {
    try {
      const { data, error } = await supabase
        .from("demandes")
        .select("*")
        .eq("stagiaire_id", stagiaireId)
        .order("date_demande", { ascending: false })

      if (error) throw error
      setDemandes(data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des demandes:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les demandes",
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "en_attente":
        return <Clock className="h-4 w-4" />
      case "approuvee":
        return <CheckCircle className="h-4 w-4" />
      case "rejetee":
        return <XCircle className="h-4 w-4" />
      case "en_cours":
        return <Clock className="h-4 w-4" />
      case "terminee":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
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

  if (!stagiaireInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} />
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">
                Vous devez d'abord compléter votre profil de stagiaire pour pouvoir faire des demandes.
              </p>
              <Button className="mt-4" onClick={() => router.push("/stagiaire/profil")}>
                Compléter mon profil
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mes demandes</h1>
          <p className="text-gray-600">Gérer et suivre toutes vos demandes</p>
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

        {/* Actions */}
        <div className="mb-6">
          <Button onClick={() => router.push("/stagiaire/demandes/nouvelle")}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle demande
          </Button>
        </div>

        {/* Liste des demandes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Mes demandes ({demandes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {demandes.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune demande</h3>
                <p className="mt-1 text-sm text-gray-500">Commencez par créer votre première demande.</p>
                <div className="mt-6">
                  <Button onClick={() => router.push("/stagiaire/demandes/nouvelle")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle demande
                  </Button>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date demande</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date réponse</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {demandes.map((demande) => (
                    <TableRow key={demande.id}>
                      <TableCell className="font-medium">{demande.titre}</TableCell>
                      <TableCell>
                        <Badge className={getTypeBadgeColor(demande.type)}>{demande.type.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(demande.date_demande)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(demande.statut)}
                          <Badge className={getStatusBadgeColor(demande.statut)}>
                            {demande.statut.replace("_", " ")}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{demande.date_reponse ? formatDate(demande.date_reponse) : "-"}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/stagiaire/demandes/${demande.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
