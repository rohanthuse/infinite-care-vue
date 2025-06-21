
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Agreement, AgreementTemplate, ScheduledAgreement, AgreementType, AgreementPartyFilter } from "@/types/agreements";

// --- CLIENTS AND STAFF DATA ---

export const useClients = (branchId?: string) => {
  return useQuery({
    queryKey: ['clients', branchId],
    queryFn: async () => {
      let query = supabase.from('clients').select('id, first_name, last_name');
      if (branchId && branchId !== 'global') {
        query = query.eq('branch_id', branchId);
      }
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data || [];
    }
  });
};

export const useStaff = (branchId?: string) => {
  return useQuery({
    queryKey: ['staff', branchId],
    queryFn: async () => {
      let query = supabase.from('staff').select('id, first_name, last_name');
      if (branchId && branchId !== 'global') {
        query = query.eq('branch_id', branchId);
      }
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data || [];
    }
  });
};

// --- AGREEMENT TYPES ---

const fetchAgreementTypes = async () => {
  const { data, error } = await supabase.from("agreement_types").select("*").eq("status", "Active");
  if (error) throw new Error(error.message);
  return data;
};

export const useAgreementTypes = () => {
  return useQuery<AgreementType[], Error>({ queryKey: ["agreementTypes"], queryFn: fetchAgreementTypes });
};

// --- SIGNED AGREEMENTS ---

const fetchSignedAgreements = async ({ searchQuery = "", typeFilter = "all", dateFilter = "all", branchId, partyFilter = "all" }: { searchQuery?: string; typeFilter?: string; dateFilter?: string; branchId?: string; partyFilter?: AgreementPartyFilter; }) => {
    let query = supabase.from('agreements').select(`*, agreement_types ( name )`);
    if (branchId) query = query.eq('branch_id', branchId);
    if (searchQuery) query = query.or(`title.ilike.%${searchQuery}%,signed_by_name.ilike.%${searchQuery}%`);
    if (typeFilter !== 'all') query = query.eq('type_id', typeFilter);
    if (partyFilter !== 'all') query = query.eq('signing_party', partyFilter);

    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      if (dateFilter === "last7days") filterDate.setDate(now.getDate() - 7);
      else if (dateFilter === "last30days") filterDate.setDate(now.getDate() - 30);
      else if (dateFilter === "last90days") filterDate.setDate(now.getDate() - 90);
      if (dateFilter !== "all") query = query.gte('signed_at', filterDate.toISOString());
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data as Agreement[];
};

export const useSignedAgreements = ({ searchQuery, typeFilter, dateFilter, branchId, partyFilter }: { searchQuery?: string; typeFilter?: string; dateFilter?: string; branchId?: string; partyFilter?: AgreementPartyFilter; }) => {
  return useQuery<Agreement[], Error>({
    queryKey: ['agreements', { searchQuery, typeFilter, dateFilter, branchId, partyFilter }],
    queryFn: () => fetchSignedAgreements({ searchQuery, typeFilter, dateFilter, branchId, partyFilter }),
  });
};

const createAgreement = async (agreementData: Omit<Agreement, 'id' | 'created_at' | 'updated_at'>) => {
  const { error } = await supabase.from('agreements').insert(agreementData);
  if (error) throw new Error(error.message);
};

export const useCreateAgreement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAgreement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agreements'] });
      toast.success("Agreement created successfully");
    },
    onError: (error) => toast.error(`Failed to create agreement: ${error.message}`),
  });
};

const deleteAgreement = async (id: string) => {
    const { error } = await supabase.from('agreements').delete().eq('id', id);
    if (error) throw new Error(error.message);
};

export const useDeleteAgreement = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteAgreement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agreements'] });
            toast.success("Agreement deleted successfully");
        },
        onError: (error) => toast.error(`Deletion failed: ${error.message}`),
    });
};

// --- SCHEDULED AGREEMENTS ---

