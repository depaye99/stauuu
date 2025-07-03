"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Header } from "@/components/layout/header"
import { User, Save, Building, Calendar, UserCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function StagiaireProfilPage() {
  const [user, setUser] = useState<any>(null)
  const [stagiaireData, setStagiaireData] = useState<any>(null)
  const [assignedTuteur, setAssignedTuteur] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
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
      if (!profile || profile.role !== "stagiaire") {
        router.push("/auth/login")
        return
      }

      setUser(profile)
      await loadStagiaireData(profile.id)
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadStagiaireData = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("stagiaires")
        .select(`
          *,
          tuteur:users!stagiaires_tuteur_id_fkey(id, name, email)
        `)
        .eq("user_id", userId)
        .single()

      if (data) {
        setStagiaireData(data)
        setAssignedTuteur(data.tuteur)
        setFormData({
          date_debut: data.date_debut || "",
          date_fin: data.date_fin || "",
          notes: data.notes || "",
        })
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données stagiaire:", error)
    }
  }

  const assignTuteurAutomatiquement = async () => {
    try {
      // Récupérer un tuteur disponible (celui avec le moins de stagiaires)
      const { data: tuteurs, error: tuteursError } = await supabase
        .from("users")
        .select(`
          id, name, email,
          stagiaires_count:stagiaires(count)
        `)
        .eq("role", "tuteur")
        .eq("is_active", true)

      if (tuteursError) throw tuteursError

      if (!tuteurs || tuteurs.length === 0) {
        throw new Error("Aucun tuteur disponible")
      }

      // Trouver le tuteur avec le moins de stagiaires
      const tuteurAvecMoinsDeStages = tuteurs.reduce((prev, current) => {
        const prevCount = prev.stagiaires_count?.[0]?.count || 0
        const currentCount = current.stagiaires_count?.[0]?.count || 0
        return currentCount < prevCount ? current : prev
      })

      return tuteurAvecMoinsDeStages.id
    } catch (error) {
      console.error("Erreur lors de l'assignation du tuteur:", error)
      // Fallback: prendre le premier tuteur disponible
      const { data: fallbackTuteur } = await supabase
        .from("users")
        .select("id")
        .eq("role", "tuteur")
        .eq("is_active", true)
        .limit(1)
        .single()

      return fallbackTuteur?.id || null
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const tuteurId = assignedTuteur?.id || (await assignTuteurAutomatiquement())

      if (!tuteurId) {
        throw new Error("Impossible d'assigner un tuteur")
      }

      const stagiaireDataToSave = {
        ...formData,
        entreprise: "Bridge Technologies Solutions", // Fixe et non modifiable
        poste: "Stagiaire", // Fixe et non modifiable
        tuteur_id: tuteurId,
        user_id: user.id,
        statut: "actif",
      }

      if (stagiaireData) {
        // Mettre à jour
        const { error } = await supabase.from("stagiaires").update(stagiaireDataToSave).eq("id", stagiaireData.id)
        if (error) throw error
      } else {
        // Créer
        const { error } = await supabase.from("stagiaires").insert([stagiaireDataToSave])
        if (error) throw error
      }

      toast({
        title: "Succès",
        description: "Profil de stagiaire mis à jour avec succès",
      })

      // Recharger les données
      await loadStagiaireData(user.id)
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le profil",
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
          <h1 className="text-3xl font-bold text-gray-900">Compléter mon profil de stagiaire</h1>
          <p className="text-gray-600">Renseignez vos informations de stage</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations de stage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Informations fixes non modifiables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="entreprise">
                  <Building className="h-4 w-4 inline mr-2" />
                  Entreprise
                </Label>
                <Input
                  id="entreprise"
                  value="Bridge Technologies Solutions"
                  disabled
                  className="bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Entreprise assignée automatiquement</p>
              </div>

              <div>
                <Label htmlFor="poste">Poste</Label>
                <Input id="poste" value="Stagiaire" disabled className="bg-gray-100 cursor-not-allowed" />
                <p className="text-xs text-gray-500 mt-1">Poste assigné automatiquement</p>
              </div>
            </div>

            {/* Tuteur assigné automatiquement */}
            {assignedTuteur && (
              <Alert>
                <UserCheck className="h-4 w-4" />
                <AlertDescription>
                  <strong>Tuteur assigné :</strong> {assignedTuteur.name} ({assignedTuteur.email})
                </AlertDescription>
              </Alert>
            )}

            {/* Champs modifiables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="date_debut">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Date de début *
                </Label>
                <Input
                  id="date_debut"
                  type="date"
                  value={formData.date_debut}
                  onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="date_fin">Date de fin *</Label>
                <Input
                  id="date_fin"
                  type="date"
                  value={formData.date_fin}
                  onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes / Objectifs</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Objectifs du stage, missions principales..."
                rows={4}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button variant="outline" onClick={() => router.push("/stagiaire")}>
                Retour au tableau de bord
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
