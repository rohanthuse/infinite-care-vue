import React, { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { ParameterTable, ParameterItem } from "@/components/ParameterTable";
import { Brain, Loader2, Library } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { AddSkillDialog } from "@/components/AddSkillDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EditSkillDialog } from "@/components/EditSkillDialog";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import { AdoptSystemTemplatesDialog } from "@/components/system-templates/AdoptSystemTemplatesDialog";
import { useAvailableSystemSkills, useAdoptedTemplates, useAdoptSystemSkills } from "@/hooks/useAdoptSystemTemplates";
import { CustomButton } from "@/components/ui/CustomButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQuery } from "@tanstack/react-query";

const Skills = () => {
  const [editingSkill, setEditingSkill] = useState<any>(null);
  const [deletingSkill, setDeletingSkill] = useState<any>(null);
  const [showAdoptDialog, setShowAdoptDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization } = useTenant();
  
  const { data: systemSkills = [], isLoading: isLoadingSystem } = useAvailableSystemSkills();
  const { data: adoptedIds = [] } = useAdoptedTemplates('skills');
  const { mutate: adoptSkills, isPending: isAdopting } = useAdoptSystemSkills();

  const { data: skills, isLoading, error } = useQuery({
    queryKey: ['skills', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .eq('organization_id', organization.id)
        .order('name', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  const { mutate: deleteSkill, isPending: isDeleting } = useMutation({
    mutationFn: async (skillId: string) => {
      const { error } = await supabase.from('skills').delete().eq('id', skillId);
      if (error) throw error;
    },
    onSuccess: () => {
      // Close confirmation first
      setDeletingSkill(null);

      toast({ title: "Skill deleted successfully" });

      // Clean up document body to prevent UI freeze
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-scroll-locked');

      // Delay invalidation to avoid focus/aria-hidden race conditions
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['skills', organization?.id] });
      }, 300);
    },
    onError: (error: any) => {
      // Ensure dialog closes on error as well
      setDeletingSkill(null);
      
      // Clean up document body on error too
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-scroll-locked');
      
      toast({ title: "Failed to delete skill", description: error.message, variant: "destructive" });
    }
  });

  const columns = [
    {
      header: "Skill Name",
      accessorKey: "name",
      enableSorting: true,
      className: "font-medium text-gray-800 w-[40%]",
    },
    {
      header: "Skill Explanation",
      accessorKey: "explanation",
      enableSorting: false,
      className: "text-gray-700 w-[40%]",
    },
    {
      header: "Status",
      accessorKey: "status",
      enableSorting: true,
      className: "w-[20%]",
      cell: ({ row }: { row: { original: ParameterItem } }) => (
        <Badge className={`${row.original.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} font-medium border-0 rounded-full px-3`}>
          {row.original.status}
        </Badge>
      ),
    },
  ];
  
  const handleEdit = (skill: any) => {
    setEditingSkill(skill);
  };

  const handleDelete = (skill: any) => {
    setDeletingSkill(skill);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <DashboardHeader />
        <DashboardNavbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
        <DashboardHeader />
        <DashboardNavbar />
        <div className="flex-1 flex items-center justify-center text-red-500">
          Error fetching skills: {error.message}
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-white">
      <DashboardHeader />
      <DashboardNavbar />
      
      <motion.main 
        className="flex-1 px-4 md:px-8 py-6 md:py-8 w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <ParameterTable 
          title="Skills"
          icon={<Brain className="h-7 w-7 text-blue-600" />}
          columns={columns}
          data={skills || []}
          onSearch={() => {}}
          searchPlaceholder="Search skills..."
          addButton={
            <div className="flex gap-2">
              <CustomButton 
                variant="outline" 
                className="border-border hover:bg-accent"
                onClick={() => setShowAdoptDialog(true)}
              >
                <Library className="mr-1.5 h-4 w-4" /> Import from System
              </CustomButton>
              <AddSkillDialog />
            </div>
          }
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        <AdoptSystemTemplatesDialog
          isOpen={showAdoptDialog}
          onClose={() => setShowAdoptDialog(false)}
          title="Import System Skills"
          description="Select skills from the system library to add to your organization."
          templates={systemSkills.map(s => ({ id: s.id, name: s.name, explanation: s.explanation, status: s.status }))}
          adoptedIds={adoptedIds}
          isLoading={isLoadingSystem}
          isAdopting={isAdopting}
          onAdopt={(selected) => {
            adoptSkills(selected as any);
            setShowAdoptDialog(false);
          }}
          displayField="name"
        />
      </motion.main>

      {editingSkill && (
        <EditSkillDialog
          isOpen={!!editingSkill}
          onClose={() => setEditingSkill(null)}
          skill={editingSkill}
        />
      )}

      {deletingSkill && (
        <AlertDialog open={!!deletingSkill} onOpenChange={(open) => { if (!open) setDeletingSkill(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this skill?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the skill titled "{deletingSkill.name}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteSkill(deletingSkill.id)} disabled={isDeleting}>
                {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default Skills;
