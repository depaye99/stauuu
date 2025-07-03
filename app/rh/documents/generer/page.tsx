
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Header } from "@/components/layout/header"
import { FileText, Download } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function RHGenererPage() {
  const [user, setUser] = useState<any>(null)
  const [stagiaires, setStagiaires] = useState<any[]>([])
  const [selectedStagiaire, setSelectedStagiaire] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const router = useRouter()
  const supabase = createClient()
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
        await loadStagiaires()
        setLoading(false)
      } catch (error) {
        console.error("💥 Erreur auth:", error)
        router.push("/auth/login")
      }
    }

    checkAuth()
  }, [router])

  const loadStagiaires = async () => {
    try {
      const response = await fetch('/api/rh/stagiaires')
      const result = await response.json()

      if (response.ok && result.success) {
        setStagiaires(result.data || [])
      }
    } catch (error) {
      console.error("Erreur lors du chargement des stagiaires:", error)
    }
  }

  const handleGenerate = async () => {
    if (!selectedStagiaire || !selectedTemplate) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un stagiaire et un modèle",
        variant: "destructive",
      })
      return
    }

    setGenerating(true)
    try {
      console.log("🔄 Génération document:", { stagiaireId: selectedStagiaire, templateType: selectedTemplate })
      
      const response = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stagiaireId: selectedStagiaire,
          templateType: selectedTemplate,
        }),
      })

      const result = await response.json()
      console.log("📋 Résultat génération:", result)

      if (response.ok && result.success) {
        toast({
          title: "Succès",
          description: "Document généré avec succès",
        })
        
        // Ouvrir le document dans un nouvel onglet
        if (result.downloadUrl) {
          window.open(result.downloadUrl, '_blank')
        }
        
        // Recharger la liste après génération
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        throw new Error(result.error || "Erreur lors de la génération")
      }
    } catch (error) {
      console.error("💥 Erreur génération:", error)
      toast({
        title: "Erreur",
        description: "Impossible de générer le document: " + error.message,
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
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
          <h1 className="text-3xl font-bold text-gray-900">Générer un document</h1>
          <p className="text-gray-600">Générer automatiquement des documents pour les stagiaires</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Génération de document
            </CardTitle>
            <CardDescription>
              Sélectionnez un stagiaire et un type de document à générer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Stagiaire</label>
                <Select value={selectedStagiaire} onValueChange={setSelectedStagiaire}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un stagiaire" />
                  </SelectTrigger>
                  <SelectContent>
                    {stagiaires.map((stagiaire) => (
                      <SelectItem key={stagiaire.id} value={stagiaire.id}>
                        {stagiaire.users?.name} - {stagiaire.entreprise}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type de document</label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un modèle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="convention">Convention de stage</SelectItem>
                    <SelectItem value="attestation">Attestation de stage</SelectItem>
                    <SelectItem value="evaluation">Fiche d'évaluation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleGenerate} 
                disabled={generating || !selectedStagiaire || !selectedTemplate}
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Génération...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Générer le document
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
