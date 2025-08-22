
import React from "react";
import { UnifiedDocumentsList } from "./UnifiedDocumentsList";
import { useUnifiedDocuments } from "@/hooks/useUnifiedDocuments";

interface DocumentsListProps {
  branchId: string;
}

export const DocumentsList: React.FC<DocumentsListProps> = ({ branchId }) => {
  const {
    documents,
    isLoading,
    downloadDocument,
    viewDocument,
    deleteDocument,
  } = useUnifiedDocuments(branchId);

  const handleDeleteDocument = async (documentId: string) => {
    if (window.confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      await deleteDocument(documentId);
    }
  };

  return (
    <UnifiedDocumentsList
      documents={documents}
      onViewDocument={viewDocument}
      onDownloadDocument={downloadDocument}
      onDeleteDocument={handleDeleteDocument}
      isLoading={isLoading}
      branchId={branchId}
    />
  );
};
