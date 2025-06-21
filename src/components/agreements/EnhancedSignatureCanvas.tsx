
import React, { useState } from 'react';
import { SignatureCanvas } from '@/components/ui/signature-canvas';
import { FileUploadDropzone } from './FileUploadDropzone';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PenLine, Upload } from 'lucide-react';

interface EnhancedSignatureCanvasProps {
  onSignatureSave: (signature: string) => void;
  agreementId?: string;
  templateId?: string;
  scheduledAgreementId?: string;
  initialSignature?: string;
}

export const EnhancedSignatureCanvas: React.FC<EnhancedSignatureCanvasProps> = ({
  onSignatureSave,
  agreementId,
  templateId,
  scheduledAgreementId,
  initialSignature
}) => {
  const [activeTab, setActiveTab] = useState('draw');

  const handleFileUpload = (files: any[]) => {
    if (files.length > 0) {
      // Use the storage path to get the public URL
      const fileUrl = `https://vcrjntfjsmpoupgairep.supabase.co/storage/v1/object/public/agreement-files/${files[0].storage_path}`;
      onSignatureSave(fileUrl);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="draw" className="flex items-center gap-2">
            <PenLine className="h-4 w-4" />
            Draw Signature
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Signature
          </TabsTrigger>
        </TabsList>

        <TabsContent value="draw" className="space-y-4">
          <SignatureCanvas
            onSave={onSignatureSave}
            initialSignature={initialSignature}
            width={500}
            height={200}
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
          />
          <p className="text-xs text-gray-500">
            Upload a clear image of your signature (PNG, JPG, GIF, or WebP format)
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
};
