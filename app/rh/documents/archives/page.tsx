
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { FileText, Search, Download, Eye, RotateCcw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function RHArchivesPage() {
  const [user, setUser] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
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
        await loadArchivedDocuments()
        setLoading(false)
      } catch (error) {
        console.error("💥 Erreur auth:", error)
        router.push("/auth/login")
      }
    }

    checkAuth()
  }, [router])

  const loadArchivedDocuments = async () => {
    try {
      // Pour le moment, simulons des documents archivés
      const mockArchives = [
        {
          id: "arch-1",
          nom: "Convention_Stage_2023.pdf",
          type: "convention",
          taille: 245760,
          users: { name: "Marie Dubois", email: "marie.dubois@example.com" },
          is_public: false,
          created_at: "2023-12-01T10:00:00Z",
          archived_at: "2024-01-15T14:30:00Z"
        },
        {
          id: "arch-2",
          nom: "Attestation_Stage_Jean.pdf",
          type: "attestation",
          taille: 156780,
          users: { name: "Jean Martin", email: "jean.martin@example.com" },
          is_public: true,
          created_at: "2023-11-15T09:15:00Z",
          archived_at: "2024-01-10T16:45:00Z"
        }
      ]
      
      setDocuments(mockArchives)
      setFilteredDocuments(mockArchives)
    } catch (error) {
      console.error("Erreur lors du chargement des archives:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents archivés",
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
          doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.users?.name.toLowerCase().includes(searchQuery.toLowerCase()),
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

  const handleRestore = async (documentId: string) => {
    try {
      toast({
        title: "Information",
        description: "Fonctionnalité de restauration en cours de développement",
      })
    } catch (error) {
      console.error("Erreur restauration:", error)
      toast({
        title: "Erreur",
        description: "Impossible de restaurer le document",
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
          <h1 className="text-3xl font-bold text-gray-900">Documents archivés</h1>
          <p className="text-gray-600">Consulter et gérer les documents archivés</p>
        </div>

        {/* Recherche */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher dans les archives..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tableau des documents archivés */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents archivés ({filteredDocuments.length})
            </CardTitle>
            <CardDescription>
              Documents supprimés ou archivés du système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Propriétaire</TableHead>
                  <TableHead>Date création</TableHead>
                  <TableHead>Date archivage</TableHead>
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
                      <div>
                        <div className="font-medium">{document.users?.name || "N/A"}</div>
                        <div className="text-sm text-gray-500">{document.users?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(document.created_at)}</TableCell>
                    <TableCell>{formatDate(document.archived_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleRestore(document.id)}
                        >
                          <RotateCcw className="h-4 w-4" />
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
