import { NextResponse } from "next/server"
import { db } from "@/lib/db"

/**
 * M-Pesa Transaction Status Result Handler
 * Called with the result of a transaction status query
 */
export async function POST(request: Request) {
  try {
    const data = await request.json()
    console.log("Transaction Status Result received:", JSON.stringify(data, null, 2))

    const result = data?.Result

    if (!result) {
      console.error("Transaction Status: Missing Result object")
      return NextResponse.json({ received: true })
    }

    const {
      ResultCode,
      ResultDesc,
      TransactionID,
      OriginatorConversationID,
      ConversationID,
    } = result

    const params = result?.ResultParameters?.ResultParameter || []
    const paramMap: Record<string, any> = {}
    for (const param of params) {
      if (param.Key && param.Value) {
        paramMap[param.Key] = param.Value
      }
    }

    if (ResultCode === 0) {
      const transactionStatus = paramMap.TransactionStatus
      const amount = paramMap.Amount
      const partyA = paramMap.PartyA
      const partyB = paramMap.PartyB
      const accountBalance = paramMap.AccountBalance

      console.log(`Transaction Status: ${transactionStatus}, Amount: ${amount}, From: ${partyA} to ${partyB}`)

      // Update transaction in database if found
      if (TransactionID) {
        const tx = await db.transaction.findFirst({
          where: { mpesaCode: TransactionID },
        })

        if (tx) {
          const mappedStatus = transactionStatus === "Completed" ? "completed" :
            transactionStatus === "Failed" ? "failed" : tx.status

          await db.transaction.update({
            where: { id: tx.id },
            data: {
              status: mappedStatus,
              description: `${tx.description} | Status check: ${transactionStatus}`,
            },
          })
        }
      }
    } else {
      console.error(`Transaction Status query failed: ${ResultDesc}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error("Transaction Status Result error:", error)
    return NextResponse.json({ received: true })
  }
}
