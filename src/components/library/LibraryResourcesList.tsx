
import React, { useState, useMemo } from "react";
import { format, isAfter } from "date-fns";
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
  Calendar,
  ExternalLink,
  Star,
  TrendingUp,
  
  Link,
  AlertTriangle,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLibraryResources, LibraryResource } from "@/hooks/useLibraryResources";
import { useLibraryAnalytics } from "@/hooks/useLibraryAnalytics";
import { LibraryResourcePreviewDialog } from "./LibraryResourcePreviewDialog";
import { toast } from "sonner";

interface LibraryResourcesListProps {
  branchId: string;
  onAddNew?: () => void;
  canDelete?: boolean;
  showEngagementMetrics?: boolean;
}

export const LibraryResourcesList: React.FC<LibraryResourcesListProps> = ({
  branchId,
  onAddNew,
  canDelete = true,
  showEngagementMetrics = true,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [resourceTypeFilter, setResourceTypeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [previewResource, setPreviewResource] = useState<LibraryResource | null>(null);
  const [showExpired, setShowExpired] = useState(false);

  const { 
    resources, 
    categories, 
    isLoading, 
    deleteResource, 
    viewResource,
    downloadResource,
    getFileUrl
  } = useLibraryResources(branchId);

  const { data: analytics } = useLibraryAnalytics(branchId, showEngagementMetrics);

  // Get unique resource types
  const resourceTypes = useMemo(() => {
    return Array.from(new Set(resources.map(r => r.resource_type))).sort();
  }, [resources]);

  // Get expired resources
  const expiredResources = useMemo(() => {
    return resources.filter(resource => 
      resource.expires_at && isAfter(new Date(), new Date(resource.expires_at))
    );
  }, [resources]);

  // Filter resources
  const filteredResources = useMemo(() => {
    return resources.filter(resource => {
      const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           resource.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = categoryFilter === "all" || resource.category === categoryFilter;
      const matchesType = resourceTypeFilter === "all" || resource.resource_type === resourceTypeFilter;
      
      // Tab filtering
      let matchesTab = true;
      if (activeTab === "recent") {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesTab = new Date(resource.created_at) > weekAgo;
      } else if (activeTab === "popular") {
        matchesTab = resource.views_count > 0;
      } else if (activeTab === "files") {
        matchesTab = !!resource.file_path;
      } else if (activeTab === "links") {
        matchesTab = !!resource.url;
      } else if (activeTab === "expired") {
        matchesTab = resource.expires_at && isAfter(new Date(), new Date(resource.expires_at));
      }
      
      // Expired resource filtering - only hide expired items if not on the expired tab
      if (!showExpired && activeTab !== "expired" && resource.expires_at && isAfter(new Date(), new Date(resource.expires_at))) {
        return false;
      }
      
      return matchesSearch && matchesCategory && matchesType && matchesTab;
    });
  }, [resources, searchQuery, categoryFilter, resourceTypeFilter, activeTab, showExpired]);

  const getResourceIcon = (resourceType: string) => {
    switch (resourceType.toLowerCase()) {
      case 'document':
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-600" />;
      case 'video':
        return <FileText className="h-4 w-4 text-purple-600" />;
      case 'audio':
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'presentation':
        return <FileText className="h-4 w-4 text-orange-600" />;
      case 'spreadsheet':
        return <FileText className="h-4 w-4 text-emerald-600" />;
      case 'image':
        return <FileText className="h-4 w-4 text-pink-600" />;
      case 'link':
        return <Link className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleViewResource = async (resource: LibraryResource) => {
    await viewResource(resource.id);
    
    if (resource.url) {
      window.open(resource.url, '_blank');
    } else if (resource.file_path) {
      const fileUrl = await getFileUrl(resource.file_path);
      if (fileUrl) {
        window.open(fileUrl, '_blank');
      }
    }
  };

  const handlePreviewResource = (resource: LibraryResource) => {
    setPreviewResource(resource);
  };

  // Convert LibraryResource to dialog format
  const convertResourceForDialog = (resource: LibraryResource) => {
    return {
      id: resource.id,
      title: resource.title,
      description: resource.description,
      category: resource.category,
      resourceType: resource.resource_type,
      uploadedBy: resource.uploaded_by_name || 'Unknown',
      uploadDate: new Date(resource.created_at),
      expiryDate: resource.expires_at ? new Date(resource.expires_at) : undefined,
      isPrivate: resource.is_private,
      accessRoles: resource.access_roles || [],
      fileSize: resource.file_size ? (typeof resource.file_size === 'string' ? parseInt(resource.file_size, 10) : resource.file_size) : undefined,
      url: resource.url,
      rating: resource.rating,
      author: resource.author,
      version: resource.version,
      tags: resource.tags,
      views: resource.views_count,
      downloads: resource.downloads_count,
    };
  };

  const handleDownloadResource = (resource: LibraryResource) => {
    if (resource.file_path) {
      // Extract extension from file_path and append to title for proper filename
      const fileExtension = resource.file_path.split('.').pop() || '';
      const fileName = `${resource.title}.${fileExtension}`;
      downloadResource(resource.id, resource.file_path, fileName);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (window.confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
      deleteResource(resourceId);
    }
  };

  const handleShareResource = async (resource: LibraryResource) => {
    try {
      let shareUrl = '';
      let shareTitle = resource.title;
      let shareText = resource.description || `Check out this resource: ${resource.title}`;

      // Get shareable URL
      if (resource.url) {
        shareUrl = resource.url;
      } else if (resource.file_path) {
        // Generate a signed URL for the file
        const fileUrl = await getFileUrl(resource.file_path);
        if (fileUrl) {
          shareUrl = fileUrl;
        }
      }

      if (!shareUrl) {
        toast.error('Unable to generate share link for this resource');
        return;
      }

      // Try to use Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        toast.success('Resource shared successfully');
      } else {
        // Fallback to copying to clipboard
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Resource link copied to clipboard');
      }
    } catch (error) {
      console.error('Failed to share resource:', error);
      toast.error('Failed to share resource');
    }
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
      {/* Analytics Summary */}
      {analytics && showEngagementMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Resources</p>
                  <p className="text-2xl font-bold">{analytics.totalResources}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">{analytics.totalViews}</p>
                </div>
                <Eye className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Downloads</p>
                  <p className="text-2xl font-bold">{analytics.totalDownloads}</p>
                </div>
                <Download className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Expired Resources</p>
                  <p className="text-2xl font-bold text-destructive">{expiredResources.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Simple summary for non-admin users */}
      {analytics && !showEngagementMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Resources</p>
                  <p className="text-2xl font-bold">{analytics.totalResources}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Expired Resources</p>
                  <p className="text-2xl font-bold text-destructive">{expiredResources.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header and Search */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Library Resources</CardTitle>
              <CardDescription>
                Browse and manage educational resources - {resources.length} total resources
              </CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 dark:text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
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
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="p-2 space-y-2">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-muted-foreground">Category</label>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.description || cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-muted-foreground">Type</label>
                      <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          {resourceTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    View
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowExpired(!showExpired)}>
                    {showExpired ? 'Hide' : 'Show'} Expired Resources
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {onAddNew && (
                <Button onClick={onAddNew} size="sm">
                  Add Resource
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs and Resources List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All ({resources.length})</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
          <TabsTrigger value="expired" className="text-destructive">
            Expired ({expiredResources.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardContent className="p-0">
              {filteredResources.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-muted-foreground" />
                  <p className="text-gray-500 dark:text-muted-foreground text-lg">No resources found</p>
                  <p className="text-gray-400 dark:text-muted-foreground text-sm">Try adjusting your search criteria or add new resources</p>
                  {onAddNew && (
                    <Button onClick={onAddNew} className="mt-4">
                      Add First Resource
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Resource</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Author</TableHead>
                      {showEngagementMetrics && <TableHead>Stats</TableHead>}
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResources.map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 dark:bg-muted rounded-md">
                              {getResourceIcon(resource.resource_type)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">{resource.title}</p>
                                {resource.is_private && (
                                  <Badge variant="outline" className="text-xs">Private</Badge>
                                )}
                                {resource.expires_at && isAfter(new Date(), new Date(resource.expires_at)) && (
                                  <Badge variant="destructive" className="text-xs">Expired</Badge>
                                )}
                                {resource.url && (
                                  <ExternalLink className="h-3 w-3 text-blue-500" />
                                )}
                              </div>
                              {resource.description && (
                                <p className="text-xs text-gray-600 dark:text-muted-foreground mt-1 line-clamp-2">
                                  {resource.description}
                                </p>
                              )}
                              {resource.tags.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {resource.tags.slice(0, 3).map((tag, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {resource.tags.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{resource.tags.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {categories.find(c => c.name === resource.category)?.description || resource.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{resource.resource_type}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400 dark:text-muted-foreground" />
                            <span className="text-sm">{resource.author || resource.uploaded_by_name || 'Unknown'}</span>
                          </div>
                          {resource.version && (
                            <p className="text-xs text-gray-500 dark:text-muted-foreground">v{resource.version}</p>
                          )}
                        </TableCell>
                        {showEngagementMetrics && (
                          <TableCell>
                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                <span>{resource.views_count}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Download className="h-3 w-3" />
                                <span>{resource.downloads_count}</span>
                              </div>
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-500 dark:text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(resource.created_at), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreviewResource(resource)}
                              className="h-8 px-2"
                              title="Preview"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewResource(resource)}
                              className="h-8 px-2"
                              title="Open"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>

                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteResource(resource.id)}
                                className="h-8 px-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                                title="Delete"
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <LibraryResourcePreviewDialog
        isOpen={!!previewResource}
        onClose={() => setPreviewResource(null)}
        resource={previewResource ? convertResourceForDialog(previewResource) : null}
        showEngagementMetrics={showEngagementMetrics}
        onOpenDocumentFile={previewResource ? (resource) => {
          // Check if it has a file path first (means file was uploaded)
          if (previewResource.file_path) {
            // Extract extension from file_path and append to title for proper filename
            const fileExtension = previewResource.file_path.split('.').pop() || '';
            const fileName = `${previewResource.title}.${fileExtension}`;
            downloadResource(previewResource.id, previewResource.file_path, fileName);
          } else if (previewResource.url) {
            // Only has a link, show message
            toast("No file to download. Use the link shown in the preview above.");
          } else {
            // Neither file nor link
            toast("No file or link available for download.");
          }
        } : undefined}
      />
    </div>
  );
};
