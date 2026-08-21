type Pending = {
  email: string
  name: string
  role: string
  shopName?: string | null
  password: string // hashed password
  otp: string
  createdAt: number
  verified?: boolean
}

const pendingVerifications = new Map<string, Pending>()

export function getPending(email: string) {
  return pendingVerifications.get(email)
}

export function setPending(email: string, data: Pending) {
  pendingVerifications.set(email, data)
}

export function deletePending(email: string) {
  pendingVerifications.delete(email)
}

export default pendingVerifications