const fetchScheduledAgreements = async ({ searchQuery = "", typeFilter = "all", dateFilter = "all", branchId }: { searchQuery?: string; typeFilter?: string; dateFilter?: string; branchId: string; }) => {
    let query = supabase.from('scheduled_agreements').select(`*, agreement_types ( name )`);
    
    if (branchId && branchId !== "global") {
        query = query.eq('branch_id', branchId);
    }
    
    if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,scheduled_with_name.ilike.%${searchQuery}%`);
    }
    
    if (typeFilter !== 'all') {
        query = query.eq('type_id', typeFilter);
    }
    
    if (dateFilter !== "all") {
        const now = new Date();
        const filterDate = new Date();
        if (dateFilter === "last7days") filterDate.setDate(now.getDate() - 7);
        else if (dateFilter === "last30days") filterDate.setDate(now.getDate() - 30);
        else if (dateFilter === "last90days") filterDate.setDate(now.getDate() - 90);
        query = query.gte('scheduled_for', filterDate.toISOString());
    }
    
    const { data, error } = await query.order('scheduled_for', { ascending: true });
    if (error) throw new Error(error.message);
    return data as ScheduledAgreement[];
};

export const useScheduledAgreements = ({ searchQuery, typeFilter, dateFilter, branchId }: { searchQuery?: string; typeFilter?: string; dateFilter?: string; branchId: string; }) => {
    return useQuery<ScheduledAgreement[], Error>({
        queryKey: ['scheduled_agreements', { searchQuery, typeFilter, dateFilter, branchId }],
        queryFn: () => fetchScheduledAgreements({ searchQuery, typeFilter, dateFilter, branchId }),
    });
};

const createScheduledAgreement = async (data: Omit<ScheduledAgreement, 'id' | 'created_at' | 'updated_at' | 'agreement_types'>) => {
    const { error } = await supabase.from('scheduled_agreements').insert(data);
    if (error) throw new Error(error.message);
};

export const useCreateScheduledAgreement = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createScheduledAgreement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scheduled_agreements'] });
            toast.success("Agreement scheduled successfully");
        },
        onError: (error) => toast.error(`Failed to schedule agreement: ${error.message}`),
    });
};

const deleteScheduledAgreement = async (id: string) => {
    const { error } = await supabase.from('scheduled_agreements').delete().eq('id', id);
    if (error) throw new Error(error.message);
};

export const useDeleteScheduledAgreement = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteScheduledAgreement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scheduled_agreements'] });
            toast.success("Scheduled agreement deleted.");
        },
        onError: (error) => toast.error(`Deletion failed: ${error.message}`),
    });
};

// --- AGREEMENT TEMPLATES ---

const fetchTemplates = async ({ searchQuery = "", typeFilter = "all", branchId }: { searchQuery?: string; typeFilter?: string; branchId: string; }) => {
    let query = supabase.from('agreement_templates').select(`*, agreement_types ( name )`);
    
    if (branchId && branchId !== "global") {
        query = query.eq('branch_id', branchId);
    }
    
    if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
    }

    if (typeFilter !== 'all') {
        query = query.eq('type_id', typeFilter);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data as AgreementTemplate[];
};

export const useAgreementTemplates = ({ searchQuery, typeFilter, branchId }: { searchQuery?: string; typeFilter?: string; branchId: string; }) => {
    return useQuery<AgreementTemplate[], Error>({
        queryKey: ['agreement_templates', { searchQuery, typeFilter, branchId }],
        queryFn: () => fetchTemplates({ searchQuery, typeFilter, branchId }),
    });
};

const createTemplate = async (templateData: Omit<AgreementTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count' | 'agreement_types'>) => {
    const { error } = await supabase.from('agreement_templates').insert({ ...templateData, usage_count: 0 });
    if (error) throw new Error(error.message);
};

export const useCreateTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agreement_templates'] });
            toast.success("Template created successfully");
        },
        onError: (error) => toast.error(`Failed to create template: ${error.message}`),
    });
};

const updateTemplate = async (templateData: { id: string; title: string; content?: string | null; type_id: string; }) => {
    const { id, ...updates } = templateData;
    const { error } = await supabase.from('agreement_templates').update(updates).eq('id', id);
    if (error) throw new Error(error.message);
};

export const useUpdateTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation<void, Error, { id: string; title: string; content?: string | null; type_id: string; }>({
        mutationFn: updateTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agreement_templates'] });
            toast.success("Template updated successfully.");
        },
        onError: (error: any) => toast.error(`Update failed: ${error.message}`),
    });
};

const deleteTemplate = async (id: string) => {
    const { error } = await supabase.from('agreement_templates').delete().eq('id', id);
    if (error) throw new Error(error.message);
};

export const useDeleteTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agreement_templates'] });
            toast.success("Template deleted.");
        },
        onError: (error) => toast.error(`Deletion failed: ${error.message}`),
    });
};

const copyTemplate = async (templateId: string) => {
    // This would be a server-side function in a real app for atomicity
    const { data: template, error: fetchError } = await supabase.from('agreement_templates').select('*').eq('id', templateId).single();
    if(fetchError) throw fetchError;
    
    const { title, content, type_id, branch_id } = template;
    const { error: insertError } = await supabase.from('agreement_templates').insert({
        title: `Copy of ${title}`,
        content,
        type_id,
        branch_id,
        usage_count: 0,
    });
    if(insertError) throw insertError;
};

export const useCopyTemplate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: copyTemplate,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['agreement_templates'] });
            toast.success("Template copied successfully.");
        },
        onError: (error: any) => toast.error(`Copy failed: ${error.message}`),
    });
};
