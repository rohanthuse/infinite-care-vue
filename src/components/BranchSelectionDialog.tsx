import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, ChevronRight, Settings } from "lucide-react";

interface AdminBranch {
  branch_id: string;
  branch_name: string;
}

interface BranchSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  adminName: string;
  branches: AdminBranch[];
  onBranchSelect: (branchId: string, branchName: string) => void;
}

export function BranchSelectionDialog({ 
  isOpen, 
  onClose, 
  adminName, 
  branches, 
  onBranchSelect 
}: BranchSelectionDialogProps) {
  
  const handleBranchClick = (branchId: string, branchName: string) => {
    onBranchSelect(branchId, branchName);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-xl">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl flex items-center font-semibold text-gray-800">
            <Settings className="h-5 w-5 mr-2 text-blue-600" />
            Select Branch
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-gray-900">{adminName}</span> has access to multiple branches. 
            Please select which branch's permissions you want to edit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {branches.map((branch) => (
            <Button
              key={branch.branch_id}
              variant="outline"
              className="w-full h-auto p-4 justify-between hover:bg-blue-50 hover:border-blue-200 transition-colors"
              onClick={() => handleBranchClick(branch.branch_id, branch.branch_name)}
            >
              <div className="flex items-center">
                <Building2 className="h-5 w-5 mr-3 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">{branch.branch_name}</div>
                  <div className="text-sm text-gray-500">Branch ID: {branch.branch_id.slice(0, 8)}...</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </Button>
          ))}
        </div>

        <div className="pt-4 border-t">
          <div className="text-sm text-gray-600 mb-3">
            <Badge variant="outline" className="mr-2">
              {branches.length} branches
            </Badge>
            Each branch can have different permission settings
          </div>
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}