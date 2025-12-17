import { useState } from "react";
import { Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AddAuthorityDialog } from "./AddAuthorityDialog";

export const AuthoritiesTab = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800 tracking-tight">Authorities</h2>
          <p className="text-sm text-gray-500 mt-1">Manage authority organizations and their configurations</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Authorities
        </Button>
      </div>

      {/* Empty State */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-800 text-lg mb-2">No Authorities Added</h3>
          <p className="text-sm text-gray-500 mb-4 max-w-sm">
            Get started by adding your first authority organization to manage billing and integrations.
          </p>
          <Button onClick={() => setIsDialogOpen(true)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Your First Authority
          </Button>
        </CardContent>
      </Card>

      <AddAuthorityDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
      />
    </div>
  );
};

export default AuthoritiesTab;
