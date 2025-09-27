// Client-side configuration for unsigned uploads
export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
}

// Cloudinary transformation utilities
export const getOptimizedUrl = (publicId: string, options?: {
  width?: number
  height?: number
  crop?: string
  quality?: string
  format?: string
}) => {
  const { width, height, crop = 'fill', quality = 'auto', format = 'auto' } = options || {}
  
  let transformation = `q_${quality},f_${format}`
  
  if (width && height) {
    transformation += `,w_${width},h_${height},c_${crop}`
  } else if (width) {
    transformation += `,w_${width}`
  } else if (height) {
    transformation += `,h_${height}`
  }
  
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${transformation}/${publicId}`
}

export const getVideoUrl = (publicId: string, options?: {
  quality?: string
  format?: string
}) => {
  const { quality = 'auto', format = 'auto' } = options || {}
  
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/q_${quality},f_${format}/${publicId}`
}