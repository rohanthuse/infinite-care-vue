
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FilePenLine, 
  FileText, 
  Download, 
  Eye, 
  Search, 
  SlidersHorizontal,
  ArrowUpDown,
  Calendar,
  Tag,
  FileArchive,
  FileImage,
  FileCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface DocumentsListProps {
  branchId: string;
}

interface Document {
  id: string;
  title: string;
  category: string;
  uploadedBy: string;
  uploadDate: Date;
  fileType: string;
  fileSize: number;
  isPrivate: boolean;
  accessRoles: string[];
  description?: string;
  expiryDate?: Date;
}

// Sample document categories
const categories = [
  { id: "policies", name: "Policies & Procedures" },
  { id: "forms", name: "Forms" },
  { id: "training", name: "Training Materials" },
  { id: "reports", name: "Reports" },
  { id: "templates", name: "Templates" },
  { id: "guides", name: "User Guides" },
  { id: "legal", name: "Legal Documents" },
  { id: "other", name: "Other Resources" },
];

// Mock data generator
const generateMockDocuments = (count: number): Document[] => {
  const fileTypes = ['pdf', 'docx', 'xlsx', 'jpg', 'png', 'txt'];
  const users = ['Dr. John Smith', 'Nurse Sarah Wilson', 'Admin Michael Brown', 'Manager Emma Davis'];
  
  return Array.from({ length: count }, (_, i) => {
    const uploadDate = new Date();
    uploadDate.setDate(uploadDate.getDate() - Math.floor(Math.random() * 30));
    
    const hasExpiry = Math.random() > 0.6;
    let expiryDate;
    
    if (hasExpiry) {
      expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + Math.floor(Math.random() * 12) + 1);
    }
    
    const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
    
    return {
      id: `doc-${i + 1}`,
      title: `Sample Document ${i + 1}`,
      category: categories[Math.floor(Math.random() * categories.length)].id,
      uploadedBy: users[Math.floor(Math.random() * users.length)],
      uploadDate,
      fileType,
      fileSize: Math.floor(Math.random() * 10000000), // Random file size up to 10MB
      isPrivate: Math.random() > 0.5,
      accessRoles: ['admin', 'branch-manager'],
      description: Math.random() > 0.3 ? `This is a sample description for document ${i + 1}` : undefined,
      expiryDate,
    };
  });
};

export const DocumentsList: React.FC<DocumentsListProps> = ({ branchId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>('uploadDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);

  useEffect(() => {
    // Simulate API call to fetch documents
    const fetchDocuments = async () => {
      setLoading(true);
      try {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        const mockDocuments = generateMockDocuments(15);
        setDocuments(mockDocuments);
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast.error('Failed to load documents');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [branchId]);

  // Handle document selection
  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocuments(prev => {
      if (prev.includes(documentId)) {
        return prev.filter(id => id !== documentId);
      } else {
        return [...prev, documentId];
      }
    });
  };

  // Handle select all
  const toggleSelectAll = () => {
    if (selectedDocuments.length === filteredDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(filteredDocuments.map(doc => doc.id));
    }
  };

  // Handle document download
  const handleDownload = (documentId: string) => {
    toast.success(`Downloading document ID: ${documentId}`);
  };

  // Handle document preview
  const handlePreview = (documentId: string) => {
    toast.info(`Previewing document ID: ${documentId}`);
  };

  // Filter documents based on search term and category
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesCategory = selectedCategory === "all" ? true : doc.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Sort documents
  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    if (sortBy === 'title') {
      return sortOrder === 'asc' 
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    } else if (sortBy === 'uploadDate') {
      return sortOrder === 'asc'
        ? a.uploadDate.getTime() - b.uploadDate.getTime()
        : b.uploadDate.getTime() - a.uploadDate.getTime();
    } else if (sortBy === 'fileSize') {
      return sortOrder === 'asc'
        ? a.fileSize - b.fileSize
        : b.fileSize - a.fileSize;
    }
    return 0;
  });

  // Get category name by ID
  const getCategoryName = (categoryId: string): string => {
    return categories.find(cat => cat.id === categoryId)?.name || categoryId;
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  };

  // Get icon based on file type
  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'docx':
        return <FilePenLine className="h-5 w-5 text-blue-500" />;
      case 'xlsx':
        return <FileCheck className="h-5 w-5 text-green-500" />;
      case 'jpg':
      case 'png':
        return <FileImage className="h-5 w-5 text-purple-500" />;
      default:
        return <FileArchive className="h-5 w-5 text-gray-500" />;
    }
  };

  // Toggle sort order
  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search documents..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-3">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                {selectedCategory === "all" ? "All Categories" : getCategoryName(selectedCategory)}
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-8 text-center text-gray-500">
              Loading documents...
            </div>
          ) : sortedDocuments.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No documents found. Try adjusting your search or filters.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox 
                      checked={selectedDocuments.length === filteredDocuments.length && filteredDocuments.length > 0} 
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="min-w-[250px]">
                    <Button 
                      variant="ghost" 
                      className="p-0 font-medium flex items-center gap-1 hover:bg-transparent"
                      onClick={() => toggleSort('title')}
                    >
                      Document
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      className="p-0 font-medium flex items-center gap-1 hover:bg-transparent"
                      onClick={() => toggleSort('uploadDate')}
                    >
                      Upload Date
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      className="p-0 font-medium flex items-center gap-1 hover:bg-transparent"
                      onClick={() => toggleSort('fileSize')}
                    >
                      Size
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDocuments.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedDocuments.includes(document.id)} 
                        onCheckedChange={() => toggleDocumentSelection(document.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getFileIcon(document.fileType)}
                        <div>
                          <div className="font-medium">{document.title}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span>by {document.uploadedBy}</span>
                            {document.isPrivate && (
                              <Badge variant="outline" className="text-xs px-1">Private</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getCategoryName(document.category)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-gray-500" />
                        <span>{format(document.uploadDate, 'dd MMM yyyy')}</span>
                      </div>
                      {document.expiryDate && (
                        <div className="text-xs text-amber-600 mt-1">
                          Expires: {format(document.expiryDate, 'dd MMM yyyy')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{formatFileSize(document.fileSize)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => handlePreview(document.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDownload(document.id)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedDocuments.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-gray-200 shadow-lg rounded-lg px-4 py-2 flex items-center gap-3 z-50">
          <span className="font-medium">{selectedDocuments.length} selected</span>
          <div className="h-4 border-r border-gray-200"></div>
          <Button size="sm" variant="outline">
            <Download className="h-4 w-4 mr-2" /> Download All
          </Button>
        </div>
      )}
    </div>
  );
};
