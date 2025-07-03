"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { Users, Search, Filter, Eye, Edit, UserPlus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface StagiaireWithUser {
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

export default function AdminStagiairesPage() {
  const [user, setUser] = useState<any>(null)
  const [stagiaires, setStagiaires] = useState<StagiaireWithUser[]>([])
  const [filteredStagiaires, setFilteredStagiaires] = useState<StagiaireWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
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
      if (!profile || profile.role !== "admin") {
        router.push("/auth/login")
        return
      }

      setUser(profile)
      await loadStagiaires()
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadStagiaires = async () => {
    try {
      console.log("🔍 Chargement des stagiaires...")

      const response = await fetch("/api/admin/stagiaires")
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
        description: "Impossible de charger les stagiaires",
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

    if (statusFilter !== "all") {
      filtered = filtered.filter((stagiaire) => stagiaire.statut === statusFilter)
    }

    setFilteredStagiaires(filtered)
  }, [stagiaires, searchQuery, statusFilter])

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "actif":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "termine":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
      case "suspendu":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("fr-FR")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header user={user} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion des stagiaires</h1>
          <p className="text-gray-600 dark:text-gray-400">Administrer tous les stagiaires de l'organisation</p>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stagiaires.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Actifs</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Terminés</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stagiaires.filter((s) => s.statut === "termine").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserPlus className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avec tuteur</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stagiaires.filter((s) => s.tuteur_id).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres et recherche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, email, entreprise..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="actif">Actifs</SelectItem>
                  <SelectItem value="termine">Terminés</SelectItem>
                  <SelectItem value="suspendu">Suspendus</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => router.push("/admin/tuteurs-stagiaires")}>
                <UserPlus className="mr-2 h-4 w-4" />
                Attribuer tuteurs
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tableau des stagiaires */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Stagiaires ({filteredStagiaires.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStagiaires.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucun stagiaire</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Les stagiaires apparaîtront ici une fois qu'ils se seront enregistrés.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stagiaire</TableHead>
                      <TableHead>Entreprise</TableHead>
                      <TableHead>Poste</TableHead>
                      <TableHead>Tuteur</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStagiaires.map((stagiaire) => (
                      <TableRow key={stagiaire.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{stagiaire.user?.name || "N/A"}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{stagiaire.user?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{stagiaire.entreprise || "-"}</TableCell>
                        <TableCell>{stagiaire.poste || "-"}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{stagiaire.tuteur?.name || "Non assigné"}</div>
                            {stagiaire.tuteur?.email && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">{stagiaire.tuteur.email}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{formatDate(stagiaire.date_debut)}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              au {formatDate(stagiaire.date_fin)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(stagiaire.statut)}>{stagiaire.statut}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/stagiaires/${stagiaire.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/stagiaires/${stagiaire.id}/edit`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
