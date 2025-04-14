
import React, { useState, useEffect } from "react";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Eye, FileText, Copy, PenLine, Trash2, Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Mock data for agreement templates
const mockTemplateAgreements = [
  {
    id: 1,
    title: "Standard Employment Contract",
    type: "Employment Agreement",
    createdAt: "12 Jan 2024",
    lastUpdated: "05 Mar 2024",
    usageCount: 15
  },
  {
    id: 2,
    title: "Non-Disclosure Agreement",
    type: "NDA",
    createdAt: "23 Feb 2024",
    lastUpdated: "23 Feb 2024",
    usageCount: 8
  },
  {
    id: 3,
    title: "Service Level Agreement",
    type: "Service Agreement",
    createdAt: "15 Mar 2024",
    lastUpdated: "02 Apr 2024",
    usageCount: 4
  },
  {
    id: 4,
    title: "Data Processing Agreement",
    type: "Data Agreement",
    createdAt: "21 Mar 2024",
    lastUpdated: "21 Mar 2024",
    usageCount: 2
  },
  {
    id: 5,
    title: "Caretaker Contract",
    type: "Employment Agreement",
    createdAt: "03 Apr 2024",
    lastUpdated: "03 Apr 2024",
    usageCount: 1
  }
];

type AgreementTemplatesProps = {
  searchQuery?: string;
  typeFilter?: string;
  branchId: string;
};

export function AgreementTemplates({ 
  searchQuery = "", 
  typeFilter = "all",
  branchId
}: AgreementTemplatesProps) {
  const [templates, setTemplates] = useState(mockTemplateAgreements);
  const [filteredTemplates, setFilteredTemplates] = useState(templates);
  
  // In a real implementation, this would fetch data based on the branch ID
  useEffect(() => {
    // Simulate API call to get templates by branch
    setTemplates(mockTemplateAgreements);
  }, [branchId]);
  
  // Apply filters whenever they change
  useEffect(() => {
    let filtered = templates;
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        template => 
          template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply type filter
    if (typeFilter && typeFilter !== "all") {
      filtered = filtered.filter(template => template.type === typeFilter);
    }
    
    setFilteredTemplates(filtered);
  }, [searchQuery, typeFilter, templates]);
  
  const handleView = (id: number) => {
    // In a full implementation, this would open a dialog to view the template
    console.log(`View template ${id}`);
  };
  
  const handleEdit = (id: number) => {
    // In a full implementation, this would open a dialog to edit the template
    console.log(`Edit template ${id}`);
  };
  
  const handleCopy = (id: number) => {
    const template = templates.find(t => t.id === id);
    if (!template) return;
    
    // In a full implementation, this would create a copy of the template with a new ID
    const newId = Math.max(...templates.map(t => t.id)) + 1;
    const copy = {
      ...template,
      id: newId,
      title: `Copy of ${template.title}`,
      createdAt: new Date().toLocaleDateString('en-US', {day: '2-digit', month: 'short', year: 'numeric'}),
      lastUpdated: new Date().toLocaleDateString('en-US', {day: '2-digit', month: 'short', year: 'numeric'}),
      usageCount: 0
    };
    
    setTemplates([...templates, copy]);
    toast.success(`Created copy of "${template.title}"`);
  };
  
  const handleDelete = (id: number) => {
    // In a real application, this would make an API call
    setTemplates(templates.filter(t => t.id !== id));
    toast.success("Template deleted successfully");
  };

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/50">
            <TableHead className="w-[5%]">#</TableHead>
            <TableHead className="w-[30%]">Template Name</TableHead>
            <TableHead className="w-[15%]">Type</TableHead>
            <TableHead className="w-[15%]">Created</TableHead>
            <TableHead className="w-[15%]">Last Updated</TableHead>
            <TableHead className="w-[10%]">Usage</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((template) => (
              <TableRow key={template.id} className="border-b border-gray-100 hover:bg-gray-50/40">
                <TableCell className="font-medium">{template.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-gray-800">{template.title}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{template.type}</span>
                  </div>
                </TableCell>
                <TableCell>{template.createdAt}</TableCell>
                <TableCell>{template.lastUpdated}</TableCell>
                <TableCell>
                  <span className="text-gray-600">{template.usageCount} times</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button 
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleView(template.id)}
                    >
                      <Eye className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button 
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleEdit(template.id)}
                    >
                      <PenLine className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button 
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleCopy(template.id)}
                    >
                      <Copy className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button 
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-4 w-4 text-gray-600 hover:text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center gap-1 py-4 text-gray-500">
                  <FileText className="h-10 w-10 text-gray-300" />
                  <p className="text-sm">No templates found</p>
                  {searchQuery && (
                    <p className="text-xs text-gray-400">Try a different search term</p>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
