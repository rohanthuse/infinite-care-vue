
import React, { useState, useMemo } from "react";
import { format } from "date-fns";
import { 
  FileText, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Tag,
  User,
  Building,
  Calendar,
  ChevronDown,
  MoreHorizontal,
  AlertCircle,
  CheckCircle,
  Database
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnifiedDocument } from "@/hooks/useUnifiedDocuments";

interface UnifiedDocumentsListProps {
  documents: UnifiedDocument[];
  onViewDocument: (filePath: string) => void;
  onDownloadDocument: (filePath: string, fileName: string) => void;
  onEditDocument?: (document: UnifiedDocument) => void;
  onDeleteDocument: (documentId: string) => void;
  isLoading?: boolean;
}

export function UnifiedDocumentsList({ 
  documents, 
  onViewDocument, 
  onDownloadDocument, 
  onEditDocument,
  onDeleteDocument,
  isLoading = false 
}: UnifiedDocumentsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  // Get unique values for filters, filtering out empty/null/undefined values
  const { categories, entities, sources } = useMemo(() => {
    const categories = Array.from(new Set(
      documents
        .map(d => d.category)
        .filter(cat => cat && cat.trim() !== '')
    )).sort();
    
    const entities = Array.from(new Set(
      documents
        .map(d => d.related_entity)
        .filter(entity => entity && entity.trim() !== '')
    )).sort();
    
    const sources = Array.from(new Set(
      documents
        .map(d => d.source_table)
        .filter(source => source && source.trim() !== '')
    )).sort();
    
    return { categories, entities, sources };
  }, [documents]);

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           doc.uploaded_by_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter;
      const matchesEntity = entityFilter === "all" || doc.related_entity === entityFilter;
      const matchesSource = sourceFilter === "all" || doc.source_table === sourceFilter;
      
      // Tab filtering
      let matchesTab = true;
      if (activeTab === "recent") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesTab = new Date(doc.created_at) > weekAgo;
      } else if (activeTab === "client-docs") {
        matchesTab = doc.related_entity === "Client";
      } else if (activeTab === "agreements") {
        matchesTab = doc.related_entity === "Agreement";
      } else if (activeTab === "forms") {
        matchesTab = doc.related_entity === "Form";
      }
      
      return matchesSearch && matchesCategory && matchesEntity && matchesSource && matchesTab;
    });
  }, [documents, searchQuery, categoryFilter, entityFilter, sourceFilter, activeTab]);

  const getDocumentIcon = (type: string, category: string) => {
    return <FileText className="h-4 w-4 text-blue-600" />;
  };

  const getSourceBadgeColor = (source: string) => {
    switch (source) {
      case 'documents': return 'bg-green-100 text-green-800';
      case 'client_documents': return 'bg-blue-100 text-blue-800';
      case 'agreement_files': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStorageBucket = (filePath?: string) => {
    if (!filePath) return 'unknown';
    
    if (filePath.startsWith('client-documents/')) return 'client-documents';
    if (filePath.startsWith('agreement-files/')) return 'agreement-files';
    if (filePath.startsWith('documents/')) return 'documents';
    
    return 'documents'; // default
  };

  const getFileStatusIcon = (hasFile?: boolean, filePath?: string) => {
    if (!filePath || filePath === '<nil>' || filePath === 'null' || filePath === 'undefined') {
      return (
        <span title="No file attached">
          <AlertCircle className="h-4 w-4 text-red-500" />
        </span>
      );
    }
    
    if (hasFile === false) {
      return (
        <span title="File not found in storage">
          <AlertCircle className="h-4 w-4 text-orange-500" />
        </span>
      );
    }
    
    const bucket = getStorageBucket(filePath);
    return (
      <span title={`File available in ${bucket} bucket`}>
        <CheckCircle className="h-4 w-4 text-green-500" />
      </span>
    );
  };

  const canDownloadOrView = (doc: UnifiedDocument) => {
    return doc.file_path && 
           doc.file_path !== '<nil>' && 
           doc.file_path !== 'null' && 
           doc.file_path !== 'undefined' &&
           doc.has_file !== false;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Documents & Files</CardTitle>
              <CardDescription>
                Manage all documents across the system - {documents.length} total documents
              </CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  className="pl-9 w-full sm:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="p-2 space-y-2">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Category</label>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-gray-500">Related To</label>
                      <Select value={entityFilter} onValueChange={setEntityFilter}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Entities</SelectItem>
                          {entities.map(entity => (
                            <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-gray-500">Source</label>
                      <Select value={sourceFilter} onValueChange={setSourceFilter}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sources</SelectItem>
                          {sources.map(source => (
                            <SelectItem key={source} value={source}>{source}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs and Documents List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({documents.length})</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="client-docs">Client Docs</TabsTrigger>
          <TabsTrigger value="agreements">Agreements</TabsTrigger>
          <TabsTrigger value="forms">Forms</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardContent className="p-0">
              {filteredDocuments.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 text-lg">No documents found</p>
                  <p className="text-gray-400 text-sm">Try adjusting your search criteria</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Document</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Related To</TableHead>
                      <TableHead>Uploaded By</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((doc) => (
                      <TableRow key={`${doc.source_table}-${doc.id}`}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 rounded-md">
                              {getDocumentIcon(doc.type, doc.category)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">{doc.name}</p>
                                {getFileStatusIcon(doc.has_file, doc.file_path)}
                                <Database className="h-3 w-3 text-gray-400" title={`Storage: ${getStorageBucket(doc.file_path)}`} />
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>{doc.type}</span>
                                {doc.file_size && (
                                  <>
                                    <span>•</span>
                                    <span>{doc.file_size}</span>
                                  </>
                                )}
                              </div>
                              {doc.tags && doc.tags.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {doc.tags.slice(0, 2).map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {doc.tags.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{doc.tags.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{doc.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {doc.related_entity === "Client" && <User className="h-4 w-4 text-blue-500" />}
                            {doc.related_entity === "Staff" && <User className="h-4 w-4 text-green-500" />}
                            {doc.related_entity === "Agreement" && <FileText className="h-4 w-4 text-purple-500" />}
                            <span className="text-sm">{doc.related_entity}</span>
                          </div>
                          {(doc.client_name || doc.staff_name) && (
                            <p className="text-xs text-gray-500 mt-1">
                              {doc.client_name || doc.staff_name}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{doc.uploaded_by_name || 'System'}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-xs ${getSourceBadgeColor(doc.source_table)}`}>
                            {doc.source_table.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(doc.created_at), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canDownloadOrView(doc) ? (
                                <>
                                  <DropdownMenuItem onClick={() => onViewDocument(doc.file_path!)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onDownloadDocument(doc.file_path!, doc.name)}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <DropdownMenuItem disabled>
                                  <AlertCircle className="mr-2 h-4 w-4" />
                                  File not available
                                </DropdownMenuItem>
                              )}
                              {onEditDocument && doc.source_table === 'documents' && (
                                <DropdownMenuItem onClick={() => onEditDocument(doc)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {doc.source_table === 'documents' && (
                                <DropdownMenuItem 
                                  onClick={() => onDeleteDocument(doc.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
