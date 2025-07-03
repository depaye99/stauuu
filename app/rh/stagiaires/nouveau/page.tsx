"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BackButton } from "@/components/ui/back-button"
import { Header } from "@/components/layout/header"
import { useToast } from "@/hooks/use-toast"
import { UserPlus, Save, X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface User {
  id: string
  name: string
  email: string
}

export default function RHNouveauStagiairePage() {
  const [user, setUser] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [tuteurs, setTuteurs] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    user_id: "",
    tuteur_id: "",
    entreprise: "",
    poste: "",
    date_debut: "",
    date_fin: "",
    notes: "",
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
      if (!profile || profile.role !== "rh") {
        router.push("/auth/login")
        return
      }

      setUser(profile)
      await loadData()
      setLoading(false)
    }

    checkAuth()
  }, [])

  const loadData = async () => {
    try {
      // Charger tous les utilisateurs qui ne sont pas encore stagiaires
      const { data: allUsers, error: usersError } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("is_active", true)
        .order("name")

      if (usersError) {
        console.error("Erreur chargement utilisateurs:", usersError)
        return
      }

      // Charger les stagiaires existants pour les exclure
      const { data: existingStagiaires } = await supabase.from("stagiaires").select("user_id")

      const existingUserIds = existingStagiaires?.map((s) => s.user_id) || []
      const availableUsers = allUsers?.filter((u) => !existingUserIds.includes(u.id)) || []

      setUsers(availableUsers)

      // Charger les tuteurs
      const { data: tuteursList } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("role", "tuteur")
        .order("name")

      setTuteurs(tuteursList || [])
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.user_id || !formData.entreprise || !formData.poste || !formData.date_debut || !formData.date_fin) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      const response = await fetch("/api/rh/stagiaires", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Succès",
          description: "Stagiaire créé avec succès",
        })
        router.push("/rh/stagiaires")
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création du stagiaire",
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <BackButton href="/rh/stagiaires" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Nouveau stagiaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="user_id">Utilisateur *</Label>
                  <Select value={formData.user_id} onValueChange={(value) => handleInputChange("user_id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un utilisateur" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tuteur_id">Tuteur</Label>
                  <Select value={formData.tuteur_id} onValueChange={(value) => handleInputChange("tuteur_id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un tuteur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun tuteur</SelectItem>
                      {tuteurs.map((tuteur) => (
                        <SelectItem key={tuteur.id} value={tuteur.id}>
                          {tuteur.name} ({tuteur.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
                      Création...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Créer le stagiaire
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/rh/stagiaires")}>
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