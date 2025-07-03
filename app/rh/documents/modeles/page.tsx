
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { FileText, Plus, Edit, Trash2, Download } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Template {
  id: string
  nom: string
  type: string
  description: string
  contenu: string
  created_at: string
}

export default function RHModelesPage() {
  const [user, setUser] = useState<any>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
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
        await loadTemplates()
        setLoading(false)
      } catch (error) {
        console.error("💥 Erreur auth:", error)
        router.push("/auth/login")
      }
    }

    checkAuth()
  }, [router])

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/templates')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors du chargement")
      }

      setTemplates(result.data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des modèles:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les modèles",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR")
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce modèle ?")) {
      return
    }

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la suppression")
      }

      toast({
        title: "Succès",
        description: "Modèle supprimé avec succès",
      })

      await loadTemplates()
    } catch (error: any) {
      console.error("Erreur suppression modèle:", error)
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression",
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Modèles de documents</h1>
            <p className="text-gray-600">Gérer les modèles de documents de la plateforme</p>
          </div>
          <Button onClick={() => router.push("/rh/documents/modeles/nouveau")}>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau modèle
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Modèles ({templates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date création</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.nom}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{template.type}</Badge>
                    </TableCell>
                    <TableCell>{template.description}</TableCell>
                    <TableCell>{formatDate(template.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/rh/documents/modeles/${template.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`/api/templates/${template.id}/preview`, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
