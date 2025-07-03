"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Upload, File, X, Loader2 } from "lucide-react"

interface DocumentUploadProps {
  onUploadSuccess?: (document: any) => void
  onUploadError?: (error: string) => void
  acceptedTypes?: string[]
  maxSize?: number
}

export function DocumentUpload({ 
  onUploadSuccess, 
  onUploadError,
  acceptedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.txt'],
  maxSize = 10 * 1024 * 1024 // 10MB
}: DocumentUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [metadata, setMetadata] = useState({
    nom: "",
    type: "autre" as "stage" | "evaluation" | "autre",
    description: ""
  })

  const { toast } = useToast()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setSelectedFile(file)
      
      // Auto-remplir le nom si vide
      if (!metadata.nom) {
        const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, "")
        setMetadata(prev => ({ ...prev, nom: nameWithoutExtension }))
      }
    }
  }, [metadata.nom])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'text/plain': ['.txt']
    },
    maxSize: maxSize,
    multiple: false
  })

  // Afficher les erreurs de rejet de fichier
  if (fileRejections.length > 0) {
    const rejection = fileRejections[0]
    const errorCode = rejection.errors[0]?.code
    
    let errorMessage = "Fichier rejeté"
    if (errorCode === 'file-too-large') {
      errorMessage = `Fichier trop volumineux (max ${formatFileSize(maxSize)})`
    } else if (errorCode === 'file-invalid-type') {
      errorMessage = "Type de fichier non autorisé"
    }
    
    toast({
      title: "Erreur",
      description: errorMessage,
      variant: "destructive"
    })
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un fichier",
        variant: "destructive"
      })
      return
    }

    if (!metadata.nom.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez donner un nom au document",
        variant: "destructive"
      })
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("metadata", JSON.stringify(metadata))

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'upload")
      }

      toast({
        title: "Succès",
        description: "Document uploadé avec succès"
      })

      // Reset form
      setSelectedFile(null)
      setMetadata({ nom: "", type: "autre", description: "" })

      if (onUploadSuccess && result.document) {
        onUploadSuccess(result.document)
      }

    } catch (error: any) {
      console.error("Erreur upload:", error)
      const errorMessage = error.message || "Erreur lors de l'upload"
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      })

      if (onUploadError) {
        onUploadError(errorMessage)
      }
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Zone de drop */}
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-blue-600">Déposez le fichier ici...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Glissez-déposez un fichier ici, ou cliquez pour sélectionner
                </p>
                <p className="text-sm text-gray-500">
                  PDF, DOC, DOCX, JPG, PNG, TXT (max {formatFileSize(maxSize)})
                </p>
              </div>
            )}
          </div>

          {/* Fichier sélectionné */}
          {selectedFile && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <File className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Métadonnées */}
      {selectedFile && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <Label htmlFor="nom">Nom du document *</Label>
              <Input
                id="nom"
                value={metadata.nom}
                onChange={(e) => setMetadata(prev => ({ ...prev, nom: e.target.value }))}
                placeholder="Nom du document"
                disabled={uploading}
              />
            </div>

            <div>
              <Label htmlFor="type">Type de document</Label>
              <Select 
                value={metadata.type} 
                onValueChange={(value) => setMetadata(prev => ({ ...prev, type: value as any }))}
                disabled={uploading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stage">Document de stage</SelectItem>
                  <SelectItem value="evaluation">Évaluation</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={metadata.description}
                onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description optionnelle"
                rows={3}
                disabled={uploading}
              />
            </div>

            <Button
              onClick={handleUpload}
              disabled={uploading || !selectedFile || !metadata.nom.trim()}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Upload en cours...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Uploader le document
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
