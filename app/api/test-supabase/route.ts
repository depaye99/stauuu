import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/client"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Test basic connection
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          message: "Supabase connection failed",
        },
        { status: 500 },
      )
    }

    // Test if we can query (this might fail if tables don't exist)
    let tablesExist = false
    try {
      const { error: queryError } = await supabase.from("users").select("count", { count: "exact", head: true })

      tablesExist = !queryError
    } catch (e) {
      console.log("Users table doesn't exist yet")
    }

    return NextResponse.json({
      success: true,
      message: "Supabase connection successful",
      session: !!data.session,
      tablesExist,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "configured" : "missing",
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "configured" : "missing",
    })
  } catch (error) {
    console.error("Supabase test error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Supabase test failed",
      },
      { status: 500 },
    )
  }
}
