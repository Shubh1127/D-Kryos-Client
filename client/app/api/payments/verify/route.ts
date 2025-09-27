import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { doc, setDoc, collection } from 'firebase/firestore'
import { db } from '@/firebase/firebaseConfig'

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_secret_key'

export async function POST(request: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_details,
      user_id
    } = await request.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required payment verification parameters' },
        { status: 400 }
      )
    }

    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex')

    const isSignatureValid = expectedSignature === razorpay_signature
    console.log('Payment signature verification:', { isSignatureValid, expectedSignature, razorpay_signature })

    // Generate transaction ID
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Prepare transaction data for Firestore
    const transactionData = {
      id: transactionId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      amount: order_details.amount,
      currency: order_details.currency || 'INR',
      receiver: order_details.receiver,
      description: order_details.description,
      userId: user_id,
      status: isSignatureValid ? 'completed' : 'failed',
      signature_verified: isSignatureValid,
      created_at: new Date(),
      updated_at: new Date(),
    }

    // Save transaction to Firestore
    await setDoc(doc(collection(db, 'transactions'), transactionId), transactionData)
    console.log('Transaction saved to Firestore:', transactionId)

    return NextResponse.json({
      success: true,
      verified: isSignatureValid,
      transaction_id: transactionId,
      status: isSignatureValid ? 'completed' : 'failed',
      message: isSignatureValid ? 'Payment verified successfully' : 'Payment verification failed'
    })

  } catch (error: any) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { 
        error: 'Payment verification failed',
        details: error.message 
      },
      { status: 500 }
    )
  }
}