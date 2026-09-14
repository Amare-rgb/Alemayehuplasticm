export interface BusinessDetails {
  businessName: string
  email: string
  phone: string
  address: string
  licenseNumber?: string
}

export interface BankDetails {
  bankName: string
  accountHolderName: string
  accountNumber: string
  iban?: string
}

export interface VerificationFile {
  name: string
  url: string
  mimeType?: string
}


