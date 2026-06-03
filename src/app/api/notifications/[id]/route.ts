import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getNotificationService } from "@/lib/notifications"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const notificationService = getNotificationService()

    // Mark this notification as read
    const notification = await notificationService.markAsRead(id)

    return NextResponse.json({ data: notification, message: "Notification marked as read" })

  } catch (error) {
    console.error("Mark notification read error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
