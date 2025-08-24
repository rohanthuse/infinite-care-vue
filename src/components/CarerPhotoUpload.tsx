
import React, { useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUpdateCarer } from '@/data/hooks/useBranchCarers';

interface CarerPhotoUploadProps {
  carerId: string;
  currentPhotoUrl?: string;
  carerName: string;
  isEditing?: boolean;
}

export const CarerPhotoUpload: React.FC<CarerPhotoUploadProps> = ({
  carerId,
  currentPhotoUrl,
  carerName,
  isEditing = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const updateCarerMutation = useUpdateCarer();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const uploadPhoto = async (file: File) => {
    if (!file) return null;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create a unique filename with timestamp
      const fileExt = file.name.split('.').pop();
      const filename = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${filename}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('staff-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(uploadError.message);
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('staff-photos')
        .getPublicUrl(uploadData.path);

      return publicUrl;
    } catch (error) {
      console.error('Photo upload error:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload photo
      const photoUrl = await uploadPhoto(file);
      if (photoUrl) {
        // Update carer profile with new photo URL
        await updateCarerMutation.mutateAsync({
          id: carerId,
          photo_url: photoUrl,
        });

        toast({
          title: "Photo updated",
          description: "Your profile photo has been updated successfully.",
        });
      }
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
      setPreviewUrl(null);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      // Update carer profile to remove photo URL
      await updateCarerMutation.mutateAsync({
        id: carerId,
        photo_url: null,
      });

      setPreviewUrl(null);
      
      toast({
        title: "Photo removed",
        description: "Your profile photo has been removed.",
      });
    } catch (error: any) {
      console.error('Error removing photo:', error);
      toast({
        title: "Remove failed",
        description: error.message || "Failed to remove photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const displayPhotoUrl = previewUrl || currentPhotoUrl;

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="w-24 h-24">
          <AvatarImage src={displayPhotoUrl} alt={carerName} />
          <AvatarFallback className="text-lg font-semibold">
            {getInitials(carerName)}
          </AvatarFallback>
        </Avatar>
        
        {isEditing && (
          <div className="absolute -bottom-2 -right-2">
            <label htmlFor="photo-upload" className="cursor-pointer">
              <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-lg hover:bg-primary/90 transition-colors">
                <Camera className="w-4 h-4" />
              </div>
            </label>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </div>
        )}
      </div>

      {isEditing && (
        <div className="flex flex-col items-center space-y-2">
          {uploading && (
            <p className="text-sm text-muted-foreground">Uploading...</p>
          )}
          
          {displayPhotoUrl && !uploading && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRemovePhoto}
              disabled={updateCarerMutation.isPending}
              className="text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Remove Photo
            </Button>
          )}
          
          {!displayPhotoUrl && !uploading && (
            <div className="text-center">
              <label htmlFor="photo-upload-alt" className="cursor-pointer">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>Upload Photo</span>
                </div>
              </label>
              <input
                id="photo-upload-alt"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
