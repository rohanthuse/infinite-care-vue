import { ArrowUpDown, MoreHorizontal, Search, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { AddAdminForm } from "@/components/AddAdminForm";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface AdminData {
  id: string;
  name: string;
  email: string;
  phone: string;
  branch: string;
  status: "Active" | "Inactive";
}

const mockData: AdminData[] = [
  {
    id: "1",
    name: "Ayo-Famure, Opeyemi",
    email: "admin@briellehealthcareservices.com",
    phone: "+44 7846427297",
    branch: "Med-Infinite - Milton Keynes",
    status: "Active",
  },
  {
    id: "2",
    name: "Iyaniwura, Ifeoluwa",
    email: "ifeoluwa@briellehealthcareservices.com",
    phone: "+44 0744709757",
    branch: "Med-Infinite - Milton Keynes",
    status: "Active",
  },
  {
    id: "3",
    name: "Abiri-Maitland, Aramide",
    email: "mide@briellehealthcareservices.com",
    phone: "+44 0772494267",
    branch: "Med-Infinite - Milton Keynes",
    status: "Active",
  },
];

export function AdminsTable() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [filteredData, setFilteredData] = useState(mockData);
  const [showInactive, setShowInactive] = useState(false);
  
  useEffect(() => {
    if (!searchQuery.trim() && !showInactive) {
      setFilteredData(mockData);
    } else {
      const filtered = mockData.filter(item => {
        const matchesSearch = !searchQuery.trim() || 
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.branch.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = !showInactive || item.status === "Inactive";
        
        return matchesSearch && (showInactive ? matchesStatus : true);
      });
      setFilteredData(filtered);
    }
  }, [searchQuery, showInactive]);
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
  };
  
  const toggleInactiveAdmins = () => {
    setShowInactive(!showInactive);
  };
  
  return (
    <div className="w-full p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          Branch Admins
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input 
              type="text" 
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search admins..." 
              className="pl-10 pr-4 py-2 border border-gray-200/80 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 h-10 bg-white/90 w-full sm:w-[280px]"
            />
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className={`font-medium border-gray-200/80 hover:bg-gray-50/80 rounded-full px-6 ${showInactive ? 'text-blue-600' : ''}`}
            onClick={toggleInactiveAdmins}
          >
            {showInactive ? "Hide Inactive Admins" : "Show Inactive Admins"}
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full px-6"
            onClick={() => setShowAddAdminModal(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" /> New Admin
          </Button>
        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100/60 overflow-hidden"
      >
        <div className="overflow-x-auto p-1">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 text-gray-700">
              <tr>
                <th className="text-left p-4 font-semibold">
                  <Button variant="ghost" size="sm" className="font-semibold flex items-center -ml-3 hover:bg-gray-100/80">
                    Full Name
                    <ArrowUpDown className="ml-1 h-4 w-4 text-gray-500" />
                  </Button>
                </th>
                <th className="text-left p-4 font-semibold hidden md:table-cell">
                  <Button variant="ghost" size="sm" className="font-semibold flex items-center -ml-3 hover:bg-gray-100/80">
                    Email
                    <ArrowUpDown className="ml-1 h-4 w-4 text-gray-500" />
                  </Button>
                </th>
                <th className="text-left p-4 font-semibold hidden md:table-cell">
                  <Button variant="ghost" size="sm" className="font-semibold flex items-center -ml-3 hover:bg-gray-100/80">
                    Number
                    <ArrowUpDown className="ml-1 h-4 w-4 text-gray-500" />
                  </Button>
                </th>
                <th className="text-left p-4 font-semibold hidden lg:table-cell">
                  <Button variant="ghost" size="sm" className="font-semibold flex items-center -ml-3 hover:bg-gray-100/80">
                    Branches
                    <ArrowUpDown className="ml-1 h-4 w-4 text-gray-500" />
                  </Button>
                </th>
                <th className="text-left p-4 font-semibold">
                  <Button variant="ghost" size="sm" className="font-semibold flex items-center -ml-3 hover:bg-gray-100/80">
                    Status
                    <ArrowUpDown className="ml-1 h-4 w-4 text-gray-500" />
                  </Button>
                </th>
                <th className="text-center p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((admin, index) => (
                <motion.tr 
                  key={admin.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="border-t border-gray-100/60 hover:bg-gray-50/30 transition-colors"
                >
                  <td className="p-4 font-medium text-gray-800">{admin.name}</td>
                  <td className="p-4 text-gray-700 hidden md:table-cell">{admin.email}</td>
                  <td className="p-4 text-gray-700 hidden md:table-cell">{admin.phone}</td>
                  <td className="p-4 text-gray-700 hidden lg:table-cell">{admin.branch}</td>
                  <td className="p-4">
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800 font-medium border-0 rounded-full px-3">
                      {admin.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100/80">
                          <MoreHorizontal className="h-4 w-4 text-gray-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Deactivate</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="border-t border-gray-100/60 px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-gray-50/50">
          <div className="text-gray-600 font-medium text-sm">Showing 1 to {filteredData.length} of {filteredData.length} entries</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled className="font-medium border-gray-200/80 rounded-full">
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button variant="outline" size="sm" className="bg-blue-50/80 border-blue-200/80 text-blue-700 font-medium rounded-full">1</Button>
            <Button variant="outline" size="sm" disabled className="font-medium border-gray-200/80 rounded-full">
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </motion.div>

      <AddAdminForm 
        isOpen={showAddAdminModal} 
        onClose={() => setShowAddAdminModal(false)} 
      />
    </div>
  );
}
