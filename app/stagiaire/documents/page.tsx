"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { FileText, Search, Upload, Download, Eye } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Document {
  id: string
  nom: string
  type: string
  taille: number
  url: string
  is_public: boolean
  created_at: string
}

export default function StagiaireDocumentsPage() {
  const [user, setUser] = useState<any>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMetadata, setUploadMetadata] = useState({
    nom: "",
    type: "autre" as "stage" | "evaluation" | "autre",
    description: "",
    is_public: false
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
      if (!profile) {
        router.push("/auth/login")
        return
      }

      setUser(profile)
      await loadDocuments(session.user.id)
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadDocuments = async (userId: string) => {
    try {
      const response = await fetch(`/api/documents?user_id=${userId}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors du chargement")
      }

      setDocuments(result.data || [])
      setFilteredDocuments(result.data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des documents:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    let filtered = documents

    if (searchQuery) {
      filtered = filtered.filter(
        (doc) =>
          doc.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.type.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredDocuments(filtered)
  }, [documents, searchQuery])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR")
  }

  const handleUpload = async (file: File, metadata: any) => {
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("nom", metadata.nom)
      formData.append("type", metadata.type)
      formData.append("description", metadata.description)
      formData.append("is_public", metadata.is_public?.toString() || "false")

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'upload")
      }

      toast({
        title: "Succès",
        description: "Document uploadé avec succès",
      })

      // Recharger les documents
      if (user) {
        await loadDocuments(user.id)
      }
    } catch (error) {
      console.error("Erreur upload:", error)
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'upload",
        variant: "destructive",
      })
    }
  }

  const handleDownload = async (document: Document) => {
    try {
      const response = await fetch(`/api/documents/${document.id}/download`)

      if (!response.ok) {
        throw new Error("Erreur lors du téléchargement")
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = document.nom
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "Succès",
        description: "Document téléchargé avec succès",
      })
    } catch (error) {
      console.error("Erreur téléchargement:", error)
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le document",
        variant: "destructive",
      })
    }
  }

  const handleView = async (document: Document) => {
    try {
      const response = await fetch(`/api/documents/${document.id}/content`)

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        window.open(url, '_blank')
        URL.revokeObjectURL(url)
      } else {
        toast({
          title: "Information",
          description: "Prévisualisation non disponible pour ce type de fichier",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Erreur prévisualisation:", error)
      toast({
        title: "Erreur",
        description: "Impossible de prévisualiser le document",
        variant: "destructive",
      })
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

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mes documents</h1>
          <p className="text-gray-600">Gérer vos documents personnels</p>
        </div>

        {/* Actions */}
        <div className="mb-6">
          <Button onClick={() => setShowUploadDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Télécharger un document
          </Button>
        </div>

        {/* Recherche */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom ou type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Liste des documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Mes documents ({filteredDocuments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredDocuments.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun document</h3>
                <p className="mt-1 text-sm text-gray-500">Commencez par télécharger votre premier document.</p>
                <div className="mt-6">
                  <Button onClick={() => setShowUploadDialog(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Télécharger un document
                  </Button>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead>Visibilité</TableHead>
                    <TableHead>Date création</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell className="font-medium">{document.nom}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{document.type}</Badge>
                      </TableCell>
                      <TableCell>{formatFileSize(document.taille)}</TableCell>
                      <TableCell>
                        <Badge variant={document.is_public ? "default" : "secondary"}>
                          {document.is_public ? "Public" : "Privé"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(document.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleView(document)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDownload(document)}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog d'upload */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Télécharger un document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">Fichier</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setSelectedFile(file)
                      if (!uploadMetadata.nom) {
                        setUploadMetadata(prev => ({
                          ...prev,
                          nom: file.name.replace(/\.[^/.]+$/, "")
                        }))
                      }
                    }
                  }}
                />
              </div>
              <div>
                <Label htmlFor="nom">Nom du document</Label>
                <Input
                  id="nom"
                  value={uploadMetadata.nom}
                  onChange={(e) => setUploadMetadata(prev => ({ ...prev, nom: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={uploadMetadata.type} onValueChange={(value) => setUploadMetadata(prev => ({ ...prev, type: value as any }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stage">Stage</SelectItem>
                    <SelectItem value="evaluation">Évaluation</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={uploadMetadata.description}
                  onChange={(e) => setUploadMetadata(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                  Annuler
                </Button>
                <Button 
                  onClick={async () => {
                    if (selectedFile) {
                      setUploading(true)
                      await handleUpload(selectedFile, uploadMetadata)
                      setUploading(false)
                      setShowUploadDialog(false)
                      setSelectedFile(null)
                      setUploadMetadata({
                        nom: "",
                        type: "autre",
                        description: "",
                        is_public: false
                      })
                    }
                  }}
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? "Upload..." : "Télécharger"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}