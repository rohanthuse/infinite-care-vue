import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, User, Stethoscope, Building2, Phone, Mail, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Separator } from '@/components/ui/separator';

interface BasicInfoSectionProps {
  carePlan: any;
}

export function BasicInfoSection({ carePlan }: BasicInfoSectionProps) {
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'Not specified';
    try {
      return format(new Date(date), 'PPP');
    } catch {
      return 'Invalid date';
    }
  };

  const priorityColors: Record<string, string> = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };

  const gpInfo = carePlan.gp_info || {};
  const pharmacyInfo = carePlan.pharmacy_info || {};
  const hasGpInfo = gpInfo.name || gpInfo.phone || gpInfo.email || gpInfo.address;
  const hasPharmacyInfo = pharmacyInfo.name || pharmacyInfo.phone || pharmacyInfo.email || pharmacyInfo.address;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Care Plan Title</label>
              <p className="text-base mt-1">{carePlan.title || 'Untitled Care Plan'}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground">Care Provider</label>
              <p className="text-base mt-1 flex items-center gap-2">
                <User className="h-4 w-4" />
                {carePlan.provider_name || 'Not assigned'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Priority Level</label>
              <div className="mt-1">
                <Badge className={priorityColors[carePlan.priority || 'medium']}>
                  {carePlan.priority || 'Medium'}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Care Plan Type</label>
              <p className="text-base mt-1 capitalize">{carePlan.care_plan_type || 'Standard'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Start Date
              </label>
              <p className="text-base mt-1">{formatDate(carePlan.start_date)}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                End Date
              </label>
              <p className="text-base mt-1">{formatDate(carePlan.end_date)}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Next Review Date
              </label>
              <p className="text-base mt-1">{formatDate(carePlan.review_date)}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Plan ID</label>
              <p className="text-base mt-1 font-mono text-sm">{carePlan.display_id || carePlan.id?.slice(0, 8)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GP Information */}
      {hasGpInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              GP Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gpInfo.name && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">GP Name</label>
                  <p className="text-base mt-1">{gpInfo.name}</p>
                </div>
              )}
              {gpInfo.surgery_name && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Surgery Name</label>
                  <p className="text-base mt-1">{gpInfo.surgery_name}</p>
                </div>
              )}
              {gpInfo.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{gpInfo.phone}</span>
                </div>
              )}
              {gpInfo.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{gpInfo.email}</span>
                </div>
              )}
              {gpInfo.address && (
                <div className="flex items-start gap-2 md:col-span-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{gpInfo.address}</span>
                </div>
              )}
              {gpInfo.nhs_number && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">NHS Number</label>
                  <p className="text-base mt-1 font-mono">{gpInfo.nhs_number}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pharmacy Information */}
      {hasPharmacyInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Pharmacy Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pharmacyInfo.name && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Pharmacy Name</label>
                  <p className="text-base mt-1">{pharmacyInfo.name}</p>
                </div>
              )}
              {pharmacyInfo.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{pharmacyInfo.phone}</span>
                </div>
              )}
              {pharmacyInfo.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{pharmacyInfo.email}</span>
                </div>
              )}
              {pharmacyInfo.address && (
                <div className="flex items-start gap-2 md:col-span-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{pharmacyInfo.address}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
