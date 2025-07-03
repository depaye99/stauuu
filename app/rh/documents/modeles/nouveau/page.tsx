
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Header } from "@/components/layout/header"
import { FileText, Save, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function NouveauModelePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    nom: "",
    type: "convention",
    description: "",
    contenu: "",
    variables: []
  })
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/user", {
          method: "GET",
          credentials: "include"
        })

        if (!response.ok) {
          router.push("/auth/login")
          return
        }

        const { user } = await response.json()

        if (!user || user.role !== "rh") {
          router.push("/auth/login")
          return
        }

        setUser(user)
        setLoading(false)
      } catch (error) {
        console.error("💥 Erreur auth:", error)
        router.push("/auth/login")
      }
    }

    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nom || !formData.contenu) {
      toast({
        title: "Erreur",
        description: "Le nom et le contenu sont requis",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const response = await fetch("/api/templates", {
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

      toast({
        title: "Succès",
        description: "Modèle créé avec succès",
      })

      router.push("/rh/documents/modeles")
    } catch (error: any) {
      console.error("Erreur création modèle:", error)
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création",
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
        <div className="mb-8 flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nouveau modèle</h1>
            <p className="text-gray-600">Créer un nouveau modèle de document</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informations du modèle
              </CardTitle>
              <CardDescription>
                Définissez les informations de base du modèle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nom du modèle *</label>
                  <Input
                    value={formData.nom}
                    onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                    placeholder="Ex: Convention de stage standard"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Type *</label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="convention">Convention de stage</SelectItem>
                      <SelectItem value="attestation">Attestation de stage</SelectItem>
                      <SelectItem value="evaluation">Fiche d'évaluation</SelectItem>
                      <SelectItem value="rapport">Rapport de stage</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description du modèle et de son utilisation"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Contenu du modèle *</label>
                <Textarea
                  value={formData.contenu}
                  onChange={(e) => setFormData(prev => ({ ...prev, contenu: e.target.value }))}
                  placeholder="Contenu du document avec variables : {{nom_stagiaire}}, {{entreprise}}, {{periode_stage}}, etc."
                  rows={15}
                  className="font-mono text-sm"
                  required
                />
                <p className="text-xs text-gray-500">
                  Utilisez des variables entre accolades doubles : {"{{nom_stagiaire}}"}, {"{{entreprise}}"}, {"{{date_debut}}"}, {"{{date_fin}}"}
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Annuler
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Création...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Créer le modèle
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  )
}
