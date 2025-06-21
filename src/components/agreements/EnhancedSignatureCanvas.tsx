
import React, { useState } from 'react';
import { SignatureCanvas } from '@/components/ui/signature-canvas';
import { FileUploadDropzone } from './FileUploadDropzone';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PenLine, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface EnhancedSignatureCanvasProps {
  onSignatureSave: (signature: string) => void;
  agreementId?: string;
  templateId?: string;
  scheduledAgreementId?: string;
  initialSignature?: string;
  disabled?: boolean;
}

export const EnhancedSignatureCanvas: React.FC<EnhancedSignatureCanvasProps> = ({
  onSignatureSave,
  agreementId,
  templateId,
  scheduledAgreementId,
  initialSignature,
  disabled = false
}) => {
  const [activeTab, setActiveTab] = useState('draw');
  const [currentSignature, setCurrentSignature] = useState(initialSignature || '');

  const handleDrawnSignature = (signature: string) => {
    setCurrentSignature(signature);
    onSignatureSave(signature);
  };

  const handleFileUpload = (files: any[]) => {
    if (files.length > 0) {
      // For uploaded signature files, use the public URL
      const fileUrl = `https://vcrjntfjsmpoupgairep.supabase.co/storage/v1/object/public/agreement-files/${files[0].storage_path}`;
      setCurrentSignature(fileUrl);
      onSignatureSave(fileUrl);
      toast.success('Signature uploaded successfully');
    }
  };

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      // For temporary files, create a local URL
      const fileUrl = URL.createObjectURL(files[0]);
      setCurrentSignature(fileUrl);
      onSignatureSave(fileUrl);
      toast.success('Signature file selected');
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="draw" className="flex items-center gap-2" disabled={disabled}>
            <PenLine className="h-4 w-4" />
            Draw Signature
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2" disabled={disabled}>
            <Upload className="h-4 w-4" />
            Upload Signature
          </TabsTrigger>
        </TabsList>

        <TabsContent value="draw" className="space-y-4">
          <SignatureCanvas
            onSave={handleDrawnSignature}
            initialSignature={activeTab === 'draw' ? currentSignature : undefined}
            width={500}
            height={200}
            disabled={disabled}
          />
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <FileUploadDropzone
            agreementId={agreementId}
            templateId={templateId}
            scheduledAgreementId={scheduledAgreementId}
            category="signature"
            maxFiles={1}
            acceptedFileTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
            onUploadComplete={handleFileUpload}
            onFilesSelected={handleFilesSelected}
            disabled={disabled}
          />
          <p className="text-xs text-gray-500">
            Upload a clear image of your signature (PNG, JPG, GIF, or WebP format)
          </p>
        </TabsContent>
      </Tabs>

      {/* Signature Preview */}
      {currentSignature && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Current Signature:</h4>
          <div className="border rounded-md p-4 bg-gray-50">
            <img 
              src={currentSignature} 
              alt="Current signature" 
              className="max-w-full max-h-32 object-contain mx-auto"
              onError={() => {
                console.error('Failed to load signature image');
                setCurrentSignature('');
                onSignatureSave('');
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
