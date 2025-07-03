"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { BackButton } from "@/components/ui/back-button"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, User } from "lucide-react"

interface UserFormData {
  email: string
  name: string
  role: "admin" | "rh" | "tuteur" | "stagiaire"
  phone: string
  department: string
  position: string
  address: string
  is_active: boolean
  password: string
}

export default function NewUserPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<UserFormData>({
    email: "",
    name: "",
    role: "stagiaire",
    phone: "",
    department: "",
    position: "",
    address: "",
    is_active: true,
    password: ""
  })
  const [errors, setErrors] = useState<Partial<UserFormData>>({})
  
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push("/auth/login")
          return
        }

        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (!profile || profile.role !== "admin") {
          router.push("/")
          return
        }

        setUser(profile)
        setLoading(false)
      } catch (error) {
        console.error("Erreur auth:", error)
        router.push("/auth/login")
      }
    }

    checkAuth()
  }, [router, supabase])

  const validateForm = (): boolean => {
    const newErrors: Partial<UserFormData> = {}

    if (!formData.email) {
      newErrors.email = "L'email est requis"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format d'email invalide"
    }

    if (!formData.name) {
      newErrors.name = "Le nom est requis"
    }

    if (!formData.password) {
      newErrors.password = "Le mot de passe est requis"
    } else if (formData.password.length < 6) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères"
    }

    if (!formData.role) {
      newErrors.role = "Le rôle est requis"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        title: "Erreur",
        description: "Veuillez corriger les erreurs dans le formulaire",
        variant: "destructive"
      })
      return
    }

    setSaving(true)

    try {
      // Créer l'utilisateur avec l'API
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Erreur lors de la création")
      }

      toast({
        title: "Succès",
        description: "Utilisateur créé avec succès"
      })

      router.push("/admin/users")
    } catch (error: any) {
      console.error("Erreur création utilisateur:", error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'utilisateur",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof UserFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
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
    <div className="container mx-auto py-10 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <BackButton href="/admin/users" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nouvel utilisateur</h1>
            <p className="text-gray-600">Créer un nouveau compte utilisateur</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informations principales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations principales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="utilisateur@example.com"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="name">Nom complet *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Jean Dupont"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  placeholder="Minimum 6 caractères"
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <Label htmlFor="role">Rôle *</Label>
                <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                  <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="rh">Ressources Humaines</SelectItem>
                    <SelectItem value="tuteur">Tuteur</SelectItem>
                    <SelectItem value="stagiaire">Stagiaire</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-red-500 mt-1">{errors.role}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                />
                <Label htmlFor="is_active">Compte actif</Label>
              </div>
            </CardContent>
          </Card>

          {/* Informations complémentaires */}
          <Card>
            <CardHeader>
              <CardTitle>Informations complémentaires</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+33 1 23 45 67 89"
                />
              </div>

              <div>
                <Label htmlFor="department">Département</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange("department", e.target.value)}
                  placeholder="Informatique, RH, Marketing..."
                />
              </div>

              <div>
                <Label htmlFor="position">Poste</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleInputChange("position", e.target.value)}
                  placeholder="Développeur, Manager, Stagiaire..."
                />
              </div>

              <div>
                <Label htmlFor="address">Adresse</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Adresse complète"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Boutons d'action */}
        <div className="mt-8 flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/users")}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Créer l'utilisateur
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
