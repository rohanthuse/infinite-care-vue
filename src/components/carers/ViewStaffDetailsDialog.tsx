import React from "react";
import { Eye, Mail, Phone, MapPin, Calendar, Clock, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useTenant } from "@/contexts/TenantContext";
import { CarerDB } from "@/data/hooks/useBranchCarers";

interface ViewStaffDetailsDialogProps {
  carer: CarerDB | null;
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  branchName?: string;
}

export function ViewStaffDetailsDialog({
  carer,
  isOpen,
  onClose,
  branchId,
  branchName,
}: ViewStaffDetailsDialogProps) {
  const navigate = useNavigate();
  const { tenantSlug } = useTenant();

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
      case 'pending invitation':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'on leave':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'training':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  if (!carer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Staff Details - {carer.first_name} {carer.last_name}
          </DialogTitle>
          <DialogDescription>
            View detailed information about this carer including contact details, employment information, and current status.
          </DialogDescription>
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
                {carer.hire_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Started {formatDate(carer.hire_date)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Employment Details */}
          <Card>
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-4">Employment Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Employee ID:</span>
                  <div className="font-mono text-sm">{carer.id.slice(-8)}</div>
                </div>
                {carer.experience && (
                  <div>
                    <span className="text-sm text-muted-foreground">Experience:</span>
                    <div className="font-semibold">{carer.experience}</div>
                  </div>
                )}
                {carer.availability && (
                  <div>
                    <span className="text-sm text-muted-foreground">Availability:</span>
                    <div className="font-semibold">{carer.availability}</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
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