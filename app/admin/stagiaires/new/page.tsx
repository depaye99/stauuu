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
import { UserPlus, Save, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function NewStagiairePage() {
  const [user, setUser] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [tuteurs, setTuteurs] = useState<any[]>([])
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
      if (!profile || profile.role !== "admin") {
        router.push("/auth/login")
        return
      }

      setUser(profile)
      await loadUsers()
      await loadTuteurs()
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadUsers = async () => {
    try {
      console.log("🔍 Chargement des utilisateurs...")

      // Récupérer les utilisateurs qui ne sont pas encore stagiaires
      const { data: existingStagiaires } = await supabase.from("stagiaires").select("user_id")
      const existingIds = existingStagiaires?.map((s) => s.user_id) || []

      console.log("📋 Stagiaires existants:", existingIds.length)

      let query = supabase.from("users").select("id, name, email").eq("role", "stagiaire").eq("is_active", true)

      if (existingIds.length > 0) {
        query = query.not("id", "in", `(${existingIds.join(",")})`)
      }

      const { data, error } = await query

      if (error) {
        console.error("❌ Erreur utilisateurs:", error)
        throw error
      }

      console.log("✅ Utilisateurs disponibles:", data?.length || 0)
      setUsers(data || [])
    } catch (error) {
      console.error("💥 Erreur lors du chargement des utilisateurs:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs",
        variant: "destructive",
      })
    }
  }

  const loadTuteurs = async () => {
    try {
      console.log("🔍 Chargement des tuteurs...")

      const { data, error } = await supabase.from("users").select("id, name").eq("role", "tuteur").eq("is_active", true)

      if (error) {
        console.error("❌ Erreur tuteurs:", error)
        throw error
      }

      console.log("✅ Tuteurs disponibles:", data?.length || 0)
      setTuteurs(data || [])
    } catch (error) {
      console.error("💥 Erreur lors du chargement des tuteurs:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les tuteurs",
        variant: "destructive",
      })
    }
  }

  const handleSave = async () => {
    if (!formData.user_id) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un utilisateur",
        variant: "destructive",
      })
      return
    }

    if (!formData.entreprise || !formData.poste) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir l'entreprise et le poste",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      console.log("💾 Sauvegarde stagiaire:", formData)

      const response = await fetch("/api/admin/stagiaires", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la création")
      }

      console.log("✅ Stagiaire créé:", result.data)

      toast({
        title: "Succès",
        description: "Stagiaire créé avec succès",
      })

      router.push("/admin/stagiaires")
    } catch (error) {
      console.error("❌ Erreur lors de la création:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer le stagiaire",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
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
        <div className="mb-8">
          <Button variant="outline" onClick={() => router.push("/admin/stagiaires")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Nouveau stagiaire</h1>
          <p className="text-gray-600">Créer un nouveau profil de stagiaire</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Informations du stagiaire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="user_id">Utilisateur *</Label>
                <Select
                  value={formData.user_id}
                  onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un utilisateur" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.length === 0 ? (
                      <SelectItem value="" disabled>
                        Aucun utilisateur disponible
                      </SelectItem>
                    ) : (
                      users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {users.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Tous les utilisateurs stagiaires sont déjà assignés ou aucun utilisateur stagiaire n'existe.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="entreprise">Entreprise *</Label>
                <Input
                  id="entreprise"
                  value={formData.entreprise}
                  onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
                  placeholder="Nom de l'entreprise"
                  required
                />
              </div>
              <div>
                <Label htmlFor="poste">Poste *</Label>
                <Input
                  id="poste"
                  value={formData.poste}
                  onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
                  placeholder="Intitulé du poste"
                  required
                />
              </div>
              <div>
                <Label htmlFor="date_debut">Date de début</Label>
                <Input
                  id="date_debut"
                  type="date"
                  value={formData.date_debut}
                  onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="date_fin">Date de fin</Label>
                <Input
                  id="date_fin"
                  type="date"
                  value={formData.date_fin}
                  onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="tuteur_id">Tuteur</Label>
                <Select
                  value={formData.tuteur_id}
                  onValueChange={(value) => setFormData({ ...formData, tuteur_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un tuteur (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    {tuteurs.length === 0 ? (
                      <SelectItem value="" disabled>
                        Aucun tuteur disponible
                      </SelectItem>
                    ) : (
                      tuteurs.map((tuteur) => (
                        <SelectItem key={tuteur.id} value={tuteur.id}>
                          {tuteur.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notes sur le stagiaire..."
                  rows={4}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Création..." : "Créer le stagiaire"}
              </Button>
              <Button variant="outline" onClick={() => router.push("/admin/stagiaires")}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
