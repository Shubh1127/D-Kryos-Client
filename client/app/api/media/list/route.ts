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
    console.log('Media list API called')
    
    // Check if Cloudinary is configured
    if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Missing Cloudinary environment variables')
      return NextResponse.json({ 
        error: 'Cloudinary not configured properly',
        missing: {
          cloud_name: !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
          api_key: !process.env.CLOUDINARY_API_KEY,
          api_secret: !process.env.CLOUDINARY_API_SECRET
        }
      }, { status: 500 })
    }
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    console.log('Fetching media for userId:', userId)
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Search for resources in the user's folder
    const folderPath = `kryos/users/${userId}/media`
    console.log('Searching in folder:', folderPath)
    
    // Try a simpler approach first - get all resources and then filter
    console.log('Executing Cloudinary search...')
    
    let imageResults, videoResults
    
    try {
      // First, try to get all images
      imageResults = await cloudinary.search
        .expression(`folder:${folderPath}`)
        .max_results(100)
        .execute()
      console.log('Image search successful:', imageResults.resources?.length || 0, 'results')
    } catch (imgError) {
      console.error('Image search error:', imgError)
      imageResults = { resources: [] }
    }
    
    try {
      // Then, try to get all videos
      videoResults = await cloudinary.search
        .expression(`folder:${folderPath}`)
        .resource_type('video')
        .max_results(100)
        .execute()
      console.log('Video search successful:', videoResults.resources?.length || 0, 'results')
    } catch (vidError) {
      console.error('Video search error:', vidError)
      videoResults = { resources: [] }
    }

    // Combine and format the results
    const allResources = [...(imageResults.resources || []), ...(videoResults.resources || [])]
    console.log('Total resources found:', allResources.length)
    
    // If no resources found in the specific folder, try a broader search
    if (allResources.length === 0) {
      console.log('No resources found in folder, trying broader search...')
      try {
        const broadSearch = await cloudinary.search
          .expression(`*`)
          .max_results(100)
          .execute()
        console.log('Broad search found:', broadSearch.resources?.length || 0, 'total resources')
        
        // Filter by user folder from the broad results
        const userResources = broadSearch.resources?.filter((resource: any) => 
          resource.public_id.includes(`users/${userId}`)
        ) || []
        console.log('User resources from broad search:', userResources.length)
        allResources.push(...userResources)
      } catch (broadError) {
        console.error('Broad search also failed:', broadError)
      }
    }
    
    const files = allResources.map((resource: any) => {
      console.log('Processing resource:', {
        public_id: resource.public_id,
        secure_url: resource.secure_url,
        resource_type: resource.resource_type
      })
      
      return {
        id: resource.public_id,
        name: resource.filename || resource.public_id.split('/').pop() || 'Unknown',
        type: resource.resource_type === 'video' ? 'video' : 'image',
        size: resource.bytes || 0,
        url: resource.secure_url,
        publicId: resource.public_id,
        cloudinaryId: resource.public_id,
        userId: userId,
        uploadedAt: new Date(resource.created_at),
        format: resource.format,
        width: resource.width,
        height: resource.height,
      }
    })

    // Sort by upload date (newest first)
    files.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())

    console.log('Returning', files.length, 'files to client')
    
    return NextResponse.json({
      success: true,
      files,
      total: files.length
    })
    
  } catch (error: any) {
    console.error('Error listing media files:', error)
    console.error('Error stack:', error.stack)
    
    return NextResponse.json(
      { 
        error: 'Failed to list media files', 
        details: error.message,
        stack: error.stack 
      },
      { status: 500 }
    )
  }
}