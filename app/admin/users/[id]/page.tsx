"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BackButton } from "@/components/ui/back-button"
import { Header } from "@/components/layout/header"
import { useToast } from "@/components/ui/use-toast"
import { User, Mail, Phone, MapPin, Building, Edit, Shield, Calendar, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface UserDetail {
  id: string
  email: string
  name: string
  role: string
  phone?: string
  address?: string
  department?: string
  position?: string
  is_active: boolean
  created_at: string
  updated_at: string
  last_login?: string
}

export default function AdminUserDetailPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = async () => {
      // Vérifier que l'ID est valide
      if (params.id === "new" || !params.id) {
        router.push("/admin/users")
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase.from("users").select("*").eq("id", session.user.id).single()
      if (!profile || profile.role !== "admin") {
        router.push("/auth/login")
        return
      }

      setCurrentUser(profile)
      await loadUser()
      setLoading(false)
    }

    checkAuth()
  }, [params.id])

  const loadUser = async () => {
    try {
      const response = await fetch(`/api/admin/users/${params.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors du chargement")
      }

      setUserDetail(data.data)
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails de l'utilisateur",
        variant: "destructive",
      })
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "rh":
        return "bg-blue-100 text-blue-800"
      case "tuteur":
        return "bg-green-100 text-green-800"
      case "stagiaire":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Jamais"
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!userDetail) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={currentUser} />
        <main className="max-w-4xl mx-auto py-6 px-4">
          <BackButton href="/admin/users" />
          <Card className="mt-6">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Utilisateur non trouvé</h3>
              <p className="text-gray-500">L'utilisateur demandé n'existe pas ou a été supprimé.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={currentUser} />

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <BackButton href="/admin/users" />
          <div className="flex gap-2">
            <Button onClick={() => router.push(`/admin/users/${userDetail.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informations personnelles
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge className={getRoleBadgeColor(userDetail.role)}>{userDetail.role}</Badge>
                    <Badge variant={userDetail.is_active ? "default" : "destructive"}>
                      {userDetail.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nom complet</label>
                    <p className="text-lg font-medium">{userDetail.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <p>{userDetail.email}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Téléphone</label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <p>{userDetail.phone || "Non défini"}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Adresse</label>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <p>{userDetail.address || "Non définie"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Informations professionnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Département</label>
                    <p className="text-lg">{userDetail.department || "Non défini"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Poste</label>
                    <p className="text-lg">{userDetail.position || "Non défini"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Rôle système</label>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <Badge className={getRoleBadgeColor(userDetail.role)}>{userDetail.role}</Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Statut</label>
                    <Badge variant={userDetail.is_active ? "default" : "destructive"}>
                      {userDetail.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Inscription</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{formatDate(userDetail.created_at)}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Dernière modification</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{formatDate(userDetail.updated_at)}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Dernière connexion</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-sm">{formatDate(userDetail.last_login)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => router.push(`/admin/users/${userDetail.id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier le profil
                </Button>
                <Button
                  variant={userDetail.is_active ? "destructive" : "default"}
                  size="sm"
                  className="w-full justify-start"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {userDetail.is_active ? "Désactiver" : "Activer"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
