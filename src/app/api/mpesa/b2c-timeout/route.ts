import { NextResponse } from "next/server"

/**
 * M-Pesa B2C Timeout Handler
 * Called when a B2C request times out
 */
export async function POST(request: Request) {
  try {
    const data = await request.json()
    console.log("B2C Timeout received:", JSON.stringify(data, null, 2))

    // Log the timeout for monitoring
    // In production, this should trigger an alert and possible retry

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error("B2C Timeout error:", error)
    return NextResponse.json({ received: true })
  }
}
