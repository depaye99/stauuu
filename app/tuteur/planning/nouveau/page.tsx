
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Header } from "@/components/layout/header"
import { Calendar, Clock, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Stagiaire {
  id: string
  user: {
    name: string
    email: string
  }
}

export default function NouveauPlanningPage() {
  const [user, setUser] = useState<any>(null)
  const [stagiaires, setStagiaires] = useState<Stagiaire[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    date_debut: "",
    date_fin: "",
    type: "formation",
    lieu: "",
    status: "planifie",
    stagiaire_id: ""
  })

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
      await loadStagiaires(session.user.id)
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadStagiaires = async (tuteurId: string) => {
    try {
      const { data, error } = await supabase
        .from("stagiaires")
        .select(`
          id,
          user:users!stagiaires_user_id_fkey(name, email)
        `)
        .eq("tuteur_id", tuteurId)
        .eq("statut", "actif")

      if (error) throw error
      setStagiaires(data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des stagiaires:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des stagiaires",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (!formData.titre || !formData.date_debut || !formData.date_fin) {
        throw new Error("Tous les champs obligatoires doivent être remplis")
      }

      if (new Date(formData.date_debut) >= new Date(formData.date_fin)) {
        throw new Error("La date de début doit être antérieure à la date de fin")
      }

      const response = await fetch("/api/planning", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erreur lors de la création")
      }

      toast({
        title: "Succès",
        description: "Événement planifié avec succès",
      })

      router.push("/tuteur/planning")
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la création",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header user={user} />

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nouvel événement</h1>
          <p className="text-gray-600 dark:text-gray-400">Créer un nouvel événement de planning</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Détails de l'événement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="titre">Titre *</Label>
                  <Input
                    id="titre"
                    value={formData.titre}
                    onChange={(e) => handleChange("titre", e.target.value)}
                    placeholder="Titre de l'événement"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type d'événement</Label>
                  <Select value={formData.type} onValueChange={(value) => handleChange("type", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formation">Formation</SelectItem>
                      <SelectItem value="reunion">Réunion</SelectItem>
                      <SelectItem value="evaluation">Évaluation</SelectItem>
                      <SelectItem value="projet">Projet</SelectItem>
                      <SelectItem value="presentation">Présentation</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_debut">Date et heure de début *</Label>
                  <Input
                    id="date_debut"
                    type="datetime-local"
                    value={formData.date_debut}
                    onChange={(e) => handleChange("date_debut", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_fin">Date et heure de fin *</Label>
                  <Input
                    id="date_fin"
                    type="datetime-local"
                    value={formData.date_fin}
                    onChange={(e) => handleChange("date_fin", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stagiaire_id">Stagiaire concerné</Label>
                  <Select value={formData.stagiaire_id} onValueChange={(value) => handleChange("stagiaire_id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un stagiaire" />
                    </SelectTrigger>
                    <SelectContent>
                      {stagiaires.map((stagiaire) => (
                        <SelectItem key={stagiaire.id} value={stagiaire.id}>
                          {stagiaire.user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lieu">Lieu</Label>
                  <Input
                    id="lieu"
                    value={formData.lieu}
                    onChange={(e) => handleChange("lieu", e.target.value)}
                    placeholder="Lieu de l'événement"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Description de l'événement"
                  rows={4}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={saving}>
                  {saving ? "Création..." : "Créer l'événement"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
