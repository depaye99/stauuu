"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { ArrowLeft, Save, Star } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

interface Stagiaire {
  id: string
  users: {
    name: string
    email: string
  }
  specialite: string
  niveau: string
}

interface EvaluationForm {
  type: string
  note_globale: number
  competences_techniques: number
  competences_relationnelles: number
  autonomie: number
  initiative: number
  ponctualite: number
  commentaires: string
  points_forts: string
  axes_amelioration: string
  objectifs_suivants: string
}

export default function StagiaireEvaluationPage() {
  const [user, setUser] = useState<any>(null)
  const [stagiaire, setStagiaire] = useState<Stagiaire | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationForm>({
    type: "mi_parcours",
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
      if (!profile || profile.role !== "tuteur") {
        router.push("/auth/login")
        return
      }

      setUser(profile)
      await loadStagiaire()
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase, params.id])

  const loadStagiaire = async () => {
    try {
      const { data, error } = await supabase
        .from("stagiaires")
        .select(`
          *,
          users!inner(name, email)
        `)
        .eq("id", params.id)
        .single()

      if (error) throw error
      setStagiaire(data)
    } catch (error) {
      console.error("Erreur lors du chargement du stagiaire:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les informations du stagiaire",
        variant: "destructive",
      })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.from("evaluations").insert([
        {
          ...evaluation,
          stagiaire_id: params.id,
          evaluateur_id: user.id,
          date_evaluation: new Date().toISOString(),
        },
      ])

      if (error) throw error

      toast({
        title: "Succès",
        description: "Évaluation enregistrée avec succès",
      })

      router.push(`/tuteur/stagiaires/${params.id}`)
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer l'évaluation",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const updateEvaluation = (field: keyof EvaluationForm, value: any) => {
    setEvaluation((prev) => ({ ...prev, [field]: value }))
  }

  const calculateGlobalNote = () => {
    const notes = [
      evaluation.competences_techniques,
      evaluation.competences_relationnelles,
      evaluation.autonomie,
      evaluation.initiative,
      evaluation.ponctualite,
    ]
    const moyenne = notes.reduce((sum, note) => sum + note, 0) / notes.length
    updateEvaluation("note_globale", Math.round(moyenne))
  }

  useEffect(() => {
    calculateGlobalNote()
  }, [
    evaluation.competences_techniques,
    evaluation.competences_relationnelles,
    evaluation.autonomie,
    evaluation.initiative,
    evaluation.ponctualite,
  ])

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
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Évaluation de {stagiaire?.users?.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {stagiaire?.specialite} - {stagiaire?.niveau}
              </p>
            </div>

            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Type d'évaluation */}
          <Card>
            <CardHeader>
              <CardTitle>Type d'évaluation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Type d'évaluation</Label>
                  <Select value={evaluation.type} onValueChange={(value) => updateEvaluation("type", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mi_parcours">Mi-parcours</SelectItem>
                      <SelectItem value="finale">Finale</SelectItem>
                      <SelectItem value="auto_evaluation">Auto-évaluation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Note globale</Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span className="text-2xl font-bold">{evaluation.note_globale}/20</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Critères d'évaluation */}
          <Card>
            <CardHeader>
              <CardTitle>Critères d'évaluation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Compétences techniques ({evaluation.competences_techniques}/20)</Label>
                <Slider
                  value={[evaluation.competences_techniques]}
                  onValueChange={(value) => updateEvaluation("competences_techniques", value[0])}
                  max={20}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Compétences relationnelles ({evaluation.competences_relationnelles}/20)</Label>
                <Slider
                  value={[evaluation.competences_relationnelles]}
                  onValueChange={(value) => updateEvaluation("competences_relationnelles", value[0])}
                  max={20}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Autonomie ({evaluation.autonomie}/20)</Label>
                <Slider
                  value={[evaluation.autonomie]}
                  onValueChange={(value) => updateEvaluation("autonomie", value[0])}
                  max={20}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Initiative ({evaluation.initiative}/20)</Label>
                <Slider
                  value={[evaluation.initiative]}
                  onValueChange={(value) => updateEvaluation("initiative", value[0])}
                  max={20}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Ponctualité ({evaluation.ponctualite}/20)</Label>
                <Slider
                  value={[evaluation.ponctualite]}
                  onValueChange={(value) => updateEvaluation("ponctualite", value[0])}
                  max={20}
                  step={1}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Commentaires */}
          <Card>
            <CardHeader>
              <CardTitle>Commentaires détaillés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="commentaires">Commentaires généraux</Label>
                <Textarea
                  id="commentaires"
                  value={evaluation.commentaires}
                  onChange={(e) => updateEvaluation("commentaires", e.target.value)}
                  placeholder="Commentaires généraux sur la performance du stagiaire..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="points_forts">Points forts</Label>
                <Textarea
                  id="points_forts"
                  value={evaluation.points_forts}
                  onChange={(e) => updateEvaluation("points_forts", e.target.value)}
                  placeholder="Quels sont les points forts du stagiaire ?"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="axes_amelioration">Axes d'amélioration</Label>
                <Textarea
                  id="axes_amelioration"
                  value={evaluation.axes_amelioration}
                  onChange={(e) => updateEvaluation("axes_amelioration", e.target.value)}
                  placeholder="Quels sont les axes d'amélioration ?"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="objectifs_suivants">Objectifs pour la suite</Label>
                <Textarea
                  id="objectifs_suivants"
                  value={evaluation.objectifs_suivants}
                  onChange={(e) => updateEvaluation("objectifs_suivants", e.target.value)}
                  placeholder="Quels sont les objectifs pour la suite du stage ?"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Enregistrement..." : "Enregistrer l'évaluation"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
