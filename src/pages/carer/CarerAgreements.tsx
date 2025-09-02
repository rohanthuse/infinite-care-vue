import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, Eye, FileText, Calendar, User } from 'lucide-react';
import { useStaffAgreements } from '@/data/hooks/useStaffAgreements';
import { ViewAgreementDialog } from '@/components/agreements/ViewAgreementDialog';
import { generatePDF } from '@/utils/pdfGenerator';
import { Agreement } from '@/types/agreements';
import { format } from 'date-fns';
import { toast } from 'sonner';

const CarerAgreements = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { data: agreements, isLoading } = useStaffAgreements({
    searchQuery,
    statusFilter: statusFilter === 'all' ? undefined : statusFilter as "Active" | "Pending" | "Expired" | "Terminated"
  });

  const handleViewAgreement = (agreement: Agreement) => {
    setSelectedAgreement(agreement);
    setDialogOpen(true);
  };

  const handleDownloadAgreement = (agreement: Agreement) => {
    try {
      const pdfData = {
        id: agreement.id,
        title: agreement.title,
        date: agreement.signed_at ? format(new Date(agreement.signed_at), 'dd MMM yyyy') : format(new Date(agreement.created_at), 'dd MMM yyyy'),
        status: agreement.status,
        signedBy: agreement.signed_by_name || 'N/A'
      };
      generatePDF(pdfData);
      toast.success('Agreement downloaded successfully');
    } catch (error) {
      toast.error('Failed to download agreement');
      console.error('Download error:', error);
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Agreements</h1>
          <p className="text-muted-foreground">View agreements that you have signed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
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

      {/* Agreements List */}
      <div className="grid gap-4">
        {agreements && agreements.length > 0 ? (
          agreements.map((agreement) => (
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
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {agreement.signed_by_name && (
                      <p>Signed by: {agreement.signed_by_name}</p>
                    )}
                  </div>
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
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No agreements found</h3>
              <p className="text-muted-foreground text-center">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'You don\'t have any agreements yet'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <ViewAgreementDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        agreement={selectedAgreement}
        onDownload={handleDownloadAgreement}
      />
    </div>
  );
};

export default CarerAgreements;