import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Clock, XCircle, CircleDashed, Download, FileText, Upload } from "lucide-react";
import { format } from "date-fns";
import { useTrainingFileUpload } from "@/hooks/useTrainingFileUpload";
import { StaffTrainingRecord, EvidenceFile } from "@/hooks/useStaffTrainingRecords";
import { formatFileSize } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrainingFileUpload } from "@/components/training/TrainingFileUpload";

interface TrainingRecordDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: StaffTrainingRecord | null;
  staffName: string;
  trainingTitle: string;
  staffId: string;
}

const TrainingRecordDetailsDialog: React.FC<TrainingRecordDetailsDialogProps> = ({
  open,
  onOpenChange,
  record,
  staffName,
  trainingTitle,
  staffId,
}) => {
  const { getFileUrl } = useTrainingFileUpload();
  const [evidenceFiles, setEvidenceFiles] = useState<any[]>(record?.evidence_files || []);

  // Sync evidence files when record changes
  useEffect(() => {
    if (record?.evidence_files) {
      setEvidenceFiles(record.evidence_files);
    }
  }, [record?.id, record?.evidence_files]);

  if (!record) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <CircleDashed className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700';
      case 'in-progress':
        return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700';
      case 'expired':
        return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const handleDownloadFile = async (file: EvidenceFile) => {
    try {
      const url = getFileUrl(file.storagePath);
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  // Helper function to handle both old string format and new object format
  const normalizeEvidenceFiles = (files: any[]): EvidenceFile[] => {
    if (!files) return [];
    
    return files.map((file, index) => {
      // If it's already in the new format
      if (typeof file === 'object' && file.name && file.storagePath) {
        return file as EvidenceFile;
      }
      
      // If it's the old string format, convert it
      if (typeof file === 'string') {
        return {
          name: file,
          size: 0,
          storagePath: file,
          uploadedAt: new Date().toISOString()
        } as EvidenceFile;
      }
      
      // Fallback
      return {
        name: `File ${index + 1}`,
        size: 0,
        storagePath: String(file),
        uploadedAt: new Date().toISOString()
      } as EvidenceFile;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon(record.status)}
            Training Details
          </DialogTitle>
          <DialogDescription>
            {trainingTitle} - {staffName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Training Details</TabsTrigger>
              <TabsTrigger value="certificates">
                Certificates ({evidenceFiles.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Training Details */}
            <TabsContent value="details" className="space-y-6 mt-4">
              {/* Status and Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge variant="outline" className={getStatusColor(record.status)}>
                      {record.status.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Assigned Date</label>
                  <div className="mt-1 text-sm">
                    {format(new Date(record.assigned_date), 'MMM dd, yyyy')}
                  </div>
                </div>
              </div>

              {/* Completion and Expiry Dates */}
              {(record.completion_date || record.expiry_date) && (
                <div className="grid grid-cols-2 gap-4">
                  {record.completion_date && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Completion Date</label>
                      <div className="mt-1 text-sm">
                        {format(new Date(record.completion_date), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  )}
                  {record.expiry_date && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Expiry Date</label>
                      <div className="mt-1 text-sm">
                        {format(new Date(record.expiry_date), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Score */}
              {record.score !== null && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Score</label>
                  <div className="mt-1 text-sm">
                    {record.score} / {record.training_course.max_score}
                  </div>
                </div>
              )}

              {/* Notes */}
              {record.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <div className="mt-1 text-sm bg-muted p-3 rounded-md">
                    {record.notes}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* TAB 2: Certificates with Upload */}
            <TabsContent value="certificates" className="space-y-6 mt-4">
              <div className="space-y-4">
                {/* Upload Section */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Upload New Certificate
                  </h4>
                  <TrainingFileUpload
                    trainingRecordId={record.id}
                    staffId={staffId}
                    evidenceFiles={evidenceFiles}
                    onFilesUpdate={setEvidenceFiles}
                  />
                </div>

                <Separator />

                {/* View/Download Existing Certificates */}
                <div>
                  <h4 className="text-sm font-medium mb-3">
                    Uploaded Certificates ({evidenceFiles.length})
                  </h4>
                  {evidenceFiles.length > 0 ? (
                    <div className="space-y-2">
                      {normalizeEvidenceFiles(evidenceFiles).map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted rounded-md border border-border"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="font-medium text-sm">{file.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {file.size > 0 ? formatFileSize(file.size) : 'Certificate file'}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadFile(file)}
                            className="gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-muted rounded-md border-2 border-dashed border-border">
                      <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">No certificates uploaded yet</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TrainingRecordDetailsDialog;