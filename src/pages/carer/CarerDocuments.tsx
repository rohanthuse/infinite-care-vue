
import React, { useEffect, useState } from "react";
import { FileText, Search, Download, Eye, Clock, Filter, Loader2 } from "lucide-react";
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
import { useCarerSharedDocuments, useSharedDocumentActions } from "@/hooks/useAdminSharedDocuments";
import { useMyAssignedForms } from "@/hooks/useMyAssignedForms";
import { useCarerDocuments } from "@/hooks/useCarerDocuments";
import { useCarerTraining } from "@/hooks/useCarerTraining";
import { AdminSharedDocuments } from "@/components/documents/AdminSharedDocuments";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";


const CarerDocuments: React.FC = () => {
  const [carerId, setCarerId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  
  useEffect(() => {
    const fetchCarerId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: staffData } = await supabase
          .from('staff')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();
        
        if (staffData) {
          setCarerId(staffData.id);
        }
      }
    };
    
    fetchCarerId();
  }, []);

  // Fetch data using hooks
  const { data: sharedDocuments = [], isLoading: isLoadingShared } = useCarerSharedDocuments(carerId);
  const { data: assignedForms = [], isLoading: isLoadingForms } = useMyAssignedForms(userId, 'carer');
  const { data: carerDocuments = [], isLoading: isLoadingDocuments } = useCarerDocuments(carerId);
  const { trainingRecords = [], isLoading: isLoadingTraining } = useCarerTraining();
  const { viewDocument, downloadDocument } = useSharedDocumentActions();

  // Filter documents by category for different tabs
  const policyDocuments = carerDocuments.filter(doc => 
    doc.source_type === 'document' && 
    (doc.document_type?.toLowerCase().includes('policy') || 
     doc.document_type?.toLowerCase().includes('procedure') ||
     doc.document_type?.toLowerCase().includes('guideline'))
  );

  const trainingDocuments = carerDocuments.filter(doc => 
    doc.source_type === 'training_certification'
  );

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return 'N/A';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'completed': { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed' },
      'in-progress': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
      'not-started': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Not Started' },
      'expired': { bg: 'bg-red-100', text: 'text-red-700', label: 'Expired' },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap['not-started'];
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${statusInfo.bg} ${statusInfo.text}`}>
        {statusInfo.label}
      </span>
    );
  };

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
              <CardTitle>Assigned Forms</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingForms ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading forms...</span>
                </div>
              ) : assignedForms.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No forms have been assigned to you.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Form Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assignedForms.map((form) => (
                      <TableRow key={form.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            {form.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(form.submission_status || 'not-started')}
                        </TableCell>
                        <TableCell>{formatDate(form.assigned_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" disabled>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="policies" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Policies & Procedures</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingDocuments ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading policies...</span>
                </div>
              ) : policyDocuments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No policy documents available.</p>
                  <p className="text-sm mt-2">Policy documents will appear here when uploaded by admin.</p>
                </div>
              ) : (
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
                    {policyDocuments.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            {doc.file_name || doc.document_type}
                          </div>
                        </TableCell>
                        <TableCell>{doc.document_type}</TableCell>
                        <TableCell>{doc.document_type}</TableCell>
                        <TableCell>{formatDate(doc.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => doc.file_path && viewDocument(doc.file_path)}
                              disabled={!doc.file_path}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => doc.file_path && downloadDocument(doc.file_path, doc.file_name || 'document')}
                              disabled={!doc.file_path}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="training" className="mt-0">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Training Records & Certificates</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTraining ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading training records...</span>
                </div>
              ) : trainingRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No training records found.</p>
                  <p className="text-sm mt-2">Training records will appear here when assigned by admin.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Completion Date</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trainingRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            {record.training_course.title}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{record.training_course.category}</TableCell>
                        <TableCell>
                          {record.completion_date ? formatDate(record.completion_date) : 'Not completed'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="h-3.5 w-3.5 mr-1 text-gray-500" />
                            {record.expiry_date ? formatDate(record.expiry_date) : 'No expiry'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(record.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" disabled>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" disabled>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Admin Shared Documents */}
      <div className="mt-6">
        <AdminSharedDocuments
          documents={sharedDocuments}
          isLoading={isLoadingShared}
          title="Documents Shared by Admin"
          emptyMessage="No documents have been shared with you by the admin."
        />
      </div>
    </div>
  );
};

export default CarerDocuments;
