import React, { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { ParameterTable, ParameterItem } from "@/components/ParameterTable";
import { Stethoscope, Plus, Loader2, Library } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddMedicalConditionDialog } from "@/components/AddMedicalConditionDialog";
import { EditMedicalCategoryDialog } from "@/components/EditMedicalCategoryDialog";
import { EditMedicalConditionDialog } from "@/components/EditMedicalConditionDialog";
import { CustomButton } from "@/components/ui/CustomButton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";
import { AdoptSystemTemplatesDialog } from "@/components/system-templates/AdoptSystemTemplatesDialog";
import { 
  useAvailableSystemMedicalCategories, 
  useAvailableSystemMedicalConditions,
  useAdoptedMedicalCategories,
  useAdoptedMedicalConditions,
  useAdoptSystemMedicalCategories,
  useAdoptSystemMedicalConditions
} from "@/hooks/useAdoptSystemTemplates";
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

const fetchConditions = async (organizationId?: string) => {
    if (!organizationId) return [];
    
    const { data, error } = await supabase
        .from('medical_conditions')
        .select(`
            id,
            title,
            field_caption,
            status,
            category_id,
            medical_categories ( name )
        `)
        .eq('organization_id', organizationId)
        .order('title', { ascending: true });

    if (error) throw error;
    
    return data.map(item => ({
        ...item,
        category: (item.medical_categories as any)?.name || 'N/A'
    }));
};

const fetchCategories = async (organizationId?: string) => {
    if (!organizationId) return [];
    
    const { data, error } = await supabase
        .from('medical_categories')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true });
    if (error) throw error;
    return data;
};

