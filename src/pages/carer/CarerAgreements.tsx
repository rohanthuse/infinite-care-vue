import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, Eye, FileText, Calendar, User, AlertCircle, PenLine } from 'lucide-react';
import { useStaffPendingAgreements } from '@/hooks/useStaffPendingAgreements';
import { useStaffAgreements } from '@/data/hooks/useStaffAgreements';
import { ViewAgreementDialog } from '@/components/agreements/ViewAgreementDialog';
import { exportAgreementToPDF } from '@/lib/agreementPdfExport';
import { Agreement } from '@/types/agreements';
import { format } from 'date-fns';
import { toast } from 'sonner';

const CarerAgreements = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  
  const { data: pendingAgreements, isLoading: pendingLoading } = useStaffPendingAgreements({
    searchQuery
  });
  
  const { data: signedAgreements, isLoading: signedLoading } = useStaffAgreements({
    searchQuery,
    statusFilter: statusFilter === 'all' ? undefined : statusFilter as "Active" | "Pending" | "Expired" | "Terminated",
    signingStatusFilter: 'signed'
  });

  const handleViewAgreement = (agreement: Agreement) => {
    setSelectedAgreement(agreement);
    setDialogOpen(true);
  };

  const handleDownloadAgreement = async (agreement: Agreement) => {
    try {
      await exportAgreementToPDF(agreement.id);
      toast.success('Agreement downloaded successfully');
    } catch (error) {
      toast.error('Failed to download agreement');
      console.error('Download error:', error);
    }
  };

  const handleSigningComplete = () => {
    setActiveTab('signed');
    toast.success('Agreement signed successfully! View it in your Signed Agreements.');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Active': { variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      'Pending': { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800' },
      'Expired': { variant: 'outline' as const, className: 'bg-gray-100 text-gray-800' },
      'Terminated': { variant: 'destructive' as const, className: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Pending'];
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };


  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">My Agreements</h1>
          <p className="text-muted-foreground">View and sign your agreements</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Pending Agreements
            {pendingAgreements && pendingAgreements.length > 0 && (
              <Badge variant="destructive" className="ml-2">{pendingAgreements.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="signed" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Signed Agreements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : pendingAgreements && pendingAgreements.length > 0 ? (
            <div className="grid gap-4">
              {pendingAgreements.map((agreement) => (
                <Card key={agreement.id} className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-blue-600" />
                          <CardTitle className="text-lg">{agreement.title}</CardTitle>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {agreement.agreement_types?.name && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              {agreement.agreement_types.name}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Created {format(new Date(agreement.created_at), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        Awaiting Signature
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        variant="default" 
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleViewAgreement(agreement)}
                      >
                        <PenLine className="h-4 w-4 mr-1" />
                        View & Sign
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No pending agreements</h3>
                <p className="text-muted-foreground text-center">
                  You don't have any agreements waiting for your signature
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="signed" className="mt-6">
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search agreements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Expired">Expired</SelectItem>
                <SelectItem value="Terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {signedLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : signedAgreements && signedAgreements.length > 0 ? (
            <div className="grid gap-4">
              {signedAgreements.map((agreement) => (
                <Card key={agreement.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{agreement.title}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {agreement.agreement_types?.name && (
                            <div className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              {agreement.agreement_types.name}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Created {format(new Date(agreement.created_at), 'MMM dd, yyyy')}
                          </div>
                          {agreement.signed_at && (
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              Signed {format(new Date(agreement.signed_at), 'MMM dd, yyyy')}
                            </div>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(agreement.status)}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-end">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewAgreement(agreement)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDownloadAgreement(agreement)}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No signed agreements found</h3>
                <p className="text-muted-foreground text-center">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'You haven\'t signed any agreements yet'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <ViewAgreementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        agreement={selectedAgreement}
        onDownload={handleDownloadAgreement}
        onSigningComplete={handleSigningComplete}
      />
    </div>
  );
};

export default CarerAgreements;