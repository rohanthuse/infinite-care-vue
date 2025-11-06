import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const fetchSignatureFile = async (fileId: string | null) => {
  if (!fileId) return null;
  
  const { data, error } = await supabase
    .from('agreement_files')
    .select('storage_path')
    .eq('id', fileId)
    .eq('file_category', 'signature')
    .single();
  
  if (error || !data) return null;
  
  // Get public URL for the signature
  const { data: urlData } = supabase.storage
    .from('agreement-files')
    .getPublicUrl(data.storage_path);
  
  return urlData?.publicUrl || null;
};

export const useSignatureFile = (fileId: string | null) => {
  return useQuery({
    queryKey: ['signature_file', fileId],
    queryFn: () => fetchSignatureFile(fileId),
    enabled: !!fileId,
  });
};
