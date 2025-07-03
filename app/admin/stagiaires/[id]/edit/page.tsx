"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { BackButton } from "@/components/ui/back-button"
import { toast } from "@/hooks/use-toast"
import { User, Building, UserCheck } from "lucide-react"

interface Stagiaire {
  id: string
  entreprise: string
  poste: string
  date_debut: string
  date_fin: string
  tuteur_id?: string
  statut: string
  commentaires?: string
  users: {
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

interface Tuteur {
  id: string
  name: string
  email: string
}

export default function EditStagiairePage() {
  const params = useParams()
  const router = useRouter()
  const [stagiaire, setStagiaire] = useState<Stagiaire | null>(null)
  const [tuteurs, setTuteurs] = useState<Tuteur[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    entreprise: "",
    poste: "",
    date_debut: "",
    date_fin: "",
    tuteur_id: "", // Updated to have a non-empty string default value
    statut: "",
    commentaires: "",
  })

  useEffect(() => {
    loadData()
  }, [params.id])

  const loadData = async () => {
    try {
      // Charger le stagiaire
      const stagiaireResponse = await fetch(`/api/admin/stagiaires/${params.id}`)
      const stagiaireData = await stagiaireResponse.json()

      if (!stagiaireResponse.ok) {
        throw new Error(stagiaireData.error || "Erreur lors du chargement du stagiaire")
      }

      // Charger les tuteurs disponibles
      const tuteursResponse = await fetch("/api/admin/tuteurs")
      const tuteursData = await tuteursResponse.json()

      if (tuteursResponse.ok) {
        setTuteurs(tuteursData.data || [])
      }

      const stagiaireInfo = stagiaireData.data
      setStagiaire(stagiaireInfo)

      // Remplir le formulaire
      setFormData({
        entreprise: stagiaireInfo.entreprise || "",
        poste: stagiaireInfo.poste || "",
        date_debut: stagiaireInfo.date_debut ? stagiaireInfo.date_debut.split("T")[0] : "",
        date_fin: stagiaireInfo.date_fin ? stagiaireInfo.date_fin.split("T")[0] : "",
        tuteur_id: stagiaireInfo.tuteur_id || "none", // Updated to have a non-empty string default value
        statut: stagiaireInfo.statut || "actif",
        commentaires: stagiaireInfo.commentaires || "",
      })
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/stagiaires/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la sauvegarde")
      }

      toast({
        title: "Succès",
        description: "Stagiaire mis à jour avec succès",
      })

      router.push("/admin/stagiaires")
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les modifications",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
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

  if (!stagiaire) {
    return (
      <div className="container mx-auto p-4">
        <BackButton href="/admin/stagiaires" />
        <div className="text-center py-8">
          <p className="text-gray-500">Stagiaire non trouvé</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <BackButton href="/admin/stagiaires" />
        <h1 className="text-2xl font-bold">Modifier le stagiaire</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
            <CardDescription>Ces informations ne peuvent pas être modifiées ici</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nom complet</Label>
              <Input value={stagiaire.users.name} disabled />
            </div>

            <div>
              <Label>Email</Label>
              <Input value={stagiaire.users.email} disabled />
            </div>

            {stagiaire.users.phone && (
              <div>
                <Label>Téléphone</Label>
                <Input value={stagiaire.users.phone} disabled />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attribution du tuteur */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Attribution du tuteur
            </CardTitle>
            <CardDescription>Assigner ou modifier le tuteur du stagiaire</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tuteur actuel</Label>
              <Input
                value={
                  stagiaire.tuteur ? `${stagiaire.tuteur.name} (${stagiaire.tuteur.email})` : "Aucun tuteur assigné"
                }
                disabled
              />
            </div>

            <div>
              <Label>Nouveau tuteur</Label>
              <Select
                value={formData.tuteur_id}
                onValueChange={(value) => setFormData({ ...formData, tuteur_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un tuteur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun tuteur</SelectItem> {/* Updated to have a non-empty string value */}
                  {tuteurs.map((tuteur) => (
                    <SelectItem key={tuteur.id} value={tuteur.id}>
                      {tuteur.name} ({tuteur.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Informations du stage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Informations du stage
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Entreprise *</Label>
            <Input
              value={formData.entreprise}
              onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
              placeholder="Nom de l'entreprise"
            />
          </div>

          <div>
            <Label>Poste *</Label>
            <Input
              value={formData.poste}
              onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
              placeholder="Intitulé du poste"
            />
          </div>

          <div>
            <Label>Date de début *</Label>
            <Input
              type="date"
              value={formData.date_debut}
              onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
            />
          </div>

          <div>
            <Label>Date de fin *</Label>
            <Input
              type="date"
              value={formData.date_fin}
              onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
            />
          </div>

          <div>
            <Label>Statut</Label>
            <Select value={formData.statut} onValueChange={(value) => setFormData({ ...formData, statut: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="termine">Terminé</SelectItem>
                <SelectItem value="suspendu">Suspendu</SelectItem>
                <SelectItem value="annule">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Commentaires */}
      <Card>
        <CardHeader>
          <CardTitle>Commentaires</CardTitle>
          <CardDescription>Notes et observations sur le stagiaire</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.commentaires}
            onChange={(e) => setFormData({ ...formData, commentaires: e.target.value })}
            placeholder="Ajouter des commentaires..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={() => router.push("/admin/stagiaires")}>
          Annuler
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Sauvegarde..." : "Sauvegarder les modifications"}
        </Button>
      </div>
    </div>
  )
}
