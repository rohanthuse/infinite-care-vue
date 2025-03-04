
import { ArrowUpDown, MoreHorizontal, Plus, FileText, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CustomButton } from "@/components/ui/CustomButton";

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
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <FileText className="mr-3 h-5 w-5 text-med-500" /> Branch Admins
        </h2>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search admins..." 
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-med-200 focus:border-med-300"
            />
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="font-medium border-gray-200 hover:bg-gray-50 hover:text-med-600"
          >
            Show Inactive Admins
          </Button>
          <CustomButton 
            size="sm" 
            className="flex items-center bg-med-500 hover:bg-med-600 text-white font-medium shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1" /> New
          </CustomButton>
        </div>
      </div>
      
      <div className="border rounded-xl overflow-hidden shadow-soft bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              <th className="text-left p-4 font-semibold">
                <Button variant="ghost" size="sm" className="font-semibold flex items-center -ml-3 hover:bg-gray-100">
                  Full Name
                  <ArrowUpDown className="ml-1 h-4 w-4 text-gray-500" />
                </Button>
              </th>
              <th className="text-left p-4 font-semibold">
                <Button variant="ghost" size="sm" className="font-semibold flex items-center -ml-3 hover:bg-gray-100">
                  Email
                  <ArrowUpDown className="ml-1 h-4 w-4 text-gray-500" />
                </Button>
              </th>
              <th className="text-left p-4 font-semibold">
                <Button variant="ghost" size="sm" className="font-semibold flex items-center -ml-3 hover:bg-gray-100">
                  Number
                  <ArrowUpDown className="ml-1 h-4 w-4 text-gray-500" />
                </Button>
              </th>
              <th className="text-left p-4 font-semibold">
                <Button variant="ghost" size="sm" className="font-semibold flex items-center -ml-3 hover:bg-gray-100">
                  Branches
                  <ArrowUpDown className="ml-1 h-4 w-4 text-gray-500" />
                </Button>
              </th>
              <th className="text-left p-4 font-semibold">
                <Button variant="ghost" size="sm" className="font-semibold flex items-center -ml-3 hover:bg-gray-100">
                  Status
                  <ArrowUpDown className="ml-1 h-4 w-4 text-gray-500" />
                </Button>
              </th>
              <th className="text-center p-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockData.map((admin) => (
              <tr 
                key={admin.id} 
                className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="p-4 font-medium text-gray-800">{admin.name}</td>
                <td className="p-4 text-gray-700">{admin.email}</td>
                <td className="p-4 text-gray-700">{admin.phone}</td>
                <td className="p-4 text-gray-700">{admin.branch}</td>
                <td className="p-4">
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800 font-medium border-0">
                    {admin.status}
                  </Badge>
                </td>
                <td className="p-4 text-center">
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                    <MoreHorizontal className="h-4 w-4 text-gray-600" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="border-t border-gray-100 p-4 flex items-center justify-between text-sm bg-gray-50 rounded-b-xl">
          <div className="text-gray-600 font-medium">Showing 1 to 3 of 3 entries</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled className="font-medium border-gray-200">Previous</Button>
            <Button variant="outline" size="sm" className="bg-med-50 border-med-200 text-med-700 font-medium">1</Button>
            <Button variant="outline" size="sm" disabled className="font-medium border-gray-200">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
