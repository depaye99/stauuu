"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { Calendar, Clock, MapPin, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
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
  stagiaires?: {
    users?: {
      name: string
    }
  }
}

export default function TuteurPlanningPage() {
  const [user, setUser] = useState<any>(null)
  const [events, setEvents] = useState<PlanningEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<"week" | "month">("week")
  const [filterType, setFilterType] = useState<string>("all")

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
      if (!profile || profile.role !== "tuteur") {
        router.push("/auth/login")
        return
      }

      setUser(profile)
      await loadPlanning(session.user.id)
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadPlanning = async (tuteurId: string) => {
    try {
      // Charger les événements via l'API planning avec le tuteur_id
      const response = await fetch(`/api/planning?tuteur_id=${tuteurId}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      // Transformer les données pour correspondre à l'interface PlanningEvent
      const transformedEvents = data.map((item: any) => ({
        id: item.id,
        title: item.titre,
        description: item.description,
        date_debut: item.date_debut,
        date_fin: item.date_fin,
        type: item.type || 'autre',
        lieu: item.lieu,
        status: item.status || 'planifie',
        stagiaires: item.stagiaire ? {
          users: {
            name: item.stagiaire?.user?.name || 'Stagiaire'
          }
        } : null
      }))

      setEvents(transformedEvents)
      console.log("✅ Planning chargé:", transformedEvents)
    } catch (error) {
      console.error("Erreur lors du chargement du planning:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger le planning",
        variant: "destructive",
      })
    }
  }

  const getWeekDates = (date: Date) => {
    const week = []
    const startOfWeek = new Date(date)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Lundi comme premier jour
    startOfWeek.setDate(diff)

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      week.push(day)
    }
    return week
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return events.filter((event) => {
      const eventDate = new Date(event.date_debut).toISOString().split("T")[0]
      return eventDate === dateStr && (filterType === "all" || event.type === filterType)
    })
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

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + (direction === "next" ? 7 : -7))
    setCurrentDate(newDate)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const weekDates = getWeekDates(currentDate)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header user={user} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Planning</h1>
              <p className="text-gray-600 dark:text-gray-400">Gérer le planning de vos stagiaires</p>
            </div>

            <div className="flex items-center gap-4">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrer par type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="formation">Formation</SelectItem>
                  <SelectItem value="reunion">Réunion</SelectItem>
                  <SelectItem value="evaluation">Évaluation</SelectItem>
                  <SelectItem value="projet">Projet</SelectItem>
                  <SelectItem value="presentation">Présentation</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={() => router.push('/tuteur/planning/nouveau')}>
                <Plus className="mr-2 h-4 w-4" />
                Nouvel événement
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation semaine */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Semaine du {weekDates[0].toLocaleDateString("fr-FR")} au {weekDates[6].toLocaleDateString("fr-FR")}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigateWeek("prev")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
                  Aujourd'hui
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigateWeek("next")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-4">
              {weekDates.map((date, index) => {
                const dayEvents = getEventsForDate(date)
                const isToday = date.toDateString() === new Date().toDateString()

                return (
                  <div
                    key={index}
                    className={`min-h-32 p-3 border rounded-lg ${
                      isToday
                        ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                        : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                    }`}
                  >
                    <div className="text-center mb-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {date.toLocaleDateString("fr-FR", { weekday: "short" })}
                      </p>
                      <p
                        className={`text-lg font-semibold ${
                          isToday ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {date.getDate()}
                      </p>
                    </div>

                    <div className="space-y-1">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className="text-xs p-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800"
                          title={event.description}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(event.date_debut)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Liste des événements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Événements à venir ({events.filter((e) => new Date(e.date_debut) >= new Date()).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucun événement planifié</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Les événements de vos stagiaires apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {events
                  .filter((event) => filterType === "all" || event.type === filterType)
                  .slice(0, 10)
                  .map((event) => (
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
                              {new Date(event.date_debut).toLocaleDateString("fr-FR")}
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

                          {event.stagiaires?.users?.name && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Stagiaire: {event.stagiaires.users.name}
                            </p>
                          )}

                          {event.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{event.description}</p>
                          )}
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