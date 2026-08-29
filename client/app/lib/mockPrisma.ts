import { SellerProfile, BusinessDetails, BankDetails, VerificationFile } from '../types/onboard'

// ── FIX: Use const instead of let since it's never reassigned ──────────────
const _store: Record<string, SellerProfile> = {}

export async function createSeller(profile: Omit<SellerProfile, 'id' | 'createdAt'>): Promise<SellerProfile> {
  const id = `seller_${Date.now()}`
  const createdAt = new Date().toISOString()
  const record: SellerProfile = { 
    id, 
    createdAt, 
    ...profile 
  }
  
  // simulate async DB write
  await new Promise((resolve) => setTimeout(resolve, 700))
  
  // ── FIX: Use Object.assign to modify the const object ────────────────────
  Object.assign(_store, { [id]: record })
  
  return record
}

export async function getSeller(id: string): Promise<SellerProfile | null> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return _store[id] || null
}

export async function updateSeller(id: string, updates: Partial<SellerProfile>): Promise<SellerProfile | null> {
  if (!_store[id]) {
    return null
  }
  
  // simulate async DB write
  await new Promise((resolve) => setTimeout(resolve, 500))
  
  const updated = { ..._store[id], ...updates, updatedAt: new Date().toISOString() }
  Object.assign(_store, { [id]: updated })
  
  return updated
}

export async function deleteSeller(id: string): Promise<boolean> {
  if (!_store[id]) {
    return false
  }
  
  // simulate async DB write
  await new Promise((resolve) => setTimeout(resolve, 500))
  
  const { [id]: removed, ...rest } = _store
  Object.assign(_store, rest)
  
  return true
}

export async function getAllSellers(): Promise<SellerProfile[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return Object.values(_store)
}

export default { 
  createSeller, 
  getSeller, 
  updateSeller, 
  deleteSeller, 
  getAllSellers 
}