const MedicalMental = () => {
  const { organization } = useTenant();
  const [activeTab, setActiveTab] = useState("conditions");
  const [showConditionDialog, setShowConditionDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCondition, setEditingCondition] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [deletingCondition, setDeletingCondition] = useState<any>(null);
  const [deletingCategory, setDeletingCategory] = useState<any>(null);
  const [showAdoptConditionsDialog, setShowAdoptConditionsDialog] = useState(false);
  const [showAdoptCategoriesDialog, setShowAdoptCategoriesDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // System templates hooks
  const { data: systemCategories = [], isLoading: isLoadingSystemCategories } = useAvailableSystemMedicalCategories();
  const { data: systemConditions = [], isLoading: isLoadingSystemConditions } = useAvailableSystemMedicalConditions();
  const { data: adoptedCategoryIds = [] } = useAdoptedMedicalCategories();
  const { data: adoptedConditionIds = [] } = useAdoptedMedicalConditions();
  const { mutate: adoptCategories, isPending: isAdoptingCategories } = useAdoptSystemMedicalCategories();
  const { mutate: adoptConditions, isPending: isAdoptingConditions } = useAdoptSystemMedicalConditions();

  const { data: conditions, isLoading: isLoadingConditions, error: errorConditions } = useQuery({
    queryKey: ['medical_conditions', organization?.id],
    queryFn: () => fetchConditions(organization?.id),
    enabled: !!organization?.id,
  });

  const { data: categories, isLoading: isLoadingCategories, error: errorCategories } = useQuery({
    queryKey: ['medical_categories', organization?.id],
    queryFn: () => fetchCategories(organization?.id),
    enabled: !!organization?.id,
  });

  const { mutate: deleteCondition, isPending: isDeletingCondition } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('medical_conditions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      // Close confirmation first
      setDeletingCondition(null);

      toast({ title: "Condition deleted successfully" });

      // Clean up document body to prevent UI freeze
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-scroll-locked');

      // Delay invalidation to avoid focus/aria-hidden race conditions
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['medical_conditions', organization?.id] });
      }, 300);
    },
    onError: (error: any) => {
      // Ensure dialog closes on error as well
      setDeletingCondition(null);
      
      // Clean up document body on error too
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-scroll-locked');
      
      toast({ title: "Failed to delete condition", description: error.message, variant: "destructive" });
    }
  });

  const { mutate: deleteCategory, isPending: isDeletingCategory } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('medical_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      // Close confirmation first
      setDeletingCategory(null);

      toast({ title: "Category deleted successfully" });

      // Clean up document body to prevent UI freeze
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-scroll-locked');

      // Delay invalidations to avoid race conditions
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['medical_categories', organization?.id] });
        queryClient.invalidateQueries({ queryKey: ['medical_conditions', organization?.id] });
      }, 300);
    },
    onError: (error: any) => {
      // Ensure dialog closes on error as well
      setDeletingCategory(null);
      
      // Clean up document body on error too
      document.body.style.pointerEvents = '';
      document.body.removeAttribute('data-scroll-locked');
      
      toast({ title: "Failed to delete category", description: "Make sure no conditions are using this category. " + error.message, variant: "destructive" });
    }
  });

  const handleEditCondition = (condition: any) => setEditingCondition(condition);
  const handleDeleteCondition = (condition: any) => setDeletingCondition(condition);
  const handleEditCategory = (category: any) => setEditingCategory(category);
  const handleDeleteCategory = (category: any) => setDeletingCategory(category);
  
  const conditionsColumns = [
    {
      header: "Title",
      accessorKey: "title",
      enableSorting: true,
      className: "font-medium text-gray-800 w-[25%]",
    },
    {
      header: "Category",
      accessorKey: "category",
      enableSorting: true,
      className: "text-gray-700 w-[35%]",
    },
    {
      header: "Field Caption",
      accessorKey: "field_caption",
      enableSorting: true,
      className: "text-gray-700 w-[25%]",
    },
    {
      header: "Status",
      accessorKey: "status",
      enableSorting: true,
      className: "w-[15%]",
      cell: ({ row }: { row: { original: ParameterItem } }) => (
        <Badge className={`${row.original.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} hover:bg-green-100 hover:text-green-800 font-medium border-0 rounded-full px-3`}>
          {row.original.status}
        </Badge>
      ),
    },
  ];
  
  const categoryColumns = [
    {
      header: "Category Name",
      accessorKey: "name",
      enableSorting: true,
      className: "font-medium text-gray-800 w-[85%]",
    },
    {
      header: "Status",
      accessorKey: "status",
      enableSorting: true,
      className: "w-[15%]",
      cell: ({ row }: { row: { original: ParameterItem } }) => (
        <Badge className={`${row.original.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} hover:bg-green-100 hover:text-green-800 font-medium border-0 rounded-full px-3`}>
          {row.original.status}
        </Badge>
      ),
    },
  ];
  
  const isLoading = isLoadingConditions || isLoadingCategories;
  const error = errorConditions || errorCategories;

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
          Error fetching data: {(error as any).message}
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
        <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <Stethoscope className="h-7 w-7 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">Medical & Mental</h1>
                <p className="text-gray-500 text-sm md:text-base">Manage health parameters</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <CustomButton 
                variant="outline" 
                className="border-border hover:bg-accent"
                onClick={() => activeTab === "conditions" ? setShowAdoptConditionsDialog(true) : setShowAdoptCategoriesDialog(true)}
              >
                <Library className="mr-1.5 h-4 w-4" /> Import from System
              </CustomButton>
              <CustomButton 
                variant="pill" 
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
                onClick={() => activeTab === "conditions" ? setShowConditionDialog(true) : setShowCategoryDialog(true)}
              >
                <Plus className="mr-1.5 h-4 w-4" /> New {activeTab === "conditions" ? "Condition" : "Category"}
              </CustomButton>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden mb-8">
          <Tabs defaultValue="conditions" onValueChange={setActiveTab}>
            <div className="border-b border-gray-100">
              <TabsList className="bg-gray-50/80 w-full justify-start pl-4 h-14 space-x-2">
                <TabsTrigger 
                  value="conditions" 
                  className={`rounded-full px-4 py-2 text-sm font-medium data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700`}
                >
                  Conditions
                </TabsTrigger>
                <TabsTrigger 
                  value="category" 
                  className={`rounded-full px-4 py-2 text-sm font-medium data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700`}
                >
                  Category
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="conditions" className="mt-0">
              <ParameterTable 
                title="Conditions"
                icon={<Stethoscope className="h-7 w-7 text-blue-600" />}
                columns={conditionsColumns}
                data={conditions || []}
                searchPlaceholder="Search conditions..."
                onEdit={handleEditCondition}
                onDelete={handleDeleteCondition}
                addButton={<></>}
              />
            </TabsContent>
            
            <TabsContent value="category" className="mt-0">
              <ParameterTable 
                title="Categories"
                icon={<Stethoscope className="h-7 w-7 text-blue-600" />}
                columns={categoryColumns}
                data={categories || []}
                searchPlaceholder="Search categories..."
                onEdit={handleEditCategory}
                onDelete={handleDeleteCategory}
                addButton={<></>}
              />
            </TabsContent>
          </Tabs>
        </div>

        <AddMedicalConditionDialog 
          isOpen={showConditionDialog} 
          onClose={() => setShowConditionDialog(false)}
          categories={categories || []}
          isCategory={false}
        />

        <AddMedicalConditionDialog 
          isOpen={showCategoryDialog} 
          onClose={() => setShowCategoryDialog(false)}
          categories={[]}
          isCategory={true}
        />

        {editingCondition && (
          <EditMedicalConditionDialog 
            isOpen={!!editingCondition}
            onClose={() => setEditingCondition(null)}
            condition={editingCondition}
          />
        )}
        
        {editingCategory && (
          <EditMedicalCategoryDialog
            isOpen={!!editingCategory}
            onClose={() => setEditingCategory(null)}
            category={editingCategory}
          />
        )}

        {deletingCondition && (
          <AlertDialog open={!!deletingCondition} onOpenChange={(open) => { if (!open) setDeletingCondition(null); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this condition?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the condition titled "{deletingCondition.title}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletingCondition}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteCondition(deletingCondition.id)} disabled={isDeletingCondition}>
                  {isDeletingCondition ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        
        {deletingCategory && (
          <AlertDialog open={!!deletingCategory} onOpenChange={(open) => { if (!open) setDeletingCategory(null); }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to delete this category?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the category titled "{deletingCategory.name}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeletingCategory}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteCategory(deletingCategory.id)} disabled={isDeletingCategory}>
                  {isDeletingCategory ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <AdoptSystemTemplatesDialog
          isOpen={showAdoptConditionsDialog}
          onClose={() => setShowAdoptConditionsDialog(false)}
          title="Import System Medical Conditions"
          description="Select medical conditions from the system library to add to your organization."
          templates={systemConditions.map(c => ({ id: c.id, title: c.title, field_caption: c.field_caption, status: c.status }))}
          adoptedIds={adoptedConditionIds}
          isLoading={isLoadingSystemConditions}
          isAdopting={isAdoptingConditions}
          onAdopt={(selected) => {
            adoptConditions(selected as any);
            setShowAdoptConditionsDialog(false);
          }}
          displayField="title"
        />

        <AdoptSystemTemplatesDialog
          isOpen={showAdoptCategoriesDialog}
          onClose={() => setShowAdoptCategoriesDialog(false)}
          title="Import System Medical Categories"
          description="Select medical categories from the system library to add to your organization."
          templates={systemCategories.map(c => ({ id: c.id, name: c.name, status: c.status }))}
          adoptedIds={adoptedCategoryIds}
          isLoading={isLoadingSystemCategories}
          isAdopting={isAdoptingCategories}
          onAdopt={(selected) => {
            adoptCategories(selected as any);
            setShowAdoptCategoriesDialog(false);
          }}
          displayField="name"
        />

      </motion.main>
    </div>
  );
};

export default MedicalMental;
