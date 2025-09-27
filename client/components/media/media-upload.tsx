"use client"

import { useState, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Upload, X, File, Image, Video } from "lucide-react"
interface UploadFile {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  url?: string
  id?: string
}

interface MediaUploadProps {
  onUploadComplete?: () => void
}

export function MediaUpload({ onUploadComplete }: MediaUploadProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  
  const allowedTypes = {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    videos: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov']
  }
  
  const maxFileSize = 50 * 1024 * 1024 // 50MB
  
  const isValidFile = (file: File) => {
    const allAllowedTypes = [...allowedTypes.images, ...allowedTypes.videos]
    return allAllowedTypes.includes(file.type) && file.size <= maxFileSize
  }
  
  const getFileType = (file: File) => {
    if (allowedTypes.images.includes(file.type)) return 'image'
    if (allowedTypes.videos.includes(file.type)) return 'video'
    return 'unknown'
  }
  
  const handleFileSelect = (files: FileList | null) => {
    if (!files || !user) return
    
    const validFiles: UploadFile[] = []
    const invalidFiles: string[] = []
    
    Array.from(files).forEach(file => {
      if (isValidFile(file)) {
        validFiles.push({
          file,
          progress: 0,
          status: 'pending'
        })
      } else {
        invalidFiles.push(file.name)
      }
    })
    
    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid Files",
        description: `${invalidFiles.join(', ')} are not supported or exceed 50MB limit.`,
        variant: "destructive",
      })
    }
    
    setUploadFiles(prev => [...prev, ...validFiles])
  }
  
  const uploadFile = async (uploadFileItem: UploadFile, index: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please make sure you're logged in before uploading files.",
        variant: "destructive",
      })
      return
    }
    
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const cleanFileName = uploadFileItem.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    
    setUploadFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, status: 'uploading', id: fileId } : f
    ))
    
    try {
      // Create FormData for the upload
      const formData = new FormData()
      formData.append('file', uploadFileItem.file)
      formData.append('fileName', cleanFileName)
      formData.append('fileId', fileId)
      formData.append('userId', user.id)
      
      // Upload via our API route
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const uploadResult = await uploadResponse.json()
      
      setUploadFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'completed', url: uploadResult.url, progress: 100 } : f
      ))

      toast({
        title: "Upload Complete",
        description: `${uploadFileItem.file.name} uploaded successfully`,
      })
      
      // Trigger refresh callback
      if (onUploadComplete) {
        onUploadComplete()
      }
      
    } catch (error: any) {
      console.error('Upload initialization error:', error)
      setUploadFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'error' } : f
      ))
      toast({
        title: "Upload Failed",
        description: `Failed to start upload: ${error.message}`,
        variant: "destructive",
      })
    }
  }
  
  const startUploads = () => {
    uploadFiles.forEach((uploadFileItem, index) => {
      if (uploadFileItem.status === 'pending') {
        uploadFile(uploadFileItem, index)
      }
    })
  }
  
  const removeFile = (index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index))
  }
  
  const clearCompleted = () => {
    setUploadFiles(prev => prev.filter(f => f.status !== 'completed'))
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }
  
  const getFileIcon = (file: File) => {
    const type = getFileType(file)
    if (type === 'image') return <Image className="h-8 w-8 text-blue-500" />
    if (type === 'video') return <Video className="h-8 w-8 text-green-500" />
    return <File className="h-8 w-8 text-gray-500" />
  }
  
  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Upload Media Files</h3>
        <p className="text-muted-foreground mb-4">
          Drag and drop images or videos here, or click to browse
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          Supports: JPEG, PNG, GIF, WebP, MP4, WebM, OGG (Max: 50MB)
        </p>
        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="outline"
        >
          Browse Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={[...allowedTypes.images, ...allowedTypes.videos].join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>
      
      {/* Upload Queue */}
      {uploadFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold">Upload Queue ({uploadFiles.length})</h4>
            <div className="space-x-2">
              <Button 
                onClick={startUploads}
                disabled={!uploadFiles.some(f => f.status === 'pending')}
                size="sm"
              >
                Upload All
              </Button>
              <Button 
                onClick={clearCompleted}
                disabled={!uploadFiles.some(f => f.status === 'completed')}
                variant="outline"
                size="sm"
              >
                Clear Completed
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            {uploadFiles.map((uploadFile, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
                {getFileIcon(uploadFile.file)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{uploadFile.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(uploadFile.file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  {uploadFile.status === 'uploading' && (
                    <Progress value={uploadFile.progress} className="mt-2" />
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    uploadFile.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                    uploadFile.status === 'uploading' ? 'bg-blue-100 text-blue-800' :
                    uploadFile.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {uploadFile.status}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(index)}
                    disabled={uploadFile.status === 'uploading'}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}