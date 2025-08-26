import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface LibraryResource {
  id: string;
  branch_id: string;
  title: string;
  description?: string;
  category: string;
  resource_type: string;
  file_path?: string;
  file_size?: number;
  file_type?: string;
  url?: string;
  author?: string;
  version?: string;
  tags: string[];
  is_private: boolean;
  access_roles: string[];
  uploaded_by?: string;
  uploaded_by_name?: string;
  views_count: number;
  downloads_count: number;
  rating?: number;
  status: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface LibraryCategory {
  id: string;
  name: string;
  description?: string;
  status: string;
}

export interface CreateLibraryResourceData {
  title: string;
  description?: string;
  category: string;
  resource_type: string;
  url?: string;
  author?: string;
  version?: string;
  tags?: string[];
  is_private?: boolean;
  access_roles?: string[];
  file?: File;
  expires_at?: string;
}

export const useLibraryResources = (branchId: string) => {
  const queryClient = useQueryClient();

  // Fetch library resources
  const {
    data: resources = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['library-resources', branchId],
    queryFn: async () => {
      console.log('Fetching library resources for branch:', branchId);
      
      // Get current user info for debugging
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user?.id);

      const { data, error } = await supabase
        .from('library_resources')
        .select('*')
        .eq('branch_id', branchId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching library resources:', error);
        if (error.message?.includes('RLS')) {
          throw new Error('Access denied: You do not have permission to view resources in this branch. Please contact your administrator.');
        }
        throw error;
      }
      
      console.log('Fetched library resources count:', data?.length);
      console.log('Private resources:', data?.filter(r => r.is_private).length);
      console.log('Resources with access_roles:', data?.filter(r => r.access_roles?.length > 0).map(r => ({ 
        id: r.id, 
        title: r.title, 
        is_private: r.is_private, 
        access_roles: r.access_roles 
      })));
      
      return data as LibraryResource[];
    },
    enabled: !!branchId,
    staleTime: 30000, // 30 seconds - prevent too frequent refetches
    refetchInterval: false, // Disable automatic refetching to prevent disappearing resources
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['library-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('library_categories')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      return data as LibraryCategory[];
    },
  });

  // Create resource mutation
  const createResourceMutation = useMutation({
    mutationFn: async (resourceData: CreateLibraryResourceData) => {
      console.log('Creating library resource:', resourceData);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to create resources');
      }

      console.log('Current user:', user.id);

      let filePath = null;
      let fileSize = null;
      let fileType = null;

      // Upload file if provided
      if (resourceData.file) {
        console.log('Uploading file:', resourceData.file.name);
        
        const fileExt = resourceData.file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const storagePath = `${branchId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('library-resources')
          .upload(storagePath, resourceData.file);

        if (uploadError) {
          console.error('File upload error:', uploadError);
          if (uploadError.message?.includes('RLS') || uploadError.message?.includes('policy')) {
            throw new Error('Access denied: You do not have permission to upload files to this branch. Please contact your administrator.');
          }
          throw uploadError;
        }

        console.log('File uploaded successfully to:', storagePath);
        filePath = storagePath;
        fileSize = resourceData.file.size;
        fileType = resourceData.file.type;
      }

      // Get user profile for uploaded_by_name
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      const uploadedByName = profile 
        ? `${profile.first_name} ${profile.last_name}`.trim()
        : user.email || 'Unknown User';

      console.log('Creating resource record with uploaded_by_name:', uploadedByName);

      const { data, error } = await supabase
        .from('library_resources')
        .insert({
          branch_id: branchId,
          title: resourceData.title,
          description: resourceData.description,
          category: resourceData.category,
          resource_type: resourceData.resource_type,
          file_path: filePath,
          file_size: fileSize,
          file_type: fileType,
          url: resourceData.url,
          author: resourceData.author,
          version: resourceData.version,
          tags: resourceData.tags || [],
          is_private: resourceData.is_private || false,
          access_roles: resourceData.access_roles || [],
          uploaded_by: user.id,
          uploaded_by_name: uploadedByName,
          expires_at: resourceData.expires_at,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating resource:', error);
        
        // Clean up uploaded file if resource creation fails
        if (filePath) {
          await supabase.storage
            .from('library-resources')
            .remove([filePath]);
        }
        
        if (error.message?.includes('RLS') || error.message?.includes('policy')) {
          throw new Error('Access denied: You do not have permission to create resources in this branch. Please contact your administrator.');
        }
        
        throw error;
      }

      console.log('Resource created successfully:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-resources', branchId] });
      toast({
        title: "Success",
        description: "Resource added to library successfully",
      });
    },
    onError: (error) => {
      console.error('Error creating resource:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add resource to library",
        variant: "destructive",
      });
    },
  });

  // Update resource mutation
  const updateResourceMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LibraryResource> & { id: string }) => {
      console.log('Updating resource:', id, updates);
      
      const { data, error } = await supabase
        .from('library_resources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating resource:', error);
        if (error.message?.includes('RLS') || error.message?.includes('policy')) {
          throw new Error('Access denied: You do not have permission to update this resource.');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-resources', branchId] });
      toast({
        title: "Success",
        description: "Resource updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating resource:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update resource",
        variant: "destructive",
      });
    },
  });

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      console.log('Deleting resource:', resourceId);
      
      // Get resource to check for file
      const { data: resource } = await supabase
        .from('library_resources')
        .select('file_path')
        .eq('id', resourceId)
        .single();

      // Delete file from storage if exists
      if (resource?.file_path) {
        console.log('Deleting file from storage:', resource.file_path);
        await supabase.storage
          .from('library-resources')
          .remove([resource.file_path]);
      }

      // Delete resource record
      const { error } = await supabase
        .from('library_resources')
        .delete()
        .eq('id', resourceId);

      if (error) {
        console.error('Error deleting resource:', error);
        if (error.message?.includes('RLS') || error.message?.includes('policy')) {
          throw new Error('Access denied: You do not have permission to delete this resource.');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-resources', branchId] });
      toast({
        title: "Success",
        description: "Resource deleted successfully",
      });
    },
    onError: (error) => {
      console.error('Error deleting resource:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete resource",
        variant: "destructive",
      });
    },
  });

  // View resource (increment view count and log access)
  const viewResource = async (resourceId: string) => {
    try {
      console.log('Viewing resource:', resourceId);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update view count
      await supabase.rpc('update_resource_stats', {
        resource_id: resourceId,
        stat_type: 'view'
      });

      // Log access
      if (user) {
        await supabase
          .from('library_resource_access_logs')
          .insert({
            resource_id: resourceId,
            user_id: user.id,
            branch_id: branchId,
            access_type: 'view'
          });
      }

      queryClient.invalidateQueries({ queryKey: ['library-resources', branchId] });
    } catch (error) {
      console.error('Error logging resource view:', error);
    }
  };

  // Download resource
  const downloadResource = async (resourceId: string, filePath: string, fileName: string) => {
    try {
      console.log('Downloading resource:', resourceId, filePath);
      
      const { data, error } = await supabase.storage
        .from('library-resources')
        .download(filePath);

      if (error) {
        console.error('Download error:', error);
        if (error.message?.includes('RLS') || error.message?.includes('policy')) {
          throw new Error('Access denied: You do not have permission to download this file.');
        }
        if (error.message?.includes('not found')) {
          throw new Error('File not found. The file may have been moved or deleted.');
        }
        throw new Error(`Download failed: ${error.message}`);
      }

      // Ensure we have a proper filename with extension
      let downloadFileName = fileName;
      if (!downloadFileName || downloadFileName === 'undefined') {
        // Extract filename from file path if original name is not available
        downloadFileName = filePath.split('/').pop() || 'downloaded-file';
      }
      
      // Ensure file has an extension
      if (!downloadFileName.includes('.')) {
        // Try to get extension from file path
        const pathExtension = filePath.split('.').pop();
        if (pathExtension && pathExtension !== filePath) {
          downloadFileName += `.${pathExtension}`;
        }
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Update download count and log access
      const { data: { user } } = await supabase.auth.getUser();
      
      try {
        await supabase.rpc('update_resource_stats', {
          resource_id: resourceId,
          stat_type: 'download'
        });

        if (user) {
          await supabase
            .from('library_resource_access_logs')
            .insert({
              resource_id: resourceId,
              user_id: user.id,
              branch_id: branchId,
              access_type: 'download'
            });
        }

        queryClient.invalidateQueries({ queryKey: ['library-resources', branchId] });
      } catch (logError) {
        // Don't throw if logging fails - the download was successful
        console.warn('Failed to log download:', logError);
      }
      
      toast({
        title: "Success",
        description: "Resource downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading resource:', error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download resource",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Get file URL for preview
  const getFileUrl = async (filePath: string) => {
    try {
      console.log('Getting file URL for:', filePath);
      
      const { data } = await supabase.storage
        .from('library-resources')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      return data?.signedUrl;
    } catch (error) {
      console.error('Error getting file URL:', error);
      return null;
    }
  };

  return {
    resources,
    categories,
    isLoading,
    error,
    createResource: createResourceMutation.mutate,
    updateResource: updateResourceMutation.mutate,
    deleteResource: deleteResourceMutation.mutate,
    viewResource,
    downloadResource,
    getFileUrl,
    isCreating: createResourceMutation.isPending,
    isUpdating: updateResourceMutation.isPending,
    isDeleting: deleteResourceMutation.isPending,
  };
};
