import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getNotificationService } from "@/lib/notifications"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const unreadOnly = searchParams.get("unread") === "true"

    const notificationService = getNotificationService()

    if (unreadOnly) {
      const notifications = await notificationService.getUnread(userId)
      return NextResponse.json({ data: notifications })
    }

    const result = await notificationService.getAll(userId, page, limit)
    return NextResponse.json({ data: result })

  } catch (error) {
    console.error("Notifications list error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    const notificationService = getNotificationService()

    // Mark all as read
    await notificationService.markAllAsRead(userId)

    return NextResponse.json({ message: "All notifications marked as read" })

  } catch (error) {
    console.error("Mark all read error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
