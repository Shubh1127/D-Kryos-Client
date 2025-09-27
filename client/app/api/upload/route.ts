import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const fileName = formData.get('fileName') as string
    const fileId = formData.get('fileId') as string
    const userId = formData.get('userId') as string

    if (!file || !fileName || !fileId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `kryos/users/${userId}/media`,
          public_id: `${fileId}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
          resource_type: file.type.startsWith('video/') ? 'video' : 'auto',
          overwrite: true,
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    }) as any

    // Return the upload result (no Firestore needed)
    const mediaFile = {
      id: uploadResult.public_id,
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'video',
      size: uploadResult.bytes,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      cloudinaryId: uploadResult.public_id,
      userId: userId,
      uploadedAt: new Date(),
      format: uploadResult.format,
      width: uploadResult.width,
      height: uploadResult.height,
    }

    console.log('Successfully uploaded to Cloudinary:', mediaFile)

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      file: mediaFile
    })
    
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    )
  }
}