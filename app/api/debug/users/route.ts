import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      return NextResponse.json({ 
        error: "Auth error", 
        details: authError 
      }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ 
        error: "No authenticated user" 
      }, { status: 401 })
    }

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single()

    // Get all users for debugging (remove in production)
    const { data: allUsers, error: allUsersError } = await supabase
      .from("users")
      .select("id, email, name, role")
      .limit(10)

    return NextResponse.json({
      authUser: {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
        emailConfirmed: user.email_confirmed_at
      },
      profile: profile || "No profile found",
      profileError: profileError || null,
      allUsers: allUsers || [],
      allUsersError: allUsersError || null
    })

  } catch (error) {
    console.error("Debug endpoint error:", error)
    return NextResponse.json({ 
      error: "Server error", 
      details: error 
    }, { status: 500 })
  }
}
