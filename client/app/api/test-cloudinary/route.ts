import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Cloudinary connection...')
    
    // Test basic connectivity
    const result = await cloudinary.api.ping()
    console.log('Cloudinary ping result:', result)
    
    // Try to list some resources
    const resources = await cloudinary.search
      .expression('*')
      .max_results(5)
      .execute()
    
    console.log('Sample resources:', resources)
    
    return NextResponse.json({
      success: true,
      ping: result,
      sampleResourcesCount: resources.resources?.length || 0,
      sampleResources: resources.resources?.slice(0, 3) || []
    })
    
  } catch (error: any) {
    console.error('Cloudinary test error:', error)
    return NextResponse.json(
      { 
        error: 'Cloudinary test failed', 
        details: error.message,
        config: {
          cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
          has_api_key: !!process.env.CLOUDINARY_API_KEY,
          has_api_secret: !!process.env.CLOUDINARY_API_SECRET
        }
      },
      { status: 500 }
    )
  }
}