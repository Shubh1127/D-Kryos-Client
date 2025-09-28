import { NextRequest, NextResponse } from 'next/server'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/firebaseConfig'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('Fetching transactions for user:', userId)

    // Query transactions from Firestore (without orderBy to avoid index requirement)
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId)
    )

    const querySnapshot = await getDocs(q)
    const transactions: any[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      transactions.push({
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate?.() || data.created_at,
        updated_at: data.updated_at?.toDate?.() || data.updated_at,
      })
    })

    // Sort transactions by created_at in descending order (newest first)
    transactions.sort((a, b) => {
      const dateA = a.created_at instanceof Date ? a.created_at : new Date(a.created_at)
      const dateB = b.created_at instanceof Date ? b.created_at : new Date(b.created_at)
      return dateB.getTime() - dateA.getTime()
    })

    console.log('Found transactions:', transactions.length)

    return NextResponse.json({
      success: true,
      transactions,
      total: transactions.length
    })

  } catch (error: any) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch transaction history',
        details: error.message 
      },
      { status: 500 }
    )
  }
}