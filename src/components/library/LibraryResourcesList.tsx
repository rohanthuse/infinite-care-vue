import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Filter, 
  Download,
  EyeIcon, 
  Share2,
  MoreVertical,
  BookOpen,
  Star,
  FileText,
  Video,
  AudioLines,
  FileSpreadsheet,
  FileImage,
  Link,
  Files,
  CalendarIcon,
  Clock,
  Tag,
  Lock,
  Unlock,
  User,
  Trash2,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { LibraryResourcePreviewDialog } from './LibraryResourcePreviewDialog';
import { LibraryFilterDialog } from './LibraryFilterDialog';
import { DateRange } from 'react-day-picker';

interface LibraryResourcesListProps {
  branchId: string;
  onAddNew?: () => void;
}

interface LibraryResource {
  id: string;
  title: string;
  description?: string;
  category: string;
  resourceType: string;
  uploadedBy: string;
  uploadDate: Date;
  expiryDate?: Date;
  isPrivate: boolean;
  accessRoles: string[];
  fileSize?: number;
  url?: string;
  rating?: number;
  author?: string;
  version?: string;
  tags?: string[];
  views: number;
  downloads: number;
}

const mockResources: LibraryResource[] = [
  {
    id: "RES-001",
    title: "Clinical Guidelines for Diabetes Management",
    description: "Comprehensive guidelines for managing diabetes in elderly patients, including medication protocols and lifestyle recommendations.",
    category: "guidelines",
    resourceType: "pdf",
    uploadedBy: "Dr. Sarah Johnson",
    uploadDate: new Date(2025, 2, 15),
    isPrivate: false,
    accessRoles: [],
    fileSize: 2.4 * 1024 * 1024, // 2.4 MB
    author: "Med-Infinite Clinical Team",
    version: "2025.1",
    tags: ["diabetes", "elderly care", "clinical protocol"],
    views: 145,
    downloads: 87
  },
  {
    id: "RES-002",
    title: "Introduction to Dementia Care",
    description: "Training video series on best practices for dementia care, including communication strategies and environment modifications.",
    category: "training",
    resourceType: "video",
    uploadedBy: "Emma Thompson",
    uploadDate: new Date(2025, 3, 2),
    isPrivate: true,
    accessRoles: ["caregiver", "nurse", "manager"],
    url: "https://example.com/videos/dementia-care-intro",
    author: "Dementia Care Association",
    version: "2025",
    tags: ["dementia", "training", "care techniques"],
    views: 89,
    downloads: 0
  },
  {
    id: "RES-003",
    title: "Medication Administration Calculator",
    description: "Interactive tool for calculating medication dosages, including pediatric and geriatric adjustments.",
    category: "tools",
    resourceType: "spreadsheet",
    uploadedBy: "Robert Wilson",
    uploadDate: new Date(2025, 3, 10),
    isPrivate: true,
    accessRoles: ["doctor", "nurse"],
    fileSize: 1.2 * 1024 * 1024, // 1.2 MB
    version: "3.5",
    tags: ["medication", "calculator", "dosage"],
    views: 67,
    downloads: 43
  },
  {
    id: "RES-004",
    title: "Wound Care Pictorial Guide",
    description: "Visual guide for identifying and treating different types of wounds, with step-by-step care instructions.",
    category: "reference",
    resourceType: "image",
    uploadedBy: "Dr. Michael Brown",
    uploadDate: new Date(2025, 2, 20),
    expiryDate: new Date(2026, 2, 20),
    isPrivate: false,
    accessRoles: [],
    fileSize: 5.7 * 1024 * 1024, // 5.7 MB
    author: "Med-Infinite Wound Care Team",
    version: "2025",
    tags: ["wound care", "treatment", "reference"],
    views: 213,
    downloads: 156
  },
  {
    id: "RES-005",
    title: "Latest Research on Alzheimer's Treatment",
    description: "Summary of recent research findings in Alzheimer's treatment, including promising drug trials and therapeutic approaches.",
    category: "research",
    resourceType: "document",
    uploadedBy: "Dr. James Wilson",
    uploadDate: new Date(2025, 3, 5),
    isPrivate: false,
    accessRoles: [],
    fileSize: 1.8 * 1024 * 1024, // 1.8 MB
    author: "International Alzheimer's Research Consortium",
    version: "April 2025",
    tags: ["alzheimer's", "research", "treatment"],
    views: 78,
    downloads: 32
  },
  {
    id: "RES-006",
    title: "Relaxation Techniques for Patients",
    description: "Audio series with guided relaxation exercises for patients with anxiety, insomnia, or chronic pain.",
    category: "care_protocols",
    resourceType: "audio",
    uploadedBy: "Lisa Chen",
    uploadDate: new Date(2025, 2, 28),
    isPrivate: true,
    accessRoles: ["caregiver", "nurse", "doctor"],
    fileSize: 45 * 1024 * 1024, // 45 MB
    author: "Mental Health Support Team",
    tags: ["relaxation", "mental health", "anxiety"],
    views: 55,
    downloads: 29
  }
];

