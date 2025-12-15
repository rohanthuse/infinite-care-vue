import React, { useRef, useState } from "react";
import { Mail, Phone, MapPin, Briefcase, Upload, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStaffPhotoUpload } from "@/hooks/useStaffPhotoUpload";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CarerProfile } from "@/hooks/useCarerProfile";

interface CarerProfileSummaryCardProps {
  carerId: string;
  carer: CarerProfile;
  onPhotoUpdate?: () => void;
}

const getStatusConfig = (status: string) => {
  const statusMap: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
    'active': { label: 'Active', variant: 'success' },
    'on_leave': { label: 'On Leave', variant: 'warning' },
    'suspended': { label: 'Suspended', variant: 'destructive' },
    'inactive': { label: 'Inactive', variant: 'secondary' },
  };
  return statusMap[status?.toLowerCase()] || statusMap['inactive'];
};

const calculateExperience = (hireDate?: string, experienceField?: string): string => {
  if (experienceField) return experienceField;
  
  if (hireDate) {
    const years = Math.floor(
      (new Date().getTime() - new Date(hireDate).getTime()) / 
      (1000 * 60 * 60 * 24 * 365.25)
    );
    return years > 0 ? `${years} Year${years > 1 ? 's' : ''}` : 'Less than 1 year';
  }
  
  return 'Not specified';
};

export function CarerProfileSummaryCard({ carerId, carer, onPhotoUpdate }: CarerProfileSummaryCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadPhoto, deletePhoto, uploading } = useStaffPhotoUpload();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const statusConfig = getStatusConfig(carer.status);
  const experience = calculateExperience(carer.hire_date, carer.experience);
  const initials = `${carer.first_name?.[0] || ''}${carer.last_name?.[0] || ''}`.toUpperCase();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      const photoUrl = await uploadPhoto(file, carerId);
      if (photoUrl) {
        // Update staff record with new photo URL
        const { error } = await supabase
          .from('staff')
          .update({ photo_url: photoUrl })
          .eq('id', carerId);

        if (error) throw error;

        // Invalidate cache to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['carer-profile-by-id', carerId] });
        toast.success('Photo uploaded successfully');
        onPhotoUpdate?.();
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!carer.photo_url) return;

    setIsDeleting(true);
    try {
      const success = await deletePhoto(carer.photo_url);
      if (success) {
        // Update staff record to remove photo URL
        const { error } = await supabase
          .from('staff')
          .update({ photo_url: null })
          .eq('id', carerId);

        if (error) throw error;

        // Invalidate cache to refresh the UI
        queryClient.invalidateQueries({ queryKey: ['carer-profile-by-id', carerId] });
        toast.success('Photo removed successfully');
        onPhotoUpdate?.();
      }
    } catch (error) {
      console.error('Error removing photo:', error);
      toast.error('Failed to remove photo');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="px-6 py-4 bg-card border-b border-border">
      <div className="flex items-start gap-5">
        {/* Left Column - Avatar and Photo Actions */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <Avatar className="h-20 w-20 border-2 border-primary">
            <AvatarImage src={carer.photo_url} alt={`${carer.first_name} ${carer.last_name}`} />
            <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="h-7 px-2 text-xs gap-1"
            >
              <Upload className="h-3 w-3" />
              {uploading ? '...' : 'Change'}
            </Button>
            {carer.photo_url && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRemovePhoto}
                disabled={isDeleting}
                className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Right Column - Details */}
        <div className="flex-1 min-w-0">
          {/* Name and Status Row */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-lg font-bold text-foreground truncate">
              {carer.first_name} {carer.last_name}
            </h2>
            <Badge variant={statusConfig.variant} className="text-xs">
              {statusConfig.label}
            </Badge>
          </div>

          {/* Role */}
          {carer.specialization && (
            <p className="text-sm text-muted-foreground mb-2">
              {carer.specialization}
            </p>
          )}

          {/* Contact Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            {carer.email && (
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground truncate">{carer.email}</span>
              </div>
            )}
            {carer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground">{carer.phone}</span>
              </div>
            )}
            {carer.address && (
              <div className="flex items-center gap-2 min-w-0 col-span-full">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground truncate">{carer.address}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">{experience}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}