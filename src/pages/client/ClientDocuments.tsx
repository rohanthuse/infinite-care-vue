
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, FileText, Calendar, Download, Upload, Eye, Filter } from "lucide-react";
import { format } from "date-fns";

const ClientDocuments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Mock document data
  const documents = [
    {
      id: 1,
      name: "Initial Assessment Report.pdf",
      type: "Medical Report",
      date: "2025-03-15",
      uploadedBy: "Dr. Emily Smith",
      size: "2.4 MB"
    },
    {
      id: 2,
      name: "Physical Therapy Plan.pdf",
      type: "Care Plan",
      date: "2025-03-20",
      uploadedBy: "Dr. Emily Smith",
      size: "1.8 MB"
    },
    {
      id: 3,
      name: "MRI Results.pdf",
      type: "Medical Report",
      date: "2025-03-10",
      uploadedBy: "Dr. Williams",
      size: "5.2 MB"
    },
    {
      id: 4,
      name: "Discharge Summary - Hospital Stay.pdf",
      type: "Medical Report",
      date: "2025-03-01",
      uploadedBy: "Memorial Hospital",
      size: "3.1 MB"
    },
    {
      id: 5,
      name: "Consent Form - Signed.pdf",
      type: "Legal Document",
      date: "2025-03-05",
      uploadedBy: "Client",
      size: "0.8 MB"
    },
    {
      id: 6,
      name: "Insurance Coverage Details.pdf",
      type: "Insurance",
      date: "2025-03-02",
      uploadedBy: "Client",
      size: "1.2 MB"
    }
  ];

  const personalDocuments = documents.filter(doc => doc.uploadedBy === "Client");
  const medicalDocuments = documents.filter(doc => 
    doc.type === "Medical Report" || doc.type === "Care Plan"
  );
  const legalDocuments = documents.filter(doc => 
    doc.type === "Legal Document" || doc.type === "Insurance"
  );

  // Filter documents based on search term
  const filterDocuments = (docs: typeof documents) => {
    if (!searchTerm) return docs;
    return docs.filter(doc => 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      doc.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };
  
  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch (e) {
      return dateStr;
    }
  };

  // Render document row
  const renderDocumentRow = (doc: typeof documents[0]) => (
    <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center py-4 border-b border-gray-200">
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
          <div className="truncate">
            <p className="font-medium truncate">{doc.name}</p>
            <div className="flex flex-col sm:flex-row sm:items-center text-xs text-gray-500 mt-1">
              <span>{doc.type}</span>
              <span className="hidden sm:inline mx-2">•</span>
              <span>Uploaded by: {doc.uploadedBy}</span>
              <span className="hidden sm:inline mx-2">•</span>
              <span>{doc.size}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 sm:mt-0">
        <div className="flex items-center text-xs text-gray-500 mr-4">
          <Calendar className="h-3 w-3 mr-1" />
          {formatDate(doc.date)}
        </div>
        <Button variant="outline" size="icon" title="View Document">
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" title="Download Document">
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold">Your Documents</h2>
          
          <div className="flex items-center gap-3">
            <div className="relative flex-1 min-w-0 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
            <Button className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All Documents</TabsTrigger>
            <TabsTrigger value="medical">Medical</TabsTrigger>
            <TabsTrigger value="legal">Legal & Insurance</TabsTrigger>
            <TabsTrigger value="personal">Uploaded by Me</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="pt-6">
            <div className="space-y-1">
              {filterDocuments(documents).length > 0 ? 
                filterDocuments(documents).map(renderDocumentRow) : 
                <p className="text-center py-8 text-gray-500">No documents found matching your search.</p>
              }
            </div>
          </TabsContent>
          
          <TabsContent value="medical" className="pt-6">
            <div className="space-y-1">
              {filterDocuments(medicalDocuments).length > 0 ? 
                filterDocuments(medicalDocuments).map(renderDocumentRow) : 
                <p className="text-center py-8 text-gray-500">No medical documents found matching your search.</p>
              }
            </div>
          </TabsContent>
          
          <TabsContent value="legal" className="pt-6">
            <div className="space-y-1">
              {filterDocuments(legalDocuments).length > 0 ? 
                filterDocuments(legalDocuments).map(renderDocumentRow) : 
                <p className="text-center py-8 text-gray-500">No legal documents found matching your search.</p>
              }
            </div>
          </TabsContent>
          
          <TabsContent value="personal" className="pt-6">
            <div className="space-y-1">
              {filterDocuments(personalDocuments).length > 0 ? 
                filterDocuments(personalDocuments).map(renderDocumentRow) : 
                <p className="text-center py-8 text-gray-500">No personal documents found matching your search.</p>
              }
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientDocuments;
