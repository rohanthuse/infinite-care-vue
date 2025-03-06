
import React, { useState } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Phone, Mail, MapPin, Calendar, FileText, Heart, 
  Briefcase, Users, CheckCircle, XCircle, Clock, FileIcon, 
  AlertCircle, Download 
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CarerProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carer: any; // Replace with proper Carer type when available
}

export const CarerProfileDialog = ({ open, onOpenChange, carer }: CarerProfileDialogProps) => {
  const [activeTab, setActiveTab] = useState("personal");

  // Mock data for essentials
  const essentials = [
    { name: "Work Permit & Nationality", status: "completed" },
    { name: "Vaccination", status: "completed" },
    { name: "Car Insurance", status: "completed" },
    { name: "Name Change", status: "completed" },
    { name: "Driving License", status: "completed" },
    { name: "NI Number", status: "completed" },
    { name: "P45", status: "completed" },
    { name: "Proof of Address", status: "completed" },
    { name: "DBS", status: "completed" },
    { name: "Bank Details", status: "missing" },
    { name: "Individualised", status: "pending" },
    { name: "Documents & Additional Information", status: "pending" }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>Carer Profile</DialogTitle>
          <DialogDescription>View and manage carer details</DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-6 h-full max-h-[calc(90vh-100px)]">
          {/* Left sidebar with basic info */}
          <div className="w-72 border-r pr-6">
            <div className="flex flex-col items-center mb-6">
              <Avatar className="w-32 h-32 mb-4">
                <AvatarImage src={carer.profileImage} />
                <AvatarFallback>{carer.avatar}</AvatarFallback>
              </Avatar>
              <h3 className="text-xl font-semibold">{carer.name}</h3>
              <p className="text-sm text-gray-500">{carer.specialization}</p>
              <Badge 
                variant="outline" 
                className={`
                  mt-2
                  ${carer.status === "Active" ? "bg-green-50 text-green-700 border-0" : ""}
                  ${carer.status === "Inactive" ? "bg-red-50 text-red-700 border-0" : ""}
                  ${carer.status === "On Leave" ? "bg-amber-50 text-amber-700 border-0" : ""}
                `}
              >
                {carer.status}
              </Badge>
            </div>

            <div className="space-y-4">
              <div className="flex items-center text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                <span className="text-sm">{carer.email}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                <span className="text-sm">{carer.phone}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="text-sm">{carer.location}</span>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="personal" onValueChange={setActiveTab} className="h-full">
              <TabsList className="grid grid-cols-4 gap-4 mb-4">
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="essentials">Essentials</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[calc(90vh-220px)]">
                <TabsContent value="personal" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Add personal details here */}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Important Contacts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Add contacts here */}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="essentials" className="space-y-4">
                  <div className="grid gap-3">
                    {essentials.map((item) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between p-4 bg-white rounded-lg border"
                      >
                        <span className="font-medium">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`
                              ${item.status === "completed" ? "bg-green-50 text-green-700 border-0" : ""}
                              ${item.status === "missing" ? "bg-red-50 text-red-700 border-0" : ""}
                              ${item.status === "pending" ? "bg-gray-50 text-gray-700 border-0" : ""}
                            `}
                          >
                            {item.status === "completed" && (
                              <CheckCircle className="w-4 h-4 mr-1" />
                            )}
                            {item.status === "missing" && (
                              <XCircle className="w-4 h-4 mr-1" />
                            )}
                            {item.status === "pending" && (
                              <AlertCircle className="w-4 h-4 mr-1" />
                            )}
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </Badge>
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Employment History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Add employment history here */}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Training History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Add training history here */}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Meetings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Add meetings here */}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="documents" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Files & Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Add files and documents here */}
                    </CardContent>
                  </Card>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
