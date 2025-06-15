import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Branch } from "@/pages/Branch";

interface EditBranchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch | null;
}

export function EditBranchDialog({ isOpen, onClose, branch }: EditBranchDialogProps) {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("England");
  const [currency, setCurrency] = useState("£");
  const [regulatory, setRegulatory] = useState("CQC");
  const [branchType, setBranchType] = useState("HomeCare");
  const [status, setStatus] = useState("Active");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (branch) {
      setName(branch.name);
      setCountry(branch.country || "England");
      setCurrency(branch.currency || "£");
      setRegulatory(branch.regulatory || "CQC");
      setBranchType(branch.branch_type || "HomeCare");
      setStatus(branch.status || "Active");
    }
  }, [branch]);

  const { mutate: updateBranch, isPending } = useMutation({
    mutationFn: async (updatedBranch: Partial<Omit<Branch, 'id' | 'created_at' | 'created_on' | 'updated_at' | 'created_by'>>) => {
      if (!branch) return;
      const { error } = await supabase
        .from('branches')
        .update(updatedBranch)
        .eq('id', branch.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Branch updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      onClose();
    },
    onError: (error: any) => {
      toast({ title: "Failed to update branch", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    updateBranch({
      name,
      country,
      currency,
      regulatory,
      branch_type: branchType,
      status,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Branch</DialogTitle>
          <DialogDescription>
            Update the details for this branch.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">Title</Label>
              <Input
                id="title"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
              />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="country" className="text-right">Country</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="England">England</SelectItem>
                  <SelectItem value="Scotland">Scotland</SelectItem>
                  <SelectItem value="Wales">Wales</SelectItem>
                  <SelectItem value="Northern Ireland">Northern Ireland</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currency" className="text-right">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="£">£ (GBP)</SelectItem>
                  <SelectItem value="€">€ (EUR)</SelectItem>
                  <SelectItem value="$">$ (USD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="regulatory" className="text-right">Regulatory</Label>
              <Select value={regulatory} onValueChange={setRegulatory}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select regulatory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CQC">CQC</SelectItem>
                  <SelectItem value="RQIA">RQIA</SelectItem>
                  <SelectItem value="CIW">CIW</SelectItem>
                  <SelectItem value="CI">CI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="branchType" className="text-right">Branch Type</Label>
              <Select value={branchType} onValueChange={setBranchType}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select branch type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HomeCare">HomeCare</SelectItem>
                  <SelectItem value="LiveIn">LiveIn</SelectItem>
                  <SelectItem value="SupportedLiving">Supported Living</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isPending}>
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
