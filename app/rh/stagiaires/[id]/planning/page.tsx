"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { Calendar, Clock, MapPin, User, ArrowLeft, Plus, Edit, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PlanningEvent {
  id: string
  title: string
  description?: string
  date_debut: string
  date_fin: string
  type: string
  lieu?: string
  status: string
}

interface Stagiaire {
  id: string
  users: {
    name: string
    email: string
  }
  specialite: string
  niveau: string
  date_debut: string
  date_fin: string
}

export default function StagiairePlanningPage() {
  const [user, setUser] = useState<any>(null)
  const [stagiaire, setStagiaire] = useState<Stagiaire | null>(null)
  const [events, setEvents] = useState<PlanningEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date_debut: "",
    date_fin: "",
    type: "formation",
    lieu: "",
    status: "planifie",
  })

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
      if (!profile || profile.role !== "rh") {
        router.push("/auth/login")
        return
      }

      setUser(profile)
      await loadStagiaire()
      await loadPlanning()
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase, params.id])

  const loadStagiaire = async () => {
    try {
      const { data, error } = await supabase
        .from("stagiaires")
        .select(`
          *,
          users!inner(name, email)
        `)
        .eq("id", params.id)
        .single()

      if (error) throw error
      setStagiaire(data)
    } catch (error) {
      console.error("Erreur lors du chargement du stagiaire:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les informations du stagiaire",
        variant: "destructive",
      })
    }
  }

  const loadPlanning = async () => {
    try {
      const { data, error } = await supabase
        .from("planning_events")
        .select("*")
        .eq("stagiaire_id", params.id)
        .order("date_debut", { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error("Erreur lors du chargement du planning:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger le planning",
        variant: "destructive",
      })
    }
  }

  const handleAddEvent = async () => {
    try {
      const { error } = await supabase.from("planning_events").insert([
        {
          ...newEvent,
          stagiaire_id: params.id,
          created_by: user.id,
        },
      ])

      if (error) throw error

      toast({
        title: "Succès",
        description: "Événement ajouté au planning",
      })

      setShowAddEvent(false)
      setNewEvent({
        title: "",
        description: "",
        date_debut: "",
        date_fin: "",
        type: "formation",
        lieu: "",
        status: "planifie",
      })
      await loadPlanning()
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'événement",
        variant: "destructive",
      })
    }
  }

  const getTypeLabel = (type: string) => {
    const types = {
      formation: "Formation",
      reunion: "Réunion",
      evaluation: "Évaluation",
      projet: "Projet",
      presentation: "Présentation",
      autre: "Autre",
    }
    return types[type as keyof typeof types] || type
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "planifie":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "en_cours":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "termine":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "annule":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("fr-FR", {
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header user={user} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Planning de {stagiaire?.users?.name}</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {stagiaire?.specialite} - {stagiaire?.niveau}
              </p>
            </div>

            <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un événement
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Nouvel événement</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Titre</Label>
                    <Input
                      id="title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      placeholder="Titre de l'événement"
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select value={newEvent.type} onValueChange={(value) => setNewEvent({ ...newEvent, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="formation">Formation</SelectItem>
                        <SelectItem value="reunion">Réunion</SelectItem>
                        <SelectItem value="evaluation">Évaluation</SelectItem>
                        <SelectItem value="projet">Projet</SelectItem>
                        <SelectItem value="presentation">Présentation</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date_debut">Date début</Label>
                      <Input
                        id="date_debut"
                        type="datetime-local"
                        value={newEvent.date_debut}
                        onChange={(e) => setNewEvent({ ...newEvent, date_debut: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="date_fin">Date fin</Label>
                      <Input
                        id="date_fin"
                        type="datetime-local"
                        value={newEvent.date_fin}
                        onChange={(e) => setNewEvent({ ...newEvent, date_fin: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="lieu">Lieu</Label>
                    <Input
                      id="lieu"
                      value={newEvent.lieu}
                      onChange={(e) => setNewEvent({ ...newEvent, lieu: e.target.value })}
                      placeholder="Lieu de l'événement"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      placeholder="Description de l'événement"
                    />
                  </div>

                  <Button onClick={handleAddEvent} className="w-full">
                    Ajouter l'événement
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Informations du stagiaire */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations du stagiaire
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="font-medium">{stagiaire?.users?.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Période de stage</p>
                <p className="font-medium">
                  {stagiaire?.date_debut && formatDate(stagiaire.date_debut)} -{" "}
                  {stagiaire?.date_fin && formatDate(stagiaire.date_fin)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Spécialité</p>
                <p className="font-medium">{stagiaire?.specialite}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Planning */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Planning ({events.length} événements)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucun événement planifié</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Commencez par ajouter un événement au planning.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{event.title}</h3>
                          <Badge variant="outline" className={getStatusColor(event.status)}>
                            {event.status.replace("_", " ")}
                          </Badge>
                          <Badge variant="secondary">{getTypeLabel(event.type)}</Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(event.date_debut)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTime(event.date_debut)} - {formatTime(event.date_fin)}
                          </div>
                          {event.lieu && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {event.lieu}
                            </div>
                          )}
                        </div>

                        {event.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">{event.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
