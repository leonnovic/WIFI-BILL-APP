/**
 * MikroTik RouterOS API Integration
 * Production-ready RouterOS API client for hotspot management,
 * user profiles, bandwidth control, and connection management.
 */

import * as net from 'net'

interface MikroTikConfig {
  host: string
  port: number
  username: string
  password: string
  timeout?: number
}

interface HotspotUser {
  '.id': string
  name: string
  password: string
  profile: string
  'limit-uptime'?: string
  'limit-bytes-total'?: string
  comment?: string
  disabled: string
  server: string
}

interface HotspotActive {
  '.id': string
  user: string
  'server-name': string
  address: string
  mac: string
  uptime: string
  'bytes-in': string
  'bytes-out': string
  'session-time-left'?: string
}

interface HotspotProfile {
  '.id': string
  name: string
  'rate-limit': string
  'shared-users': string
  price?: string
  'session-timeout'?: string
  'keepalive-timeout'?: string
  status: string
}

interface InterfaceInfo {
  '.id': string
  name: string
  type: string
  'running': string
  'tx-byte': string
  'rx-byte': string
  'link-downs': string
  disabled: string
}

interface SystemResource {
  'uptime': string
  'cpu-load': string
  'free-memory': string
  'total-memory': string
  'free-hdd-space': string
  'total-hdd-space': string
  'version': string
  'board-name': string
  'cpu-count': string
  'cpu-frequency': string
}

/**
 * MikroTik RouterOS API Client
 * Implements the RouterOS API protocol for direct communication
 */
class MikroTikAPI {
  private config: MikroTikConfig
  private socket: net.Socket | null = null
  private connected: boolean = false
  private loggedIn: boolean = false
  private responseBuffer: Buffer[] = []
  private responseResolve: ((data: any[]) => void) | null = null
  private wordQueue: string[] = []

  constructor(config: MikroTikConfig) {
    this.config = {
      timeout: config.timeout || 10000,
      ...config,
    }
  }

  /**
   * Connect to RouterOS device
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.disconnect()
        reject(new Error('Connection timeout'))
      }, this.config.timeout)

      this.socket = new net.Socket()

      this.socket.on('connect', () => {
        clearTimeout(timeout)
        this.connected = true
        resolve()
      })

      this.socket.on('error', (err) => {
        clearTimeout(timeout)
        this.connected = false
        reject(new Error(`Connection error: ${err.message}`))
      })

      this.socket.on('data', (data: Buffer) => {
        this.responseBuffer.push(data)
        this.processResponse()
      })

      this.socket.on('close', () => {
        this.connected = false
        this.loggedIn = false
      })

      this.socket.connect(this.config.port, this.config.host)
    })
  }

  /**
   * Login to RouterOS
   */
  async login(): Promise<void> {
    if (!this.connected) {
      await this.connect()
    }

    try {
      const response = await this.sendCommand('/login', {
        name: this.config.username,
        password: this.config.password,
      })

      if (response.length === 0 || response[0].ret) {
        // Challenge-response auth (v6.43+)
        const ret = response[0]?.ret
        if (ret) {
          // For newer RouterOS versions, use /login with name+password
          const loginResponse = await this.sendCommand('/login', {
            name: this.config.username,
            password: this.config.password,
          })
          
          if (loginResponse.length > 0 && !loginResponse[0]?.message) {
            this.loggedIn = true
            return
          }
          throw new Error(loginResponse[0]?.message || 'Authentication failed')
        }
      }

      this.loggedIn = true
    } catch (error: any) {
      throw new Error(`MikroTik login failed: ${error.message}`)
    }
  }

