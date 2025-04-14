
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus, FileText } from "lucide-react";

interface ExpensesTabProps {
  branchId?: string;
  branchName?: string;
}

const ExpensesTab: React.FC<ExpensesTabProps> = ({ branchId, branchName }) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Expenses Management</h2>
          <p className="text-gray-500 mt-1">Log and manage branch expenses</p>
        </div>
        
        <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4" />
          <span>Add Expense</span>
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-3 items-stretch">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search expenses..."
            className="pl-10 pr-4"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="icon" className="h-10 w-10 bg-white">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Placeholder for expenses content */}
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <FileText className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">Expenses Management</h3>
        <p className="text-gray-500">This module will allow logging and tracking expenses for {branchName}.</p>
        <Button 
          variant="default" 
          className="mt-4 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add First Expense
        </Button>
      </div>
    </div>
  );
};

export default ExpensesTab;
