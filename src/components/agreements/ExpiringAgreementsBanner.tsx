import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useExpiringAgreements } from "@/hooks/useExpiringAgreements";

interface ExpiringAgreementsBannerProps {
  branchId?: string;
  isOrganizationLevel?: boolean;
}

export function ExpiringAgreementsBanner({ branchId, isOrganizationLevel }: ExpiringAgreementsBannerProps) {
  const { data: expiringAgreements } = useExpiringAgreements(branchId, isOrganizationLevel);

  if (!expiringAgreements || expiringAgreements.length === 0) return null;

  const critical = expiringAgreements.filter(a => a.days_until_expiry <= 7);
  const warning = expiringAgreements.filter(a => a.days_until_expiry > 7 && a.days_until_expiry <= 15);

  if (critical.length === 0 && warning.length === 0) return null;

  return (
    <Alert variant={critical.length > 0 ? "destructive" : "default"} className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Agreements Expiring Soon</AlertTitle>
      <AlertDescription>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {critical.length > 0 && (
            <Badge variant="destructive">
              {critical.length} expiring within 7 days
            </Badge>
          )}
          {warning.length > 0 && (
            <Badge className="bg-yellow-500 hover:bg-yellow-600">
              {warning.length} expiring within 15 days
            </Badge>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}