  /**
   * Disconnect from RouterOS
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.destroy()
      this.socket = null
    }
    this.connected = false
    this.loggedIn = false
    this.responseBuffer = []
  }

  /**
   * Send command to RouterOS API
   */
  private async sendCommand(command: string, params: Record<string, string> = {}): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.connected) {
        reject(new Error('Not connected to RouterOS'))
        return
      }

      const timeout = setTimeout(() => {
        reject(new Error('Command timeout'))
      }, this.config.timeout)

      this.responseResolve = (data: any[]) => {
        clearTimeout(timeout)
        resolve(data)
      }

      // Build command words
      const words: string[] = [command]
      for (const [key, value] of Object.entries(params)) {
        words.push(`=${key}=${value}`)
      }

      // Send each word with length encoding
      for (const word of words) {
        const encoded = this.encodeWord(word)
        this.socket!.write(encoded)
      }

      // Send termination mark
      this.socket!.write(Buffer.from([0x00]))
    })
  }

  /**
   * Encode word using RouterOS API length encoding
   */
  private encodeWord(word: string): Buffer {
    const strBuf = Buffer.from(word, 'utf8')
    const len = strBuf.length

    if (len < 0x80) {
      return Buffer.concat([Buffer.from([len]), strBuf])
    } else if (len < 0x4000) {
      const header = Buffer.alloc(2)
      header.writeUInt16BE(len | 0x8000, 0)
      return Buffer.concat([header, strBuf])
    } else if (len < 0x200000) {
      const header = Buffer.alloc(3)
      header[0] = (len >> 16) | 0xC0
      header[1] = (len >> 8) & 0xFF
      header[2] = len & 0xFF
      return Buffer.concat([header, strBuf])
    } else {
      const header = Buffer.alloc(4)
      header.writeUInt32BE(len | 0xE0000000, 0)
      return Buffer.concat([header, strBuf])
    }
  }

  /**
   * Process incoming response data
   */
  private processResponse(): void {
    const data = Buffer.concat(this.responseBuffer)
    const words: string[] = []
    let offset = 0

    while (offset < data.length) {
      if (data[offset] === 0x00) {
        offset++
        continue
      }

      const { length, bytesConsumed } = this.decodeLength(data, offset)
      offset += bytesConsumed

      if (offset + length > data.length) {
        // Incomplete word, wait for more data
        this.responseBuffer = [data.subarray(offset)]
        return
      }

      words.push(data.subarray(offset, offset + length).toString('utf8'))
      offset += length
    }

    this.responseBuffer = []

    // Parse words into response objects
    const sentences: any[] = []
    let currentSentence: any = {}

    for (const word of words) {
      if (word.startsWith('!done')) {
        if (Object.keys(currentSentence).length > 0) {
          sentences.push(currentSentence)
        }
        if (this.responseResolve) {
          this.responseResolve(sentences)
          this.responseResolve = null
        }
        return
      } else if (word.startsWith('!re')) {
        if (Object.keys(currentSentence).length > 0) {
          sentences.push(currentSentence)
        }
        currentSentence = {}
      } else if (word.startsWith('!trap')) {
        currentSentence = { error: true }
      } else if (word.startsWith('!fatal')) {
        if (this.responseResolve) {
          this.responseResolve([{ error: true, fatal: true, message: 'Connection terminated' }])
          this.responseResolve = null
        }
        return
      } else if (word.startsWith('=')) {
        const eqIndex = word.indexOf('=', 1)
        if (eqIndex > 0) {
          const key = word.substring(1, eqIndex)
          const value = word.substring(eqIndex + 1)
          currentSentence[key] = value
        }
      } else if (word.startsWith('.'))
        currentSentence[word] = ''
    }

    if (Object.keys(currentSentence).length > 0) {
      sentences.push(currentSentence)
    }
  }

  /**
   * Decode RouterOS API length encoding
   */
  private decodeLength(data: Buffer, offset: number): { length: number; bytesConsumed: number } {
    const first = data[offset]

    if (first < 0x80) {
      return { length: first, bytesConsumed: 1 }
    } else if (first < 0xC0) {
      return {
        length: ((first & 0x3F) << 8) | data[offset + 1],
        bytesConsumed: 2,
      }
    } else if (first < 0xE0) {
      return {
        length: ((first & 0x1F) << 16) | (data[offset + 1] << 8) | data[offset + 2],
        bytesConsumed: 3,
      }
    } else {
      return {
        length: ((first & 0x0F) << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3],
        bytesConsumed: 4,
      }
    }
  }

  // ===== HOTSPOT MANAGEMENT =====

  /**
   * Create a hotspot user
   */
  async createHotspotUser(params: {
    name: string
    password: string
    profile: string
    server?: string
    limitUptime?: string
    limitBytesTotal?: number
    comment?: string
  }): Promise<any> {
    const cmdParams: Record<string, string> = {
      name: params.name,
      password: params.password,
      profile: params.profile,
    }

    if (params.server) cmdParams.server = params.server
    if (params.limitUptime) cmdParams['limit-uptime'] = params.limitUptime
    if (params.limitBytesTotal) cmdParams['limit-bytes-total'] = params.limitBytesTotal.toString()
    if (params.comment) cmdParams.comment = params.comment

    return this.sendCommand('/ip/hotspot/user/add', cmdParams)
  }

  /**
   * Remove a hotspot user
   */
  async removeHotspotUser(id: string): Promise<any> {
    return this.sendCommand('/ip/hotspot/user/remove', { '.id': id })
  }

  /**
   * Update hotspot user
   */
  async updateHotspotUser(id: string, params: Record<string, string>): Promise<any> {
    return this.sendCommand('/ip/hotspot/user/set', { '.id': id, ...params })
  }

  /**
   * Get all hotspot users
   */
  async getHotspotUsers(): Promise<HotspotUser[]> {
    const response = await this.sendCommand('/ip/hotspot/user/print')
    return response as HotspotUser[]
  }

  /**
   * Get active hotspot connections
   */
  async getActiveConnections(): Promise<HotspotActive[]> {
    const response = await this.sendCommand('/ip/hotspot/active/print')
    return response as HotspotActive[]
  }

  /**
   * Disconnect an active hotspot user
   */
  async disconnectUser(id: string): Promise<any> {
    return this.sendCommand('/ip/hotspot/active/remove', { '.id': id })
  }

  // ===== HOTSPOT PROFILES =====

  /**
   * Create a hotspot user profile (bandwidth plan)
   */
  async createHotspotProfile(params: {
    name: string
    rateLimit: string
    sharedUsers: number
    price?: string
    sessionTimeout?: string
  }): Promise<any> {
    const cmdParams: Record<string, string> = {
      name: params.name,
      'rate-limit': params.rateLimit,
      'shared-users': params.sharedUsers.toString(),
    }

    if (params.price) cmdParams.price = params.price
    if (params.sessionTimeout) cmdParams['session-timeout'] = params.sessionTimeout

    return this.sendCommand('/ip/hotspot/user/profile/add', cmdParams)
  }

  /**
   * Get all hotspot profiles
   */
  async getHotspotProfiles(): Promise<HotspotProfile[]> {
    const response = await this.sendCommand('/ip/hotspot/user/profile/print')
    return response as HotspotProfile[]
  }

  // ===== SYSTEM INFO =====

  /**
   * Get system resource info
   */
  async getSystemResource(): Promise<SystemResource> {
    const response = await this.sendCommand('/system/resource/print')
    return response[0] as SystemResource
  }

  /**
   * Get interface information
   */
  async getInterfaces(): Promise<InterfaceInfo[]> {
    const response = await this.sendCommand('/interface/print')
    return response as InterfaceInfo[]
  }

  /**
   * Get router identity
   */
  async getIdentity(): Promise<string> {
    const response = await this.sendCommand('/system/identity/print')
    return response[0]?.name || 'Unknown'
  }

  /**
   * Get system logs
   */
  async getLogs(topics?: string[], count?: number): Promise<any[]> {
    const params: Record<string, string> = {}
    if (topics?.length) params.topics = topics.join(',')
    if (count) params.count = count.toString()
    
    return this.sendCommand('/log/print', params)
  }

  // ===== BANDWIDTH & QUEUE =====

  /**
   * Create a simple queue for bandwidth limiting
   */
  async createQueue(params: {
    name: string
    target: string
    maxLimit: string
    burstLimit?: string
    burstTime?: string
    burstThreshold?: string
    parent?: string
    comment?: string
  }): Promise<any> {
    const cmdParams: Record<string, string> = {
      name: params.name,
      target: params.target,
      'max-limit': params.maxLimit,
    }

    if (params.burstLimit) cmdParams['burst-limit'] = params.burstLimit
    if (params.burstTime) cmdParams['burst-time'] = params.burstTime
    if (params.burstThreshold) cmdParams['burst-threshold'] = params.burstThreshold
    if (params.parent) cmdParams.parent = params.parent
    if (params.comment) cmdParams.comment = params.comment

    return this.sendCommand('/queue/simple/add', cmdParams)
  }

  /**
   * Update a simple queue
   */
  async updateQueue(id: string, params: Record<string, string>): Promise<any> {
    return this.sendCommand('/queue/simple/set', { '.id': id, ...params })
  }

  /**
   * Get all simple queues
   */
  async getQueues(): Promise<any[]> {
    return this.sendCommand('/queue/simple/print')
  }

  /**
   * Remove a queue
   */
  async removeQueue(id: string): Promise<any> {
    return this.sendCommand('/queue/simple/remove', { '.id': id })
  }

  // ===== DNS & FIREWALL =====

  /**
   * Get DNS settings
   */
  async getDNS(): Promise<any> {
    const response = await this.sendCommand('/ip/dns/print')
    return response[0]
  }

  /**
   * Add DNS server
   */
  async addDNSServer(server: string): Promise<any> {
    return this.sendCommand('/ip/dns/set', { servers: server })
  }

  /**
   * Get firewall filter rules
   */
  async getFirewallRules(): Promise<any[]> {
    return this.sendCommand('/ip/firewall/filter/print')
  }

  /**
   * Add firewall rule to block MAC address
   */
  async blockMAC(macAddress: string, comment?: string): Promise<any> {
    return this.sendCommand('/ip/firewall/filter/add', {
      chain: 'forward',
      'src-mac-address': macAddress,
      action: 'drop',
      comment: comment || `Blocked: ${macAddress}`,
    })
  }
}

