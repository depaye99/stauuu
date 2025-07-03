"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

interface BackButtonProps {
  href?: string
  className?: string
  children?: React.ReactNode
}

export function BackButton({ href, className = "", children }: BackButtonProps) {
  const router = useRouter()

  const handleClick = () => {
    if (href) {
      router.push(href)
    } else {
      router.back()
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} className={`flex items-center gap-2 ${className}`}>
      <ArrowLeft className="h-4 w-4" />
      {children || "Retour"}
    </Button>
  )
}
