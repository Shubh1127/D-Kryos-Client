import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Razorpay test credentials
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_1234567890'
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_secret_key'

export async function POST(request: NextRequest) {
  try {
    const { amount, currency = 'INR', receipt, notes } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      )
    }

    // Create Razorpay order
    const options = {
      amount: amount * 100, // Amount in paise (smallest currency unit)
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    }

    console.log('Creating Razorpay order with options:', options)

    // Create Razorpay order using direct API call
    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64')
    
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Razorpay API error: ${errorData.error?.description || 'Unknown error'}`)
    }

    const order = await response.json()
    console.log('Razorpay order created:', order)

    return NextResponse.json({
      success: true,
      order,
      key_id: RAZORPAY_KEY_ID,
    })

  } catch (error: any) {
    console.error('Error creating Razorpay order:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create payment order',
        details: error.message 
      },
      { status: 500 }
    )
  }
}