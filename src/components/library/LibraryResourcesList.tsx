import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  FileText, 
  Video,
  AudioLines,
  FileImage,
  FileSpreadsheet,
  Link as LinkIcon,
  BookOpen,
  Lock,
  Unlock,
  Calendar,
  User,
  ExternalLink,
  Loader2
} from "lucide-react";
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LibraryResourcePreviewDialog } from "./LibraryResourcePreviewDialog";
import { useLibraryResources } from "@/hooks/useLibraryResources";
import { toast } from "@/hooks/use-toast";

interface LibraryResourcesListProps {
  branchId: string;
  canDelete?: boolean;
}

export const LibraryResourcesList: React.FC<LibraryResourcesListProps> = ({ 
  branchId, 
  canDelete = false 
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedResource, setSelectedResource] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  const {
    resources,
    categories,
    isLoading,
    error,
    viewResource,
    downloadResource,
  } = useLibraryResources(branchId);

  const filteredResources = useMemo(() => {
    let filtered = [...resources];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(lowerSearchTerm) ||
        (resource.description && resource.description.toLowerCase().includes(lowerSearchTerm)) ||
        (resource.tags && resource.tags.some(tag => tag.toLowerCase().includes(lowerSearchTerm)))
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(resource => resource.category === categoryFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(resource => resource.resource_type === typeFilter);
    }

    return filtered;
  }, [resources, searchTerm, categoryFilter, typeFilter]);

  const handleDownload = async (resource: any) => {
    if (!resource.file_path) {
      toast({
        title: "Download Error",
        description: "No file available for download",
        variant: "destructive",
      });
      return;
    }

    setDownloadingIds(prev => new Set(prev).add(resource.id));
    
    try {
      await downloadResource(resource.id, resource.file_path, resource.title);
    } catch (error) {
      // Error is already handled in downloadResource
      console.error('Download failed:', error);
    } finally {
      setDownloadingIds(prev => {
        const next = new Set(prev);
        next.delete(resource.id);
        return next;
      });
    }
  };

  const handlePreview = (resource: any) => {
    setSelectedResource(resource);
    setPreviewOpen(true);
    viewResource(resource.id);
  };

  const handleOpenDocumentFile = (resource: any) => {
    handleDownload(resource);
  };

  const renderResourceCard = (resource: any) => (
    <div key={resource.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{resource.title}</h3>
          {resource.description && (
            <p className="text-gray-600 mt-1">{resource.description.substring(0, 100)}{resource.description.length > 100 ? '...' : ''}</p>
          )}
        </div>
        {/* Resource Type Icon */}
        {resource.resource_type && (
          <div className="shrink-0">
            {resource.resource_type === 'pdf' && <FileText className="h-6 w-6 text-red-600" />}
            {resource.resource_type === 'video' && <Video className="h-6 w-6 text-blue-600" />}
            {resource.resource_type === 'audio' && <AudioLines className="h-6 w-6 text-purple-600" />}
            {resource.resource_type === 'spreadsheet' && <FileSpreadsheet className="h-6 w-6 text-green-600" />}
            {resource.resource_type === 'image' && <FileImage className="h-6 w-6 text-pink-600" />}
            {resource.resource_type === 'link' && <LinkIcon className="h-6 w-6 text-cyan-600" />}
            {resource.resource_type !== 'pdf' && resource.resource_type !== 'video' && resource.resource_type !== 'audio' && resource.resource_type !== 'spreadsheet' && resource.resource_type !== 'image' && resource.resource_type !== 'link' && <BookOpen className="h-6 w-6 text-gray-600" />}
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2 mt-2">
        {resource.is_private && (
          <Badge variant="outline" className="text-amber-600 border-amber-200">
            <Lock className="h-3 w-3 mr-1" />
            Private
          </Badge>
        )}
        {!resource.is_private && (
          <Badge variant="outline" className="text-green-600 border-green-200">
            <Unlock className="h-3 w-3 mr-1" />
            Public
          </Badge>
        )}
        {resource.expires_at && (
          <Badge variant={resource.expires_at < new Date().toISOString() ? 'destructive' : 'outline'} className={resource.expires_at < new Date().toISOString() ? '' : 'text-amber-600 border-amber-200'}>
            <Calendar className="h-3 w-3 mr-1" />
            {resource.expires_at < new Date().toISOString() ? 'Expired' : 'Expires'}: {format(new Date(resource.expires_at), 'dd MMM yyyy')}
          </Badge>
        )}
      </div>
      
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {resource.uploaded_by_name && (
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {resource.uploaded_by_name}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePreview(resource)}
            className="flex items-center gap-1"
          >
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          
          {resource.resource_type === 'link' && resource.url ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(resource.url, '_blank')}
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-4 w-4" />
              Visit
            </Button>
          ) : resource.file_path ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownload(resource)}
              disabled={downloadingIds.has(resource.id)}
              className="flex items-center gap-1"
            >
              {downloadingIds.has(resource.id) ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Download
                </>
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center w-full md:w-auto">
          <Input
            type="search"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:w-80"
          />
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>

        <div className="flex items-center space-x-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="pdf">PDF Documents</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
              <SelectItem value="audio">Audio Files</SelectItem>
              <SelectItem value="spreadsheet">Spreadsheets</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="link">Links</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resources Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Loading resources...</p>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 mb-2">Failed to load resources</p>
          <p className="text-sm text-gray-600">{error.message}</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || categoryFilter !== "all" || typeFilter !== "all" 
              ? "No resources found" 
              : "No resources available"
            }
          </h3>
          <p className="text-gray-600">
            {searchTerm || categoryFilter !== "all" || typeFilter !== "all"
              ? "Try adjusting your search or filters"
              : "Resources will appear here when they are added to your branch"
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map(renderResourceCard)}
        </div>
      )}

      {/* Preview Dialog */}
      <LibraryResourcePreviewDialog
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        resource={selectedResource}
        onOpenDocumentFile={handleOpenDocumentFile}
      />
    </div>
  );
};
