
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
  Calendar,
  ExternalLink,
  Star,
  TrendingUp,
  MoreHorizontal,
  Link
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

interface LibraryResourcesListProps {
  branchId: string;
  onAddNew?: () => void;
}

export const LibraryResourcesList: React.FC<LibraryResourcesListProps> = ({
  branchId,
  onAddNew,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [resourceTypeFilter, setResourceTypeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  const { 
    resources, 
    categories, 
    isLoading, 
    deleteResource, 
    viewResource,
    downloadResource,
    getFileUrl
  } = useLibraryResources(branchId);

  // Get unique resource types
  const resourceTypes = useMemo(() => {
    return Array.from(new Set(resources.map(r => r.resource_type))).sort();
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
      }
      
      return matchesSearch && matchesCategory && matchesType && matchesTab;
    });
  }, [resources, searchQuery, categoryFilter, resourceTypeFilter, activeTab]);

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

  const handleDownloadResource = (resource: LibraryResource) => {
    if (resource.file_path) {
      downloadResource(resource.id, resource.file_path, resource.title);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (window.confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
      deleteResource(resourceId);
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
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
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
                      <label className="text-xs font-medium text-gray-500">Category</label>
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
                      <label className="text-xs font-medium text-gray-500">Type</label>
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({resources.length})</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="links">Links</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardContent className="p-0">
              {filteredResources.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 text-lg">No resources found</p>
                  <p className="text-gray-400 text-sm">Try adjusting your search criteria or add new resources</p>
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
                      <TableHead>Stats</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResources.map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 rounded-md">
                              {getResourceIcon(resource.resource_type)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium truncate">{resource.title}</p>
                                {resource.is_private && (
                                  <Badge variant="outline" className="text-xs">Private</Badge>
                                )}
                                {resource.url && (
                                  <ExternalLink className="h-3 w-3 text-blue-500" />
                                )}
                              </div>
                              {resource.description && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
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
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{resource.author || resource.uploaded_by_name || 'Unknown'}</span>
                          </div>
                          {resource.version && (
                            <p className="text-xs text-gray-500">v{resource.version}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
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
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(resource.created_at), 'MMM dd, yyyy')}
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
                              <DropdownMenuItem onClick={() => handleViewResource(resource)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              {resource.file_path && (
                                <DropdownMenuItem onClick={() => handleDownloadResource(resource)}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={() => handleDeleteResource(resource.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
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
};
