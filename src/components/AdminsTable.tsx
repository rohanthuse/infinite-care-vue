
import { ArrowUpDown, MoreHorizontal, Plus, FileText, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CustomButton } from "@/components/ui/CustomButton";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

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
    branch: "Brielle Health Care Services- Milton Keynes",
    status: "Active",
  },
  {
    id: "2",
    name: "Iyaniwura, Ifeoluwa",
    email: "ifeoluwa@briellehealthcareservices.com",
    phone: "+44 0744709757",
    branch: "Brielle Health Care Services- Milton Keynes",
    status: "Active",
  },
  {
    id: "3",
    name: "Abiri-Maitland, Aramide",
    email: "mide@briellehealthcareservices.com",
    phone: "+44 0772494267",
    branch: "Brielle Health Care Services- Milton Keynes",
    status: "Active",
  },
];

export function AdminsTable() {
  const [searchQuery, setSearchQuery] = useState("");
  
  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 p-8">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <FileText className="mr-3 h-5 w-5 text-med-500" /> Branch Admins
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search admins..." 
              className="pl-10 pr-4 py-2 border border-gray-200/80 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-med-200 focus:border-med-300 h-10 bg-white/90"
            />
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="font-medium border-gray-200/80 hover:bg-gray-50/80 hover:text-med-600 rounded-full"
          >
            Show Inactive Admins
          </Button>
          <CustomButton 
            size="sm"
            variant="pill"
            className="flex items-center bg-gradient-to-r from-med-500 to-med-600 text-white font-medium shadow-sm hover:shadow-md"
          >
            <Plus className="h-4 w-4 mr-1" /> New Admin
          </CustomButton>
        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="px-8 pb-8"
      >
        <div className="overflow-hidden rounded-2xl shadow-soft border border-gray-100/60 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 text-gray-700">
                <tr>
                  <th className="text-left p-4 font-semibold">
                    <Button variant="ghost" size="sm" className="font-semibold flex items-center -ml-3 hover:bg-gray-100/80 rounded-full">
                      Full Name
                      <ArrowUpDown className="ml-1 h-4 w-4 text-gray-500" />
                    </Button>
                  </th>
                  <th className="text-left p-4 font-semibold">
                    <Button variant="ghost" size="sm" className="font-semibold flex items-center -ml-3 hover:bg-gray-100/80 rounded-full">
                      Email
                      <ArrowUpDown className="ml-1 h-4 w-4 text-gray-500" />
                    </Button>
                  </th>
                  <th className="text-left p-4 font-semibold">
                    <Button variant="ghost" size="sm" className="font-semibold flex items-center -ml-3 hover:bg-gray-100/80 rounded-full">
                      Number
                      <ArrowUpDown className="ml-1 h-4 w-4 text-gray-500" />
                    </Button>
                  </th>
                  <th className="text-left p-4 font-semibold">
                    <Button variant="ghost" size="sm" className="font-semibold flex items-center -ml-3 hover:bg-gray-100/80 rounded-full">
                      Branches
                      <ArrowUpDown className="ml-1 h-4 w-4 text-gray-500" />
                    </Button>
                  </th>
                  <th className="text-left p-4 font-semibold">
                    <Button variant="ghost" size="sm" className="font-semibold flex items-center -ml-3 hover:bg-gray-100/80 rounded-full">
                      Status
                      <ArrowUpDown className="ml-1 h-4 w-4 text-gray-500" />
                    </Button>
                  </th>
                  <th className="text-center p-4 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mockData.map((admin, index) => (
                  <motion.tr 
                    key={admin.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="border-t border-gray-100/60 hover:bg-gray-50/30 transition-colors"
                  >
                    <td className="p-4 font-medium text-gray-800">{admin.name}</td>
                    <td className="p-4 text-gray-700">{admin.email}</td>
                    <td className="p-4 text-gray-700">{admin.phone}</td>
                    <td className="p-4 text-gray-700">{admin.branch}</td>
                    <td className="p-4">
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800 font-medium border-0 rounded-full px-3">
                        {admin.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-center">
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100/80">
                        <MoreHorizontal className="h-4 w-4 text-gray-600" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="border-t border-gray-100/60 p-4 flex items-center justify-between text-sm bg-gray-50/50 rounded-b-xl">
            <div className="text-gray-600 font-medium">Showing 1 to 3 of 3 entries</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled className="font-medium border-gray-200/80 rounded-full">
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button variant="outline" size="sm" className="bg-med-50/80 border-med-200/80 text-med-700 font-medium rounded-full">1</Button>
              <Button variant="outline" size="sm" disabled className="font-medium border-gray-200/80 rounded-full">
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
