import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const noteId = formData.get("noteId") as string

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const filename = `voice-notes/${session.user.id}/${noteId}-${Date.now()}.webm`
    const blob = await put(filename, audioFile, {
      access: "public",
    })

    return NextResponse.json({
      success: true,
      url: blob.url,
    })
  } catch (error) {
    console.error("Voice note upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
