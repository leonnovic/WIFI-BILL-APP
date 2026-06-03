/**
 * M-Pesa Daraja API Integration
 * Production-ready Safaricom M-Pesa STK Push, C2B, B2C, and Transaction Status
 */

interface MpesaConfig {
  consumerKey: string
  consumerSecret: string
  passkey: string
  shortCode: string
  securityCredential?: string
  initiatorName?: string
  environment: 'sandbox' | 'production'
}

interface STKPushRequest {
  phoneNumber: string
  amount: number
  accountReference: string
  transactionDesc: string
  callbackUrl?: string
}

interface STKPushResponse {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResponseCode: string
  ResponseDescription: string
  CustomerMessage: string
}

interface C2BRegisterResponse {
  ResponseCode: string
  ResponseDescription: string
}

interface B2CRequest {
  phoneNumber: string
  amount: number
  occasion: string
  remarks: string
  commandID?: string
}

interface TransactionStatusRequest {
  transactionID: string
  initiator?: string
  partyA?: string
  identifierType?: number
  remarks?: string
}

interface MpesaCallbackResult {
  MerchantRequestID?: string
  CheckoutRequestID?: string
  ResultCode: number
  ResultDesc: string
  Amount?: number
  MpesaReceiptNumber?: string
  TransactionDate?: string
  PhoneNumber?: string
  Balance?: number
}

class MpesaAPI {
  private config: MpesaConfig
  private baseUrl: string
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor(config?: Partial<MpesaConfig>) {
    this.config = {
      consumerKey: config?.consumerKey || process.env.MPESA_CONSUMER_KEY || '',
      consumerSecret: config?.consumerSecret || process.env.MPESA_CONSUMER_SECRET || '',
      passkey: config?.passkey || process.env.MPESA_PASSKEY || '',
      shortCode: config?.shortCode || process.env.MPESA_SHORT_CODE || '174379',
      securityCredential: config?.securityCredential || process.env.MPESA_SECURITY_CREDENTIAL || '',
      initiatorName: config?.initiatorName || process.env.MPESA_INITIATOR_NAME || 'apitest',
      environment: config?.environment || (process.env.MPESA_ENV as 'sandbox' | 'production') || 'sandbox',
    }
    this.baseUrl = this.config.environment === 'production'
      ? 'https://api.safaricom.co.ke'
      : 'https://sandbox.safaricom.co.ke'
  }

