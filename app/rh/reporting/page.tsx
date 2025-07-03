"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"
import { Download, FileText, TrendingUp, Users, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ReportingData {
  stagiaires: {
    total: number
    actifs: number
    termines: number
    par_mois: Array<{ mois: string; nombre: number }>
    par_departement: Array<{ departement: string; nombre: number }>
  }
  demandes: {
    total: number
    en_attente: number
    approuvees: number
    rejetees: number
    par_type: Array<{ type: string; nombre: number }>
    par_mois: Array<{ mois: string; nombre: number }>
  }
  evaluations: {
    total: number
    moyenne_globale: number
    par_critere: Array<{ critere: string; moyenne: number }>
  }
  documents: {
    total: number
    par_type: Array<{ type: string; nombre: number }>
  }
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

export default function RHReportingPage() {
  const [user, setUser] = useState<any>(null)
  const [data, setData] = useState<ReportingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("12") // 12 derniers mois
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
      if (!profile || profile.role !== "rh") {
        router.push("/auth/login")
        return
      }

      setUser(profile)
      await loadReportingData()
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase, selectedPeriod])

  const loadReportingData = async () => {
    try {
      const response = await fetch(`/api/reporting?period=${selectedPeriod}`)
      if (!response.ok) throw new Error("Erreur lors du chargement des données")

      const reportingData = await response.json()
      setData(reportingData)
    } catch (error) {
      console.error("Erreur lors du chargement des données de reporting:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données de reporting",
        variant: "destructive",
      })
    }
  }

  const exportToCSV = async (type: string) => {
    try {
      const response = await fetch(`/api/reporting/export?type=${type}&period=${selectedPeriod}`)
      if (!response.ok) throw new Error("Erreur lors de l'export")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `rapport_${type}_${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export réussi",
        description: `Le rapport ${type} a été téléchargé`,
      })
    } catch (error) {
      console.error("Erreur lors de l'export:", error)
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les données",
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

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Aucune donnée disponible</h2>
          <p className="text-gray-600">Impossible de charger les données de reporting</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reporting et Analyses</h1>
          <p className="text-gray-600">Tableaux de bord et indicateurs de performance</p>
        </div>

        {/* Contrôles */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-4">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 derniers mois</SelectItem>
                    <SelectItem value="6">6 derniers mois</SelectItem>
                    <SelectItem value="12">12 derniers mois</SelectItem>
                    <SelectItem value="24">24 derniers mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => exportToCSV("stagiaires")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Stagiaires
                </Button>
                <Button variant="outline" onClick={() => exportToCSV("demandes")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Demandes
                </Button>
                <Button variant="outline" onClick={() => exportToCSV("evaluations")}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Évaluations
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs principaux */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Stagiaires</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stagiaires.total}</div>
              <p className="text-xs text-muted-foreground">
                {data.stagiaires.actifs} actifs, {data.stagiaires.termines} terminés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Demandes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.demandes.total}</div>
              <p className="text-xs text-muted-foreground">{data.demandes.en_attente} en attente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Note Moyenne</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.evaluations.moyenne_globale.toFixed(1)}/5</div>
              <p className="text-xs text-muted-foreground">{data.evaluations.total} évaluations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.documents.total}</div>
              <p className="text-xs text-muted-foreground">Documents générés</p>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Évolution des stagiaires */}
          <Card>
            <CardHeader>
              <CardTitle>Évolution des stagiaires par mois</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.stagiaires.par_mois}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="nombre" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Répartition des demandes par type */}
          <Card>
            <CardHeader>
              <CardTitle>Demandes par type</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.demandes.par_type}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percent }) => `${type} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="nombre"
                  >
                    {data.demandes.par_type.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Stagiaires par département */}
          <Card>
            <CardHeader>
              <CardTitle>Stagiaires par département</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.stagiaires.par_departement}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="departement" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="nombre" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Évaluations par critère */}
          <Card>
            <CardHeader>
              <CardTitle>Moyennes par critère d'évaluation</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.evaluations.par_critere}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="critere" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Bar dataKey="moyenne" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tableau de synthèse */}
        <Card>
          <CardHeader>
            <CardTitle>Synthèse des indicateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-4">Statuts des demandes</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Approuvées:</span>
                    <Badge variant="default">{data.demandes.approuvees}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>En attente:</span>
                    <Badge variant="secondary">{data.demandes.en_attente}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Rejetées:</span>
                    <Badge variant="destructive">{data.demandes.rejetees}</Badge>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Types de documents</h3>
                <div className="space-y-2">
                  {data.documents.par_type.map((doc, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{doc.type}:</span>
                      <Badge variant="outline">{doc.nombre}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
