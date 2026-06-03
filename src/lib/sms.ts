/**
 * Africa's Talking SMS Gateway Integration
 * Production-ready SMS sending for OTP, notifications, and alerts
 */

interface AfricaTalkingConfig {
  apiKey: string
  username: string
  senderId?: string
  environment: 'sandbox' | 'production'
}

interface SMSMessage {
  to: string | string[]
  message: string
  from?: string
}

interface SMSResponse {
  SMSMessageData: {
    Message: string
    Recipients: SMSRecipient[]
  }
}

interface SMSRecipient {
  statusCode: number
  number: string
  status: string
  cost: string
  messageId: string
}

interface OTPData {
  phone: string
  code: string
  expiresAt: number
}

class SMSAPI {
  private config: AfricaTalkingConfig
  private baseUrl: string

  constructor(config?: Partial<AfricaTalkingConfig>) {
    this.config = {
      apiKey: config?.apiKey || process.env.AT_API_KEY || '',
      username: config?.username || process.env.AT_USERNAME || 'sandbox',
      senderId: config?.senderId || process.env.AT_SENDER_ID || 'ISPLedger',
      environment: config?.environment || (process.env.AT_ENV as 'sandbox' | 'production') || 'sandbox',
    }
    this.baseUrl = this.config.environment === 'production'
      ? 'https://api.africastalking.com/v1'
      : 'https://api.sandbox.africastalking.com/v1'
  }

  /**
   * Send SMS message(s)
   */
  async sendSMS(params: SMSMessage): Promise<SMSResponse> {
    const recipients = Array.isArray(params.to) ? params.to : [params.to]
    const formattedRecipients = recipients.map(phone => this.formatPhoneNumber(phone))

    const payload = new URLSearchParams({
      username: this.config.username,
      to: formattedRecipients.join(','),
      message: params.message,
      from: params.from || this.config.senderId || '',
    })

    const response = await fetch(`${this.baseUrl}/messaging`, {
      method: 'POST',
      headers: {
        'ApiKey': this.config.apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: payload.toString(),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`SMS API error: ${response.status} - ${errorText}`)
    }

    return response.json() as Promise<SMSResponse>
  }

  /**
   * Send OTP via SMS
   */
  async sendOTP(phone: string, code: string): Promise<SMSResponse> {
    return this.sendSMS({
      to: phone,
      message: `Your ISPLedger verification code is: ${code}. Valid for 5 minutes. Do not share this code with anyone.`,
    })
  }

  /**
   * Send package activation notification
   */
  async sendPackageActivation(phone: string, packageName: string, duration: string): Promise<SMSResponse> {
    return this.sendSMS({
      to: phone,
      message: `Your ${packageName} package has been activated! Valid for ${duration}. Enjoy your internet! - ISPLedger`,
    })
  }

  /**
   * Send package expiry notification
   */
  async sendPackageExpiry(phone: string, packageName: string, hoursLeft: number): Promise<SMSResponse> {
    const timeStr = hoursLeft >= 24
      ? `${Math.floor(hoursLeft / 24)} day(s)`
      : `${hoursLeft} hour(s)`
    return this.sendSMS({
      to: phone,
      message: `Your ${packageName} package expires in ${timeStr}. Renew now to stay connected! - ISPLedger`,
    })
  }

  /**
   * Send OKOA credit notification
   */
  async sendOkoaCredit(phone: string, amount: number, totalDebt: number): Promise<SMSResponse> {
    return this.sendSMS({
      to: phone,
      message: `OKOA Internet: KES ${amount} credited. Total OKOA debt: KES ${totalDebt}. This will be deducted from your next top-up. - ISPLedger`,
    })
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(phone: string, amount: number, packageName: string, mpesaCode: string): Promise<SMSResponse> {
    return this.sendSMS({
      to: phone,
      message: `Payment confirmed! KES ${amount} for ${packageName}. M-Pesa Ref: ${mpesaCode}. Thank you! - ISPLedger`,
    })
  }

  /**
   * Send welcome message
   */
  async sendWelcome(phone: string, name: string): Promise<SMSResponse> {
    return this.sendSMS({
      to: phone,
      message: `Welcome to ISPLedger, ${name}! Your account is ready. Buy a package to get started. - ISPLedger`,
    })
  }

  /**
   * Send support ticket update
   */
  async sendTicketUpdate(phone: string, ticketSubject: string, status: string): Promise<SMSResponse> {
    return this.sendSMS({
      to: phone,
      message: `Your support ticket "${ticketSubject}" has been updated to: ${status}. Check your account for details. - ISPLedger`,
    })
  }

  /**
   * Format phone number to international format
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

    return formatted
  }

  /**
   * Check balance
   */
  async checkBalance(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/messaging?username=${this.config.username}`, {
      method: 'GET',
      headers: {
        'ApiKey': this.config.apiKey,
        'Accept': 'application/json',
      },
    })

    return response.json()
  }
}

// In-memory OTP store (production should use Redis)
const otpStore = new Map<string, OTPData>()

/**
 * Generate and store OTP for a phone number
 */
function generateOTP(length: number = 6): string {
  const digits = '0123456789'
  let otp = ''
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)]
  }
  return otp
}

/**
 * Store OTP for verification
 */
function storeOTP(phone: string, code: string, expiryMinutes: number = 5): void {
  const formatted = phone.replace(/\s+/g, '').replace(/[()+-]/g, '')
  otpStore.set(formatted, {
    phone: formatted,
    code,
    expiresAt: Date.now() + expiryMinutes * 60 * 1000,
  })
}

/**
 * Verify OTP
 */
function verifyOTP(phone: string, code: string): boolean {
  const formatted = phone.replace(/\s+/g, '').replace(/[()+-]/g, '')
  const stored = otpStore.get(formatted)

  if (!stored) return false
  if (Date.now() > stored.expiresAt) {
    otpStore.delete(formatted)
    return false
  }

  if (stored.code === code) {
    otpStore.delete(formatted)
    return true
  }

  return false
}

// Singleton
let smsInstance: SMSAPI | null = null

function getSMSAPI(): SMSAPI {
  if (!smsInstance) {
    smsInstance = new SMSAPI()
  }
  return smsInstance
}

export {
  SMSAPI,
  getSMSAPI,
  generateOTP,
  storeOTP,
  verifyOTP,
}
export type { SMSMessage, SMSResponse }