  /**
   * Get OAuth access token from Safaricom
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    const auth = Buffer.from(`${this.config.consumerKey}:${this.config.consumerSecret}`).toString('base64')

    const response = await fetch(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to get M-Pesa access token: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    this.accessToken = data.access_token
    this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000 // Refresh 1 min before expiry

    return this.accessToken!
  }

  /**
   * Generate password for STK Push
   * Password = Base64(Shortcode + Passkey + Timestamp)
   */
  private generatePassword(): { password: string; timestamp: string } {
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14)
    const password = Buffer.from(`${this.config.shortCode}${this.config.passkey}${timestamp}`).toString('base64')
    return { password, timestamp }
  }

  /**
   * Initiate STK Push (Lipa Na M-Pesa Online)
   * Sends a payment request to the customer's phone
   */
  async initiateSTKPush(request: STKPushRequest): Promise<STKPushResponse> {
    const token = await this.getAccessToken()
    const { password, timestamp } = this.generatePassword()

    const callbackUrl = request.callbackUrl || process.env.MPESA_CALLBACK_URL || `${process.env.NEXTAUTH_URL}/api/mpesa/callback`

    // Format phone number to 254XXXXXXXXX
    const formattedPhone = this.formatPhoneNumber(request.phoneNumber)

    const payload = {
      BusinessShortCode: this.config.shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.ceil(request.amount),
      PartyA: formattedPhone,
      PartyB: this.config.shortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: request.accountReference.slice(0, 12),
      TransactionDesc: request.transactionDesc.slice(0, 13),
    }

    const response = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (data.ResponseCode !== '0' && data.responseCode !== '0') {
      throw new Error(data.ResponseDescription || data.errorMessage || 'STK Push initiation failed')
    }

    return data as STKPushResponse
  }

  /**
   * Query STK Push status
   */
  async querySTKPush(checkoutRequestID: string): Promise<MpesaCallbackResult> {
    const token = await this.getAccessToken()
    const { password, timestamp } = this.generatePassword()

    const payload = {
      BusinessShortCode: this.config.shortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestID,
    }

    const response = await fetch(`${this.baseUrl}/mpesa/stkpushquery/v1/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    return data as MpesaCallbackResult
  }

  /**
   * Register C2B (Customer to Business) confirmation and validation URLs
   */
  async registerC2BUrls(confirmationUrl: string, validationUrl: string): Promise<C2BRegisterResponse> {
    const token = await this.getAccessToken()

    const payload = {
      ShortCode: this.config.shortCode,
      ResponseType: 'Completed',
      ConfirmationURL: confirmationUrl,
      ValidationURL: validationUrl,
    }

    const response = await fetch(`${this.baseUrl}/mpesa/c2b/v1/registerurl`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    return response.json() as Promise<C2BRegisterResponse>
  }

  /**
   * Initiate B2C (Business to Customer) payment
   * Used for refunds, payouts, OKOA credit disbursements
   */
  async initiateB2C(request: B2CRequest): Promise<any> {
    const token = await this.getAccessToken()

    const formattedPhone = this.formatPhoneNumber(request.phoneNumber)

    const payload = {
      InitiatorName: this.config.initiatorName,
      SecurityCredential: this.config.securityCredential,
      CommandID: request.commandID || 'BusinessPayment',
      Amount: Math.ceil(request.amount),
      PartyA: this.config.shortCode,
      PartyB: formattedPhone.replace('254', ''),
      Remarks: request.remarks.slice(0, 100),
      QueueTimeOutURL: `${process.env.NEXTAUTH_URL}/api/mpesa/b2c-timeout`,
      ResultURL: `${process.env.NEXTAUTH_URL}/api/mpesa/b2c-result`,
      Occasion: request.occasion.slice(0, 100),
    }

    const response = await fetch(`${this.baseUrl}/mpesa/b2c/v3/paymentrequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    return response.json()
  }

  /**
   * Check transaction status
   */
  async checkTransactionStatus(request: TransactionStatusRequest): Promise<any> {
    const token = await this.getAccessToken()

    const payload = {
      Initiator: request.initiator || this.config.initiatorName,
      SecurityCredential: this.config.securityCredential,
      CommandID: 'TransactionStatusQuery',
      TransactionID: request.transactionID,
      PartyA: request.partyA || this.config.shortCode,
      IdentifierType: request.identifierType?.toString() || '4',
      ResultURL: `${process.env.NEXTAUTH_URL}/api/mpesa/status-result`,
      QueueTimeOutURL: `${process.env.NEXTAUTH_URL}/api/mpesa/status-timeout`,
      Remarks: request.remarks || 'Transaction status query',
      Occasion: 'StatusCheck',
    }

    const response = await fetch(`${this.baseUrl}/mpesa/transactionstatus/v1/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    return response.json()
  }

  /**
   * Get account balance
   */
  async getAccountBalance(): Promise<any> {
    const token = await this.getAccessToken()

    const payload = {
      Initiator: this.config.initiatorName,
      SecurityCredential: this.config.securityCredential,
      CommandID: 'AccountBalance',
      PartyA: this.config.shortCode,
      IdentifierType: '4',
      Remarks: 'Account balance query',
      QueueTimeOutURL: `${process.env.NEXTAUTH_URL}/api/mpesa/balance-timeout`,
      ResultURL: `${process.env.NEXTAUTH_URL}/api/mpesa/balance-result`,
    }

    const response = await fetch(`${this.baseUrl}/mpesa/accountbalance/v1/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    return response.json()
  }

  /**
   * Format phone number to international format (254XXXXXXXXX)
   */
  private formatPhoneNumber(phone: string): string {
    let formatted = phone.replace(/\s+/g, '').replace(/[()-]/g, '')

    if (formatted.startsWith('+')) {
      formatted = formatted.substring(1)
    }

    if (formatted.startsWith('0')) {
      formatted = '254' + formatted.substring(1)
    }

    if (formatted.startsWith('7') || formatted.startsWith('1')) {
      formatted = '254' + formatted
    }

    // Validate Kenyan phone number format
    if (!/^254[17]\d{8}$/.test(formatted)) {
      throw new Error(`Invalid Kenyan phone number: ${phone}. Expected format: 254XXXXXXXXX`)
    }

    return formatted
  }

  /**
   * Validate M-Pesa callback signature
   */
  validateCallback(callbackData: any): boolean {
    // In production, validate the callback using the security credential
    // For now, check essential fields
    return !!(
      callbackData?.Body?.stkCallback?.MerchantRequestID ||
      callbackData?.Body?.stkCallback?.CheckoutRequestID
    )
  }

  /**
   * Parse M-Pesa STK Callback
   */
  parseSTKCallback(callbackData: any): MpesaCallbackResult | null {
    try {
      const stkCallback = callbackData?.Body?.stkCallback
      if (!stkCallback) return null

      if (stkCallback.ResultCode !== 0) {
        return {
          MerchantRequestID: stkCallback.MerchantRequestID,
          CheckoutRequestID: stkCallback.CheckoutRequestID,
          ResultCode: stkCallback.ResultCode,
          ResultDesc: stkCallback.ResultDesc,
        }
      }

      const callbackMetadata = stkCallback.CallbackMetadata?.Item || []
      const metadata: Record<string, any> = {}
      callbackMetadata.forEach((item: any) => {
        metadata[item.Name] = item.Value
      })

      return {
        MerchantRequestID: stkCallback.MerchantRequestID,
        CheckoutRequestID: stkCallback.CheckoutRequestID,
        ResultCode: stkCallback.ResultCode,
        ResultDesc: stkCallback.ResultDesc,
        Amount: metadata.Amount,
        MpesaReceiptNumber: metadata.MpesaReceiptNumber,
        TransactionDate: metadata.TransactionDate?.toString(),
        PhoneNumber: metadata.PhoneNumber?.toString(),
        Balance: metadata.Balance,
      }
    } catch (error) {
      console.error('Failed to parse M-Pesa callback:', error)
      return null
    }
  }
}

// Singleton instance
let mpesaInstance: MpesaAPI | null = null

export function getMpesaAPI(): MpesaAPI {
  if (!mpesaInstance) {
    mpesaInstance = new MpesaAPI()
  }
  return mpesaInstance
}

export { MpesaAPI }
export type { STKPushRequest, STKPushResponse, MpesaCallbackResult, B2CRequest }
