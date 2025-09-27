"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Download, Trash2, Eye, Image, Video, Calendar, FileText } from "lucide-react"
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore"
import { ref, deleteObject, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/firebase/firebaseConfig"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface MediaFile {
  id: string
  name: string
  type: 'image' | 'video'
  size: number
  url: string
  userId: string
  uploadedAt: any
}

export function MediaGallery() {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  
  useEffect(() => {
    if (!user) return
    
    const q = query(
      collection(db, 'media'),
      where('userId', '==', user.id),
      orderBy('uploadedAt', 'desc')
    )
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const files: MediaFile[] = []
      snapshot.forEach((doc) => {
        files.push({ id: doc.id, ...doc.data() } as MediaFile)
      })
      setMediaFiles(files)
      setLoading(false)
    })
    
    return () => unsubscribe()
  }, [user])
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
  
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }
  
  const downloadFile = async (file: MediaFile) => {
    try {
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
      
      toast({
        title: "Download Started",
        description: `${file.name} is being downloaded.`,
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: "Download Failed",
        description: "Failed to download the file.",
        variant: "destructive",
      })
    }
  }
  
  const deleteFile = async (file: MediaFile) => {
    try {
      // Delete from Storage
      const fileRef = ref(storage, `users/${user?.id}/media/${file.id}-${file.name}`)
      await deleteObject(fileRef)
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'media', file.id))
      
      toast({
        title: "File Deleted",
        description: `${file.name} has been deleted.`,
      })
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Delete Failed",
        description: "Failed to delete the file.",
        variant: "destructive",
      })
    }
  }
  
  const getFileIcon = (type: string) => {
    if (type === 'image') return <Image className="h-6 w-6 text-blue-500" />
    if (type === 'video') return <Video className="h-6 w-6 text-green-500" />
    return <FileText className="h-6 w-6 text-gray-500" />
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your media files...</p>
        </div>
      </div>
    )
  }
  
  if (mediaFiles.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <Image className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No media files yet</h3>
          <p className="text-muted-foreground text-center">
            Upload your first image or video to get started.
          </p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your Media Files ({mediaFiles.length})</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mediaFiles.map((file) => (
          <Card key={file.id} className="overflow-hidden">
            <div className="aspect-video bg-muted relative">
              {file.type === 'image' ? (
                <img
                  src={file.url}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={file.url}
                  className="w-full h-full object-cover"
                  preload="metadata"
                />
              )}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="secondary">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>{file.name}</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[70vh] overflow-auto">
                      {file.type === 'image' ? (
                        <img
                          src={file.url}
                          alt={file.name}
                          className="w-full h-auto"
                        />
                      ) : (
                        <video
                          src={file.url}
                          controls
                          className="w-full h-auto"
                        />
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getFileIcon(file.type)}
                    <h4 className="font-medium truncate">{file.name}</h4>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-3 w-3" />
                    <span>{formatFileSize(file.size)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(file.uploadedAt)}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadFile(file)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete File</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{file.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteFile(file)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}