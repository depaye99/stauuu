
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error("❌ Erreur session:", sessionError)
      return NextResponse.json({ error: "Session error" }, { status: 401 })
    }

    if (!session?.user) {
      console.log("❌ Pas de session")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single()

    if (profileError) {
      console.error("❌ Erreur profil:", profileError)
      return NextResponse.json({ error: "Profile error" }, { status: 401 })
    }

    if (!profile) {
      console.error("❌ Profil non trouvé")
      return NextResponse.json({ error: "Profile not found" }, { status: 401 })
    }

    return NextResponse.json({ user: profile })
  } catch (error) {
    console.error("💥 Erreur récupération utilisateur:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
