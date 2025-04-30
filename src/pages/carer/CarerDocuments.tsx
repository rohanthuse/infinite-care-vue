
import React from "react";
import { FileText, Search, Download, Eye, Clock, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

// Mock documents data
const mockDocuments = {
  forms: [
    {
      id: "1",
      name: "Daily Care Log",
      type: "PDF",
      category: "Care Records",
      updated: "23 Apr 2025"
    },
    {
      id: "2",
      name: "Medication Administration Record",
      type: "PDF",
      category: "Medication",
      updated: "20 Apr 2025"
    },
    {
      id: "3",
      name: "Client Assessment Form",
      type: "DOCX",
      category: "Assessment",
      updated: "15 Apr 2025"
    },
    {
      id: "4",
      name: "Incident Report Form",
      type: "PDF",
      category: "Reporting",
      updated: "10 Apr 2025"
    }
  ],
  policies: [
    {
      id: "1",
      name: "Medication Administration Policy",
      type: "PDF",
      category: "Clinical",
      updated: "01 Mar 2025"
    },
    {
      id: "2",
      name: "Infection Control Guidelines",
      type: "PDF",
      category: "Health & Safety",
      updated: "15 Feb 2025"
    },
    {
      id: "3",
      name: "Emergency Response Procedure",
      type: "PDF",
      category: "Emergency",
      updated: "25 Jan 2025"
    },
    {
      id: "4",
      name: "Client Confidentiality Policy",
      type: "PDF",
      category: "Data Protection",
      updated: "10 Jan 2025"
    },
    {
      id: "5",
      name: "Manual Handling Guide",
      type: "PDF",
      category: "Health & Safety",
      updated: "05 Jan 2025"
    }
  ],
  training: [
    {
      id: "1",
      name: "Medication Administration Training",
      type: "PDF",
      category: "Clinical Skills",
      updated: "15 Apr 2025",
      completed: true,
      dueDate: "15 Oct 2025"
    },
    {
      id: "2",
      name: "First Aid Refresher",
      type: "PDF",
      category: "Emergency Response",
      updated: "10 Mar 2025",
      completed: true,
      dueDate: "10 Mar 2026"
    },
    {
      id: "3",
      name: "Infection Control",
      type: "PDF",
      category: "Health & Safety",
      updated: "25 Feb 2025",
      completed: false,
      dueDate: "25 May 2025"
    },
    {
      id: "4",
      name: "Safeguarding Vulnerable Adults",
      type: "PDF",
      category: "Compliance",
      updated: "15 Jan 2025",
      completed: false,
      dueDate: "15 May 2025"
    }
  ]
};

const CarerDocuments: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Documents</h1>
      
      <div className="flex items-center justify-between mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input placeholder="Search documents..." className="pl-9" />
        </div>
        
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          <span>Filter</span>
        </Button>
      </div>
      
      <Tabs defaultValue="forms" className="w-full">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="forms" className="flex-1">Forms</TabsTrigger>
          <TabsTrigger value="policies" className="flex-1">Policies & Procedures</TabsTrigger>
          <TabsTrigger value="training" className="flex-1">Training</TabsTrigger>
        </TabsList>
        
        <TabsContent value="forms" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Forms & Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockDocuments.forms.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          {doc.name}
                        </div>
                      </TableCell>
                      <TableCell>{doc.type}</TableCell>
                      <TableCell>{doc.category}</TableCell>
                      <TableCell>{doc.updated}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="policies" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Policies & Procedures</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockDocuments.policies.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          {doc.name}
                        </div>
                      </TableCell>
                      <TableCell>{doc.type}</TableCell>
                      <TableCell>{doc.category}</TableCell>
                      <TableCell>{doc.updated}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="training" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Training Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockDocuments.training.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-500" />
                          {doc.name}
                        </div>
                      </TableCell>
                      <TableCell>{doc.category}</TableCell>
                      <TableCell>{doc.updated}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="h-3.5 w-3.5 mr-1 text-gray-500" />
                          {doc.dueDate}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          doc.completed 
                            ? "bg-green-100 text-green-700" 
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {doc.completed ? "Completed" : "Pending"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CarerDocuments;
