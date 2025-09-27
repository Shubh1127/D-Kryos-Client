import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(request: NextRequest) {
  try {
    const { publicId, resourceType } = await request.json();

    if (!publicId) {
      return NextResponse.json(
        { error: 'Public ID is required' },
        { status: 400 }
      );
    }

    console.log('Deleting resource:', { publicId, resourceType });

    let result;
    
    if (resourceType && (resourceType === 'image' || resourceType === 'video')) {
      // If we know the resource type, use it directly
      result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
    } else {
      // Try image first, then video if image fails
      try {
        result = await cloudinary.uploader.destroy(publicId, {
          resource_type: 'image',
        });
        
        // If the result is 'not found', try video
        if (result.result === 'not found') {
          result = await cloudinary.uploader.destroy(publicId, {
            resource_type: 'video',
          });
        }
      } catch (imageError) {
        console.log('Image deletion failed, trying video:', imageError);
        // If image deletion fails, try video
        result = await cloudinary.uploader.destroy(publicId, {
          resource_type: 'video',
        });
      }
    }

    console.log('Cloudinary delete result:', result);

    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new Error(`Failed to delete resource: ${result.result}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'File deleted successfully',
      result 
    });

  } catch (error: any) {
    console.error('Error deleting file from Cloudinary:', error);
    return NextResponse.json(
      { error: 'Failed to delete file', details: error.message },
      { status: 500 }
    );
  }
}