
import React from "react";
import { Search, Filter, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock clients data
const mockClients = [
  {
    id: "CL-001",
    name: "Emma Thompson",
    address: "15 Oak Street, Milton Keynes",
    age: 75,
    status: "Active",
    careNeeds: ["Medication Management", "Personal Care", "Mobility Assistance"]
  },
  {
    id: "CL-002",
    name: "James Wilson",
    address: "42 Pine Avenue, Milton Keynes",
    age: 68,
    status: "Active",
    careNeeds: ["Medication Management", "Meal Preparation"]
  },
  {
    id: "CL-003",
    name: "Margaret Brown",
    address: "8 Cedar Lane, Milton Keynes",
    age: 82,
    status: "Active",
    careNeeds: ["Personal Care", "Mobility Assistance", "Companionship"]
  },
  {
    id: "CL-004",
    name: "Robert Johnson",
    address: "23 Maple Drive, Milton Keynes",
    age: 71,
    status: "Active",
    careNeeds: ["Medication Management", "Wound Care"]
  },
  {
    id: "CL-005",
    name: "Elizabeth Davis",
    address: "17 Birch Road, Milton Keynes",
    age: 79,
    status: "Active",
    careNeeds: ["Personal Care", "Meal Preparation", "Companionship"]
  }
];

const CarerClients: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Clients</h1>
      
      <div className="flex items-center justify-between mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input placeholder="Search clients..." className="pl-9" />
        </div>
        
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          <span>Filter</span>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockClients.map((client) => (
          <Card key={client.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-base">{client.name}</CardTitle>
                  <p className="text-xs text-gray-500">{client.id}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Address</h4>
                  <p className="text-sm">{client.address}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Age</h4>
                  <p className="text-sm">{client.age} years</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Care Needs</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {client.careNeeds.map((need, i) => (
                      <div key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                        {need}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="w-full">View Care Plan</Button>
                <Button size="sm" variant="outline" className="w-full">Client Details</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CarerClients;
