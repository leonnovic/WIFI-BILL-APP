import { NextResponse } from "next/server"
import { db } from "@/lib/db"

/**
 * M-Pesa B2C Result Handler
 * Called by Safaricom with the result of a B2C payment
 * (e.g., refund, OKOA disbursement)
 */
export async function POST(request: Request) {
  try {
    const data = await request.json()
    console.log("B2C Result received:", JSON.stringify(data, null, 2))

    const result = data?.Result

    if (!result) {
      console.error("B2C Result: Missing Result object")
      return NextResponse.json({ received: true })
    }

    const {
      ResultType,
      ResultCode,
      ResultDesc,
      OriginatorConversationID,
      ConversationID,
      TransactionID,
    } = result

    // Find any pending B2C transaction by conversation ID
    // This could be a refund or OKOA disbursement
    const params = result?.ResultParameters?.ResultParameter || []
    const paramMap: Record<string, any> = {}
    for (const param of params) {
      if (param.Key && param.Value) {
        paramMap[param.Key] = param.Value
      }
    }

    const b2cRecipientIsRegistered = paramMap.RecipientIsRegisteredCustomer
    const b2cAmount = paramMap.TransactionAmount
    const b2cReceiverParty = paramMap.ReceiverPartyPublicName
    const b2cCharges = paramMap.B2CChargesPaidAccountAvailableFunds
    const b2cUtility = paramMap.B2CUtilityAccountAvailableFunds

    if (ResultCode === 0) {
      console.log(`B2C Success: KES ${b2cAmount} to ${b2cReceiverParty}, TransactionID: ${TransactionID}`)

      // Update any related transactions
      // In a full implementation, we'd track the ConversationID mapping
    } else {
      console.error(`B2C Failed: ${ResultDesc}, Code: ${ResultCode}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error("B2C Result error:", error)
    return NextResponse.json({ received: true })
  }
}