const categories = [
  { id: "care_protocols", name: "Care Protocols" },
  { id: "training", name: "Training Materials" },
  { id: "research", name: "Research Papers" },
  { id: "guidelines", name: "Clinical Guidelines" },
  { id: "reference", name: "Reference Materials" },
  { id: "presentations", name: "Presentations" },
  { id: "courses", name: "Courses" },
  { id: "tools", name: "Tools & Calculators" },
];

export const LibraryResourcesList: React.FC<LibraryResourcesListProps> = ({ 
  branchId,
  onAddNew
}) => {
  const [searchValue, setSearchValue] = useState("");
  const [selectedResource, setSelectedResource] = useState<LibraryResource | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: null as DateRange | null,
    resourceTypes: [] as string[],
    onlyPrivate: false,
    categories: [] as string[],
    hasExpiry: false,
  });
  
  const getCategoryName = (categoryId: string): string => {
    return categories.find(cat => cat.id === categoryId)?.name || categoryId;
  };
  
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  };
  
  const getResourceTypeIcon = (resourceType: string) => {
    switch (resourceType.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-500" />;
      case 'video':
        return <Video className="h-6 w-6 text-blue-500" />;
      case 'audio':
        return <AudioLines className="h-6 w-6 text-purple-500" />;
      case 'spreadsheet':
        return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
      case 'presentation':
        return <Files className="h-6 w-6 text-amber-500" />;
      case 'document':
        return <FileText className="h-6 w-6 text-blue-500" />;
      case 'image':
        return <FileImage className="h-6 w-6 text-pink-500" />;
      case 'link':
        return <Link className="h-6 w-6 text-cyan-500" />;
      default:
        return <BookOpen className="h-6 w-6 text-gray-500" />;
    }
  };
  
  const handlePreviewResource = (resource: LibraryResource) => {
    setSelectedResource(resource);
    setPreviewDialogOpen(true);
    
    const updatedResource = mockResources.find(r => r.id === resource.id);
    if (updatedResource) {
      updatedResource.views += 1;
    }
  };
  
  const handleDownloadResource = (resource: LibraryResource) => {
    toast.success(`Downloading: ${resource.title}`);
    const updatedResource = mockResources.find(r => r.id === resource.id);
    if (updatedResource) {
      updatedResource.downloads += 1;
    }
  };
  
  const handleShareResource = (resource: LibraryResource) => {
    const shareLink = `https://med-infinite.com/resources/${resource.id}`;
    navigator.clipboard.writeText(shareLink).then(() => {
      toast.success(`Share link copied to clipboard for: ${resource.title}`);
    }).catch(() => {
      toast.error("Failed to copy share link");
    });
  };
  
  const handleDeleteResource = (resource: LibraryResource) => {
    toast.success(`Resource deleted: ${resource.title}`);
  };

  const handleAddNew = () => {
    if (onAddNew) {
      onAddNew();
    }
  };
  
  const filteredResources = mockResources.filter(resource => {
    const matchesSearch = 
      resource.title.toLowerCase().includes(searchValue.toLowerCase()) ||
      resource.description?.toLowerCase().includes(searchValue.toLowerCase()) ||
      resource.author?.toLowerCase().includes(searchValue.toLowerCase()) ||
      resource.tags?.some(tag => tag.toLowerCase().includes(searchValue.toLowerCase()));
    
    const matchesResourceType = 
      filters.resourceTypes.length === 0 || 
      filters.resourceTypes.includes(resource.resourceType);
    
    const matchesPrivacy = !filters.onlyPrivate || resource.isPrivate;
    
    const matchesCategory = 
      filters.categories.length === 0 || 
      filters.categories.includes(resource.category);
    
    const matchesDateRange = 
      !filters.dateRange?.from || 
      !filters.dateRange?.to || 
      (resource.uploadDate >= filters.dateRange.from && 
       resource.uploadDate <= filters.dateRange.to);
    
    const matchesExpiry = !filters.hasExpiry || !!resource.expiryDate;
    
    return matchesSearch && matchesResourceType && matchesPrivacy && 
           matchesCategory && matchesDateRange && matchesExpiry;
  });
  
  const renderRating = (rating?: number) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`h-3.5 w-3.5 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search resources by title, description, author, or tags..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setFilterDialogOpen(true)}
            className="whitespace-nowrap"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {(filters.resourceTypes.length > 0 || filters.categories.length > 0 || filters.onlyPrivate || filters.hasExpiry || filters.dateRange) && (
              <Badge className="ml-2 bg-blue-500 hover:bg-blue-600">
                {filters.resourceTypes.length + 
                 filters.categories.length + 
                 (filters.onlyPrivate ? 1 : 0) + 
                 (filters.hasExpiry ? 1 : 0) + 
                 (filters.dateRange ? 1 : 0)}
              </Badge>
            )}
          </Button>
          
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </Button>
        </div>
      </div>
      
      {filteredResources.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-xl font-medium text-gray-600">No resources found</h3>
          <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
          <Button className="mt-4" variant="outline" onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Resource
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource) => (
            <Card key={resource.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="p-4 border-b border-gray-100 flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center">
                      {getResourceTypeIcon(resource.resourceType)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 line-clamp-1" title={resource.title}>
                        {resource.title}
                      </h3>
                      <div className="flex items-center mt-1">
                        {renderRating(resource.rating)}
                        <div className="text-xs text-gray-500 ml-2">
                          {resource.views} views • {resource.downloads} downloads
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handlePreviewResource(resource)}>
                        <EyeIcon className="h-4 w-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadResource(resource)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShareResource(resource)}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDeleteResource(resource)} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="p-4">
                  <p className="text-sm text-gray-600 line-clamp-2 h-10" title={resource.description}>
                    {resource.description || "No description available"}
                  </p>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-gray-100">
                      <Tag className="h-3 w-3 mr-1" />
                      {getCategoryName(resource.category)}
                    </Badge>
                    
                    {resource.isPrivate ? (
                      <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                        <Lock className="h-3 w-3 mr-1" />
                        Private
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                        <Unlock className="h-3 w-3 mr-1" />
                        Public
                      </Badge>
                    )}
                    
                    {resource.expiryDate && (
                      <Badge variant={new Date() > resource.expiryDate ? "destructive" : "outline"} className={new Date() > resource.expiryDate ? "" : "text-amber-600 border-amber-200 bg-amber-50"}>
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date() > resource.expiryDate ? "Expired" : "Expires"}: {format(resource.expiryDate, "dd MMM yyyy")}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="mt-4 text-xs text-gray-500">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {resource.author && (
                        <>
                          <span className="font-medium">Author:</span>
                          <span>{resource.author}</span>
                        </>
                      )}
                      
                      {resource.version && (
                        <>
                          <span className="font-medium">Version:</span>
                          <span>{resource.version}</span>
                        </>
                      )}
                      
                      <span className="font-medium">Type:</span>
                      <span>{resource.resourceType.charAt(0).toUpperCase() + resource.resourceType.slice(1)}</span>
                      
                      {resource.fileSize && (
                        <>
                          <span className="font-medium">Size:</span>
                          <span>{formatFileSize(resource.fileSize)}</span>
                        </>
                      )}
                      
                      <span className="font-medium">Uploaded:</span>
                      <span>{format(resource.uploadDate, "dd MMM yyyy")}</span>
                      
                      <span className="font-medium">By:</span>
                      <span className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {resource.uploadedBy}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      {resource.tags && resource.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {resource.tags.slice(0, 3).map((tag, index) => (
                            <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              #{tag}
                            </span>
                          ))}
                          {resource.tags.length > 3 && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              +{resource.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8"
                        onClick={() => handlePreviewResource(resource)}
                      >
                        <EyeIcon className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8"
                        onClick={() => handleDownloadResource(resource)}
                      >
                        <Download className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8"
                        onClick={() => handleShareResource(resource)}
                      >
                        <Share2 className="h-4 w-4 text-purple-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <LibraryResourcePreviewDialog
        isOpen={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        resource={selectedResource}
        onDownload={handleDownloadResource}
        onShare={handleShareResource}
        onDelete={handleDeleteResource}
      />
      
      <LibraryFilterDialog
        isOpen={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        filters={filters}
        onApplyFilters={setFilters}
      />
    </div>
  );
};
