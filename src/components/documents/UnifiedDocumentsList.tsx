
import React, { useState } from "react";
import { format } from "date-fns";
import { 
  FileText, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Calendar,
  User,
  Tag,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUnifiedDocuments } from "@/hooks/useUnifiedDocuments";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UnifiedDocumentsListProps {
  branchId: string;
}

export function UnifiedDocumentsList({ branchId }: UnifiedDocumentsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  
  const { 
    documents, 
    isLoading, 
    error, 
    downloadDocument, 
    viewDocument, 
    deleteDocument 
  } = useUnifiedDocuments(branchId);

  // Filter documents based on search and filters
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchTerm || 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.uploaded_by_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === "all" || doc.category === filterCategory;
    const matchesType = filterType === "all" || doc.source_table === filterType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const getIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'medical':
      case 'care plan':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'legal':
      case 'insurance':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'training':
        return <FileText className="h-4 w-4 text-green-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'medical':
        return 'bg-red-100 text-red-800';
      case 'legal':
        return 'bg-blue-100 text-blue-800';
      case 'training':
        return 'bg-green-100 text-green-800';
      case 'policy':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownload = (doc: any) => {
    if (doc.file_path) {
      downloadDocument(doc.file_path, doc.name);
    }
  };

  const handleView = (doc: any) => {
    if (doc.file_path) {
      viewDocument(doc.file_path);
    }
  };

  const handleDelete = (doc: any) => {
    if (confirm(`Are you sure you want to delete "${doc.name}"?`)) {
      deleteDocument(doc.id);
    }
  };

  if (!branchId) {
    return (
      <Alert className="border-amber-200 bg-amber-50">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          No branch selected. Please select a branch to view documents.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span>Loading documents...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Failed to load documents: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents ({filteredDocuments.length})
          </CardTitle>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full sm:w-64"
              />
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="policy">Policy</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="documents">General Documents</SelectItem>
                <SelectItem value="client_documents">Client Documents</SelectItem>
                <SelectItem value="agreement_files">Agreement Files</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {documents.length === 0 ? "No documents found" : "No matching documents"}
            </h3>
            <p className="text-gray-600 mb-4">
              {documents.length === 0 
                ? "No documents have been uploaded yet." 
                : "Try adjusting your search or filter criteria."
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Uploaded By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={`${doc.source_table}-${doc.id}`}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {getIcon(doc.category)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">
                            {doc.name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {doc.type}
                          </p>
                          {doc.file_size && (
                            <p className="text-xs text-gray-400">
                              {doc.file_size}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge className={getCategoryColor(doc.category)}>
                        {doc.category}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {doc.related_entity}
                      </span>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {doc.uploaded_by_name || 'Unknown'}
                        </span>
                      </div>
                      {(doc.client_name || doc.staff_name) && (
                        <div className="text-xs text-gray-500 mt-1">
                          for {doc.client_name || doc.staff_name}
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {format(new Date(doc.created_at), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant={doc.has_file ? "default" : "destructive"}>
                          {doc.has_file ? "Available" : "Missing"}
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        {doc.has_file && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(doc)}
                              title="View Document"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(doc)}
                              title="Download Document"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {doc.source_table === 'documents' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(doc)}
                            title="Delete Document"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
