
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CarerDocument {
  id: string;
  staff_id: string;
  document_type: string;
  status: string;
  expiry_date?: string;
  created_at: string;
  source_type: 'document' | 'training_certification';
  training_course_name?: string;
  completion_date?: string;
  training_id?: string;
  file_name?: string;
  file_path?: string;
  file_size?: string;
}

const fetchCarerDocuments = async (carerId: string): Promise<CarerDocument[]> => {
  console.log('[fetchCarerDocuments] Fetching documents for carer:', carerId);
  
  // Get current user to check auth
  const { data: { user } } = await supabase.auth.getUser();
  console.log('[fetchCarerDocuments] Current user:', user?.id);
  
  // Fetch regular staff documents
  const { data: documentsData, error: documentsError } = await supabase
    .from('staff_documents')
    .select('*')
    .eq('staff_id', carerId)
    .order('created_at', { ascending: false });

  if (documentsError) {
    console.error('[fetchCarerDocuments] Documents error:', documentsError);
    throw documentsError;
  }

  // Fetch training certifications
  const { data: trainingData, error: trainingError } = await supabase
    .from('staff_training_records')
    .select(`
      id,
      staff_id,
      training_course_id,
      status,
      completion_date,
      evidence_files,
      training_courses (
        title
      )
    `)
    .eq('staff_id', carerId)
    .not('evidence_files', 'is', null)
    .order('completion_date', { ascending: false });

  if (trainingError) {
    console.error('[fetchCarerDocuments] Training error:', trainingError);
    throw trainingError;
  }

  // Transform regular documents
  const regularDocuments: CarerDocument[] = (documentsData || []).map(doc => ({
    ...doc,
    source_type: 'document' as const,
    file_name: doc.file_name || doc.document_type,
    file_path: doc.file_path,
    file_size: doc.file_size?.toString()
  }));

  // Transform training certifications - with validation
  const trainingCertifications: CarerDocument[] = [];
  
  if (trainingData) {
    trainingData.forEach(training => {
      // Validate that evidence_files is an array and not empty
      if (training.evidence_files && 
          Array.isArray(training.evidence_files) && 
          training.evidence_files.length > 0) {
        
        training.evidence_files.forEach((file: any, index: number) => {
          // Validate that file has required properties
          if (file && file.path && file.name) {
            trainingCertifications.push({
              id: `${training.id}-cert-${index}`,
              staff_id: training.staff_id,
              document_type: 'Training Certification',
              status: training.status || 'active',
              created_at: training.completion_date || new Date().toISOString(),
              source_type: 'training_certification' as const,
              training_course_name: training.training_courses?.title,
              completion_date: training.completion_date,
              training_id: training.id,
              file_name: file.name,
              file_path: file.path,
              file_size: file.size?.toString()
            });
          } else {
            console.warn('[fetchCarerDocuments] Invalid evidence file for training:', training.id, file);
          }
        });
      }
    });
  }

  // Combine and sort by date
  const allDocuments = [...regularDocuments, ...trainingCertifications];
  allDocuments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  console.log('[fetchCarerDocuments] Retrieved documents:', regularDocuments.length, 'Training certifications:', trainingCertifications.length);
  return allDocuments;
};

export const useCarerDocuments = (carerId: string) => {
  return useQuery({
    queryKey: ['carer-documents', carerId],
    queryFn: () => fetchCarerDocuments(carerId),
    enabled: Boolean(carerId),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};
