"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { BackButton } from "@/components/ui/back-button"
import { Header } from "@/components/layout/header"
import { useToast } from "@/hooks/use-toast"
import { User, Save, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface UserData {
  id: string
  email: string
  name: string
  role: string
  phone?: string
  department?: string
  position?: string
  is_active: boolean
}

export default function EditUserPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    department: "",
    position: "",
    is_active: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
      console.log("🔍 Chargement utilisateur:", params.id)

      const response = await fetch(`/api/admin/users/${params.id}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors du chargement")
      }

      console.log("✅ Utilisateur chargé:", result.data)
      setUserData(result.data)
      setFormData({
        name: result.data.name || "",
        email: result.data.email || "",
        phone: result.data.phone || "",
        role: result.data.role || "",
        department: result.data.department || "",
        position: result.data.position || "",
        is_active: result.data.is_active ?? true,
      })
    } catch (error) {
      console.error("❌ Erreur chargement utilisateur:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger l'utilisateur",
        variant: "destructive",
      })
    }
  }

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.role) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      console.log("💾 Sauvegarde utilisateur:", formData)

      const response = await fetch(`/api/admin/users/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la sauvegarde")
      }

      console.log("✅ Utilisateur sauvegardé:", result.data)

      toast({
        title: "Succès",
        description: "Utilisateur mis à jour avec succès",
      })

      router.push(`/admin/users/${params.id}`)
    } catch (error) {
      console.error("❌ Erreur sauvegarde:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de sauvegarder",
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

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={currentUser} />
        <main className="max-w-4xl mx-auto py-6 px-4">
          <BackButton href="/admin/users" />
          <Card className="mt-6">
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Utilisateur non trouvé</h3>
              <p className="text-gray-500">L'utilisateur demandé n'existe pas.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header user={currentUser} />

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <BackButton href={`/admin/users/${params.id}`} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Modifier l'utilisateur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Nom complet <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nom complet"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@exemple.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+237 6XX XXX XXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">
                  Rôle <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="rh">Ressources Humaines</SelectItem>
                    <SelectItem value="tuteur">Tuteur</SelectItem>
                    <SelectItem value="stagiaire">Stagiaire</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Département</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Département"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Poste</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Intitulé du poste"
                />
              </div>

              <div className="md:col-span-2 flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Compte actif</Label>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {saving ? "Sauvegarde..." : "Sauvegarder"}
              </Button>
              <Button variant="outline" onClick={() => router.push(`/admin/users/${params.id}`)}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
