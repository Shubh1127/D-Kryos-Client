"use client"

import { useState, useRef } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProfileForm } from "@/components/profile/profile-form"
import { MediaUpload } from "@/components/media/media-upload"
import { MediaGallery } from "@/components/media/media-gallery"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProfilePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const mediaGalleryRef = useRef<{ refresh: () => void }>(null)
  
  const handleUploadComplete = () => {
    // Trigger gallery refresh
    setRefreshTrigger(prev => prev + 1)
    if (mediaGalleryRef.current) {
      mediaGalleryRef.current.refresh()
    }
  }
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings, upload media files, and view your content.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="media">Media Upload</TabsTrigger>
            <TabsTrigger value="gallery">Media Gallery</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and account settings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upload Media</CardTitle>
                <CardDescription>
                  Upload images and videos to your personal storage.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MediaUpload onUploadComplete={handleUploadComplete} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-4">
            <MediaGallery ref={mediaGalleryRef} key={refreshTrigger} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
