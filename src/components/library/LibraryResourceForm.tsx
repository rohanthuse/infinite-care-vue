
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, Upload, XIcon, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface LibraryResourceFormProps {
  branchId: string;
  onResourceAdded?: () => void;
}

const resourceCategories = [
  { id: "care_protocols", name: "Care Protocols" },
  { id: "training", name: "Training Materials" },
  { id: "research", name: "Research Papers" },
  { id: "guidelines", name: "Clinical Guidelines" },
  { id: "reference", name: "Reference Materials" },
  { id: "presentations", name: "Presentations" },
  { id: "courses", name: "Courses" },
  { id: "tools", name: "Tools & Calculators" },
];

const resourceTypes = [
  { id: "pdf", name: "PDF Document" },
  { id: "video", name: "Video" },
  { id: "presentation", name: "Presentation" },
  { id: "audio", name: "Audio" },
  { id: "spreadsheet", name: "Spreadsheet" },
  { id: "document", name: "Document" },
  { id: "image", name: "Image" },
  { id: "link", name: "External Link" },
];

export const LibraryResourceForm: React.FC<LibraryResourceFormProps> = ({ 
  branchId,
  onResourceAdded 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [tags, setTags] = useState('');
  const [author, setAuthor] = useState('');
  const [version, setVersion] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resourceUrl, setResourceUrl] = useState('');
  const [accessRoles, setAccessRoles] = useState<string[]>([]);
  const [isLink, setIsLink] = useState(false);

  const roles = [
    { id: "admin", name: "Administrators" },
    { id: "manager", name: "Managers" },
    { id: "staff", name: "Staff Members" },
    { id: "nurse", name: "Nurses" },
    { id: "doctor", name: "Doctors" },
    { id: "caregiver", name: "Caregivers" },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setIsLink(false);
    }
  };
  
  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleToggleResourceType = (value: boolean) => {
    setIsLink(value);
    setSelectedFile(null);
    setResourceUrl('');
  };

  const handleRoleToggle = (roleId: string) => {
    setAccessRoles(current => 
      current.includes(roleId) 
        ? current.filter(id => id !== roleId) 
        : [...current, roleId]
    );
  };

  const simulateUpload = () => {
    setUploading(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploading(false);
          
          // Call onResourceAdded callback after successful upload
          if (onResourceAdded) {
            setTimeout(() => {
              onResourceAdded();
            }, 500); // Small delay to ensure progress bar is seen at 100%
          }
          
          return 100;
        }
        return prev + 5; // Speed up the progress a bit
      });
    }, 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) {
      toast.error("Please enter a resource title");
      return;
    }
    
    if (isLink && !resourceUrl) {
      toast.error("Please enter a resource URL");
      return;
    }
    
    if (!isLink && !selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }
    
    if (!category) {
      toast.error("Please select a category");
      return;
    }
    
    if (!resourceType) {
      toast.error("Please select a resource type");
      return;
    }
    
    if (isPrivate && accessRoles.length === 0) {
      toast.error("Please select at least one role for access permissions");
      return;
    }

    // Here would be the API call to submit the resource
    simulateUpload();
    
    // Form reset happens after upload completes in simulateUpload
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setResourceType('');
    setIsPrivate(false);
    setExpiryDate(undefined);
    setTags('');
    setAuthor('');
    setVersion('');
    setSelectedFile(null);
    setResourceUrl('');
    setAccessRoles([]);
    setProgress(0);
  };

  // Drag and drop functionality
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
      setIsLink(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Resource Title <span className="text-red-500">*</span></Label>
            <Input 
              id="title"
              placeholder="Enter resource title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description"
              placeholder="Enter resource description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Resource Category <span className="text-red-500">*</span></Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {resourceCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="resourceType">Resource Type <span className="text-red-500">*</span></Label>
              <Select value={resourceType} onValueChange={setResourceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {resourceTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="author">Author/Source</Label>
              <Input 
                id="author"
                placeholder="Enter author or source"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input 
                id="version"
                placeholder="e.g., 1.0, 2023.1"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input 
              id="tags"
              placeholder="Enter tags to help with searching"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-2">
            <Label>Resource Type</Label>
            <div className="flex items-center space-x-2">
              <Label htmlFor="resource-toggle" className={!isLink ? "font-medium" : "text-gray-500"}>File</Label>
              <Switch
                id="resource-toggle"
                checked={isLink}
                onCheckedChange={handleToggleResourceType}
              />
              <Label htmlFor="resource-toggle" className={isLink ? "font-medium" : "text-gray-500"}>Link</Label>
            </div>
          </div>
          
          {isLink ? (
            <div className="space-y-2">
              <Label htmlFor="resourceUrl">Resource URL <span className="text-red-500">*</span></Label>
              <Input 
                id="resourceUrl"
                placeholder="Enter URL to the resource"
                type="url"
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              {selectedFile ? (
                <Card className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-10 h-10 rounded-md bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-700">{selectedFile.name.split('.').pop()?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleRemoveFile}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition cursor-pointer"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center">
                    <Upload className="h-10 w-10 text-gray-400 mb-3" />
                    <p className="font-medium text-gray-700">Click to upload a file</p>
                    <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
                    <p className="text-xs text-gray-400 mt-2">PDF, DOCX, XLSX, MP4, JPG, etc.</p>
                  </div>
                  <input 
                    id="file-upload"
                    type="file" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </div>
              )}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="expiry-date">Expiry Date (if applicable)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="expiry-date"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expiryDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expiryDate ? format(expiryDate, "PPP") : <span>Set expiry date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={expiryDate}
                  onSelect={setExpiryDate}
                  initialFocus
                  disabled={(date) => date < new Date()} // Can't select dates in the past
                />
              </PopoverContent>
            </Popover>
            {expiryDate && (
              <Button
                variant="ghost"
                size="sm"
                className="mt-1 h-auto p-0 text-xs text-muted-foreground"
                onClick={() => setExpiryDate(undefined)}
              >
                <XIcon className="mr-1 h-3 w-3" />
                Clear expiry date
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="privacy-toggle">Private Resource</Label>
              <Switch
                id="privacy-toggle"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
            </div>
            <p className="text-xs text-gray-500">
              {isPrivate 
                ? "This resource will only be accessible to selected roles" 
                : "This resource will be accessible to everyone in the branch"}
            </p>
            
            {isPrivate && (
              <div className="mt-3 space-y-2">
                <Label>Access Permissions <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`role-${role.id}`}
                        checked={accessRoles.includes(role.id)}
                        onChange={() => handleRoleToggle(role.id)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <Label htmlFor={`role-${role.id}`} className="text-sm font-normal cursor-pointer">
                        {role.name}
                      </Label>
                    </div>
                  ))}
                </div>
                {isPrivate && accessRoles.length === 0 && (
                  <div className="flex items-center mt-1 text-amber-600 text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    <span>Please select at least one role</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Uploading Resource...</Label>
            <span className="text-sm font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
      
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={resetForm}>
          Cancel
        </Button>
        <Button type="submit" disabled={uploading}>
          {uploading ? "Uploading..." : "Add Resource"}
        </Button>
      </div>
    </form>
  );
};
