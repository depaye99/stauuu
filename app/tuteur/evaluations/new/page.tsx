"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, 
SelectTrigger, SelectValue } from "@/components/ui/select"

import { Header } from "@/components/layout/header"


import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Save, ArrowLeft } from "lucide-react"
import { Slider } from "@/components/ui/slider"


interface Stagiaire {
  id: string
  users: {
    name: string
    email: string
  }
}

interface FormData {
  stagiaire_id: string
  type: string
  note_globale: number
  competences_techniques: number
  competences_relationnelles: number
  autonomie: number
  initiative?: number
  ponctualite?: number
  commentaires: string
  points_forts: string
  axes_amelioration: string
  objectifs_suivants: string
  date_evaluation: string
}

export default function NewEvaluationPage() {
  const [stagiaires, setStagiaires] = useState<Stagiaire[]>([])
  const [formData, setFormData] = useState<FormData>({
    stagiaire_id: "",
    type: "",
    note_globale: 10,
    competences_techniques: 10,
    competences_relationnelles: 10,
    autonomie: 10,
    initiative: 10,
    ponctualite: 10,
    commentaires: "",
    points_forts: "",
    axes_amelioration: "",
    objectifs_suivants: "",
    date_evaluation: new Date().toISOString().split('T')[0]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  const router = useRouter()

  useEffect(() => {
    fetchUser()
    fetchStagiaires()
  }, [])

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/user")
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error("Erreur récupération utilisateur:", error)
    }
  }

  const fetchStagiaires = async () => {
    try {
      const response = await fetch("/api/tuteur/stagiaires")
      
      if (response.ok) {
        const data = await response.json()
        setStagiaires(data.stagiaires || [])
      }
    } catch (error) {
      console.error("Erreur récupération stagiaires:", error)
    }
  }

  const handleSliderChange = (field: keyof FormData, value: number[]) => {
    setFormData(prev => ({ ...prev, [field]: value[0] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/evaluations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erreur lors de la création")
      }

      router.push("/tuteur/evaluations")
    } catch (error: any) {
      console.error("Erreur:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getColorForNote = (note: number) => {
    if (note >= 16) return "text-green-600"
    if (note >= 12) return "text-orange-600"
    return "text-red-600"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Nouvelle évaluation</h1>
          <p className="text-gray-600">Créer une évaluation pour un stagiaire</p>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>Sélectionnez le stagiaire et le type d'évaluation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stagiaire">Stagiaire *</Label>
                  <Select value={formData.stagiaire_id} onValueChange={(value) => setFormData(prev => ({ ...prev, stagiaire_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un stagiaire" />
                    </SelectTrigger>
                    <SelectContent>
                      {stagiaires.map((stagiaire) => (
                        <SelectItem key={stagiaire.id} value={stagiaire.id}>
                          {stagiaire.users.name} ({stagiaire.users.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type d'évaluation *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mi_parcours">Mi-parcours</SelectItem>
                      <SelectItem value="finale">Finale</SelectItem>
                      <SelectItem value="auto_evaluation">Auto-évaluation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="date_evaluation">Date d'évaluation *</Label>
                  <Input
                    id="date_evaluation"
                    type="date"
                    value={formData.date_evaluation}
                    onChange={(e) => setFormData(prev => ({ ...prev, date_evaluation: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notes et compétences</CardTitle>
              <CardDescription>Évaluez les différentes compétences du stagiaire (0-20)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Note globale */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Note globale *</Label>
                  <span className={`font-bold text-lg ${getColorForNote(formData.note_globale)}`}>
                    {formData.note_globale}/20
                  </span>
                </div>
                <Slider
                  value={[formData.note_globale]}
                  onValueChange={(value) => handleSliderChange('note_globale', value)}
                  max={20}
                  min={0}
                  step={0.5}
                  className="w-full"
                />
              </div>

              {/* Compétences techniques */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Compétences techniques *</Label>
                  <span className={`font-bold text-lg ${getColorForNote(formData.competences_techniques)}`}>
                    {formData.competences_techniques}/20
                  </span>
                </div>
                <Slider
                  value={[formData.competences_techniques]}
                  onValueChange={(value) => handleSliderChange('competences_techniques', value)}
                  max={20}
                  min={0}
                  step={0.5}
                  className="w-full"
                />
              </div>

              {/* Compétences relationnelles */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Compétences relationnelles *</Label>
                  <span className={`font-bold text-lg ${getColorForNote(formData.competences_relationnelles)}`}>
                    {formData.competences_relationnelles}/20
                  </span>
                </div>
                <Slider
                  value={[formData.competences_relationnelles]}
                  onValueChange={(value) => handleSliderChange('competences_relationnelles', value)}
                  max={20}
                  min={0}
                  step={0.5}
                  className="w-full"
                />
              </div>

              {/* Autonomie */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Autonomie *</Label>
                  <span className={`font-bold text-lg ${getColorForNote(formData.autonomie)}`}>
                    {formData.autonomie}/20
                  </span>
                </div>
                <Slider
                  value={[formData.autonomie]}
                  onValueChange={(value) => handleSliderChange('autonomie', value)}
                  max={20}
                  min={0}
                  step={0.5}
                  className="w-full"
                />
              </div>

              {/* Initiative */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Initiative</Label>
                  <span className={`font-bold text-lg ${getColorForNote(formData.initiative || 0)}`}>
                    {formData.initiative}/20
                  </span>
                </div>
                <Slider
                  value={[formData.initiative || 0]}
                  onValueChange={(value) => handleSliderChange('initiative', value)}
                  max={20}
                  min={0}
                  step={0.5}
                  className="w-full"
                />
              </div>

              {/* Ponctualité */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Ponctualité</Label>
                  <span className={`font-bold text-lg ${getColorForNote(formData.ponctualite || 0)}`}>
                    {formData.ponctualite}/20
                  </span>
                </div>
                <Slider
                  value={[formData.ponctualite || 0]}
                  onValueChange={(value) => handleSliderChange('ponctualite', value)}
                  max={20}
                  min={0}
                  step={0.5}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Commentaires et observations</CardTitle>
              <CardDescription>Ajoutez vos commentaires détaillés</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="commentaires">Commentaires généraux</Label>
                <Textarea
                  id="commentaires"
                  placeholder="Commentaires généraux sur le stagiaire..."
                  value={formData.commentaires}
                  onChange={(e) => setFormData(prev => ({ ...prev, commentaires: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="points_forts">Points forts</Label>
                <Textarea
                  id="points_forts"
                  placeholder="Les points forts du stagiaire..."
                  value={formData.points_forts}
                  onChange={(e) => setFormData(prev => ({ ...prev, points_forts: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="axes_amelioration">Axes d'amélioration</Label>
                <Textarea
                  id="axes_amelioration"
                  placeholder="Les axes d'amélioration suggérés..."
                  value={formData.axes_amelioration}
                  onChange={(e) => setFormData(prev => ({ ...prev, axes_amelioration: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="objectifs_suivants">Objectifs suivants</Label>
                <Textarea
                  id="objectifs_suivants"
                  placeholder="Les objectifs pour la suite du stage..."
                  value={formData.objectifs_suivants}
                  onChange={(e) => setFormData(prev => ({ ...prev, objectifs_suivants: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.stagiaire_id || !formData.type}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Créer l'évaluation
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
