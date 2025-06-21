
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
      const { data, error } = await supabase
        .from('library_resources')
        .select('*')
        .eq('branch_id', branchId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LibraryResource[];
    },
    enabled: !!branchId,
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let filePath = null;
      let fileSize = null;
      let fileType = null;

      // Upload file if provided
      if (resourceData.file) {
        const fileExt = resourceData.file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const storagePath = `${branchId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('library-resources')
          .upload(storagePath, resourceData.file);

        if (uploadError) throw uploadError;

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

      if (error) throw error;
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
        description: "Failed to add resource to library",
        variant: "destructive",
      });
    },
  });

  // Update resource mutation
  const updateResourceMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LibraryResource> & { id: string }) => {
      const { data, error } = await supabase
        .from('library_resources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
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
        description: "Failed to update resource",
        variant: "destructive",
      });
    },
  });

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      // Get resource to check for file
      const { data: resource } = await supabase
        .from('library_resources')
        .select('file_path')
        .eq('id', resourceId)
        .single();

      // Delete file from storage if exists
      if (resource?.file_path) {
        await supabase.storage
          .from('library-resources')
          .remove([resource.file_path]);
      }

      // Delete resource record
      const { error } = await supabase
        .from('library_resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;
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
        description: "Failed to delete resource",
        variant: "destructive",
      });
    },
  });

  // View resource (increment view count and log access)
  const viewResource = async (resourceId: string) => {
    try {
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
      const { data, error } = await supabase.storage
        .from('library-resources')
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Update download count and log access
      const { data: { user } } = await supabase.auth.getUser();
      
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
      
      toast({
        title: "Success",
        description: "Resource downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading resource:', error);
      toast({
        title: "Error",
        description: "Failed to download resource",
        variant: "destructive",
      });
    }
  };

  // Get file URL for preview
  const getFileUrl = async (filePath: string) => {
    try {
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
