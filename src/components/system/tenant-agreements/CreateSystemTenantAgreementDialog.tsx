import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useSystemTenantAgreementTypes, useSystemTenantAgreementTemplates, useCreateSystemTenantAgreement } from "@/hooks/useSystemTenantAgreements";
import { useToast } from "@/hooks/use-toast";

export function CreateSystemTenantAgreementDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const createAgreement = useCreateSystemTenantAgreement();

  const handleSubmit = async () => {
    try {
      await createAgreement.mutateAsync({
        tenant_id: '',
        title: 'Test Agreement',
      } as any);
      setOpen(false);
      toast({ title: "Agreement created" });
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Agreement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Create Tenant Agreement</DialogTitle>
          <DialogDescription>
            Comprehensive agreement form - Full implementation coming soon
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4">
          <p>Form fields will be added here.</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createAgreement.isPending}>
            {createAgreement.isPending ? 'Creating...' : 'Create Agreement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
