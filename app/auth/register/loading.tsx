import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function RegisterLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600">Chargement...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
