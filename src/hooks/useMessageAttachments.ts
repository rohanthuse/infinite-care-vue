import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useMessageAttachments = () => {
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState<string | null>(null);

  const downloadAttachment = async (attachment: any) => {
    if (!attachment?.path && !attachment?.url) {
      toast.error('Attachment path not found');
      return;
    }

    setIsDownloading(attachment.name || 'file');
    
    try {
      const filePath = attachment.path || attachment.url;
      const bucket = 'agreement-files';
      
      // Use public URL for reliable access
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (!data?.publicUrl) {
        throw new Error('Could not generate file URL');
      }

      // Fetch the file and download
      const response = await fetch(data.publicUrl);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.name || 'attachment';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Attachment downloaded');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(`Failed to download: ${error.message || 'Unknown error'}`);
    } finally {
      setIsDownloading(null);
    }
  };

  const previewAttachment = async (attachment: any) => {
    if (!attachment?.path && !attachment?.url) {
      toast.error('Attachment path not found');
      return;
    }

    setIsPreviewing(attachment.name || 'file');

    try {
      const filePath = attachment.path || attachment.url;
      const bucket = 'agreement-files';
      
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (data?.publicUrl) {
        window.open(data.publicUrl, '_blank');
        toast.success('Opening file preview');
      } else {
        throw new Error('Could not generate preview URL');
      }
    } catch (error: any) {
      console.error('Preview error:', error);
      toast.error(`Failed to preview: ${error.message || 'Unknown error'}`);
    } finally {
      setIsPreviewing(null);
    }
  };

  return {
    downloadAttachment,
    previewAttachment,
    isDownloading,
    isPreviewing
  };
};