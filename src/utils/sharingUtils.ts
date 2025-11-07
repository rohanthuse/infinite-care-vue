import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ShareRecord {
  contentId: string;
  contentType: 'event' | 'report' | 'agreement';
  sharedWith: string[];
  shareMethod: 'web_share' | 'internal' | 'email';
  shareNote?: string;
  fileFormat?: 'pdf' | 'csv' | 'excel';
  reportType?: string;
  reportData?: any;
  branchId?: string;
}

/**
 * Share content using Web Share API (mobile/modern browsers)
 */
export async function shareViaWebAPI(file: Blob, fileName: string, title?: string): Promise<boolean> {
  if (!navigator.share) {
    toast.error("Web Share API not supported on this browser");
    return false;
  }

  try {
    const fileToShare = new File([file], fileName, { type: file.type });
    
    await navigator.share({
      title: title || fileName,
      files: [fileToShare],
    });
    
    toast.success("Content shared successfully");
    return true;
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      console.error('Error sharing via Web Share API:', error);
      toast.error("Failed to share content");
    }
    return false;
  }
}

/**
 * Share content with staff/carers internally
 */
export async function shareWithStaff(shareData: ShareRecord): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("You must be logged in to share content");
      return false;
    }

    // Create share record based on content type
    let result;
    
    switch (shareData.contentType) {
      case 'event':
        result = await supabase
          .from('event_shares')
          .insert({
            event_id: shareData.contentId,
            shared_by: user.id,
            shared_with: shareData.sharedWith,
            share_method: shareData.shareMethod,
            share_note: shareData.shareNote,
          });
        break;
        
      case 'report':
        result = await supabase
          .from('report_shares')
          .insert({
            report_type: shareData.reportType || 'unknown',
            report_data: shareData.reportData,
            branch_id: shareData.branchId,
            shared_by: user.id,
            shared_with: shareData.sharedWith,
            file_format: shareData.fileFormat || 'pdf',
            share_method: shareData.shareMethod,
            share_note: shareData.shareNote,
          });
        break;
        
      case 'agreement':
        result = await supabase
          .from('agreement_shares')
          .insert({
            agreement_id: shareData.contentId,
            shared_by: user.id,
            shared_with: shareData.sharedWith,
            share_method: shareData.shareMethod,
            share_note: shareData.shareNote,
          });
        break;
        
      default:
        toast.error("Invalid content type");
        return false;
    }

    if (result.error) {
      console.error('Error creating share record:', result.error);
      toast.error("Failed to share content");
      return false;
    }

    toast.success(`Content shared with ${shareData.sharedWith.length} ${shareData.sharedWith.length === 1 ? 'person' : 'people'}`);
    return true;
  } catch (error) {
    console.error('Error sharing with staff:', error);
    toast.error("Failed to share content");
    return false;
  }
}

/**
 * Get share history for a piece of content
 */
export async function getShareHistory(contentId: string, contentType: 'event' | 'report' | 'agreement') {
  try {
    if (contentType === 'event') {
      const { data, error } = await supabase
        .from('event_shares')
        .select('*')
        .eq('event_id', contentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching event share history:', error);
        return [];
      }
      return data || [];
    } else if (contentType === 'report') {
      const { data, error } = await supabase
        .from('report_shares')
        .select('*')
        .eq('report_type', contentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching report share history:', error);
        return [];
      }
      return data || [];
    } else if (contentType === 'agreement') {
      const { data, error } = await supabase
        .from('agreement_shares')
        .select('*')
        .eq('agreement_id', contentId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching agreement share history:', error);
        return [];
      }
      return data || [];
    }

    return [];
  } catch (error) {
    console.error('Error getting share history:', error);
    return [];
  }
}

/**
 * Download file directly (fallback for browsers without Web Share API)
 */
export function downloadFile(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast.success("File downloaded successfully");
}
