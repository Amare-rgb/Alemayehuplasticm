import { SellerProfile, BusinessDetails, BankDetails, VerificationFile } from '../types/onboard'

let _store: Record<string, SellerProfile> = {}

export async function createSeller(profile: Omit<SellerProfile, 'id' | 'createdAt'>) {
  const id = `seller_${Date.now()}`
  const createdAt = new Date().toISOString()
  const record: SellerProfile = { id, createdAt, ...profile }
  // simulate async DB write
  await new Promise((r) => setTimeout(r, 700))
  _store[id] = record
  return record
}

export async function getSeller(id: string) {
  await new Promise((r) => setTimeout(r, 200))
  return _store[id] || null
}

export default { createSeller, getSeller }
