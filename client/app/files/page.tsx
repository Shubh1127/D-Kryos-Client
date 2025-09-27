"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Upload, Download, FileText, ImageIcon, Music, Video, File, Trash2, Eye } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

interface FileItem {
  id: string
  name: string
  type: string
  size: number
  uploadDate: string
  category: "image" | "video" | "document" | "music" | "other"
  url: string
  publicId: string
  format?: string
  width?: number
  height?: number
}

export default function FilesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch files from Cloudinary
  useEffect(() => {
    const fetchFiles = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/media/list?userId=${user.id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch files')
        }

        const data = await response.json()
        const cloudinaryFiles: FileItem[] = data.files.map((file: any) => ({
          id: file.publicId,
          name: file.name,
          type: file.type === 'image' ? 'image/jpeg' : file.type === 'video' ? 'video/mp4' : 'application/octet-stream',
          size: file.size,
          uploadDate: new Date(file.uploadedAt).toISOString().split('T')[0],
          category: file.type === 'image' ? 'image' : file.type === 'video' ? 'video' : 'other',
          url: file.url,
          publicId: file.publicId,
          format: file.format,
          width: file.width,
          height: file.height,
        }))

        setFiles(cloudinaryFiles)
      } catch (error) {
        console.error('Error fetching files:', error)
        toast({
          title: "Error",
          description: "Failed to load files",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchFiles()
  }, [user, toast])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (category: string) => {
    switch (category) {
      case "image":
        return <ImageIcon className="h-5 w-5 text-blue-500" />
      case "video":
        return <Video className="h-5 w-5 text-purple-500" />
      case "document":
        return <FileText className="h-5 w-5 text-green-500" />
      case "music":
        return <Music className="h-5 w-5 text-orange-500" />
      default:
        return <File className="h-5 w-5 text-gray-500" />
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files
    if (!uploadedFiles || uploadedFiles.length === 0 || !user) return

    setIsUploading(true)

    try {
      const uploadPromises = Array.from(uploadedFiles).map(async (file) => {
        const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const formData = new FormData()
        formData.append('file', file)
        formData.append('fileName', file.name.replace(/[^a-zA-Z0-9.-]/g, '_'))
        formData.append('fileId', fileId)
        formData.append('userId', user.id)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        return await response.json()
      })

      await Promise.all(uploadPromises)

      // Refresh the files list
      const response = await fetch(`/api/media/list?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        const cloudinaryFiles: FileItem[] = data.files.map((file: any) => ({
          id: file.publicId,
          name: file.name,
          type: file.type === 'image' ? 'image/jpeg' : file.type === 'video' ? 'video/mp4' : 'application/octet-stream',
          size: file.size,
          uploadDate: new Date(file.uploadedAt).toISOString().split('T')[0],
          category: file.type === 'image' ? 'image' : file.type === 'video' ? 'video' : 'other',
          url: file.url,
          publicId: file.publicId,
          format: file.format,
          width: file.width,
          height: file.height,
        }))
        setFiles(cloudinaryFiles)
      }

      toast({
        title: "Upload Successful",
        description: `${uploadedFiles.length} file(s) uploaded successfully.`,
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload Failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      // Reset input
      e.target.value = ""
    }
  }

  const handleSelectFile = (fileId: string) => {
    setSelectedFiles((prev) => (prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]))
  }

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(files.map((file) => file.id))
    }
  }

  const handleDownload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select files to download.",
        variant: "destructive",
      })
      return
    }

    if (selectedFiles.length > 50) {
      toast({
        title: "Download Limit Exceeded",
        description: "You can only download up to 50 files at once.",
        variant: "destructive",
      })
      return
    }

    try {
      // Download each selected file
      for (const fileId of selectedFiles) {
        const file = files.find(f => f.id === fileId)
        if (file) {
          const response = await fetch(file.url)
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = file.name
          document.body.appendChild(a)
          a.click()
          window.URL.revokeObjectURL(url)
          document.body.removeChild(a)
        }
      }

      toast({
        title: "Download Complete",
        description: `Downloaded ${selectedFiles.length} file(s) successfully.`,
      })
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Some files failed to download.",
        variant: "destructive",
      })
    }

    setSelectedFiles([])
  }

  const handleDelete = async (fileId: string) => {
    try {
      const file = files.find(f => f.id === fileId)
      if (!file) return

      // Delete from Cloudinary
      const response = await fetch('/api/media/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          publicId: file.publicId,
          resourceType: file.category === 'image' ? 'image' : file.category === 'video' ? 'video' : 'image',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete file')
      }

      // Update local state
      setFiles((prev) => prev.filter((file) => file.id !== fileId))
      setSelectedFiles((prev) => prev.filter((id) => id !== fileId))

      toast({
        title: "File Deleted",
        description: "File has been deleted successfully.",
      })
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Delete Failed",
        description: "Failed to delete file.",
        variant: "destructive",
      })
    }
  }

  const stats = {
    totalFiles: files.length,
    totalSize: files.reduce((acc, file) => acc + file.size, 0),
    images: files.filter((f) => f.category === "image").length,
    videos: files.filter((f) => f.category === "video").length,
    documents: files.filter((f) => f.category === "document").length,
    music: files.filter((f) => f.category === "music").length,
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">File Management</h1>
            <p className="text-muted-foreground">Upload, organize, and manage your media files</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedFiles.length > 0 && (
              <Button onClick={handleDownload} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download ({selectedFiles.length})
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Files</p>
                  <p className="text-2xl font-bold">
                    {loading ? (
                      <div className="h-6 w-8 bg-muted animate-pulse rounded" />
                    ) : (
                      stats.totalFiles
                    )}
                  </p>
                </div>
                <File className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Size</p>
                  <p className="text-2xl font-bold">
                    {loading ? (
                      <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                    ) : (
                      formatFileSize(stats.totalSize)
                    )}
                  </p>
                </div>
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Images</p>
                  <p className="text-2xl font-bold">
                    {loading ? (
                      <div className="h-6 w-6 bg-muted animate-pulse rounded" />
                    ) : (
                      stats.images
                    )}
                  </p>
                </div>
                <ImageIcon className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Videos</p>
                  <p className="text-2xl font-bold">
                    {loading ? (
                      <div className="h-6 w-6 bg-muted animate-pulse rounded" />
                    ) : (
                      stats.videos
                    )}
                  </p>
                </div>
                <Video className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Documents</p>
                  <p className="text-2xl font-bold">
                    {loading ? (
                      <div className="h-6 w-6 bg-muted animate-pulse rounded" />
                    ) : (
                      stats.documents
                    )}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Files
            </CardTitle>
            <CardDescription>Upload images, videos, documents, and music files</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload">Select Files</Label>
                <Input
                  id="file-upload"
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                />
              </div>
              {isUploading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                  Uploading files...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Files List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Files</CardTitle>
                <CardDescription>Manage and download your uploaded files</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedFiles.length === files.length && files.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label className="text-sm">Select All</Label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 border border-border rounded-lg">
                      <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                      <div className="h-6 w-6 bg-muted animate-pulse rounded" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted animate-pulse rounded w-1/3" />
                        <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-8">
                  <File className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No files uploaded yet</p>
                </div>
              ) : (
                files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/5"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedFiles.includes(file.id)}
                        onCheckedChange={() => handleSelectFile(file.id)}
                      />
                      {getFileIcon(file.category)}
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <span>{file.uploadDate}</span>
                          <Badge variant="secondary" className="text-xs">
                            {file.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(file.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Download Limits Info */}
        <Card className="border-orange-500/20">
          <CardHeader>
            <CardTitle className="text-orange-500">Download Limits</CardTitle>
            <CardDescription>Important information about file downloads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>• Maximum 50 files can be downloaded at once</p>
              <p>• Files are compressed into a ZIP archive for bulk downloads</p>
              <p>• Individual file downloads have no restrictions</p>
              <p>• All downloads are logged for security purposes</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
