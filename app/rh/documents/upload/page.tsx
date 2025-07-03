
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Header } from "@/components/layout/header"
import { Upload, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function RHUploadPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    nom: "",
    type: "autre",
    description: "",
    is_public: false
  })
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
        setLoading(false)
      } catch (error) {
        console.error("💥 Erreur auth:", error)
        router.push("/auth/login")
      }
    }

    checkAuth()
  }, [router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!formData.nom) {
        setFormData(prev => ({ ...prev, nom: file.name.replace(/\.[^/.]+$/, "") }))
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !formData.nom) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier et renseigner un nom",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", selectedFile)
      uploadFormData.append("nom", formData.nom)
      uploadFormData.append("type", formData.type)
      uploadFormData.append("description", formData.description)
      uploadFormData.append("is_public", formData.is_public.toString())

      const response = await fetch("/api/documents", {
        method: "POST",
        body: uploadFormData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'upload")
      }

      toast({
        title: "Succès",
        description: "Document uploadé avec succès",
      })

      // Réinitialiser le formulaire
      setSelectedFile(null)
      setFormData({
        nom: "",
        type: "autre",
        description: "",
        is_public: false
      })

      // Rediriger vers la liste des documents
      router.push("/rh/documents")
    } catch (error) {
      console.error("Erreur upload:", error)
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'upload",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
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
          <h1 className="text-3xl font-bold text-gray-900">Télécharger un document</h1>
          <p className="text-gray-600">Ajouter un nouveau document à la plateforme</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload de document
            </CardTitle>
            <CardDescription>
              Téléchargez un document (PDF, DOC, DOCX, JPG, PNG - Max 10MB)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fichier *</label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {selectedFile && (
                <p className="text-sm text-gray-600">
                  Fichier sélectionné: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nom du document *</label>
                <Input
                  value={formData.nom}
                  onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                  placeholder="Nom du document"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="convention">Convention</SelectItem>
                    <SelectItem value="attestation">Attestation</SelectItem>
                    <SelectItem value="evaluation">Évaluation</SelectItem>
                    <SelectItem value="stage">Stage</SelectItem>
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
                placeholder="Description du document (optionnel)"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_public"
                checked={formData.is_public}
                onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
              />
              <label htmlFor="is_public" className="text-sm">
                Document public (visible par tous les utilisateurs)
              </label>
            </div>

            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={() => router.push("/rh/documents")}>
                Annuler
              </Button>
              <Button onClick={handleUpload} disabled={uploading || !selectedFile || !formData.nom}>
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Upload...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Télécharger
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
