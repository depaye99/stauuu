"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BackButton } from "@/components/ui/back-button"
import { toast } from "@/hooks/use-toast"
import { Search, UserCheck, Mail, Phone, Plus } from "lucide-react"
import Link from "next/link"

interface Tuteur {
  id: string
  name: string
  email: string
  phone?: string
  created_at: string
}

export default function TuteursPage() {
  const [tuteurs, setTuteurs] = useState<Tuteur[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadTuteurs()
  }, [])

  const loadTuteurs = async () => {
    try {
      const response = await fetch("/api/admin/tuteurs")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du chargement")
      }

      setTuteurs(data.data || [])
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les tuteurs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredTuteurs = tuteurs.filter(
    (tuteur) =>
      tuteur.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tuteur.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

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

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <BackButton href="/admin" />
        <h1 className="text-2xl font-bold">Gestion des tuteurs</h1>
        <Link href="/admin/users/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau tuteur
          </Button>
        </Link>
      </div>

      {/* Barre de recherche */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher un tuteur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total tuteurs</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tuteurs.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des tuteurs */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des tuteurs</CardTitle>
          <CardDescription>Gérer les tuteurs de l'organisation</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTuteurs.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Aucun tuteur</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? "Aucun tuteur ne correspond à votre recherche." : "Commencez par ajouter un tuteur."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredTuteurs.map((tuteur) => (
                <div key={tuteur.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{tuteur.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-1" />
                          {tuteur.email}
                        </div>
                        {tuteur.phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            {tuteur.phone}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        Inscrit le {new Date(tuteur.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">Tuteur</Badge>
                    <Link href={`/admin/users/${tuteur.id}`}>
                      <Button variant="outline" size="sm">
                        Voir détails
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
