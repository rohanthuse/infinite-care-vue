
import React from "react";
import { format } from "date-fns";
import { File, FileText, FilePlus, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Document {
  name: string;
  date: Date;
  type: string;
  author: string;
}

interface DocumentsTabProps {
  clientId: string;
  documents?: Document[];
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ clientId, documents = [] }) => {
  const getDocIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'pdf': return <File className="text-red-500" />;
      case 'docx': return <FileText className="text-blue-500" />;
      default: return <FileText className="text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">Client Documents</CardTitle>
            </div>
            <Button size="sm" className="gap-1">
              <FilePlus className="h-4 w-4 mr-1" />
              <span>Upload Document</span>
            </Button>
          </div>
          <CardDescription>Documents and files for client {clientId}</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No documents available for this client</p>
            </div>
          ) : (
            <div className="divide-y">
              {documents.map((doc, index) => (
                <div key={index} className="flex items-center justify-between py-3 hover:bg-gray-50 px-2 rounded-md">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-md">
                      {getDocIcon(doc.type)}
                    </div>
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <span>{doc.author}</span>
                        <span className="mx-1">•</span>
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{format(doc.date, 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  <Badge>{doc.type.toUpperCase()}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
