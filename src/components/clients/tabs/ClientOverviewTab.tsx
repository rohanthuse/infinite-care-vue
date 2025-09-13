import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistance } from "date-fns";
import { formatCurrency } from "@/utils/currencyFormatter";
import { useServiceRates } from "@/hooks/useAccountingData";
import { Calendar, MapPin, Mail, Phone, Smartphone } from "lucide-react";

interface ClientOverviewTabProps {
  client: any;
  branchId: string;
}

export const ClientOverviewTab: React.FC<ClientOverviewTabProps> = ({ client, branchId }) => {
  const { data: serviceRates, isLoading: isLoadingRates } = useServiceRates(branchId);

  const registeredDate = client.registered_on || client.registeredOn;
  const lengthOfRegistration = registeredDate 
    ? formatDistance(new Date(registeredDate), new Date(), { addSuffix: false })
    : 'N/A';

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: "default" as const, text: "Active" },
      inactive: { variant: "secondary" as const, text: "Inactive" },
      expired: { variant: "destructive" as const, text: "Expired" },
    };
    
    const config = statusConfig[status?.toLowerCase() as keyof typeof statusConfig] || 
                   { variant: "secondary" as const, text: status || "Unknown" };
    
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Joined On</p>
                <p className="text-lg font-bold">{formatDate(registeredDate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Location</p>
                <p className="text-lg font-bold">{client.location || client.address || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-lg font-bold truncate">{client.email || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Mobile</p>
                <p className="text-lg font-bold">{client.mobile || client.phone || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Client Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="font-medium">Length of Registration:</span>
              <span>{lengthOfRegistration}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Telephone:</span>
              <span>{client.telephone || client.landline || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              <span>{getStatusBadge(client.status)}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Client ID:</span>
              <span>{client.id}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Rates Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingRates ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : serviceRates && serviceRates.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {serviceRates.length} service rate{serviceRates.length !== 1 ? 's' : ''} configured
                </p>
                <div className="space-y-1">
                  {serviceRates.slice(0, 3).map((rate) => (
                    <div key={rate.id} className="flex justify-between text-sm">
                      <span>{rate.service_name}</span>
                      <span className="font-medium">{formatCurrency(rate.amount)}</span>
                    </div>
                  ))}
                  {serviceRates.length > 3 && (
                    <p className="text-sm text-muted-foreground">
                      +{serviceRates.length - 3} more...
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No service rates configured</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Service Rates Table */}
      {serviceRates && serviceRates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Service Rates</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Effective From</TableHead>
                  <TableHead>Effective To</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceRates.map((rate) => (
                  <TableRow key={rate.id}>
                    <TableCell className="font-medium">{rate.service_name}</TableCell>
                    <TableCell>{rate.rate_type}</TableCell>
                    <TableCell>{formatCurrency(rate.amount)}</TableCell>
                    <TableCell>{formatDate(rate.effective_from)}</TableCell>
                    <TableCell>{rate.effective_to ? formatDate(rate.effective_to) : 'Ongoing'}</TableCell>
                    <TableCell>{getStatusBadge(rate.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};