/**
 * OCR Client for Receipt Scanning
 * Simple API client untuk scan struk tanpa perlu simpan ke database
 */

import { getApiKey } from '../storage/secure-storage'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000'

export interface OcrItem {
  name: string
  price: number
}

export interface OcrResult {
  items: OcrItem[]
  subtotal: number
  tax: number
  service: number
  total: number
}

export interface OcrResponse {
  success: boolean
  data: OcrResult
}

/**
 * Scan receipt image dan return structured data
 * @param imageUri - URI gambar dari camera/gallery
 * @returns OCR result dengan items, subtotal, tax, service, total
 */
export async function scanReceipt(imageUri: string): Promise<OcrResult> {
  console.log('🔍 [OCR Client] Starting scan receipt...')
  console.log('📍 [OCR Client] API_BASE_URL:', API_BASE_URL)
  console.log('🖼️ [OCR Client] Image URI:', imageUri)
  
  const apiKey = await getApiKey()
  console.log('🔑 [OCR Client] API Key:', apiKey ? 'Found' : 'Not found')
  
  // For testing: allow without API key (will use mock data from backend)
  // if (!apiKey) {
  //   throw new Error('API key not found. Please login first.')
  // }

  // Create form data
  const formData = new FormData()
  
  console.log('📦 [OCR Client] Creating FormData...')
  
  // Convert image URI to blob
  try {
    console.log('🌐 [OCR Client] Fetching image from URI...')
    const response = await fetch(imageUri)
    console.log('✅ [OCR Client] Image fetch response:', response.status, response.statusText)
    
    const blob = await response.blob()
    console.log('✅ [OCR Client] Blob created, size:', blob.size, 'type:', blob.type)
    
    // Append image to form data
    formData.append('image', blob, 'receipt.jpg')
    console.log('✅ [OCR Client] Image appended to FormData')
  } catch (error) {
    console.error('❌ [OCR Client] Error creating blob:', error)
    throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  // Send request
  const apiUrl = `${API_BASE_URL}/api/v1/mobile/ocr/receipt`
  console.log('🚀 [OCR Client] Sending request to:', apiUrl)
  console.log('🔐 [OCR Client] Headers:', apiKey ? 'With Authorization' : 'No Authorization')
  
  try {
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: apiKey ? {
        'Authorization': `Bearer ${apiKey}`,
      } : {},
      body: formData,
    })

    console.log('📥 [OCR Client] Response status:', apiResponse.status, apiResponse.statusText)
    console.log('📥 [OCR Client] Response headers:', JSON.stringify(Object.fromEntries(apiResponse.headers.entries())))

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      console.error('❌ [OCR Client] Error response:', errorText)
      
      try {
        const error = JSON.parse(errorText)
        throw new Error(error.error || 'Failed to scan receipt')
      } catch (e) {
        throw new Error(`Failed to scan receipt: ${apiResponse.status} ${apiResponse.statusText}`)
      }
    }

    const result: OcrResponse = await apiResponse.json()
    console.log('✅ [OCR Client] Success! Result:', JSON.stringify(result, null, 2))
    
    return result.data
  } catch (error) {
    console.error('❌ [OCR Client] Network/Fetch error:', error)
    console.error('❌ [OCR Client] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
}

/**
 * Calculate split per person
 * @param ocrResult - Result from scanReceipt
 * @param numPeople - Number of people to split
 * @returns Amount per person
 */
export function calculateSplitPerPerson(ocrResult: OcrResult, numPeople: number): number {
  if (numPeople <= 0) return 0
  return Math.ceil(ocrResult.total / numPeople)
}

/**
 * Format currency to IDR
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}
