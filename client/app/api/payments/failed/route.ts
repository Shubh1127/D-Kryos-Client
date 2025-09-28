import { NextRequest, NextResponse } from 'next/server'
import { doc, setDoc, collection } from 'firebase/firestore'
import { db } from '@/firebase/firebaseConfig'

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      order_details,
      user_id,
      failure_reason
    } = await request.json()

    if (!razorpay_order_id || !user_id) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Generate transaction ID
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Prepare failed transaction data for Firestore
    const transactionData = {
      id: transactionId,
      razorpay_order_id,
      razorpay_payment_id: null,
      razorpay_signature: null,
      amount: order_details.amount,
      currency: order_details.currency || 'INR',
      receiver: order_details.receiver,
      description: order_details.description || '',
      userId: user_id,
      status: 'failed',
      signature_verified: false,
      failure_reason: failure_reason || 'Payment cancelled by user',
      created_at: new Date(),
      updated_at: new Date(),
    }

    // Save failed transaction to Firestore
    await setDoc(doc(collection(db, 'transactions'), transactionId), transactionData)
    console.log('Failed transaction saved to Firestore:', transactionId)

    return NextResponse.json({
      success: true,
      transaction_id: transactionId,
      status: 'failed',
      message: 'Failed transaction recorded successfully'
    })

  } catch (error: any) {
    console.error('Error recording failed payment:', error)
    return NextResponse.json(
      { 
        error: 'Failed to record failed payment',
        details: error.message 
      },
      { status: 500 }
    )
  }
}