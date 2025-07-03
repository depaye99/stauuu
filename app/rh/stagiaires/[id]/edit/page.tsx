"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BackButton } from "@/components/ui/back-button"
import { Header } from "@/components/layout/header"
import { useToast } from "@/hooks/use-toast"
import { Edit, Save, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

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

export default function RHEditStagiairePage() {
  const [user, setUser] = useState<any>(null)
  const [stagiaire, setStagiaire] = useState<StagiaireDetail | null>(null)
  const [tuteurs, setTuteurs] = useState<Tuteur[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    entreprise: "",
    poste: "",
    date_debut: "",
    date_fin: "",
    tuteur_id: "",
    statut: "actif",
    notes: "",
  })

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
      await Promise.all([loadStagiaire(), loadTuteurs()])
      setLoading(false)
    }

    checkAuth()
  }, [params.id])

  const loadStagiaire = async () => {
    try {
      const response = await fetch(`/api/rh/stagiaires/${params.id}`)
      const data = await response.json()

      if (data.success) {
        const stagiaireData = data.data
        setStagiaire(stagiaireData)
        setFormData({
          entreprise: stagiaireData.entreprise || "",
          poste: stagiaireData.poste || "",
          date_debut: stagiaireData.date_debut || "",
          date_fin: stagiaireData.date_fin || "",
          tuteur_id: stagiaireData.tuteur_id || "default",
          statut: stagiaireData.statut || "actif",
          notes: stagiaireData.notes || "",
        })
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

  const loadTuteurs = async () => {
    try {
      const { data: tuteursList } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("role", "tuteur")
        .order("name")

      setTuteurs(tuteursList || [])
    } catch (error) {
      console.error("Erreur lors du chargement des tuteurs:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.entreprise || !formData.poste || !formData.date_debut || !formData.date_fin) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/rh/stagiaires/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Succès",
          description: "Stagiaire mis à jour avec succès",
        })
        router.push(`/rh/stagiaires/${params.id}`)
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour du stagiaire",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Stagiaire non trouvé</h3>
              <p className="text-gray-500">Le stagiaire demandé n'existe pas.</p>
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
          <BackButton href={`/rh/stagiaires/${params.id}`} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Modifier le stagiaire - {stagiaire.user?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="entreprise">Entreprise *</Label>
                  <Input
                    id="entreprise"
                    value={formData.entreprise}
                    onChange={(e) => handleInputChange("entreprise", e.target.value)}
                    placeholder="Nom de l'entreprise"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="poste">Poste *</Label>
                  <Input
                    id="poste"
                    value={formData.poste}
                    onChange={(e) => handleInputChange("poste", e.target.value)}
                    placeholder="Poste du stagiaire"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_debut">Date de début *</Label>
                  <Input
                    id="date_debut"
                    type="date"
                    value={formData.date_debut}
                    onChange={(e) => handleInputChange("date_debut", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_fin">Date de fin *</Label>
                  <Input
                    id="date_fin"
                    type="date"
                    value={formData.date_fin}
                    onChange={(e) => handleInputChange("date_fin", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tuteur_id">Tuteur</Label>
                  <Select value={formData.tuteur_id} onValueChange={(value) => handleInputChange("tuteur_id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un tuteur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Aucun tuteur</SelectItem>
                      {tuteurs.map((tuteur) => (
                        <SelectItem key={tuteur.id} value={tuteur.id}>
                          {tuteur.name} ({tuteur.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statut">Statut</Label>
                  <Select value={formData.statut} onValueChange={(value) => handleInputChange("statut", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="actif">Actif</SelectItem>
                      <SelectItem value="termine">Terminé</SelectItem>
                      <SelectItem value="suspendu">Suspendu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Notes additionnelles sur le stagiaire..."
                  rows={3}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Sauvegarder
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push(`/rh/stagiaires/${params.id}`)}>
                  <X className="mr-2 h-4 w-4" />
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
