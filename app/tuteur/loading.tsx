import { Loader2 } from "lucide-react"

export default function TuteurLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-600">Chargement du tableau de bord tuteur...</p>
      </div>
    </div>
  )
}
