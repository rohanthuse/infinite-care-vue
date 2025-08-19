import React from "react";
import { Eye, Mail, Phone, MapPin, Calendar, Clock, Star, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { useCarerProfileById } from "@/hooks/useCarerProfile";
import { useCarerPerformance } from "@/hooks/useCarerPerformance";
import { useTenant } from "@/contexts/TenantContext";
import { useNavigate } from "react-router-dom";

export interface CarerDB {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  status: string;
  specialization?: string;
  branch_id?: string;
  address?: string;
  employment_start_date?: string;
  hourly_rate?: number;
}

interface ViewCarerProfileDialogProps {
  carer: CarerDB | null;
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  branchName?: string;
}

export function ViewCarerProfileDialog({
  carer,
  isOpen,
  onClose,
  branchId,
  branchName,
}: ViewCarerProfileDialogProps) {
  const navigate = useNavigate();
  const { tenantSlug } = useTenant();
  const { data: carerProfile } = useCarerProfileById(carer?.id);
  const { data: performanceData } = useCarerPerformance(carer?.id || "");

  const handleViewFullProfile = () => {
    if (!carer) return;
    
    const path = tenantSlug 
      ? `/${tenantSlug}/branch-dashboard/${branchId}/${encodeURIComponent(branchName || '')}/carers/${carer.id}`
      : `/branch-dashboard/${branchId}/${encodeURIComponent(branchName || '')}/carers/${carer.id}`;
    navigate(path);
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (!carer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {carer.first_name} {carer.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    {carer.first_name} {carer.last_name}
                  </h3>
                  <p className="text-muted-foreground">{carer.specialization || 'Care Assistant'}</p>
                </div>
                <Badge className={getStatusColor(carer.status)}>
                  {carer.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {carer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{carer.email}</span>
                  </div>
                )}
                {carer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{carer.phone}</span>
                  </div>
                )}
                {carer.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{carer.address}</span>
                  </div>
                )}
                {carer.employment_start_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Started {formatDate(carer.employment_start_date)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Performance Summary */}
          {performanceData && (
            <Card>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Weekly Overview
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {performanceData.totalBookings}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Bookings</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {performanceData.completedBookings}
                    </div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {performanceData.completionRate}%
                    </div>
                    <div className="text-xs text-muted-foreground">Completion Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                      <Star className="h-4 w-4" />
                      {performanceData.averageRating}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Rating</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Employment Details */}
          <Card>
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-4">Employment Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {carer.hourly_rate && (
                  <div>
                    <span className="text-sm text-muted-foreground">Hourly Rate:</span>
                    <div className="font-semibold">£{carer.hourly_rate}/hour</div>
                  </div>
                )}
                <div>
                  <span className="text-sm text-muted-foreground">Employee ID:</span>
                  <div className="font-semibold text-xs">{carer.id.slice(-8)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleViewFullProfile} className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              View Full Profile
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}