/**
 * Create a MikroTik API connection, execute a command, and disconnect
 */
async function withMikroTik<T>(
  routerConfig: MikroTikConfig,
  fn: (api: MikroTikAPI) => Promise<T>
): Promise<T> {
  const api = new MikroTikAPI(routerConfig)
  try {
    await api.connect()
    await api.login()
    return await fn(api)
  } finally {
    api.disconnect()
  }
}

/**
 * Test connection to a MikroTik router
 */
async function testRouterConnection(config: MikroTikConfig): Promise<{
  success: boolean
  identity?: string
  version?: string
  uptime?: string
  error?: string
}> {
  try {
    return await withMikroTik(config, async (api) => {
      const [identity, resource] = await Promise.all([
        api.getIdentity(),
        api.getSystemResource(),
      ])

      return {
        success: true,
        identity,
        version: resource.version,
        uptime: resource.uptime,
      }
    })
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Create hotspot user on router when a client purchases a package
 */
async function provisionClientOnRouter(
  routerConfig: MikroTikConfig,
  clientInfo: {
    username: string
    password: string
    profileName: string
    comment: string
    limitUptime?: string
  }
): Promise<{ success: boolean; message: string }> {
  try {
    return await withMikroTik(routerConfig, async (api) => {
      // Check if user already exists
      const users = await api.getHotspotUsers()
      const existing = users.find(u => u.name === clientInfo.username)

      if (existing) {
        // Update existing user
        await api.updateHotspotUser(existing['.id'], {
          password: clientInfo.password,
          profile: clientInfo.profileName,
          comment: clientInfo.comment,
          disabled: 'false',
        })
        return { success: true, message: 'User updated on router' }
      }

      // Create new user
      await api.createHotspotUser({
        name: clientInfo.username,
        password: clientInfo.password,
        profile: clientInfo.profileName,
        comment: clientInfo.comment,
        limitUptime: clientInfo.limitUptime,
      })

      return { success: true, message: 'User created on router' }
    })
  } catch (error: any) {
    console.error('Failed to provision client on router:', error)
    return { success: false, message: error.message }
  }
}

/**
 * Disable hotspot user on router (when package expires)
 */
async function disableClientOnRouter(
  routerConfig: MikroTikConfig,
  username: string
): Promise<{ success: boolean; message: string }> {
  try {
    return await withMikroTik(routerConfig, async (api) => {
      const users = await api.getHotspotUsers()
      const user = users.find(u => u.name === username)

      if (!user) {
        return { success: false, message: 'User not found on router' }
      }

      await api.updateHotspotUser(user['.id'], { disabled: 'true' })

      // Also disconnect any active sessions
      const active = await api.getActiveConnections()
      const activeSession = active.find(a => a.user === username)
      if (activeSession) {
        await api.disconnectUser(activeSession['.id'])
      }

      return { success: true, message: 'User disabled and disconnected' }
    })
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

export {
  MikroTikAPI,
  MikroTikConfig,
  withMikroTik,
  testRouterConnection,
  provisionClientOnRouter,
  disableClientOnRouter,
}
export type { HotspotUser, HotspotActive, HotspotProfile, SystemResource, InterfaceInfo }
