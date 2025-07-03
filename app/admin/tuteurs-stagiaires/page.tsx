"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Header } from "@/components/layout/header"
import { Users, UserPlus, Save, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Stagiaire {
  id: string
  user_id: string
  tuteur_id?: string
  entreprise?: string
  poste?: string
  statut: string
  user?: {
    name: string
    email: string
  }
  tuteur?: {
    name: string
    email: string
  }
}

interface Tuteur {
  id: string
  name: string
  email: string
}

export default function TuteursStagiairesPage() {
  const [user, setUser] = useState<any>(null)
  const [stagiaires, setStagiaires] = useState<Stagiaire[]>([])
  const [tuteurs, setTuteurs] = useState<Tuteur[]>([])
  const [attributions, setAttributions] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
      await Promise.all([loadStagiaires(), loadTuteurs()])
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadStagiaires = async () => {
    try {
      const response = await fetch("/api/admin/stagiaires")
      const result = await response.json()

      if (response.ok) {
        setStagiaires(result.data || [])
        // Initialiser les attributions actuelles
        const currentAttributions: { [key: string]: string } = {}
        result.data?.forEach((stagiaire: Stagiaire) => {
          if (stagiaire.tuteur_id) {
            currentAttributions[stagiaire.id] = stagiaire.tuteur_id
          }
        })
        setAttributions(currentAttributions)
      }
    } catch (error) {
      console.error("Erreur chargement stagiaires:", error)
    }
  }

  const loadTuteurs = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("role", "tuteur")
        .eq("is_active", true)

      if (error) throw error
      setTuteurs(data || [])
    } catch (error) {
      console.error("Erreur chargement tuteurs:", error)
    }
  }

  const handleAttributionChange = (stagiaireId: string, tuteurId: string) => {
    setAttributions((prev) => ({
      ...prev,
      [stagiaireId]: tuteurId === "none" ? "" : tuteurId,
    }))
  }

  const saveAttributions = async () => {
    setSaving(true)
    try {
      const updates = Object.entries(attributions).map(([stagiaireId, tuteurId]) => ({
        id: stagiaireId,
        tuteur_id: tuteurId || null,
      }))

      for (const update of updates) {
        const { error } = await supabase.from("stagiaires").update({ tuteur_id: update.tuteur_id }).eq("id", update.id)

        if (error) throw error
      }

      toast({
        title: "Succès",
        description: "Attributions sauvegardées avec succès",
      })

      await loadStagiaires() // Recharger pour voir les changements
    } catch (error) {
      console.error("Erreur sauvegarde:", error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les attributions",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const stagiairesAvecTuteur = stagiaires.filter((s) => attributions[s.id])
  const stagiaireSansTuteur = stagiaires.filter((s) => !attributions[s.id])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header user={user} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Attribution des tuteurs</h1>
          <p className="text-gray-600 dark:text-gray-400">Attribuer des tuteurs aux stagiaires</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total stagiaires</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stagiaires.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserPlus className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avec tuteur</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stagiairesAvecTuteur.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sans tuteur</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stagiaireSansTuteur.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tuteurs disponibles</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{tuteurs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="mb-6 flex justify-end">
          <Button onClick={saveAttributions} disabled={saving}>
            {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {saving ? "Sauvegarde..." : "Sauvegarder les attributions"}
          </Button>
        </div>

        {/* Tableau d'attribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Attribution des tuteurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stagiaires.length === 0 ? (
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
                      <TableHead>Statut</TableHead>
                      <TableHead>Tuteur actuel</TableHead>
                      <TableHead>Nouveau tuteur</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stagiaires.map((stagiaire) => (
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
                          <Badge className={getStatusBadgeColor(stagiaire.statut)}>{stagiaire.statut}</Badge>
                        </TableCell>
                        <TableCell>
                          {stagiaire.tuteur ? (
                            <div>
                              <div className="font-medium">{stagiaire.tuteur.name}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{stagiaire.tuteur.email}</div>
                            </div>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">Non assigné</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={attributions[stagiaire.id] || "none"}
                            onValueChange={(value) => handleAttributionChange(stagiaire.id, value)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Sélectionner un tuteur" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Aucun tuteur</SelectItem>
                              {tuteurs.map((tuteur) => (
                                <SelectItem key={tuteur.id} value={tuteur.id}>
                                  {tuteur.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
