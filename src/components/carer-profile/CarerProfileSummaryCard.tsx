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
    <div className="p-5 bg-card border-b border-border">
      <div className="flex flex-col items-center space-y-3">
        {/* Profile Photo */}
        <div className="relative">
          <Avatar className="h-24 w-24 border-4 border-primary">
            <AvatarImage src={carer.photo_url} alt={`${carer.first_name} ${carer.last_name}`} />
            <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Photo Actions - Stacked vertically */}
        <div className="flex flex-col items-center gap-2 w-full max-w-[180px]">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full gap-2 h-8 text-xs"
          >
            <Upload className="h-3.5 w-3.5" />
            {uploading ? 'Uploading...' : 'Change Photo'}
          </Button>
          {carer.photo_url && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRemovePhoto}
              disabled={isDeleting}
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 h-8 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isDeleting ? 'Removing...' : 'Remove'}
            </Button>
          )}
        </div>

        {/* Name, Specialization, and Status */}
        <div className="text-center space-y-2 pt-1">
          <div>
            <h2 className="text-lg font-bold text-foreground leading-tight">
              {carer.first_name} {carer.last_name}
            </h2>
            {carer.specialization && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {carer.specialization}
              </p>
            )}
          </div>
          <Badge variant={statusConfig.variant} className="text-xs px-2.5 py-0.5">
            {statusConfig.label}
          </Badge>
        </div>

        {/* Contact Details - Card-style rows */}
        <div className="w-full pt-3 border-t border-border">
          <div className="space-y-1.5">
            {carer.email && (
              <div className="flex items-start gap-2.5 text-xs p-2 rounded-md bg-muted/50">
                <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span className="text-foreground break-all leading-relaxed">{carer.email}</span>
              </div>
            )}
            {carer.phone && (
              <div className="flex items-center gap-2.5 text-xs p-2 rounded-md bg-muted/50">
                <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-foreground">{carer.phone}</span>
              </div>
            )}
            {carer.address && (
              <div className="flex items-start gap-2.5 text-xs p-2 rounded-md bg-muted/50">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span className="text-foreground leading-relaxed">{carer.address}</span>
              </div>
            )}
            <div className="flex items-center gap-2.5 text-xs p-2 rounded-md bg-muted/50">
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">{experience}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}