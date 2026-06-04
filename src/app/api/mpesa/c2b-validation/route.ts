import { NextResponse } from "next/server"

/**
 * M-Pesa C2B Validation URL
 * Called by Safaricom to validate a C2B transaction before processing
 * Return ResultCode 0 to accept, 1 to reject
 */
export async function POST(request: Request) {
  try {
    const data = await request.json()
    console.log("C2B Validation request:", JSON.stringify(data, null, 2))

    const { TransID, MSISDN, BillRefNumber, TransAmount, BusinessShortCode } = data

    // Validate the transaction
    // 1. Check if the business shortcode matches
    if (BusinessShortCode !== process.env.MPESA_SHORT_CODE && BusinessShortCode !== "174379") {
      console.log(`C2B Validation rejected: Invalid shortcode ${BusinessShortCode}`)
      return NextResponse.json({
        ResultCode: 1,
        ResultDesc: "Invalid business shortcode",
      })
    }

    // 2. Check if the amount is valid (positive number)
    const amount = parseFloat(TransAmount)
    if (isNaN(amount) || amount <= 0) {
      console.log(`C2B Validation rejected: Invalid amount ${TransAmount}`)
      return NextResponse.json({
        ResultCode: 1,
        ResultDesc: "Invalid amount",
      })
    }

    // 3. Check if the BillRefNumber (account reference) is valid
    if (!BillRefNumber || BillRefNumber.trim().length < 3) {
      console.log(`C2B Validation rejected: Invalid bill reference ${BillRefNumber}`)
      return NextResponse.json({
        ResultCode: 1,
        ResultDesc: "Invalid account reference",
      })
    }

    // All validation passed - accept the transaction
    console.log(`C2B Validation accepted: ${TransID} from ${MSISDN} for KES ${TransAmount}`)
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Accepted",
    })

  } catch (error) {
    console.error("C2B Validation error:", error)
    return NextResponse.json({
      ResultCode: 1,
      ResultDesc: "Internal validation error",
    })
  }
}
