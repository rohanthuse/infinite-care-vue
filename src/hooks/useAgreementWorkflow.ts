
import { useState } from 'react';
import { useFileUpload } from './useFileUpload';

export interface AgreementWorkflowState {
  uploadedFiles: any[];
  digitalSignature: string;
  isUploading: boolean;
}

export const useAgreementWorkflow = () => {
  const [workflowState, setWorkflowState] = useState<AgreementWorkflowState>({
    uploadedFiles: [],
    digitalSignature: '',
    isUploading: false
  });

  const { uploadFile } = useFileUpload();

  const handleFileUpload = async (files: File[], agreementId: string, category: string) => {
    setWorkflowState(prev => ({ ...prev, isUploading: true }));
    
    try {
      const uploadedFiles = [];
      for (const file of files) {
        const result = await uploadFile(file, {
          agreementId,
          category: category as any,
        });
        uploadedFiles.push(result);
      }
      
      setWorkflowState(prev => ({ 
        ...prev, 
        uploadedFiles: [...prev.uploadedFiles, ...uploadedFiles],
        isUploading: false 
      }));
      
      return uploadedFiles;
    } catch (error) {
      setWorkflowState(prev => ({ ...prev, isUploading: false }));
      throw error;
    }
  };

  const setSignature = (signature: string) => {
    setWorkflowState(prev => ({ ...prev, digitalSignature: signature }));
  };

  const resetWorkflow = () => {
    setWorkflowState({
      uploadedFiles: [],
      digitalSignature: '',
      isUploading: false
    });
  };

  return {
    workflowState,
    handleFileUpload,
    setSignature,
    resetWorkflow
  };
};
