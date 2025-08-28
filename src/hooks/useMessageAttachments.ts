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
      // Use the correct bucket - agreement-files for all message attachments
      const filePath = attachment.path || attachment.url;
      const bucket = 'agreement-files';
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(filePath);

      if (error) {
        console.error('Download error:', error);
        toast.error('Failed to download attachment');
        return;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.name || 'attachment';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Attachment downloaded');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download attachment');
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
      // Use the correct bucket - agreement-files for all message attachments
      const filePath = attachment.path || attachment.url;
      const bucket = 'agreement-files';
      
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (data?.publicUrl) {
        // Open in new tab for preview
        window.open(data.publicUrl, '_blank');
      } else {
        // Fallback: download and open
        const { data: fileData, error } = await supabase.storage
          .from(bucket)
          .download(filePath);
          
        if (error) {
          console.error('Preview error:', error);
          toast.error('Failed to preview attachment');
          return;
        }

        const url = URL.createObjectURL(fileData);
        window.open(url, '_blank');
        
        // Clean up URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Failed to preview attachment');
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