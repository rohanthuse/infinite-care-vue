
import { ArrowUpDown, MoreHorizontal, Plus, FileText } from "lucide-react";
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medium flex items-center">
          <FileText className="mr-2 h-5 w-5" /> Branch Admins
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Show Inactive Admins
          </Button>
          <CustomButton size="sm" className="flex items-center bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-1" /> New
          </CustomButton>
        </div>
      </div>
      
      <div className="border rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left p-4 font-medium">
                <div className="flex items-center">
                  Full Name
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                </div>
              </th>
              <th className="text-left p-4 font-medium">
                <div className="flex items-center">
                  Email
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                </div>
              </th>
              <th className="text-left p-4 font-medium">
                <div className="flex items-center">
                  Number
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                </div>
              </th>
              <th className="text-left p-4 font-medium">
                <div className="flex items-center">
                  Branches
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                </div>
              </th>
              <th className="text-left p-4 font-medium">
                <div className="flex items-center">
                  Status
                  <ArrowUpDown className="ml-1 h-4 w-4" />
                </div>
              </th>
              <th className="text-center p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockData.map((admin) => (
              <tr key={admin.id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="p-4">{admin.name}</td>
                <td className="p-4">{admin.email}</td>
                <td className="p-4">{admin.phone}</td>
                <td className="p-4">{admin.branch}</td>
                <td className="p-4">
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 hover:text-green-800">
                    {admin.status}
                  </Badge>
                </td>
                <td className="p-4 text-center">
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="border-t border-gray-200 p-4 flex items-center justify-between text-sm">
          <div>Showing 1 to 3 of 3 entries</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" className="bg-blue-50">1</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
