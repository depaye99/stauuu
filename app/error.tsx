"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Une erreur s'est produite</h1>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Désolé, quelque chose s'est mal passé. Veuillez réessayer.
          </p>

          {process.env.NODE_ENV === "development" && (
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-6 text-left">
              <p className="text-sm text-gray-800 dark:text-gray-200 font-mono">{error.message}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={reset} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/")} className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Accueil
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
