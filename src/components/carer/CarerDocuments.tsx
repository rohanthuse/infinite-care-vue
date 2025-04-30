
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Dialog } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { UploadDocumentDialog } from "../care/dialogs/UploadDocumentDialog";
import { Check, Clock, FileText, Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Document types required for carers
const REQUIRED_DOCUMENTS = [
  {
    id: "photo_id",
    name: "Photo ID",
    description: "Valid passport or driving license",
    category: "Identity",
    required: true
  },
  {
    id: "address_proof",
    name: "Proof of Address",
    description: "Recent utility bill or bank statement (within last 3 months)",
    category: "Identity",
    required: true
  },
  {
    id: "right_to_work",
    name: "Right to Work",
    description: "Proof of right to work in the UK",
    category: "Identity",
    required: true
  },
  {
    id: "education_certificates",
    name: "Educational Certificates",
    description: "Relevant qualifications and certifications",
    category: "Professional",
    required: true
  },
  {
    id: "professional_registration",
    name: "Professional Registration",
    description: "NMC, HCPC or other relevant professional registration",
    category: "Professional",
    required: true
  },
  {
    id: "training_certificates",
    name: "Training Certificates",
    description: "First Aid, Manual Handling, Infection Control, etc.",
    category: "Professional",
    required: true
  },
  {
    id: "dbs_check",
    name: "DBS Check",
    description: "Enhanced DBS check for working with vulnerable adults",
    category: "Compliance",
    required: true
  },
  {
    id: "health_declaration",
    name: "Health Declaration",
    description: "Occupational health check and immunization records",
    category: "Compliance",
    required: true
  },
  {
    id: "references",
    name: "References",
    description: "Two professional references",
    category: "Employment",
    required: true
  },
  {
    id: "employment_history",
    name: "Employment History",
    description: "CV or complete employment history",
    category: "Employment",
    required: true
  },
  {
    id: "contract",
    name: "Signed Contract",
    description: "Signed employment contract",
    category: "Employment",
    required: true
  }
];

interface DocumentStatus {
  id: string;
  name: string;
  status: "pending" | "approved" | "rejected" | "expired" | "not_submitted";
  submittedDate?: Date;
  expiryDate?: Date;
  reviewedBy?: string;
  reviewDate?: Date;
  fileUrl?: string;
  fileName?: string;
  feedback?: string;
}

export const CarerDocuments: React.FC = () => {
  const { toast } = useToast();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<string | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  
  // Mock document statuses (in a real app, this would come from the server)
  const [documentStatuses, setDocumentStatuses] = useState<DocumentStatus[]>([
    {
      id: "photo_id",
      name: "Photo ID",
      status: "approved",
      submittedDate: new Date(2023, 1, 15),
      reviewedBy: "Admin User",
      reviewDate: new Date(2023, 1, 16),
      fileName: "passport.jpg"
    },
    {
      id: "address_proof",
      name: "Proof of Address",
      status: "pending",
      submittedDate: new Date(2023, 1, 18),
      fileName: "utility_bill.pdf"
    },
    {
      id: "dbs_check",
      name: "DBS Check",
      status: "rejected",
      submittedDate: new Date(2023, 1, 10),
      feedback: "Document not clear. Please resubmit.",
      fileName: "dbs_certificate.pdf"
    },
    {
      id: "training_certificates",
      name: "Training Certificates",
      status: "expired",
      submittedDate: new Date(2022, 5, 20),
      expiryDate: new Date(2023, 5, 20),
      fileName: "first_aid_cert.pdf"
    }
  ]);
  
  // Filter documents that haven't been submitted
  const notSubmittedDocs = REQUIRED_DOCUMENTS.filter(
    doc => !documentStatuses.some(status => status.id === doc.id)
  );

  // Group documents by category
  const groupedDocuments: Record<string, typeof REQUIRED_DOCUMENTS> = {};
  REQUIRED_DOCUMENTS.forEach(doc => {
    if (!groupedDocuments[doc.category]) {
      groupedDocuments[doc.category] = [];
    }
    groupedDocuments[doc.category].push(doc);
  });
  
  const handleOpenUploadDialog = (docId: string) => {
    setCurrentDocument(docId);
    setUploadDialogOpen(true);
  };
  
  const handleDocumentSave = (document: { name: string; date: Date; type: string; author: string; file: File }) => {
    if (!currentDocument) return;
    
    // Find the current document details
    const docDetails = REQUIRED_DOCUMENTS.find(doc => doc.id === currentDocument);
    if (!docDetails) return;
    
    // In a real app, this would upload to a server
    // For now, we'll just update the local state
    const existingIndex = documentStatuses.findIndex(doc => doc.id === currentDocument);
    
    if (existingIndex >= 0) {
      // Update existing document
      const updatedStatuses = [...documentStatuses];
      updatedStatuses[existingIndex] = {
        ...updatedStatuses[existingIndex],
        status: "pending",
        submittedDate: new Date(),
        fileName: document.file.name,
        feedback: undefined // Clear any previous feedback
      };
      setDocumentStatuses(updatedStatuses);
    } else {
      // Add new document
      setDocumentStatuses([
        ...documentStatuses,
        {
          id: currentDocument,
          name: docDetails.name,
          status: "pending",
          submittedDate: new Date(),
          fileName: document.file.name
        }
      ]);
    }
    
    toast({
      title: "Document uploaded",
      description: "Your document has been submitted for review."
    });
  };
  
  const handleDeleteDocument = (docId: string) => {
    setSelectedDocId(docId);
    setDeleteDialogOpen(true);
  };
  
  const confirmDeleteDocument = () => {
    if (!selectedDocId) return;
    
    const updatedStatuses = documentStatuses.filter(doc => doc.id !== selectedDocId);
    setDocumentStatuses(updatedStatuses);
    
    toast({
      title: "Document deleted",
      description: "Document has been removed successfully."
    });
    
    setDeleteDialogOpen(false);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <Check className="h-3 w-3 mr-1" /> Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            <Clock className="h-3 w-3 mr-1" /> Pending Review
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            <X className="h-3 w-3 mr-1" /> Rejected
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">
            <Clock className="h-3 w-3 mr-1" /> Expired
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200">
            Not Submitted
          </Badge>
        );
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-blue-600">
            <FileText className="h-5 w-5 mr-2" />
            Required Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(groupedDocuments).map(([category, docs]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-lg font-semibold">{category} Documents</h3>
              <div className="space-y-4">
                {docs.map(doc => {
                  const docStatus = documentStatuses.find(status => status.id === doc.id);
                  return (
                    <div key={doc.id} className="border rounded-md p-4 bg-white">
                      <div className="flex flex-col md:flex-row justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <h4 className="font-medium">{doc.name}</h4>
                            {doc.required && (
                              <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                                Required
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{doc.description}</p>
                          {docStatus && (
                            <div className="flex flex-col gap-1 text-xs text-gray-600 mt-2">
                              {docStatus.fileName && <span>File: {docStatus.fileName}</span>}
                              {docStatus.submittedDate && (
                                <span>Submitted: {docStatus.submittedDate.toLocaleDateString()}</span>
                              )}
                              {docStatus.expiryDate && (
                                <span className={docStatus.expiryDate < new Date() ? "text-red-600 font-medium" : ""}>
                                  Expires: {docStatus.expiryDate.toLocaleDateString()}
                                </span>
                              )}
                              {docStatus.feedback && (
                                <span className="text-red-600">Feedback: {docStatus.feedback}</span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 items-center mt-4 md:mt-0">
                          <div className="min-w-20">
                            {docStatus ? getStatusBadge(docStatus.status) : getStatusBadge("not_submitted")}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant={docStatus ? "outline" : "default"} 
                              size="sm"
                              onClick={() => handleOpenUploadDialog(doc.id)}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              {docStatus ? "Update" : "Upload"}
                            </Button>
                            {docStatus && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteDocument(doc.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {documentStatuses.length === 0 && notSubmittedDocs.length === REQUIRED_DOCUMENTS.length && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <h3 className="font-medium text-gray-700 mb-1">No Documents Uploaded</h3>
              <p>Please upload the required documents to complete your profile.</p>
            </div>
          )}
          
          <div className="pt-4">
            <p className="text-sm text-gray-500">
              <span className="font-medium">Note:</span> All documents are reviewed by the admin team. 
              You will be notified when your documents are approved. Expired documents need to be renewed.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Upload Document Dialog */}
      <UploadDocumentDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSave={handleDocumentSave}
      />
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the document from your profile. You will need to re-upload it if required.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDocument}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
