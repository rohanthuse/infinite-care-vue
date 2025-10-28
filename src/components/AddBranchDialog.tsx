
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";

export function AddBranchDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [country, setCountry] = useState("England");
  const [currency, setCurrency] = useState("£");
  const [regulatory, setRegulatory] = useState("CQC");
  const [branchType, setBranchType] = useState("HomeCare");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization } = useTenant();

  const { mutate: addBranch, isPending } = useMutation({
    mutationFn: async (newBranch: {
      name: string;
      country: string;
      currency: string;
      regulatory: string;
      branch_type: string;
      status: string;
      organization_id: string;
    }) => {
      const { data, error } = await supabase
        .from('branches')
        .insert([newBranch])
        .select();

      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
        const newBranch = data?.[0];
        toast({
            title: "Branch added",
            description: `${newBranch?.name} has been added successfully`,
        });
        queryClient.invalidateQueries({ queryKey: ['branches'] });
        queryClient.invalidateQueries({ queryKey: ['organization-branches', organization?.id] });
        setOpen(false);
        setTitle("");
        setCountry("England");
        setCurrency("£");
        setRegulatory("CQC");
        setBranchType("HomeCare");
    },
    onError: (error: any) => {
        toast({
            title: "Error adding branch",
            description: error.message,
            variant: "destructive",
        });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({
        title: "Title is required",
        description: "Please enter a title for the branch",
        variant: "destructive",
      });
      return;
    }

    if (!organization?.id) {
      toast({
        title: "Organisation required",
        description: "No organisation context found",
        variant: "destructive",
      });
      return;
    }

    addBranch({ 
      name: title, 
      country, 
      currency, 
      regulatory, 
      branch_type: branchType, 
      status: "Active",
      organization_id: organization.id
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 rounded-full">
          <Plus className="mr-1.5 h-4 w-4" /> New Branch
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Branch</DialogTitle>
          <DialogDescription>
            Enter the details for the new branch
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                placeholder="E.g., Med-Infinite - London"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="country" className="text-right">
                Country
              </Label>
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
              <Label htmlFor="currency" className="text-right">
                Currency
              </Label>
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
              <Label htmlFor="regulatory" className="text-right">
                Regulatory
              </Label>
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
              <Label htmlFor="branchType" className="text-right">
                Branch Type
              </Label>
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
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isPending}>
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : 'Add Branch'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
