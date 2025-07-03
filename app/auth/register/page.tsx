"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { z } from "zod"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string(),
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  role: z.enum(["admin", "rh", "tuteur", "stagiaire"]),
  phone: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})

type FormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const [formData, setFormData] = useState<Partial<FormData>>({
    role: "stagiaire"
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

  const router = useRouter()

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors({})
    setMessage(null)

    try {
      // Validation côté client
      const validatedData = registerSchema.parse(formData)

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: validatedData.email,
          password: validatedData.password,
          name: validatedData.name,
          role: validatedData.role,
          phone: validatedData.phone,
          department: validatedData.department,
          position: validatedData.position,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.details) {
          // Erreurs de validation Zod
          const fieldErrors: Record<string, string> = {}
          data.details.forEach((error: any) => {
            if (error.path && error.path[0]) {
              fieldErrors[error.path[0]] = error.message
            }
          })
          setErrors(fieldErrors)
        } else {
          setMessage({ type: "error", text: data.error || "Erreur lors de l'inscription" })
        }
        return
      }

      setMessage({ 
        type: "success", 
        text: "Compte créé avec succès ! Vérifiez votre email pour confirmer votre compte." 
      })

      // Rediriger vers la page de connexion après 2 secondes
      setTimeout(() => {
        router.push("/auth/login?message=Compte créé avec succès")
      }, 2000)

    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          if (err.path && err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(fieldErrors)
      } else {
        setMessage({ type: "error", text: "Erreur lors de l'inscription" })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 transition-colors duration-300">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Formulaire à gauche */}
          <div>
            <Card className="w-full shadow-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
              <CardHeader className="space-y-1">
                <CardTitle className="text-3xl font-bold text-center text-blue-900 dark:text-white">Créer un compte</CardTitle>
                <CardDescription className="text-center text-gray-600 dark:text-gray-300">
                  Remplissez les informations ci-dessous pour créer votre compte
                </CardDescription>
              </CardHeader>
              <CardContent>
                {message && (
                  <Alert className={`mb-4 ${message.type === "error" ? "border-red-200 bg-red-50 dark:bg-red-950" : "border-green-200 bg-green-50 dark:bg-green-950"}`}>
                    <AlertDescription className={message.type === "error" ? "text-red-700 dark:text-red-300" : "text-green-700 dark:text-green-300"}>
                      {message.text}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name || ""}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      className={errors.name ? "border-red-500" : ""}
                      required
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ""}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={errors.email ? "border-red-500" : ""}
                      required
                    />
                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Rôle *</Label>
                    <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                      <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                        <SelectValue placeholder="Sélectionnez un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stagiaire">Stagiaire</SelectItem>                   
                      </SelectContent>
                    </Select>
                    {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone || ""}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe *</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password || ""}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                        className={errors.password ? "border-red-500" : ""}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword || ""}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                        className={errors.confirmPassword ? "border-red-500" : ""}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Création en cours...
                      </>
                    ) : (
                      "Créer le compte"
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Vous avez déjà un compte ?{" "}
                    <Link href="/auth/login" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                      Se connecter
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Image à droite (remplace l'espace réservé par l'image réelle) */}
          <div className="hidden md:block h-full">
            <img
              src="https://cdn.pixabay.com/photo/2015/01/08/18/11/laptops-593296_1280.jpg"
              alt="Espace professionnel"
              className="object-cover w-full h-full rounded-lg shadow-lg"
              style={{ minHeight: 500, maxHeight: 'calc(100vh - 120px)' }}
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
